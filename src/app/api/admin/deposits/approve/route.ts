/**
 * POST /api/admin/deposits/approve
 *
 * Admin confirms or rejects a crypto deposit.
 *
 * NEW FLOW (deposit-first, invest-later):
 * Deposits are completely decoupled from contracts. On approval, ONE
 * ledger transaction is posted:
 *
 *   TX — entry_type: 'DEPOSIT'
 *     DR  PLATFORM_DEPOSIT_CLEARING
 *     CR  USER_WALLET
 *
 * Then available_balance is incremented and the user can invest.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, postLedgerTransaction } from "@/lib/ledger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: adminRow, error: adminErr } = await adminClient
    .from("wc_admins")
    .select("id, role, is_active")
    .eq("user_id", user.id)
    .single();

  if (adminErr || !adminRow || !adminRow.is_active) {
    return NextResponse.json({ error: "Forbidden: admin access required" }, { status: 403 });
  }

  if (!["SUPER_ADMIN", "FINANCE"].includes(adminRow.role)) {
    return NextResponse.json(
      { error: "Forbidden: FINANCE or SUPER_ADMIN role required" },
      { status: 403 }
    );
  }

  let body: {
    deposit_id: string;
    action: "approve" | "reject";
    rejection_reason?: string;
    admin_notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { deposit_id, action, rejection_reason, admin_notes } = body;
  if (!deposit_id || !action) {
    return NextResponse.json(
      { error: "deposit_id and action are required" },
      { status: 400 }
    );
  }
  if (action === "reject" && !rejection_reason) {
    return NextResponse.json(
      { error: "rejection_reason is required when rejecting" },
      { status: 400 }
    );
  }

  const { data: deposit, error: depositErr } = await adminClient
    .from("wc_deposits")
    .select("id, user_id, amount, currency, payment_reference, status, metadata")
    .eq("id", deposit_id)
    .single();

  if (depositErr || !deposit) {
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }
  if (deposit.status !== "PENDING") {
    return NextResponse.json(
      { error: `Deposit is '${deposit.status}' — only PENDING deposits can be actioned` },
      { status: 409 }
    );
  }

  const amount = Number(deposit.amount);
  const userId = deposit.user_id;
  const now = new Date();

  if (action === "reject") {
    await adminClient
      .from("wc_deposits")
      .update({
        status: "REJECTED",
        rejection_reason,
        notes: admin_notes ?? null,
        reviewed_by: user.id,
        reviewed_at: now.toISOString(),
      })
      .eq("id", deposit_id);

    await adminClient.from("wc_admin_audit_log").insert({
      admin_id: adminRow.id,
      action_type: "REJECT_DEPOSIT",
      target_user_id: userId,
      target_deposit_id: deposit_id,
      before_state: { deposit_status: "PENDING" },
      after_state: { deposit_status: "REJECTED" },
      reason: rejection_reason!,
    });

    return NextResponse.json({ message: "Deposit rejected.", deposit_id });
  }

  // APPROVE
  try {
    const { transactionId: depositTxId } = await postLedgerTransaction({
      entryType: "DEPOSIT",
      userId,
      depositId: deposit_id,
      description: `Deposit confirmed — ${amount} ${deposit.currency} | tx: ${deposit.payment_reference ?? "manual"}`,
      amount: amount.toFixed(8),
      currency: deposit.currency,
      idempotencyKey: `deposit_confirmed_${deposit_id}`,
      initiatedBy: user.id,
      adminNotes: admin_notes,
      lines: [
        {
          accountType: "PLATFORM_DEPOSIT_CLEARING",
          direction: "DEBIT",
          amount: amount.toFixed(8),
          userId: undefined,
        },
        {
          accountType: "USER_WALLET",
          direction: "CREDIT",
          amount: amount.toFixed(8),
          userId,
        },
      ],
    });

    await adminClient
      .from("wc_deposits")
      .update({
        status: "APPROVED",
        reviewed_by: user.id,
        reviewed_at: now.toISOString(),
        notes: admin_notes ?? null,
        ledger_tx_id: depositTxId,
      })
      .eq("id", deposit_id);

    const { data: wallet } = await adminClient
      .from("wc_wallet_balances")
      .select("available_balance")
      .eq("user_id", userId)
      .single();

    if (wallet) {
      await adminClient
        .from("wc_wallet_balances")
        .update({
          available_balance: Number(wallet.available_balance) + amount,
          updated_at: now.toISOString(),
        })
        .eq("user_id", userId);
    }

    await adminClient.from("wc_admin_audit_log").insert({
      admin_id: adminRow.id,
      action_type: "APPROVE_DEPOSIT",
      target_user_id: userId,
      target_deposit_id: deposit_id,
      before_state: { deposit_status: "PENDING", available_balance: wallet?.available_balance ?? 0 },
      after_state: {
        deposit_status: "APPROVED",
        available_balance: (Number(wallet?.available_balance ?? 0) + amount).toFixed(8),
        ledger_tx_id: depositTxId,
      },
      reason: admin_notes ?? "Deposit confirmed by admin",
    });

    return NextResponse.json({
      message: `Deposit approved. $${amount.toFixed(2)} credited to user available balance.`,
      deposit_id,
      amount_credited: amount.toFixed(8),
      ledger_tx_id: depositTxId,
      next_step: "User can now visit /invest to activate an investment plan.",
    });
  } catch (err) {
    console.error("Deposit approval error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error during approval" },
      { status: 500 }
    );
  }
}
