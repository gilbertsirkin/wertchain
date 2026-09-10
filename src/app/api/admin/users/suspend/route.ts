import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/ledger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await adminClient.from("wc_admins").select("id, is_active").eq("user_id", user.id).single();
  if (!adminRow?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, action, reason } = await req.json() as { user_id: string; action: "suspend" | "unsuspend"; reason?: string };
  if (!user_id || !action) return NextResponse.json({ error: "user_id and action required" }, { status: 400 });

  const isSuspend = action === "suspend";

  const { data: targetUser } = await adminClient.from("wc_users").select("is_suspended, full_name").eq("id", user_id).single();
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await adminClient
    .from("wc_users")
    .update({ is_suspended: isSuspend, updated_at: new Date().toISOString() } as never)
    .eq("id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient.from("wc_admin_audit_log").insert({
    admin_id: adminRow.id,
    action_type: isSuspend ? "USER_SUSPEND" : "USER_UNSUSPEND",
    target_user_id: user_id,
    reason: reason ?? "",
    before_state: { is_suspended: targetUser.is_suspended },
    after_state: { is_suspended: isSuspend },
  });

  return NextResponse.json({ success: true, is_suspended: isSuspend });
}
