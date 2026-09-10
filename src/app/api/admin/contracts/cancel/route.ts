import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, postLedgerTransaction } from "@/lib/ledger";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await adminClient.from("wc_admins").select("id, is_active").eq("user_id", user.id).single();
  if (!adminRow?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { contract_id, reason } = await req.json() as { contract_id: string; reason: string };
  if (!contract_id || !reason) return NextResponse.json({ error: "contract_id and reason required" }, { status: 400 });

  const { data: contract } = await adminClient
    .from("wc_contracts")
    .select("id, user_id, state, principal_amount, plan_tier")
    .eq("id", contract_id)
    .single();

  if (!contract) return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  if (!["ACTIVE", "PENDING", "MATURED"].includes(contract.state)) {
    return NextResponse.json({ error: `Cannot cancel contract in state ${contract.state}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const amtStr = Number(contract.principal_amount).toFixed(8);

  const { transactionId } = await postLedgerTransaction({
    entryType: "CAPITAL_RELEASE",
    userId: contract.user_id,
    contractId: contract_id,
    description: `Admin force-cancel: ${reason}`,
    amount: amtStr,
    idempotencyKey: `cancel_${contract_id}_${randomUUID()}`,
    initiatedBy: user.id,
    adminNotes: reason,
    lines: [
      { accountType: "USER_WALLET",         userId: contract.user_id, direction: "CREDIT", amount: amtStr },
      { accountType: "USER_CAPITAL_LOCKED",  userId: contract.user_id, direction: "DEBIT",  amount: amtStr },
    ],
  });

  await adminClient.from("wc_contracts")
    .update({ state: "CANCELLED", notes: reason, updated_at: now } as never)
    .eq("id", contract_id);

  const { data: wallet } = await adminClient.from("wc_wallet_balances")
    .select("available_balance, locked_capital").eq("user_id", contract.user_id).single();
  if (wallet) {
    await adminClient.from("wc_wallet_balances").update({
      available_balance: (wallet.available_balance as number) + Number(contract.principal_amount),
      locked_capital: Math.max(0, (wallet.locked_capital as number) - Number(contract.principal_amount)),
      updated_at: now,
    } as never).eq("user_id", contract.user_id);
  }

  await adminClient.from("wc_admin_audit_log").insert({
    admin_id: adminRow.id,
    action_type: "FORCE_CONTRACT_CANCEL",
    target_user_id: contract.user_id,
    reason,
    before_state: { state: contract.state },
    after_state: { state: "CANCELLED", ledger_tx_id: transactionId },
  });

  return NextResponse.json({ success: true, contract_id, ledger_tx_id: transactionId, returned_principal: Number(contract.principal_amount) });
}
