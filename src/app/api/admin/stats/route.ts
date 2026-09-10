import { NextResponse } from "next/server";
import { adminClient } from "@/lib/ledger";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await adminClient
    .from("wc_admins").select("id, is_active").eq("user_id", user.id).single();
  if (!adminRow?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    { data: wallets },
    { count: pendingDeposits },
    { count: pendingWithdrawals },
    { count: pendingMigrations },
    { count: activeContracts },
    { count: totalUsers },
    { data: deposits },
    { data: withdrawals },
    { data: migrations },
    { data: users },
    { data: contracts },
    { data: plans },
  ] = await Promise.all([
    adminClient.from("wc_wallet_balances").select("locked_capital, available_balance"),
    adminClient.from("wc_deposits").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    adminClient.from("wc_withdrawals").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    adminClient.from("wc_migrations").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    adminClient.from("wc_contracts").select("*", { count: "exact", head: true }).eq("state", "ACTIVE"),
    adminClient.from("wc_users").select("*", { count: "exact", head: true }),

    adminClient.from("wc_deposits")
      .select("id, user_id, amount, currency, payment_method, payment_reference, status, created_at, updated_at, reviewed_at, rejection_reason, metadata")
      .order("created_at", { ascending: false }).limit(200),

    adminClient.from("wc_withdrawals")
      .select("id, user_id, amount, currency, net_payout, fee_amount, withdrawal_type, status, created_at, updated_at, reviewed_at, rejection_reason, destination_details, contract_id")
      .order("created_at", { ascending: false }).limit(200),

    adminClient.from("wc_migrations")
      .select("id, user_id, capital_amount, topup_amount, total_new_principal, migration_type, target_plan_tier, status, created_at, updated_at, source_contract_id")
      .order("created_at", { ascending: false }).limit(200),

    adminClient.from("wc_users")
      .select("id, full_name, email, kyc_status, is_suspended, is_active, created_at, updated_at, wc_wallet_balances(available_balance, locked_capital, pending_release_capital, pending_profit)")
      .order("created_at", { ascending: false }).limit(500),

    adminClient.from("wc_contracts")
      .select("id, user_id, plan_tier, state, principal_amount, expected_profit, profit_credited, daily_profit_amount, profit_rate_snapshot, activated_at, maturity_date, auto_reinvest, created_at, wc_users(full_name, email)")
      .order("created_at", { ascending: false }).limit(500),

    adminClient.from("wc_investment_plans")
      .select("id, label, tier, profit_rate, duration_days, min_amount, max_amount, is_active")
      .order("profit_rate", { ascending: true }),
  ]);

  const totalLockedCapital    = (wallets ?? []).reduce((s, w) => s + (Number(w.locked_capital)    || 0), 0);
  const totalAvailableBalance = (wallets ?? []).reduce((s, w) => s + (Number(w.available_balance) || 0), 0);

  // Build user lookup map to avoid relying on FK joins
  const userMap = Object.fromEntries(
    (users ?? []).map(u => [u.id, { full_name: u.full_name, email: u.email }])
  );

  const depositsWithUsers    = (deposits    ?? []).map(d => ({ ...d, wc_users: userMap[d.user_id] ?? null }));
  const withdrawalsWithUsers = (withdrawals ?? []).map(w => ({ ...w, wc_users: userMap[w.user_id] ?? null }));
  const migrationsWithUsers  = (migrations  ?? []).map(m => ({ ...m, wc_users: userMap[m.user_id] ?? null }));

  return NextResponse.json({
    stats: {
      totalLockedCapital,
      totalAvailableBalance,
      pendingDeposits:    pendingDeposits    ?? 0,
      pendingWithdrawals: pendingWithdrawals ?? 0,
      pendingMigrations:  pendingMigrations  ?? 0,
      activeContracts:    activeContracts    ?? 0,
      totalUsers:         totalUsers         ?? 0,
    },
    deposits:    depositsWithUsers,
    withdrawals: withdrawalsWithUsers,
    migrations:  migrationsWithUsers,
    users:       users       ?? [],
    contracts:   contracts   ?? [],
    plans:       plans       ?? [],
  });
}
