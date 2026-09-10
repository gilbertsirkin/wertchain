import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/ledger";
import { mailer } from "@/lib/email/mailer";
import { Resend } from "resend";


const FROM = process.env.RESEND_FROM ?? "Wertchain <noreply@wertchain.com>";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await adminClient.from("wc_admins").select("id, is_active").eq("user_id", user.id).single();
  if (!adminRow?.is_active) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { user_id, template, custom_subject, custom_body } = await req.json() as {
    user_id: string; template: string; custom_subject?: string; custom_body?: string;
  };
  if (!user_id || !template) return NextResponse.json({ error: "user_id and template required" }, { status: 400 });

  const { data: targetUser } = await adminClient.from("wc_users").select("email, full_name").eq("id", user_id).single();
  if (!targetUser?.email) return NextResponse.json({ error: "User not found or no email" }, { status: 404 });

  const { email, full_name } = targetUser;
  const fullName = full_name ?? "Investor";
  const now = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  switch (template) {
    case "welcome":
      await mailer.welcome(email, { fullName, email });
      break;

    case "securityAlert":
      await mailer.securityAlert(email, { fullName, signedInAt: now });
      break;

    case "depositApproved": {
      const { data: lastDeposit } = await adminClient
        .from("wc_deposits").select("id, amount, currency")
        .eq("user_id", user_id).eq("status", "APPROVED")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      const { data: walletRow } = await adminClient.from("wc_wallet_balances")
        .select("available_balance").eq("user_id", user_id).maybeSingle();
      await mailer.depositApproved(email, {
        fullName,
        amount: Number(lastDeposit?.amount ?? 0),
        currency: lastDeposit?.currency ?? "USDT",
        newBalance: Number(walletRow?.available_balance ?? 0),
        depositId: lastDeposit?.id ?? "manual",
      });
      break;
    }

    case "custom": {
      if (!custom_subject || !custom_body) {
        return NextResponse.json({ error: "custom_subject and custom_body required" }, { status: 400 });
      }
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
body{background:#0B0E11;color:#EAECEF;font-family:'IBM Plex Sans',sans-serif;margin:0;padding:40px 16px}
.wrap{max-width:600px;margin:0 auto;background:#161A1E;border:1px solid #2B2F36;border-radius:16px;overflow:hidden}
.top{height:2px;background:linear-gradient(90deg,transparent,#F0B90B,transparent)}
.hdr{padding:28px 40px;border-bottom:1px solid #2B2F36;text-align:center}
.logo{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:linear-gradient(135deg,#F0B90B,#C99D0A);border-radius:10px;font-weight:700;font-size:20px;color:#0B0E11;margin-bottom:10px;font-family:'IBM Plex Sans',sans-serif}
.brand{font-size:18px;font-weight:600;color:#EAECEF}
.body{padding:36px 40px;font-size:15px;line-height:1.7;color:#EAECEF}
.footer{padding:24px 40px;border-top:1px solid #2B2F36;text-align:center;font-size:11px;color:#474D57;font-family:'IBM Plex Mono',monospace}
</style></head><body>
<div class="wrap">
<div class="top"></div>
<div class="hdr"><div class="logo">W</div><br><div class="brand">Wertchain</div></div>
<div class="body">${custom_body.replace(/\n/g, "<br>")}</div>
<div class="footer">© ${new Date().getFullYear()} Wertchain · <a href="mailto:${process.env.RESEND_REPLY_TO ?? "support@wertchain.com"}" style="color:#848E9C">support</a></div>
</div></body></html>`;

      const { error } = await resend.emails.send({ from: FROM, to: email, subject: custom_subject, html });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      break;
    }

    default:
      return NextResponse.json({
        error: `Unknown template '${template}'. Available: welcome, securityAlert, depositApproved, custom`
      }, { status: 400 });
  }

  await adminClient.from("wc_admin_audit_log").insert({
    admin_id: adminRow.id,
    action_type: "MANUAL_LEDGER_ADJUSTMENT" as never,
    target_user_id: user_id,
    reason: `Manual email sent — template: ${template}`,
    before_state: {},
    after_state: { email_template: template, recipient: email },
  });

  return NextResponse.json({ success: true, sent_to: email, template });
}
