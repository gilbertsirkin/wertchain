const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://wertchain.com'

export function composeTemplate({ full_name, subject, body }: {
  full_name: string
  subject: string
  body: string
}) {
  // Convert plain line-breaks to <br> tags, and wrap in branded shell
  const htmlBody = body
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" /><title>${subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#080D1A;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#E5E7EB;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080D1A;min-height:100vh;">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- logo -->
        <tr><td style="padding-bottom:28px;" align="center">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background-color:#22C55E;width:32px;height:32px;border-radius:8px;text-align:center;vertical-align:middle;">
                <span style="font-size:16px;font-weight:900;color:#000;line-height:32px;">W</span>
              </td>
              <td style="padding-left:10px;">
                <span style="font-size:18px;font-weight:700;color:#FFFFFF;letter-spacing:-0.3px;">Wertchain</span>
                <span style="font-size:10px;color:#4B5563;letter-spacing:1.5px;text-transform:uppercase;margin-left:8px;">INVESTMENT PLATFORM</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- card -->
        <tr><td style="background-color:#0D1017;border:1px solid #1A1E2E;border-radius:16px;overflow:hidden;">
          <div style="height:2px;background:linear-gradient(to right,transparent,#22C55E40,transparent);"></div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #1A1E2E;">
              <p style="font-size:11px;font-weight:600;letter-spacing:1.5px;color:#4B5563;text-transform:uppercase;margin:0 0 8px;">Wertchain · Account Message</p>
              <h1 style="font-size:22px;font-weight:700;color:#FFFFFF;line-height:1.3;letter-spacing:-0.4px;margin:0;">${subject}</h1>
            </td></tr>
            <tr><td style="padding:28px 40px;">
              <p style="font-size:15px;color:#E5E7EB;margin:0 0 20px;">Dear <strong>${full_name}</strong>,</p>
              <div style="font-size:14px;color:#9CA3AF;line-height:1.8;">${htmlBody}</div>
              <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="background-color:#22C55E;border-radius:10px;">
                    <a href="${SITE_URL}/dashboard" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#000;text-decoration:none;">Open Dashboard →</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#374151;margin-top:24px;line-height:1.6;">
                This message was sent by the Wertchain team. Do not reply to this email.<br />
                Questions? <a href="${SITE_URL}/contact" style="color:#22C55E;">Contact support</a>
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:24px 0 0;" align="center">
          <p style="font-size:11px;color:#374151;line-height:1.6;margin:0;">
            Wertchain Ltd · <a href="${SITE_URL}/privacy" style="color:#4B5563;">Privacy</a> · <a href="${SITE_URL}/terms" style="color:#4B5563;">Terms</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
