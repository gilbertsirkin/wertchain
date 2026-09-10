/**
 * POST /api/admin/email
 *
 * Sends email from admin panel. Two modes:
 *   type: "compose"  — free-form email to a segment or specific address
 *   type: "campaign" — fires one of the 7 pre-built drip templates
 *
 * Body:
 *   {
 *     type: "compose" | "campaign",
 *     segment: "all" | "no_deposit" | "active" | "specific",
 *     specific_email?: string,       // when segment = "specific"
 *     subject?: string,              // compose only
 *     body?: string,                 // compose only (plain text / light HTML)
 *     campaign_day?: 1|2|3|4|5|6|7, // campaign only
 *   }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { adminClient } from "@/lib/ledger"
import { Resend } from "resend"
import { campaignTemplate } from "@/lib/email/campaign-templates"
import { composeTemplate } from "@/lib/email/compose-template"


const FROM = process.env.EMAIL_FROM ?? "Wertchain <noreply@wertchain.com>"

async function authAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: a } = await adminClient.from("wc_admins").select("id, is_active").eq("user_id", user.id).single()
  return a?.is_active ? user : null
}

async function getRecipients(segment: string, specificEmail?: string) {
  if (segment === "specific" && specificEmail) {
    const { data } = await adminClient.from("wc_users").select("email, full_name").eq("email", specificEmail).single()
    return data ? [data] : []
  }

  if (segment === "all") {
    const { data } = await adminClient.from("wc_users").select("email, full_name").eq("is_active", true)
    return data ?? []
  }

  if (segment === "no_deposit") {
    // Registered but never made a deposit — wallet balance == 0 and no approved deposits
    const { data } = await adminClient
      .from("wc_users")
      .select("email, full_name, wc_wallet_balances(available_balance, locked_capital)")
      .eq("is_active", true)
    if (!data) return []
    return data.filter((u: {
      email: string
      full_name: string
      wc_wallet_balances: { available_balance: number; locked_capital: number } | null
    }) => {
      const wb = u.wc_wallet_balances
      return (!wb || (Number(wb.available_balance) === 0 && Number(wb.locked_capital) === 0))
    })
  }

  if (segment === "active") {
    // Users with at least one ACTIVE contract
    const { data: contracts } = await adminClient
      .from("wc_contracts").select("user_id").eq("state", "ACTIVE")
    if (!contracts) return []
    const ids = [...new Set(contracts.map((c: { user_id: string }) => c.user_id))]
    const { data } = await adminClient.from("wc_users").select("email, full_name").in("id", ids)
    return data ?? []
  }

  return []
}

async function logEmail(
  adminUserId: string,
  recipients: { email: string }[],
  subject: string,
  type: string,
  campaignDay?: number
) {
  await adminClient.from("wc_email_log").insert(
    recipients.map(r => ({
      admin_user_id: adminUserId,
      recipient_email: r.email,
      subject,
      email_type: type,
      campaign_day: campaignDay ?? null,
      sent_at: new Date().toISOString(),
      status: "SENT",
    }))
  )
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const admin = await authAdmin()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { type, segment, specific_email, subject, body: emailBody, campaign_day } = body

  if (!segment) return NextResponse.json({ error: "segment is required" }, { status: 400 })

  const recipients = await getRecipients(segment, specific_email)
  if (recipients.length === 0) return NextResponse.json({ error: "No recipients found for this segment" }, { status: 404 })

  let sent = 0
  const errors: string[] = []

  if (type === "compose") {
    if (!subject || !emailBody) return NextResponse.json({ error: "subject and body required" }, { status: 400 })
    for (const r of recipients) {
      try {
        const { error } = await resend.emails.send({
          from: FROM, to: r.email,
          subject,
          html: composeTemplate({ full_name: r.full_name, subject, body: emailBody }),
        })
        if (error) errors.push(`${r.email}: ${error.message}`)
        else sent++
      } catch (e) { errors.push(`${r.email}: ${(e as Error).message}`) }
    }
    await logEmail(admin.id, recipients, subject, "compose")
  }

  if (type === "campaign") {
    if (!campaign_day || campaign_day < 1 || campaign_day > 7)
      return NextResponse.json({ error: "campaign_day must be 1–7" }, { status: 400 })

    const tpl = campaignTemplate(campaign_day)
    for (const r of recipients) {
      try {
        const { error } = await resend.emails.send({
          from: FROM, to: r.email,
          subject: tpl.subject,
          html: tpl.html({ full_name: r.full_name }),
        })
        if (error) errors.push(`${r.email}: ${error.message}`)
        else sent++
      } catch (e) { errors.push(`${r.email}: ${(e as Error).message}`) }
    }
    await logEmail(admin.id, recipients, tpl.subject, "campaign", campaign_day)
  }

  return NextResponse.json({ ok: true, sent, total: recipients.length, errors: errors.length > 0 ? errors : undefined })
}

export async function GET() {
  const admin = await authAdmin()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await adminClient
    .from("wc_email_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(200)

  return NextResponse.json({ logs: data ?? [] })
}
