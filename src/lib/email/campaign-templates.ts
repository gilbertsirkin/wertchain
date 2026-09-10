/**
 * Wertchain 7-Day Activation Campaign
 * Target: Registered users who have not yet made a first deposit
 *
 * Tone calibration (German-market institutional):
 *   - No urgency manipulation. No countdown timers. No "act now".
 *   - Precise numbers. Exact mechanics. No vague promises.
 *   - Every claim is factually grounded in the platform's architecture.
 *   - Formal but not stiff. Authoritative but accessible.
 *   - Risk disclosure present on every email.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wertchain.live'

function shell(subject: string, preview: string, headerTitle: string, headerSub: string | undefined, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="color-scheme" content="dark" /><title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#080D1A;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#E5E7EB;">
  <div style="display:none;max-height:0;overflow:hidden;">${preview}&nbsp;​‌​‌​‌</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080D1A;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <tr><td style="padding-bottom:28px;" align="center">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background-color:#22C55E;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
              <span style="font-size:16px;font-weight:900;color:#000;line-height:32px;">W</span>
            </td>
            <td style="padding-left:10px;">
              <span style="font-size:18px;font-weight:700;color:#FFF;letter-spacing:-0.3px;">Wertchain</span>
              <span style="font-size:10px;color:#4B5563;letter-spacing:1.5px;text-transform:uppercase;margin-left:8px;">INVESTMENT PLATFORM</span>
            </td>
          </tr></table>
        </td></tr>

        <tr><td style="background-color:#0D1017;border:1px solid #1A1E2E;border-radius:16px;overflow:hidden;">
          <div style="height:2px;background:linear-gradient(to right,transparent,#22C55E40,transparent);"></div>

          <!-- header -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #1A1E2E;">
              <p style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#4B5563;text-transform:uppercase;margin:0 0 8px;">Wertchain Notification</p>
              <h1 style="font-size:22px;font-weight:700;color:#FFF;line-height:1.3;letter-spacing:-0.4px;margin:0;">${headerTitle}</h1>
              ${headerSub ? `<p style="font-size:14px;color:#9CA3AF;margin:6px 0 0;">${headerSub}</p>` : ''}
            </td></tr>

            <!-- body -->
            <tr><td style="padding:28px 40px;">
              ${content}

              <!-- risk disclosure -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr><td style="background-color:#0A1628;border:1px solid #1E3A5F;border-radius:8px;padding:14px 16px;">
                  <p style="font-size:11px;color:#60A5FA;line-height:1.6;margin:0;">
                    ℹ&nbsp;&nbsp;Capital allocation involves risk. Fixed yield rates are locked at contract creation and do not fluctuate thereafter. Past yield performance does not guarantee future results. Please invest only capital you can commit for the full contract term.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 0 0;" align="center">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding:0 12px;"><a href="${SITE_URL}/dashboard" style="font-size:12px;color:#4B5563;text-decoration:none;">Dashboard</a></td>
            <td style="padding:0 12px;"><a href="${SITE_URL}/privacy" style="font-size:12px;color:#4B5563;text-decoration:none;">Privacy</a></td>
            <td style="padding:0 12px;"><a href="${SITE_URL}/terms" style="font-size:12px;color:#4B5563;text-decoration:none;">Terms</a></td>
            <td style="padding:0 12px;"><a href="${SITE_URL}/contact" style="font-size:12px;color:#4B5563;text-decoration:none;">Support</a></td>
          </tr></table>
          <p style="font-size:11px;color:#374151;line-height:1.6;margin:8px auto 0;max-width:400px;">
            Wertchain Ltd · You are receiving this because you hold a registered account.<br/>
            This is an automated message — please do not reply directly.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function para(t: string) {
  return `<p style="font-size:14px;color:#9CA3AF;line-height:1.8;margin:0 0 16px;">${t}</p>`
}
function cta(label: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background-color:#22C55E;border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#000;text-decoration:none;">${label}</a>
    </td></tr>
  </table>`
}
function statGrid(items: [string, string, string?][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>${items.map(([label, value, sub]) => `
      <td align="center" style="background-color:#0A1628;border:1px solid #1A1E2E;border-radius:10px;padding:16px;width:${Math.floor(100/items.length)}%;">
        <p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#4B5563;margin:0 0 4px;">${label}</p>
        <p style="font-size:20px;font-weight:800;color:#22C55E;font-family:'Courier New',monospace;margin:0;">${value}</p>
        ${sub ? `<p style="font-size:11px;color:#374151;margin:2px 0 0;">${sub}</p>` : ''}
      </td>`).join('<td width="8"></td>')}
    </tr>
  </table>`
}
function dataBlock(rows: [string, string][]) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1628;border:1px solid #1A1E2E;border-radius:10px;margin:20px 0;">
    <tr><td style="padding:4px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${rows.map(([l,v]) => `
          <tr><td style="padding:12px 0;border-bottom:1px solid #1A1E2E;">
            <p style="font-size:11px;letter-spacing:0.8px;text-transform:uppercase;color:#4B5563;margin:0 0 2px;">${l}</p>
            <p style="font-size:13px;font-weight:500;color:#D1D5DB;font-family:'Courier New',monospace;margin:0;">${v}</p>
          </td></tr>`).join('')}
      </table>
    </td></tr>
  </table>`
}

// ── DAY TEMPLATES ──────────────────────────────────────────────────────────

const days: Record<number, {
  subject: string
  preview: string
  title: string
  subtitle?: string
  body: (name: string) => string
}> = {

  // DAY 1 — Welcome back. Here is what you have access to.
  1: {
    subject: 'Your Wertchain account is waiting — here is what you have access to',
    preview: 'Fixed-yield investment contracts, cryptographically tracked, fully auditable.',
    title: 'Your account is ready. Your capital is not working yet.',
    subtitle: 'A brief overview of what Wertchain offers.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('You created a Wertchain account but have not yet placed a capital allocation. This message is a straightforward reminder of what the platform provides.')}
      ${statGrid([
        ['Fixed Yield', '5–40%', 'per contract term'],
        ['Ledger Type', 'NUMERIC(20,8)', 'double-entry'],
        ['Auditability', '100%', 'reconstructable'],
      ])}
      ${para('Wertchain operates on a Master Ledger architecture. Every allocation, every profit accrual, and every withdrawal is recorded as an immutable double-entry transaction — SHA-256 hashed and fully reconstructable from first principles.')}
      ${para('There are four capital tiers. Each carries a fixed yield rate locked at contract activation. The rate does not change for the duration of your term.')}
      ${cta('View investment plans', `${SITE_URL}/invest`)}
      ${para('If you have questions about the mechanics before committing capital, our support team is available at <a href="mailto:support@wertchain.live" style="color:#22C55E;">support@wertchain.live</a>.')}
    `,
  },

  // DAY 2 — Exactly how it works. Step by step.
  2: {
    subject: 'How Wertchain contracts work — step by step',
    preview: 'Four steps from deposit to daily yield accrual. No ambiguity.',
    title: 'Four steps from deposit to daily yield.',
    subtitle: 'How capital flows through the platform.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('Precision matters in investment infrastructure. Here is exactly what happens when you allocate capital on Wertchain — no approximations.')}
      ${dataBlock([
        ['Step 1 — Deposit', 'Transfer crypto to the platform wallet. Submit your transaction hash for confirmation. Typical review time: 1–6 hours.'],
        ['Step 2 — Activation', 'Once verified, your fixed-term contract is activated. Your yield rate is locked at this point and cannot be changed.'],
        ['Step 3 — Daily Accrual', 'Profit accrues daily at your contracted rate. Each accrual is recorded as a separate ledger entry with timestamp and SHA-256 hash.'],
        ['Step 4 — Maturity', 'At contract maturity, capital enters the release queue. Profit is credited to your available balance immediately.'],
      ])}
      ${para('At no stage does the platform have discretionary control over your profit rate. The rate is encoded in the contract record at activation and is mathematically fixed.')}
      ${cta('Open an investment contract', `${SITE_URL}/deposit`)}
    `,
  },

  // DAY 3 — The architecture. Why it cannot be soft-coded.
  3: {
    subject: 'Why Wertchain balances are cryptographically guaranteed',
    preview: 'NUMERIC(20,8) precision. SHA-256 hash chains. Double-entry constraints. Every cent tracked.',
    title: 'The infrastructure behind your balance.',
    subtitle: 'Built on PostgreSQL 15 + Supabase with database-level financial constraints.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('This message is for investors who want to understand the infrastructure before committing capital. If you prefer a summary, skip to the bottom.')}
      ${dataBlock([
        ['Arithmetic precision', 'NUMERIC(20,8) — 8 decimal places, no floating point rounding error on any transaction'],
        ['Ledger type', 'Double-entry — every credit has a matching debit; no balance can appear without a recorded source'],
        ['Hash chain', 'SHA-256 per ledger entry — any tampering with a historical record is mathematically detectable'],
        ['State machine', 'Contract states (PENDING → ACTIVE → MATURED → RELEASE_QUEUE → RELEASED) are enforced at database level — not in application code'],
        ['Audit trail', '100% reconstructable — the sum of all ledger entries for any account equals the balance displayed, always'],
      ])}
      ${para('This is the architecture the platform is built on. It is not marketing language — it is the schema. Investors with a technical background are welcome to request a technical overview from support.')}
      ${para('<strong style="color:#FFF;">Summary:</strong> Your balance cannot be altered without a corresponding ledger record. Every movement is tracked, hashed, and auditable.')}
      ${cta('Start with a capital allocation', `${SITE_URL}/invest`)}
    `,
  },

  // DAY 4 — The four plans. Exact terms.
  4: {
    subject: 'Wertchain investment tiers — exact terms and yield rates',
    preview: 'Start at $1K. Four fixed-yield tiers. Rates locked at activation.',
    title: 'Four capital tiers. Exact terms.',
    subtitle: 'No negotiated rates. No variable yields. What you see is what is locked.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('The following is a precise specification of the four Wertchain investment tiers currently available.')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1628;border:1px solid #1A1E2E;border-radius:10px;margin:20px 0;overflow:hidden;">
        <tr style="border-bottom:1px solid #1A1E2E;">
          <td style="padding:10px 16px;"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;margin:0;">Plan</p></td>
          <td style="padding:10px 16px;"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;margin:0;">Capital Range</p></td>
          <td style="padding:10px 16px;"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;margin:0;">Yield</p></td>
          <td style="padding:10px 16px;"><p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#4B5563;margin:0;">Term</p></td>
        </tr>
        ${[
          ['Start Plan', '$1,000 – $4,999', '5%', '14 days'],
          ['Growth Plan', '$5,000 – $14,999', '8%', '30 days'],
          ['Professional', '$15,000 – $49,999', '15%', '60 days'],
          ['Elite', '$50,000+', '40%', '90 days'],
        ].map(([plan, range, yield_, term]) => `
          <tr style="border-top:1px solid #1A1E2E;">
            <td style="padding:13px 16px;"><p style="font-size:13px;font-weight:600;color:#FFF;margin:0;">${plan}</p></td>
            <td style="padding:13px 16px;"><p style="font-size:13px;color:#9CA3AF;font-family:'Courier New',monospace;margin:0;">${range}</p></td>
            <td style="padding:13px 16px;"><p style="font-size:13px;font-weight:700;color:#22C55E;font-family:'Courier New',monospace;margin:0;">${yield_}</p></td>
            <td style="padding:13px 16px;"><p style="font-size:13px;color:#9CA3AF;font-family:'Courier New',monospace;margin:0;">${term}</p></td>
          </tr>`).join('')}
      </table>
      ${para('Yield rates are fixed at contract creation. They do not fluctuate based on market conditions, platform performance, or any external variable.')}
      ${para('Plan upgrades (migrations) are available mid-term if your capital grows beyond the current tier threshold. Migrations are reviewed by the admin team within 24 hours.')}
      ${cta('Allocate capital now', `${SITE_URL}/deposit`)}
    `,
  },

  // DAY 5 — Withdrawals. Exactly how they work.
  5: {
    subject: 'How withdrawals work on Wertchain — no surprises',
    preview: 'Profit at maturity. Capital in the release queue. KYC required. Processed within 24 hours.',
    title: 'Withdrawals — the exact mechanics.',
    subtitle: 'Transparency on how and when funds are returned.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('Before allocating capital, investors deserve to understand precisely how withdrawal works. This is that explanation.')}
      ${dataBlock([
        ['Profit withdrawal', 'Profit is credited to your available balance at contract maturity. You may withdraw at any time after crediting. No waiting period on profit.'],
        ['Capital withdrawal', 'Principal enters a release queue at maturity. Release is processed within the contractual release window (typically 24–72 hours).'],
        ['Partial withdrawal', 'Not available during the contract term. Capital is locked for the full duration as stated in your contract.'],
        ['KYC requirement', 'Identity verification is required before the first withdrawal is processed. This is a regulatory requirement, not a platform restriction.'],
        ['Processing time', 'Admin team processes withdrawal requests within 24 business hours. Crypto network confirmation time applies separately.'],
      ])}
      ${para('There are no hidden fees on withdrawals. The amount credited to your balance is the amount sent to your wallet, minus standard network gas fees where applicable.')}
      ${para('Locking capital for a fixed term is the structure that allows fixed yield rates to be contractually guaranteed. This is the direct exchange: certainty of return, in exchange for commitment of term.')}
      ${cta('Review plans and start investing', `${SITE_URL}/invest`)}
    `,
  },

  // DAY 6 — Objections handled. Direct.
  6: {
    subject: 'The questions investors ask before their first deposit',
    preview: 'Is my capital safe? What if I need funds early? How are yields generated?',
    title: 'Answers to the questions investors ask before committing.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('The following are the most common questions from investors before their first allocation. Straight answers.')}
      ${dataBlock([
        ['Is my capital safe?', 'Capital is held in platform-controlled wallets separate from operational funds. The ledger architecture ensures balances are always auditable and reconstructable. No fractional reserve. Every deposit is traceable.'],
        ['How are yields generated?', 'The platform generates returns through structured capital deployment strategies. Yield rates are fixed at contract creation — your rate is locked regardless of what the platform earns.'],
        ['What if I need funds before maturity?', 'Capital is committed for the contract term. Early termination is not supported. This is a fundamental structural requirement, not a restriction — it is what makes the fixed rate possible.'],
        ['What is the minimum allocation?', '$1,000 USD on the Start Plan. The 14-day term and 5% yield make it the appropriate entry point for new investors.'],
        ['Is KYC mandatory?', 'KYC is required for withdrawals. Account registration and deposits do not require KYC. Verification is initiated when you first request a withdrawal.'],
        ['What happens if I have a dispute?', 'All transactions are immutably recorded in the ledger. Any discrepancy can be investigated by submitting a support ticket with your account email. Every entry has a timestamp, hash, and audit trail.'],
      ])}
      ${cta('Open your investment contract', `${SITE_URL}/deposit`)}
    `,
  },

  // DAY 7 — Final message. No pressure. Just clear.
  7: {
    subject: 'A final note from the Wertchain team',
    preview: 'Your account remains open. The plans remain available. No deadline.',
    title: 'Your account is open. No deadline.',
    subtitle: 'This is the last message in this introduction series.',
    body: (name) => `
      ${para(`Dear ${name},`)}
      ${para('This is the last message in the introduction series sent to new Wertchain registrants. You will not receive further automated outreach after today unless you have an active contract or initiate contact.')}
      ${para('If you have not yet allocated capital, that is a considered decision and we respect it. The platform remains available when and if it is appropriate for your portfolio.')}
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0A1628;border:1px solid #1A1E2E;border-radius:10px;margin:20px 0;">
        <tr><td style="padding:20px 24px;">
          <p style="font-size:13px;font-weight:700;color:#FFF;margin:0 0 8px;">What remains available to you:</p>
          ${[
            'Your account — active and accessible at any time',
            'All four investment plans — same rates, same terms',
            'Support team — available at support@wertchain.live',
            'Full platform documentation — at wertchain.live',
          ].map(item => `
            <p style="font-size:13px;color:#9CA3AF;margin:6px 0;padding-left:16px;border-left:2px solid #22C55E40;">
              <span style="color:#22C55E;margin-right:8px;">✓</span>${item}
            </p>`).join('')}
        </td></tr>
      </table>
      ${para('If anything in the platform architecture, the yield mechanics, or the withdrawal process was unclear from these messages, please write to us directly. We will answer precisely.')}
      ${para('Thank you for registering.')}
      <p style="font-size:13px;color:#9CA3AF;margin:20px 0 0;"><strong style="color:#FFF;">The Wertchain Team</strong></p>
      ${cta('Log in to your account', `${SITE_URL}/dashboard`)}
    `,
  },
}

export function campaignTemplate(day: number): {
  subject: string
  html: (opts: { full_name: string }) => string
} {
  const d = days[day]
  if (!d) throw new Error(`No campaign template for day ${day}`)
  return {
    subject: d.subject,
    html: ({ full_name }) => shell(
      d.subject,
      d.preview,
      d.title,
      d.subtitle,
      d.body(full_name)
    ),
  }
}

export const CAMPAIGN_DAYS = Object.entries(days).map(([day, d]) => ({
  day: Number(day),
  subject: d.subject,
  preview: d.preview,
}))
