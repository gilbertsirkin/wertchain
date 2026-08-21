/**
 * Wertchain Mailer — Resend integration
 *
 * Usage:
 *   import { mailer } from '@/lib/email/mailer'
 *   await mailer.depositApproved({ fullName, amount, ... })
 *
 * Env vars required:
 *   RESEND_API_KEY=re_...
 *   RESEND_FROM=noreply@yourdomain.com   (must match verified Resend domain)
 *   RESEND_REPLY_TO=support@yourdomain.com  (optional)
 *   NEXT_PUBLIC_APP_URL=https://wertchain.com
 */

import { Resend } from 'resend'
import {
  welcomeEmail,
  depositReceivedEmail,
  depositApprovedEmail,
  depositRejectedEmail,
  contractCreatedEmail,
  profitCreditedEmail,
  withdrawalRequestedEmail,
  withdrawalApprovedEmail,
  withdrawalRejectedEmail,
  migrationRequestedEmail,
  migrationApprovedEmail,
  securityAlertEmail,
} from './templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.RESEND_FROM ?? 'Wertchain <noreply@wertchain.com>'
const REPLY_TO = process.env.RESEND_REPLY_TO ?? 'support@wertchain.com'

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[mailer] RESEND_API_KEY not set — skipping email to', to)
    return null
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to,
      subject,
      html,
    })
    if (error) {
      console.error('[mailer] Resend error:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('[mailer] send failed:', err)
    return null
  }
}

// ─── exported mailer object ─────────────────────────────────────────────────
export const mailer = {
  // 1. Account welcome
  welcome: (to: string, params: { fullName: string; email: string }) =>
    send(to, `Welcome to Wertchain — Your Account Is Ready`, welcomeEmail(params)),

  // 2. Deposit received (pending)
  depositReceived: (
    to: string,
    params: {
      fullName: string
      amount: number
      currency: string
      txHash: string
      depositId: string
      submittedAt: string
    },
  ) =>
    send(
      to,
      `Deposit Received — Under Review ($${params.amount.toFixed(2)})`,
      depositReceivedEmail(params),
    ),

  // 3. Deposit approved
  depositApproved: (
    to: string,
    params: {
      fullName: string
      amount: number
      currency: string
      newBalance: number
      depositId: string
    },
  ) =>
    send(
      to,
      `✓ Deposit Approved — $${params.amount.toFixed(2)} Credited`,
      depositApprovedEmail(params),
    ),

  // 4. Deposit rejected
  depositRejected: (
    to: string,
    params: {
      fullName: string
      amount: number
      currency: string
      depositId: string
      reason?: string
    },
  ) =>
    send(
      to,
      `Deposit Not Verified — Action Required`,
      depositRejectedEmail(params),
    ),

  // 5. Contract created
  contractCreated: (
    to: string,
    params: {
      fullName: string
      planTier: string
      principal: number
      profitRate: number
      expectedProfit: number
      duration: number
      activatedAt: string
      maturityDate: string
      contractId: string
      autoReinvest: boolean
    },
  ) =>
    send(
      to,
      `Investment Active — $${params.principal.toFixed(2)} Locked & Earning`,
      contractCreatedEmail(params),
    ),

  // 6. Profit credited at maturity
  profitCredited: (
    to: string,
    params: {
      fullName: string
      planTier: string
      principal: number
      profitAmount: number
      totalCredited: number
      contractId: string
      autoReinvest: boolean
    },
  ) =>
    send(
      to,
      `🎯 Profit Credited — $${params.profitAmount.toFixed(2)} in Your Wallet`,
      profitCreditedEmail(params),
    ),

  // 7. Withdrawal requested
  withdrawalRequested: (
    to: string,
    params: {
      fullName: string
      amount: number
      withdrawalType: 'PROFIT' | 'CAPITAL'
      destination: string
      requestedAt: string
      withdrawalId: string
    },
  ) =>
    send(
      to,
      `Withdrawal Request Received — $${params.amount.toFixed(2)} Pending`,
      withdrawalRequestedEmail(params),
    ),

  // 8. Withdrawal approved
  withdrawalApproved: (
    to: string,
    params: {
      fullName: string
      amount: number
      withdrawalType: 'PROFIT' | 'CAPITAL'
      destination: string
      withdrawalId: string
      approvedAt: string
      txHash?: string
    },
  ) =>
    send(
      to,
      `✓ Withdrawal Approved — $${params.amount.toFixed(2)} Sent`,
      withdrawalApprovedEmail(params),
    ),

  // 9. Withdrawal rejected
  withdrawalRejected: (
    to: string,
    params: {
      fullName: string
      amount: number
      withdrawalType: 'PROFIT' | 'CAPITAL'
      withdrawalId: string
      reason?: string
    },
  ) =>
    send(to, `Withdrawal Rejected — Funds Returned to Wallet`, withdrawalRejectedEmail(params)),

  // 10. Migration requested
  migrationRequested: (
    to: string,
    params: {
      fullName: string
      sourcePlan: string
      targetPlan: string
      capitalAmount: number
      topupAmount: number
      migrationId: string
      requestedAt: string
    },
  ) =>
    send(to, `Migration Request Received — Under Review`, migrationRequestedEmail(params)),

  // 11. Migration approved
  migrationApproved: (
    to: string,
    params: {
      fullName: string
      sourcePlan: string
      targetPlan: string
      newPrincipal: number
      newProfitRate: number
      newMaturityDate: string
      newContractId: string
      migrationId: string
    },
  ) =>
    send(
      to,
      `✓ Migration Complete — New Contract Active`,
      migrationApprovedEmail(params),
    ),

  // 12. Security alert
  securityAlert: (
    to: string,
    params: {
      fullName: string
      ip?: string
      userAgent?: string
      location?: string
      signedInAt: string
    },
  ) =>
    send(to, `Security Alert — New Sign-In to Your Wertchain Account`, securityAlertEmail(params)),
}