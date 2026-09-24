import { Resend } from 'resend';

export interface SendPassEmailParams {
  to: string;
  leadName: string;
  eventTitle: string;
  eventCategory?: string;
  dayOption?: string | null;
  amount?: number | null; // in paise
  razorpayPaymentId?: string | null;
  ticketCodes: string[];
  registrationId: string;
  teamMembers?: Array<{ fullName: string }>;
}

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'Zest 2026 Passes <onboarding@resend.dev>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lingayaszest.tech';

/**
 * Dispatches an official Lingaya's Zest 2026 Pass confirmation email
 * with ticket codes, direct pass access link, and payment receipt.
 */
export async function sendPassEmail(params: SendPassEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const {
    to,
    leadName,
    eventTitle,
    eventCategory = 'Campus Event',
    dayOption,
    amount,
    razorpayPaymentId,
    ticketCodes,
    registrationId,
    teamMembers = [],
  } = params;

  if (!to || !to.includes('@')) {
    console.warn('[Email] Skipping dispatch: invalid recipient email:', to);
    return { success: false, error: 'Invalid recipient email' };
  }

  if (!resend) {
    console.warn('[Email] Resend API key is not configured in environment. Skipping email dispatch.');
    return { success: false, error: 'Resend API key missing' };
  }

  const passUrl = `${appUrl}/tickets/${registrationId}`;
  const formattedAmount = amount != null ? `₹${(amount / 100).toFixed(0)}` : 'N/A';
  const dayPassLabel =
    dayOption === 'BOTH_DAYS'
      ? 'Both Days Access (Day 1 & Day 2)'
      : dayOption === 'DAY_2'
      ? 'Day 2 Fest Pass'
      : dayOption === 'DAY_1' || dayOption === 'SINGLE_DAY'
      ? 'Day 1 Pass'
      : null;

  const ticketsHtml = ticketCodes
    .map(
      (code) => `
      <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:10px 14px; margin-bottom:8px; display:inline-block; font-family:monospace; font-size:15px; font-weight:700; color:#0f172a; letter-spacing:0.5px;">
        🎟️ ${code}
      </div>
    `
    )
    .join('');

  const teamMembersHtml =
    teamMembers.length > 0
      ? `
      <div style="margin-top:16px; padding:12px; background:#f1f5f9; border-radius:8px;">
        <span style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase;">Included Team Members:</span>
        <ul style="margin:6px 0 0 0; padding-left:20px; font-size:13px; color:#1e293b;">
          ${teamMembers.map((m) => `<li>${m.fullName}</li>`).join('')}
        </ul>
      </div>
    `
      : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Your Lingaya's Zest 2026 Passes</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              
              <!-- Header Banner -->
              <tr>
                <td style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding:32px 24px; text-align:center; color:#ffffff;">
                  <span style="display:inline-block; background:rgba(26, 115, 232, 0.2); border:1px solid rgba(26, 115, 232, 0.4); color:#93c5fd; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; padding:4px 12px; border-radius:20px; margin-bottom:12px;">
                    Lingaya's Vidyapeeth Annual Fest
                  </span>
                  <h1 style="margin:0; font-size:26px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                    ZEST 2026 • Official Passes
                  </h1>
                  <p style="margin:8px 0 0 0; font-size:13px; color:#cbd5e1;">
                    Your entry has been confirmed. Present this pass at the gate.
                  </p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding:28px 24px;">
                  <p style="margin:0 0 16px 0; font-size:16px; color:#0f172a;">
                    Hello <strong>${leadName}</strong>,
                  </p>
                  <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#334155;">
                    Your registration for <strong>${eventTitle}</strong> (${eventCategory}) is confirmed! Below are your digital gate access codes.
                  </p>

                  <!-- Digital Passes Box -->
                  <div style="background:#f8fafc; border:2px dashed #94a3b8; border-radius:12px; padding:20px; text-align:center; margin-bottom:24px;">
                    <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:12px;">
                      Your Official Pass Code(s)
                    </span>
                    <div>
                      ${ticketsHtml}
                    </div>

                    <div style="margin-top:16px;">
                      <a href="${passUrl}" target="_blank" style="display:inline-block; background-color:#1a73e8; color:#ffffff; font-weight:700; font-size:14px; text-decoration:none; padding:12px 28px; border-radius:10px; box-shadow:0 2px 4px rgba(26, 115, 232, 0.3);">
                        View & Download Official Pass (PNG) →
                      </a>
                    </div>
                    <span style="display:block; font-size:11px; color:#64748b; margin-top:8px;">
                      Save the high-resolution PNG on your phone for offline security gate access.
                    </span>
                  </div>

                  <!-- Booking Summary -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:20px; font-size:13px;">
                    <tr>
                      <td style="padding:10px 14px; color:#64748b; border-bottom:1px solid #e2e8f0; width:40%;">Event:</td>
                      <td style="padding:10px 14px; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${eventTitle}</td>
                    </tr>
                    ${
                      dayPassLabel
                        ? `
                    <tr>
                      <td style="padding:10px 14px; color:#64748b; border-bottom:1px solid #e2e8f0;">Pass Access:</td>
                      <td style="padding:10px 14px; font-weight:700; color:#1a73e8; border-bottom:1px solid #e2e8f0;">${dayPassLabel}</td>
                    </tr>
                    `
                        : ''
                    }
                    <tr>
                      <td style="padding:10px 14px; color:#64748b; border-bottom:1px solid #e2e8f0;">Amount Paid:</td>
                      <td style="padding:10px 14px; font-weight:700; color:#059669; border-bottom:1px solid #e2e8f0;">${formattedAmount}</td>
                    </tr>
                    ${
                      razorpayPaymentId
                        ? `
                    <tr>
                      <td style="padding:10px 14px; color:#64748b; border-bottom:1px solid #e2e8f0;">Transaction Ref:</td>
                      <td style="padding:10px 14px; font-family:monospace; font-weight:700; color:#0f172a; border-bottom:1px solid #e2e8f0;">${razorpayPaymentId}</td>
                    </tr>
                    `
                        : ''
                    }
                    <tr>
                      <td style="padding:10px 14px; color:#64748b;">Registration ID:</td>
                      <td style="padding:10px 14px; font-family:monospace; color:#475569;">${registrationId}</td>
                    </tr>
                  </table>

                  ${teamMembersHtml}

                  <!-- Gate Instructions -->
                  <div style="background:#eff6ff; border-left:4px solid #1a73e8; padding:14px; border-radius:0 8px 8px 0; margin-top:24px; font-size:12px; color:#1e3a8a; line-height:1.5;">
                    <strong style="display:block; margin-bottom:4px; font-size:13px;">Important Gate Check-In Rules:</strong>
                    • <strong>Festival Dates:</strong> 30th & 31st October 2026<br>
                    • <strong>Venue:</strong> Lingaya's Vidyapeeth Campus, Nachauli, Jasana Road, Faridabad<br>
                    • <strong>ID Verification:</strong> Every attendee must carry their original College/School ID card along with their digital QR pass.<br>
                    • <strong>Pass Policy:</strong> Each pass contains a cryptographic HMAC security signature valid for a single scanned entry.
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f1f5f9; padding:20px 24px; text-align:center; font-size:11px; color:#64748b; border-top:1px solid #e2e8f0;">
                  <p style="margin:0 0 6px 0;">
                    Registration & Invitation (R&I) Committee • Lingaya's Vidyapeeth
                  </p>
                  <p style="margin:0;">
                    Need help? Visit <a href="https://lingayaszest.tech" target="_blank" style="color:#1a73e8; text-decoration:none;">lingayaszest.tech</a> or report to the On-Spot Registration Desk at the main campus entrance.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const res = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Your Zest 2026 Passes • ${eventTitle} (Booking Ref #${registrationId.slice(0, 8)})`,
      html: htmlContent,
    });

    if (res.error) {
      console.error('[Email] Resend returned error:', res.error);
      return { success: false, error: res.error.message };
    }

    console.log(`[Email] Pass confirmation successfully dispatched to ${to} (ID: ${res.data?.id})`);
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.error('[Email] Unexpected error dispatching pass email:', err);
    return { success: false, error: (err as Error).message || 'Failed to dispatch email' };
  }
}
