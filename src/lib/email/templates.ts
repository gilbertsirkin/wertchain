/**
 * Wertchain Email Templates
 * Design: Dark financial aesthetic — inspired by Binance/institutional fintech
 * Font: IBM Plex Sans (body) + IBM Plex Mono (numerics/addresses) via Google Fonts
 * All templates return self-contained HTML strings safe for Resend.
 */

// ─── shared design tokens ───────────────────────────────────────────────────
const BRAND = {
  primary: '#F0B90B',       // Binance gold
  primaryDark: '#C99D0A',
  bg: '#0B0E11',            // Binance dark background
  surface: '#161A1E',       // card surface
  surfaceBorder: '#2B2F36', // card border
  textPrimary: '#EAECEF',   // near-white
  textSecondary: '#848E9C', // muted
  textMuted: '#474D57',
  green: '#0ECB81',
  red: '#F6465D',
  blue: '#1E88E5',
  name: 'Wertchain',
  domain: process.env.NEXT_PUBLIC_APP_URL ?? 'https://wertchain.com',
  supportEmail: process.env.SUPPORT_EMAIL ?? 'support@wertchain.com',
  logoText: 'W',
}

const FONTS = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
`

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#0B0E11;
    font-family:'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing:antialiased;
    color:#EAECEF;
  }
  .mono { font-family:'IBM Plex Mono', 'Courier New', monospace; }
  .wrapper { background:#0B0E11; padding:40px 16px; }
  .container {
    max-width:600px; margin:0 auto;
    background:#161A1E;
    border-radius:16px;
    border:1px solid #2B2F36;
    overflow:hidden;
  }

  /* Header */
  .header {
    background:linear-gradient(135deg, #0B0E11 0%, #161A1E 100%);
    border-bottom:1px solid #2B2F36;
    padding:32px 40px 28px;
    text-align:center;
    position:relative;
  }
  .header::after {
    content:'';
    display:block;
    height:2px;
    background:linear-gradient(90deg, transparent, #F0B90B, transparent);
    margin-top:28px;
    margin-left:-40px;
    margin-right:-40px;
  }
  .logo-mark {
    display:inline-flex; align-items:center; justify-content:center;
    width:48px; height:48px;
    background:linear-gradient(135deg, #F0B90B, #C99D0A);
    border-radius:12px;
    font-family:'IBM Plex Sans', sans-serif;
    font-weight:700; font-size:22px; color:#0B0E11;
    margin-bottom:12px;
    box-shadow:0 4px 20px rgba(240,185,11,0.3);
  }
  .brand-name {
    font-size:20px; font-weight:600; color:#EAECEF; letter-spacing:0.5px;
  }
  .brand-tagline { font-size:11px; color:#848E9C; letter-spacing:2px; text-transform:uppercase; margin-top:2px; }

  /* Body */
  .body { padding:40px; }
  .greeting { font-size:24px; font-weight:600; color:#EAECEF; margin-bottom:8px; }
  .subtext { font-size:15px; color:#848E9C; line-height:1.6; margin-bottom:28px; }

  /* Amount block */
  .amount-block {
    background:#0B0E11;
    border:1px solid #2B2F36;
    border-radius:12px;
    padding:24px 28px;
    margin:24px 0;
    position:relative;
    overflow:hidden;
  }
  .amount-block::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:2px;
    background:linear-gradient(90deg, #F0B90B, transparent);
  }
  .amount-label { font-size:11px; color:#848E9C; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px; }
  .amount-value {
    font-family:'IBM Plex Mono', monospace;
    font-size:32px; font-weight:600; color:#F0B90B;
    letter-spacing:-0.5px;
  }
  .amount-currency { font-size:14px; color:#848E9C; margin-top:4px; font-family:'IBM Plex Mono', monospace; }

  /* Stat grid */
  .stat-grid { display:table; width:100%; border-collapse:separate; border-spacing:12px; margin:20px 0; }
  .stat-cell {
    display:table-cell; width:50%;
    background:#0B0E11;
    border:1px solid #2B2F36;
    border-radius:10px;
    padding:16px 20px;
    vertical-align:top;
  }
  .stat-label { font-size:11px; color:#848E9C; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:6px; }
  .stat-value { font-family:'IBM Plex Mono', monospace; font-size:16px; font-weight:600; color:#EAECEF; }
  .stat-value.green { color:#0ECB81; }
  .stat-value.gold { color:#F0B90B; }
  .stat-value.blue { color:#1E88E5; }

  /* Info rows */
  .info-table { width:100%; border-collapse:collapse; margin:20px 0; }
  .info-row { border-bottom:1px solid #2B2F36; }
  .info-row:last-child { border-bottom:none; }
  .info-key { padding:12px 0; font-size:13px; color:#848E9C; width:45%; vertical-align:top; }
  .info-val { padding:12px 0; font-size:13px; color:#EAECEF; font-family:'IBM Plex Mono', monospace; text-align:right; }

  /* Status badge */
  .badge {
    display:inline-block; padding:4px 12px; border-radius:20px;
    font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase;
    font-family:'IBM Plex Mono', monospace;
  }
  .badge-gold { background:rgba(240,185,11,0.15); color:#F0B90B; border:1px solid rgba(240,185,11,0.3); }
  .badge-green { background:rgba(14,203,129,0.12); color:#0ECB81; border:1px solid rgba(14,203,129,0.25); }
  .badge-red { background:rgba(246,70,93,0.12); color:#F6465D; border:1px solid rgba(246,70,93,0.25); }
  .badge-blue { background:rgba(30,136,229,0.12); color:#1E88E5; border:1px solid rgba(30,136,229,0.25); }

  /* CTA button */
  .btn-wrap { text-align:center; margin:28px 0 20px; }
  .btn {
    display:inline-block;
    background:linear-gradient(135deg, #F0B90B, #C99D0A);
    color:#0B0E11; text-decoration:none;
    padding:14px 32px; border-radius:8px;
    font-weight:700; font-size:14px; letter-spacing:0.3px;
    box-shadow:0 4px 16px rgba(240,185,11,0.25);
  }
  .btn-ghost {
    display:inline-block;
    background:transparent;
    color:#EAECEF; text-decoration:none;
    padding:12px 28px; border-radius:8px;
    font-weight:600; font-size:13px;
    border:1px solid #2B2F36;
  }

  /* Alert box */
  .alert {
    border-radius:10px; padding:16px 20px; margin:20px 0;
    font-size:13px; line-height:1.6;
  }
  .alert-warning { background:rgba(240,185,11,0.08); border:1px solid rgba(240,185,11,0.25); color:#F0B90B; }
  .alert-info { background:rgba(30,136,229,0.08); border:1px solid rgba(30,136,229,0.25); color:#848E9C; }
  .alert-danger { background:rgba(246,70,93,0.08); border:1px solid rgba(246,70,93,0.25); color:#F6465D; }
  .alert-success { background:rgba(14,203,129,0.08); border:1px solid rgba(14,203,129,0.25); color:#0ECB81; }

  /* Divider */
  .divider { height:1px; background:#2B2F36; margin:28px 0; }

  /* Timeline step */
  .timeline { margin:20px 0; }
  .timeline-step { display:flex; align-items:flex-start; gap:14px; margin-bottom:20px; }
  .timeline-dot {
    width:28px; height:28px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; font-family:'IBM Plex Mono', monospace;
  }
  .timeline-dot.active { background:linear-gradient(135deg,#F0B90B,#C99D0A); color:#0B0E11; }
  .timeline-dot.done { background:rgba(14,203,129,0.2); color:#0ECB81; border:1px solid rgba(14,203,129,0.4); }
  .timeline-dot.pending { background:#161A1E; color:#474D57; border:1px solid #2B2F36; }
  .timeline-content .t-title { font-size:14px; font-weight:600; color:#EAECEF; }
  .timeline-content .t-sub { font-size:12px; color:#848E9C; margin-top:2px; }

  /* Footer */
  .footer {
    background:#0B0E11;
    border-top:1px solid #2B2F36;
    padding:28px 40px;
    text-align:center;
  }
  .footer-links { margin-bottom:16px; }
  .footer-links a { color:#848E9C; text-decoration:none; font-size:12px; margin:0 10px; }
  .footer-links a:hover { color:#F0B90B; }
  .footer-text { font-size:11px; color:#474D57; line-height:1.7; }
  .footer-brand { font-size:13px; font-weight:600; color:#848E9C; margin-bottom:8px; }

  /* Security notice */
  .security-box {
    background:#0B0E11; border:1px solid #2B2F36; border-radius:10px;
    padding:16px 20px; margin-top:24px; display:flex; gap:12px; align-items:flex-start;
  }
  .security-icon { font-size:18px; flex-shrink:0; margin-top:1px; }
  .security-text { font-size:12px; color:#848E9C; line-height:1.6; }
  .security-text strong { color:#EAECEF; }
`

