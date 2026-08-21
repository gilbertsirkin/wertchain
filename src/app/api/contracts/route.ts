/**
 * POST /api/contracts
 *
 * Creates a new investment contract for the authenticated user, funded
 * entirely from their internal available_balance (wc_wallet_balances).
 *
 * Flow:
 *   1. Validate plan + amount.
 *   2. Check the user's available_balance.
 *      - If insufficient: return 402 with a `redirect_to_deposit` payload
 *        describing exactly which plan/amount triggered it. No contract,
 *        no deposit row, no ledger entry is created. The frontend uses
 *        this to send the user to a plan-aware /deposit page.
 *      - If sufficient: debit USER_WALLET, credit USER_CAPITAL_LOCKED via
 *        postLedgerTransaction(), and create the contract as ACTIVE
 *        immediately — this is a real, completed investment.
 *
 * This route does NOT create wc_deposits rows or show platform wallet
 * addresses. Depositing funds into available_balance is a separate flow
 * (/deposit page -> /api/deposits/submit -> admin approval).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, postLedgerTransaction } from "@/lib/ledger";
import { mailer } from "@/lib/email/mailer";

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: {
    plan_id: string;
    amount: string;
    auto_reinvest?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { plan_id, amount, auto_reinvest = true } = body;
  if (!plan_id || !amount) {
    return NextResponse.json(
      { error: "plan_id and amount are required" },
      { status: 400 }
    );
  }

  const amountNum = Number(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { error: "amount must be a positive number" },
      { status: 400 }
    );
  }

  // 3. Fetch and validate plan
  const { data: plan, error: planError } = await adminClient
    .from("wc_investment_plans")
    .select("id, tier, label, min_amount, max_amount, duration_days, profit_rate, auto_reinvest_default, capital_release_delay_days, is_active")
    .eq("id", plan_id)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (!plan.is_active) {
    return NextResponse.json(
      { error: "This plan is no longer accepting new investments" },
      { status: 400 }
    );
  }
  if (amountNum < Number(plan.min_amount)) {
    return NextResponse.json(
      { error: `Minimum investment is ${plan.min_amount} for ${plan.label}` },
      { status: 400 }
    );
  }
  if (plan.max_amount && amountNum > Number(plan.max_amount)) {
    return NextResponse.json(
      { error: `Maximum investment is ${plan.max_amount} for ${plan.label}` },
      { status: 400 }
    );
  }

  // 4. Validate user account
  const { data: userData, error: userError } = await adminClient
    .from("wc_users")
    .select("id, is_active, is_suspended, kyc_status, email, full_name")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: "User account not found" }, { status: 404 });
  }
  if (!userData.is_active || userData.is_suspended) {
    return NextResponse.json(
      { error: "Your account is not active. Please contact support." },
      { status: 403 }
    );
  }

  // 5. Check available balance — this is the critical gate.
  const { data: wallet, error: walletError } = await adminClient
    .from("wc_wallet_balances")
    .select("available_balance, locked_capital")
    .eq("user_id", user.id)
    .single();

  if (walletError || !wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const availableBalance = Number(wallet.available_balance);
  const currentLockedCapital = Number(wallet.locked_capital);

  if (availableBalance < amountNum) {
    // Not enough funds — do NOT create a contract. Tell the frontend
    // exactly what's needed so it can route to a plan-aware deposit page.
    return NextResponse.json(
      {
        error: "Insufficient balance",
        message: `You need $${amountNum.toFixed(2)} to activate ${plan.label}, but your available balance is $${availableBalance.toFixed(2)}.`,
        redirect_to_deposit: {
          plan_id: plan.id,
          plan_label: plan.label,
          plan_tier: plan.tier,
          amount_needed: amountNum.toFixed(2),
          current_balance: availableBalance.toFixed(2),
          shortfall: (amountNum - availableBalance).toFixed(2),
        },
      },
      { status: 402 } // 402 Payment Required
    );
  }

  // 6. Pre-calculate all contract financials — locked at creation, immutable after ACTIVE
  const profitRate = Number(plan.profit_rate);
  const durationDays = plan.duration_days;
  const dailyProfitAmount = (amountNum * profitRate) / durationDays;
  const expectedProfit = amountNum * profitRate;

  // Schema requires maturity_date whenever state != 'PENDING' (CHECK constraint).
  // Since this contract activates immediately, compute both dates now.
  const now = new Date();
  const maturityDate = new Date(now);
  maturityDate.setDate(maturityDate.getDate() + durationDays);

  const releaseEligibleDate = new Date(maturityDate);
  releaseEligibleDate.setDate(releaseEligibleDate.getDate() + plan.capital_release_delay_days);

  const toDateString = (d: Date) => d.toISOString().split("T")[0];

  // 7. Create contract — funded immediately, goes straight to ACTIVE
  const { data: contract, error: contractError } = await adminClient
    .from("wc_contracts")
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_tier: plan.tier,
      principal_amount: amountNum,
      expected_profit: expectedProfit,
      daily_profit_amount: Number(dailyProfitAmount),
      profit_rate_snapshot: profitRate,
      duration_days_snapshot: durationDays,
      state: "ACTIVE",
      auto_reinvest: auto_reinvest,
      release_delay_days: plan.capital_release_delay_days,
      origin_type: "NEW",
      activated_at: now.toISOString(),
      maturity_date: toDateString(maturityDate),
      release_eligible_date: toDateString(releaseEligibleDate),
    })
    .select("id, state, created_at, activated_at, maturity_date")
    .single();

  if (contractError || !contract) {
    console.error("Contract insert error:", contractError);
    return NextResponse.json(
      { error: "Failed to create contract. Please try again." },
      { status: 500 }
    );
  }

  // 8. Post the double-entry ledger transaction:
  //    DR: USER_WALLET (available balance goes down)
  //    CR: USER_CAPITAL_LOCKED (locked capital goes up)
  try {
    await postLedgerTransaction({
      entryType: "INVESTMENT_CREATION",
      userId: user.id,
      contractId: contract.id,
      description: `Investment in ${plan.label} funded from available balance`,
      amount: amountNum.toFixed(8),
      idempotencyKey: `investment_creation_${contract.id}`,
      lines: [
        {
          accountType: "USER_WALLET",
          direction: "DEBIT",
          amount: amountNum.toFixed(8),
          userId: user.id,
        },
        {
          accountType: "USER_CAPITAL_LOCKED",
          direction: "CREDIT",
          amount: amountNum.toFixed(8),
          userId: user.id,
        },
      ],
    });
  } catch (ledgerErr) {
    // Roll back the contract if the ledger post fails — never leave a
    // contract active without a matching balanced ledger entry.
    await adminClient.from("wc_contracts").delete().eq("id", contract.id);
    console.error("Ledger post error:", ledgerErr);
    return NextResponse.json(
      { error: "Failed to process investment. Please try again." },
      { status: 500 }
    );
  }

  // 9. Update wallet balances atomically: available down, locked up.
  const { error: balanceUpdateError } = await adminClient
    .from("wc_wallet_balances")
    .update({
      available_balance: availableBalance - amountNum,
      locked_capital: currentLockedCapital + amountNum,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (balanceUpdateError) {
    // Rare — the ledger post above already succeeded and is the source
    // of truth. Log loudly; wc_wallet_balances can be reconciled from
    // the ledger by the nightly reconciliation job.
    console.error("Wallet balance update error (ledger already posted):", balanceUpdateError);
  }

  // Send investment confirmation email (non-blocking)
  if (userData?.email) {
    const activatedDate = new Date(contract.activated_at ?? new Date()).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    const maturityDate = new Date(new Date(contract.activated_at ?? new Date()).getTime() + durationDays * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    mailer.contractCreated(userData.email, {
      fullName: userData.full_name ?? "Investor",
      planTier: plan.tier,
      principal: amountNum,
      profitRate,
      expectedProfit,
      duration: durationDays,
      activatedAt: activatedDate,
      maturityDate,
      contractId: contract.id,
      autoReinvest: auto_reinvest,
    }).catch((e) => console.error("[mailer] contractCreated failed:", e));
  }

  return NextResponse.json(
    {
      success: true,
      contract: {
        id: contract.id,
        state: contract.state,
        plan_name: plan.label,
        plan_tier: plan.tier,
        principal_amount: amountNum.toFixed(8),
        expected_profit: expectedProfit.toFixed(8),
        daily_profit_amount: Number(dailyProfitAmount),
        duration_days: durationDays,
        profit_rate: profitRate,
        auto_reinvest,
        created_at: contract.created_at,
        activated_at: contract.activated_at,
      },
      message: `Your investment in ${plan.label} is now active and earning daily profit.`,
    },
    { status: 201 }
  );
}
