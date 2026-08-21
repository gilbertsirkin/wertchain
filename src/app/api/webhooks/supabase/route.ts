/**
 * POST /api/webhooks/supabase
 *
 * Receives Supabase auth webhook events and fires transactional emails.
 *
 * Setup in Supabase Dashboard → Auth → Webhooks:
 *   URL: https://yourdomain.com/api/webhooks/supabase
 *   Events: user.created, user.updated (for email verification)
 *   Secret: set SUPABASE_WEBHOOK_SECRET in env
 *
 * Events handled:
 *   - user.created          → Welcome email (for magic-link / OAuth flows)
 *   - user.updated          → Welcome email when email_confirmed_at first appears
 *
 * Note: For password-based signups, Supabase sends a confirmation link.
 *   The welcome fires on the first `user.updated` where email is confirmed,
 *   NOT on `user.created`, to avoid emailing unconfirmed addresses.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/ledger";
import { mailer } from "@/lib/email/mailer";

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const authHeader = req.headers.get("authorization");
  if (WEBHOOK_SECRET && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    type: string;
    table: string;
    record: {
      id: string;
      email: string;
      email_confirmed_at?: string | null;
      raw_user_meta_data?: { full_name?: string };
      created_at: string;
    };
    old_record?: {
      email_confirmed_at?: string | null;
    };
  };

  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, record } = payload;

  // Handle user.created for OAuth / magic-link (already confirmed)
  if (type === "INSERT" && record.email_confirmed_at) {
    await sendWelcome(record.id, record.email, record.raw_user_meta_data?.full_name);
    return NextResponse.json({ sent: true });
  }

  // Handle user.updated — fire welcome on first email confirmation
  if (type === "UPDATE") {
    const wasConfirmed = !!payload.old_record?.email_confirmed_at;
    const nowConfirmed = !!record.email_confirmed_at;
    if (!wasConfirmed && nowConfirmed) {
      await sendWelcome(record.id, record.email, record.raw_user_meta_data?.full_name);
      return NextResponse.json({ sent: true });
    }
  }

  return NextResponse.json({ skipped: true });
}

async function sendWelcome(userId: string, email: string, metaName?: string) {
  // Try to get full_name from wc_users (created by trigger after signup)
  const { data: userRow } = await adminClient
    .from("wc_users")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const fullName = userRow?.full_name ?? metaName ?? "Investor";

  mailer
    .welcome(email, { fullName, email })
    .catch((e) => console.error("[mailer] welcome failed:", e));
}
