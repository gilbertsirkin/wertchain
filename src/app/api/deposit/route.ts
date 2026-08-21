/**
 * POST /api/deposits
 *
 * Creates a new PENDING deposit row for the authenticated user. This is
 * the entry point for the deposit flow: the frontend calls this first to
 * get a deposit_id, shows the user the platform wallet address (fetched
 * separately via GET /api/deposits/address), then the user submits their
 * tx hash via POST /api/deposits/submit using the deposit_id returned here.
 *
 * If `plan_id` is supplied, it's stored in metadata so the admin queue
 * and the post-approval flow know which investment this deposit is meant
 * to fund — but it does NOT create a contract. Contract creation only
 * happens via /api/contracts once the user's available_balance covers it.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/ledger";

const PLATFORM_WALLETS: Record<string, { address: string; paymentMethod: string }> = {
  USDT_TRC20: {
    address: process.env.PLATFORM_WALLET_USDT_TRC20 ?? "",
    paymentMethod: "CRYPTO_USDT_TRC20",
  },
  USDT_ERC20: {
    address: process.env.PLATFORM_WALLET_USDT_ERC20 ?? "",
    paymentMethod: "CRYPTO_USDT_ERC20",
  },
  BTC: {
    address: process.env.PLATFORM_WALLET_BTC ?? "",
    paymentMethod: "CRYPTO_BTC",
  },
};

function isPlaceholder(address: string): boolean {
  if (!address) return true;
  const lower = address.toLowerCase();
  return lower.includes("paste_your") || lower.includes("_here") || lower.includes("your_") || lower.includes("placeholder");
}

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: {
    amount: string;
    currency: string;
    plan_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { amount, currency, plan_id } = body;
  if (!amount || !currency) {
    return NextResponse.json(
      { error: "amount and currency are required" },
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

  const walletConfig = PLATFORM_WALLETS[currency];
  if (!walletConfig) {
    return NextResponse.json(
      { error: `Unsupported currency: ${currency}. Supported: ${Object.keys(PLATFORM_WALLETS).join(", ")}` },
      { status: 400 }
    );
  }

  // Never create a deposit instruction pointing at a placeholder address.
  if (isPlaceholder(walletConfig.address)) {
    console.error(`PLATFORM_WALLET_${currency} is still a placeholder — refusing deposit creation`);
    return NextResponse.json(
      { error: "Deposits are temporarily unavailable for this currency. Please try again later or contact support." },
      { status: 503 }
    );
  }

  // 3. Optionally validate plan_id if supplied (informational link only)
  let planLabel: string | null = null;
  if (plan_id) {
    const { data: plan } = await adminClient
      .from("wc_investment_plans")
      .select("id, label")
      .eq("id", plan_id)
      .maybeSingle();
    planLabel = plan?.label ?? null;
  }

  // 4. Create the deposit row
  const { data: deposit, error: depositError } = await adminClient
    .from("wc_deposits")
    .insert({
      user_id: user.id,
      amount: amountNum,
      currency,
      payment_method: walletConfig.paymentMethod,
      status: "PENDING",
      metadata: {
        intended_plan_id: plan_id ?? null,
        intended_plan_label: planLabel,
      },
    })
    .select("id, status, created_at")
    .single();

  if (depositError || !deposit) {
    console.error("Deposit creation error:", depositError);
    return NextResponse.json(
      { error: "Failed to create deposit. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      deposit: {
        id: deposit.id,
        status: deposit.status,
        created_at: deposit.created_at,
      },
      to_address: walletConfig.address,
      payment_method: walletConfig.paymentMethod,
      next_step: "Send the funds, then submit your transaction hash via POST /api/deposits/submit.",
    },
    { status: 201 }
  );
}