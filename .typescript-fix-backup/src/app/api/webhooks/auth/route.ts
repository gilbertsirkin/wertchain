/**
 * POST /api/webhooks/auth
 *
 * Supabase Auth webhook receiver.
 * Handles: USER_CREATED (send welcome email)
 *
 * Setup in Supabase Dashboard:
 *   Authentication → Webhooks → Add webhook
 *   URL: https://wertchain.com/api/webhooks/auth
 *   Events: user.created
 *   Secret: set SUPABASE_WEBHOOK_SECRET in env
 *
 * Supabase signs requests with HMAC-SHA256.
 * We verify before doing anything.
 */

import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { adminClient } from "@/lib/ledger"
import { sendWelcomeEmail } from "@/lib/email/mailer"

const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET ?? ""

function verifySignature(body: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader) return false
  try {
    const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex")
    const received = signatureHeader.replace(/^sha256=/, "")
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get("x-supabase-signature") ?? req.headers.get("webhook-signature")

  if (WEBHOOK_SECRET && !verifySignature(raw, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: { type: string; record?: { id?: string; email?: string; raw_user_meta_data?: Record<string, string> } }
  try {
    payload = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (payload.type === "INSERT" && payload.record?.email) {
    const authUser = payload.record
    const fullName = authUser.raw_user_meta_data?.full_name ?? authUser.email?.split("@")[0] ?? "there"

    // Retry loop — the DB trigger creating wc_users row may not have fired yet
    let wcUser: { email: string; full_name: string } | null = null
    for (let i = 0; i < 5; i++) {
      const { data } = await adminClient
        .from("wc_users")
        .select("email, full_name")
        .eq("id", authUser.id)
        .single()
      if (data) { wcUser = data; break }
      await new Promise(r => setTimeout(r, 800 * (i + 1))) // back-off: 0.8s, 1.6s, 2.4s…
    }

    const emailTarget = wcUser ?? { email: authUser.email!, full_name: fullName }
    await sendWelcomeEmail(emailTarget).catch(console.error)
  }

  return NextResponse.json({ ok: true })
}
