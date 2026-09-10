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

  const { user_id, amount, reason } = await req.json() as { user_id: string; amount: number; reason: string };
  if (!user_id || !amount || !reason) return NextResponse.json({ error: "user_id, amount and reason are required" }, { status: 400 });
  if (amount <= 0) return NextResponse.json({ error: "amount must be positive" }, { status: 400 });

  const { data: targetUser } = await adminClient.from("wc_users").select("full_name, email").eq("id", user_id).single();
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const amtStr = amount.toFixed(8);

  const { transactionId } = await postLedgerTransaction({
    entryType: "BONUS",
    userId: user_id,
    description: `Admin bonus: ${reason}`,
    amount: amtStr,
    idempotencyKey: `bonus_${user_id}_${randomUUID()}`,
    initiatedBy: user.id,
    adminNotes: reason,
    lines: [
      { accountType: "USER_WALLET",       userId: user_id, direction: "CREDIT", amount: amtStr },
      { accountType: "SYSTEM_ADJUSTMENT",                  direction: "DEBIT",  amount: amtStr },
    ],
  });

  // Update wallet cache
  const { data: wallet } = await adminClient.from("wc_wallet_balances").select("available_balance").eq("user_id", user_id).single();
  if (wallet) {
    await adminClient.from("wc_wallet_balances")
      .update({ available_balance: (wallet.available_balance as number) + amount, updated_at: new Date().toISOString() } as never)
      .eq("user_id", user_id);
  }

  await adminClient.from("wc_admin_audit_log").insert({
    admin_id: adminRow.id,
    action_type: "BONUS_CREDIT",
    target_user_id: user_id,
    reason,
    before_state: {},
    after_state: { bonus_amount: amount, ledger_tx_id: transactionId },
  });

  return NextResponse.json({ success: true, ledger_tx_id: transactionId, amount, user: targetUser.full_name });
}
