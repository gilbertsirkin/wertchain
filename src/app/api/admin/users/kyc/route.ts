import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/ledger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await adminClient.from("wc_admins").select("id, is_active").eq("user_id", user.id).single();
  if (!adminRow?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, action, reason } = await req.json() as { user_id: string; action: "approve" | "reject"; reason?: string };
  if (!user_id || !action) return NextResponse.json({ error: "user_id and action required" }, { status: 400 });
  if (action === "reject" && !reason) return NextResponse.json({ error: "reason required for rejection" }, { status: 400 });

  const newStatus = action === "approve" ? "VERIFIED" : "REJECTED";

  const { error } = await adminClient
    .from("wc_users")
    .update({ kyc_status: newStatus, updated_at: new Date().toISOString() } as never)
    .eq("id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await adminClient.from("wc_admin_audit_log").insert({
    admin_id: adminRow.id,
    action_type: action === "approve" ? "KYC_APPROVE" : "KYC_REJECT",
    target_user_id: user_id,
    reason: reason ?? "",
    before_state: { kyc_status: "UNVERIFIED" },
    after_state: { kyc_status: newStatus },
  });

  return NextResponse.json({ success: true, kyc_status: newStatus });
}