function shell(title: string, previewText: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  ${FONTS}
  <style>${CSS}</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="logo-mark">${BRAND.logoText}</div>
        <div class="brand-name">${BRAND.name}</div>
        <div class="brand-tagline">Institutional Fixed-Yield</div>
      </div>

      ${body}

      <!-- Footer -->
      <div class="footer">
        <div class="footer-brand">${BRAND.name}</div>
        <div class="footer-links">
          <a href="${BRAND.domain}/dashboard">Dashboard</a>
          <a href="${BRAND.domain}/privacy">Privacy</a>
          <a href="${BRAND.domain}/terms">Terms</a>
          <a href="mailto:${BRAND.supportEmail}">Support</a>
        </div>
        <div class="footer-text">
          © ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.<br>
          This email was sent to you as a registered user of the ${BRAND.name} platform.<br>
          Please do not reply to this email — contact us at <a href="mailto:${BRAND.supportEmail}" style="color:#848E9C;">${BRAND.supportEmail}</a>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`
}

// ─── fmt helpers ────────────────────────────────────────────────────────────
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const pct = (n: number) => `${n.toFixed(2)}%`

const planLabel: Record<string, string> = {
  WERTCHAIN_START: 'Start',
  WERTCHAIN_GROWTH: 'Growth',
  WERTCHAIN_PROFESSIONAL: 'Professional',
  WERTCHAIN_ELITE: 'Elite',
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. WELCOME / ACCOUNT CREATED
// ═══════════════════════════════════════════════════════════════════════════
export function welcomeEmail(params: {
  fullName: string
  email: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Welcome to ${BRAND.name}, ${params.fullName.split(' ')[0]}.</div>
      <p class="subtext">Your institutional investment account has been created. You're now part of the ${BRAND.name} network — fixed-yield returns, cryptographically tracked on an immutable ledger.</p>

      <div class="amount-block">
        <div class="amount-label">Account Status</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
          <span class="badge badge-green">Active</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:#848E9C;">${params.email}</span>
        </div>
      </div>

      <div class="timeline">
        <div class="timeline-step">
          <div class="timeline-dot done">✓</div>
          <div class="timeline-content">
            <div class="t-title">Account Created</div>
            <div class="t-sub">Identity registered on the platform</div>
          </div>
        </div>
        <div class="timeline-step">
          <div class="timeline-dot active">2</div>
          <div class="timeline-content">
            <div class="t-title">Make a Deposit</div>
            <div class="t-sub">Fund your wallet via USDT (TRC20/ERC20) or BTC</div>
          </div>
        </div>
        <div class="timeline-step">
          <div class="timeline-dot pending">3</div>
          <div class="timeline-content">
            <div class="t-title">Start Earning</div>
            <div class="t-sub">Choose an investment plan and lock in fixed returns</div>
          </div>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/dashboard" class="btn">Go to Dashboard →</a>
      </div>

      <div class="security-box">
        <div class="security-icon">🔒</div>
        <div class="security-text">
          <strong>Security reminder:</strong> ${BRAND.name} will never ask for your password or seed phrases. If you receive any such request, contact support immediately at <a href="mailto:${BRAND.supportEmail}" style="color:#F0B90B;">${BRAND.supportEmail}</a>
        </div>
      </div>
    </div>
  `
  return shell(`Welcome to ${BRAND.name}`, `Your ${BRAND.name} account is ready — start earning fixed yields`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. DEPOSIT RECEIVED (awaiting admin review)
// ═══════════════════════════════════════════════════════════════════════════
export function depositReceivedEmail(params: {
  fullName: string
  amount: number
  currency: string
  txHash: string
  depositId: string
  submittedAt: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Deposit Received</div>
      <p class="subtext">We've received your deposit submission. Our team will verify the transaction on-chain and credit your wallet — typically within 1–4 hours.</p>

      <div class="amount-block">
        <div class="amount-label">Deposit Amount</div>
        <div class="amount-value">$${usd(params.amount)}</div>
        <div class="amount-currency">${params.currency}</div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Transaction Hash</td>
          <td class="info-val" style="font-size:11px;word-break:break-all;">${params.txHash}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Deposit Reference</td>
          <td class="info-val">${params.depositId.slice(0, 8).toUpperCase()}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Submitted</td>
          <td class="info-val">${params.submittedAt}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Status</td>
          <td class="info-val"><span class="badge badge-gold">Pending Review</span></td>
        </tr>
      </table>

      <div class="alert alert-info">
        You will receive another email once your deposit is approved and your wallet balance has been updated.
      </div>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/dashboard" class="btn-ghost">View Dashboard</a>
      </div>
    </div>
  `
  return shell('Deposit Received — Under Review', `Your $${usd(params.amount)} deposit is pending verification`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. DEPOSIT APPROVED
// ═══════════════════════════════════════════════════════════════════════════
export function depositApprovedEmail(params: {
  fullName: string
  amount: number
  currency: string
  newBalance: number
  depositId: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Deposit Approved ✓</div>
      <p class="subtext">Your deposit has been verified on-chain and credited to your ${BRAND.name} wallet. Funds are now available for investment.</p>

      <div class="amount-block">
        <div class="amount-label">Amount Credited</div>
        <div class="amount-value">+$${usd(params.amount)}</div>
        <div class="amount-currency">${params.currency} · Deposit #${params.depositId.slice(0, 8).toUpperCase()}</div>
      </div>

      <div style="display:table;width:100%;border-collapse:separate;border-spacing:12px;margin:20px 0;">
        <div style="display:table-row;">
          <div class="stat-cell" style="display:table-cell;">
            <div class="stat-label">Deposited</div>
            <div class="stat-value green mono">+$${usd(params.amount)}</div>
          </div>
          <div class="stat-cell" style="display:table-cell;">
            <div class="stat-label">Available Balance</div>
            <div class="stat-value gold mono">$${usd(params.newBalance)}</div>
          </div>
        </div>
      </div>

      <div class="alert alert-success">
        Your funds are now available. Ready to start earning fixed yields? Choose an investment plan from your dashboard.
      </div>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/invest" class="btn">Browse Investment Plans →</a>
      </div>
    </div>
  `
  return shell('Deposit Approved', `$${usd(params.amount)} has been credited to your wallet`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. DEPOSIT REJECTED
// ═══════════════════════════════════════════════════════════════════════════
export function depositRejectedEmail(params: {
  fullName: string
  amount: number
  currency: string
  depositId: string
  reason?: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Deposit Not Verified</div>
      <p class="subtext">Unfortunately, we were unable to verify your recent deposit. No funds have been credited to your account.</p>

      <div class="amount-block">
        <div class="amount-label">Deposit Amount</div>
        <div class="amount-value" style="color:#F6465D;">$${usd(params.amount)}</div>
        <div class="amount-currency">${params.currency} · Deposit #${params.depositId.slice(0, 8).toUpperCase()}</div>
      </div>

      ${params.reason ? `
      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Reason</td>
          <td class="info-val" style="font-family:'IBM Plex Sans',sans-serif;font-size:13px;text-align:right;">${params.reason}</td>
        </tr>
      </table>
      ` : ''}

      <div class="alert alert-danger">
        If you believe this is an error, please contact our support team with your transaction hash and proof of payment.
      </div>

      <div class="btn-wrap">
        <a href="mailto:${BRAND.supportEmail}" class="btn">Contact Support</a>
      </div>
    </div>
  `
  return shell('Deposit Not Verified', `Your deposit of $${usd(params.amount)} could not be verified`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CONTRACT / INVESTMENT CREATED
// ═══════════════════════════════════════════════════════════════════════════
export function contractCreatedEmail(params: {
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
}) {
  const label = planLabel[params.planTier] ?? params.planTier
  const total = params.principal + params.expectedProfit

  const body = `
    <div class="body">
      <div class="greeting">Investment Active</div>
      <p class="subtext">Your capital is now locked and earning. Below is your investment summary — all returns are tracked on the immutable ${BRAND.name} ledger.</p>

      <div class="amount-block">
        <div class="amount-label">Principal Locked</div>
        <div class="amount-value">$${usd(params.principal)}</div>
        <div class="amount-currency">
          <span class="badge badge-gold" style="margin-right:8px;">${label} Plan</span>
          <span style="color:#848E9C;">Contract #${params.contractId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Annual Profit Rate</td>
          <td class="info-val" style="color:#0ECB81;">${pct(params.profitRate)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Expected Profit</td>
          <td class="info-val" style="color:#0ECB81;">+$${usd(params.expectedProfit)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Total at Maturity</td>
          <td class="info-val">$${usd(total)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Contract Duration</td>
          <td class="info-val">${params.duration} days</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Activated</td>
          <td class="info-val">${params.activatedAt}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Maturity Date</td>
          <td class="info-val">${params.maturityDate}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Auto-Reinvest</td>
          <td class="info-val"><span class="badge ${params.autoReinvest ? 'badge-green' : 'badge-blue'}">${params.autoReinvest ? 'Enabled' : 'Disabled'}</span></td>
        </tr>
      </table>

      <div class="alert alert-warning">
        Capital is locked for the full contract duration. Profit accrues daily and is credited to your wallet at maturity.
      </div>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/dashboard" class="btn">Track Your Investment →</a>
      </div>
    </div>
  `
  return shell('Investment Activated', `Your $${usd(params.principal)} is now earning ${pct(params.profitRate)} — matures ${params.maturityDate}`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. PROFIT CREDITED (contract matured)
// ═══════════════════════════════════════════════════════════════════════════
export function profitCreditedEmail(params: {
  fullName: string
  planTier: string
  principal: number
  profitAmount: number
  totalCredited: number
  contractId: string
  autoReinvest: boolean
}) {
  const label = planLabel[params.planTier] ?? params.planTier
  const body = `
    <div class="body">
      <div class="greeting">Contract Matured 🎯</div>
      <p class="subtext">Your ${label} Plan contract has reached maturity. All accrued profit has been credited to your ${BRAND.name} wallet.</p>

      <div class="amount-block">
        <div class="amount-label">Profit Credited</div>
        <div class="amount-value" style="color:#0ECB81;">+$${usd(params.profitAmount)}</div>
        <div class="amount-currency">${label} Plan · Contract #${params.contractId.slice(0, 8).toUpperCase()}</div>
      </div>

      <div style="display:table;width:100%;border-collapse:separate;border-spacing:12px;margin:20px 0;">
        <div style="display:table-row;">
          <div class="stat-cell" style="display:table-cell;">
            <div class="stat-label">Principal</div>
            <div class="stat-value mono">$${usd(params.principal)}</div>
          </div>
          <div class="stat-cell" style="display:table-cell;">
            <div class="stat-label">Total Credited</div>
            <div class="stat-value gold mono">$${usd(params.totalCredited)}</div>
          </div>
        </div>
      </div>

      ${params.autoReinvest ? `
      <div class="alert alert-info">
        Auto-reinvest is <strong style="color:#EAECEF;">enabled</strong> on this contract. Your principal will automatically roll into a new ${label} Plan contract within 24 hours.
      </div>
      ` : `
      <div class="alert alert-success">
        Your capital has entered the release queue and will be available in your wallet within the standard release period. You can then withdraw or reinvest.
      </div>
      <div class="btn-wrap">
        <a href="${BRAND.domain}/invest" class="btn">Reinvest →</a>
        &nbsp;&nbsp;
        <a href="${BRAND.domain}/wallet" class="btn-ghost">Withdraw</a>
      </div>
      `}
    </div>
  `
  return shell('Profit Credited — Contract Matured', `+$${usd(params.profitAmount)} profit has been credited to your wallet`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. WITHDRAWAL REQUEST RECEIVED
// ═══════════════════════════════════════════════════════════════════════════
export function withdrawalRequestedEmail(params: {
  fullName: string
  amount: number
  withdrawalType: 'PROFIT' | 'CAPITAL'
  destination: string
  requestedAt: string
  withdrawalId: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Withdrawal Requested</div>
      <p class="subtext">Your withdrawal request has been received and is being reviewed. Payouts are processed within 24–48 hours on business days.</p>

      <div class="amount-block">
        <div class="amount-label">Withdrawal Amount</div>
        <div class="amount-value">$${usd(params.amount)}</div>
        <div class="amount-currency">
          <span class="badge badge-gold" style="margin-right:8px;">${params.withdrawalType}</span>
          <span style="color:#848E9C;">Ref #${params.withdrawalId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Destination</td>
          <td class="info-val" style="font-size:11px;word-break:break-all;">${params.destination}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Requested</td>
          <td class="info-val">${params.requestedAt}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Status</td>
          <td class="info-val"><span class="badge badge-gold">Pending Approval</span></td>
        </tr>
      </table>

      <div class="alert alert-warning">
        Do not submit a duplicate request. If you have questions, contact support referencing your withdrawal ID above.
      </div>

      <div class="security-box">
        <div class="security-icon">⚠️</div>
        <div class="security-text">
          <strong>Fraud alert:</strong> If you did not initiate this withdrawal, contact support immediately at <a href="mailto:${BRAND.supportEmail}" style="color:#F0B90B;">${BRAND.supportEmail}</a> — your account may be compromised.
        </div>
      </div>
    </div>
  `
  return shell('Withdrawal Request Received', `Your $${usd(params.amount)} withdrawal is pending review`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. WITHDRAWAL APPROVED
// ═══════════════════════════════════════════════════════════════════════════
export function withdrawalApprovedEmail(params: {
  fullName: string
  amount: number
  withdrawalType: 'PROFIT' | 'CAPITAL'
  destination: string
  withdrawalId: string
  approvedAt: string
  txHash?: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Withdrawal Approved ✓</div>
      <p class="subtext">Your withdrawal has been approved and processed. Funds have been dispatched to your destination address.</p>

      <div class="amount-block">
        <div class="amount-label">Amount Sent</div>
        <div class="amount-value" style="color:#0ECB81;">$${usd(params.amount)}</div>
        <div class="amount-currency">${params.withdrawalType} Withdrawal · #${params.withdrawalId.slice(0, 8).toUpperCase()}</div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Destination</td>
          <td class="info-val" style="font-size:11px;word-break:break-all;">${params.destination}</td>
        </tr>
        ${params.txHash ? `
        <tr class="info-row">
          <td class="info-key">Transaction Hash</td>
          <td class="info-val" style="font-size:11px;word-break:break-all;">${params.txHash}</td>
        </tr>
        ` : ''}
        <tr class="info-row">
          <td class="info-key">Processed</td>
          <td class="info-val">${params.approvedAt}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Status</td>
          <td class="info-val"><span class="badge badge-green">Approved</span></td>
        </tr>
      </table>

      <div class="alert alert-info">
        Network confirmation time varies by blockchain. If you haven't received funds within 2 hours, contact support with the transaction hash above.
      </div>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/dashboard" class="btn-ghost">Back to Dashboard</a>
      </div>
    </div>
  `
  return shell('Withdrawal Approved', `$${usd(params.amount)} has been sent to your destination`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. WITHDRAWAL REJECTED
// ═══════════════════════════════════════════════════════════════════════════
export function withdrawalRejectedEmail(params: {
  fullName: string
  amount: number
  withdrawalType: 'PROFIT' | 'CAPITAL'
  withdrawalId: string
  reason?: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">Withdrawal Rejected</div>
      <p class="subtext">Your withdrawal request could not be processed at this time. Your funds have been returned to your available wallet balance.</p>

      <div class="amount-block">
        <div class="amount-label">Returned to Wallet</div>
        <div class="amount-value" style="color:#F0B90B;">$${usd(params.amount)}</div>
        <div class="amount-currency">${params.withdrawalType} · #${params.withdrawalId.slice(0, 8).toUpperCase()}</div>
      </div>

      ${params.reason ? `
      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Reason</td>
          <td class="info-val" style="font-family:'IBM Plex Sans',sans-serif;text-align:right;">${params.reason}</td>
        </tr>
      </table>
      ` : ''}

      <div class="alert alert-danger">
        Your available balance has been restored. Please review the reason above and resubmit if the issue is resolved.
      </div>

      <div class="btn-wrap">
        <a href="mailto:${BRAND.supportEmail}" class="btn">Contact Support</a>
        &nbsp;&nbsp;
        <a href="${BRAND.domain}/wallet" class="btn-ghost">View Wallet</a>
      </div>
    </div>
  `
  return shell('Withdrawal Rejected', `Your $${usd(params.amount)} withdrawal was not approved — funds returned`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. MIGRATION REQUESTED
// ═══════════════════════════════════════════════════════════════════════════
export function migrationRequestedEmail(params: {
  fullName: string
  sourcePlan: string
  targetPlan: string
  capitalAmount: number
  topupAmount: number
  migrationId: string
  requestedAt: string
}) {
  const srcLabel = planLabel[params.sourcePlan] ?? params.sourcePlan
  const tgtLabel = planLabel[params.targetPlan] ?? params.targetPlan
  const body = `
    <div class="body">
      <div class="greeting">Migration Requested</div>
      <p class="subtext">Your plan migration request is queued for review. Once approved, your capital will be seamlessly moved to the new plan with zero interruption.</p>

      <div class="amount-block">
        <div class="amount-label">Capital to Migrate</div>
        <div class="amount-value">$${usd(params.capitalAmount)}</div>
        <div class="amount-currency">Migration #${params.migrationId.slice(0, 8).toUpperCase()}</div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">From Plan</td>
          <td class="info-val"><span class="badge badge-blue">${srcLabel}</span></td>
        </tr>
        <tr class="info-row">
          <td class="info-key">To Plan</td>
          <td class="info-val"><span class="badge badge-gold">${tgtLabel}</span></td>
        </tr>
        ${params.topupAmount > 0 ? `
        <tr class="info-row">
          <td class="info-key">Top-up Required</td>
          <td class="info-val" style="color:#F0B90B;">+$${usd(params.topupAmount)}</td>
        </tr>
        ` : ''}
        <tr class="info-row">
          <td class="info-key">Submitted</td>
          <td class="info-val">${params.requestedAt}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Status</td>
          <td class="info-val"><span class="badge badge-gold">Pending Review</span></td>
        </tr>
      </table>

      <div class="alert alert-info">
        You will receive a confirmation email once your migration has been approved and a new contract is live.
      </div>
    </div>
  `
  return shell('Migration Requested', `Your capital migration from ${srcLabel} → ${tgtLabel} is under review`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. MIGRATION APPROVED
// ═══════════════════════════════════════════════════════════════════════════
export function migrationApprovedEmail(params: {
  fullName: string
  sourcePlan: string
  targetPlan: string
  newPrincipal: number
  newProfitRate: number
  newMaturityDate: string
  newContractId: string
  migrationId: string
}) {
  const srcLabel = planLabel[params.sourcePlan] ?? params.sourcePlan
  const tgtLabel = planLabel[params.targetPlan] ?? params.targetPlan
  const body = `
    <div class="body">
      <div class="greeting">Migration Complete ✓</div>
      <p class="subtext">Your capital has been successfully migrated. A new contract is active under the <strong style="color:#F0B90B;">${tgtLabel} Plan</strong>.</p>

      <div class="amount-block">
        <div class="amount-label">New Principal Locked</div>
        <div class="amount-value">$${usd(params.newPrincipal)}</div>
        <div class="amount-currency">
          <span class="badge badge-gold" style="margin-right:8px;">${tgtLabel}</span>
          <span style="color:#848E9C;">Contract #${params.newContractId.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Migrated From</td>
          <td class="info-val"><span class="badge badge-blue">${srcLabel}</span></td>
        </tr>
        <tr class="info-row">
          <td class="info-key">New Plan</td>
          <td class="info-val"><span class="badge badge-gold">${tgtLabel}</span></td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Profit Rate</td>
          <td class="info-val" style="color:#0ECB81;">${pct(params.newProfitRate)}</td>
        </tr>
        <tr class="info-row">
          <td class="info-key">Maturity Date</td>
          <td class="info-val">${params.newMaturityDate}</td>
        </tr>
      </table>

      <div class="btn-wrap">
        <a href="${BRAND.domain}/dashboard" class="btn">View New Contract →</a>
      </div>
    </div>
  `
  return shell('Migration Approved', `Your capital is now active in the ${tgtLabel} Plan`, body)
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. SECURITY ALERT — new sign-in
// ═══════════════════════════════════════════════════════════════════════════
export function securityAlertEmail(params: {
  fullName: string
  ip?: string
  userAgent?: string
  location?: string
  signedInAt: string
}) {
  const body = `
    <div class="body">
      <div class="greeting">New Sign-In Detected</div>
      <p class="subtext">A new sign-in to your ${BRAND.name} account was recorded. If this was you, no action is required.</p>

      <table class="info-table">
        <tr class="info-row">
          <td class="info-key">Time</td>
          <td class="info-val">${params.signedInAt}</td>
        </tr>
        ${params.ip ? `<tr class="info-row"><td class="info-key">IP Address</td><td class="info-val">${params.ip}</td></tr>` : ''}
        ${params.location ? `<tr class="info-row"><td class="info-key">Location</td><td class="info-val">${params.location}</td></tr>` : ''}
        ${params.userAgent ? `<tr class="info-row"><td class="info-key">Device</td><td class="info-val" style="font-size:11px;">${params.userAgent.slice(0, 60)}</td></tr>` : ''}
      </table>

      <div class="alert alert-danger">
        <strong>Not you?</strong> Secure your account immediately — change your password and contact support at <a href="mailto:${BRAND.supportEmail}" style="color:#F6465D;">${BRAND.supportEmail}</a>
      </div>
    </div>
  `
  return shell('Security Alert — New Sign-In', 'A new sign-in to your Wertchain account was detected', body)
}
