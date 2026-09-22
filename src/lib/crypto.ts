import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_TICKET_SECRET || 'festos-v2-lingayas-vidyapeeth-hmac-sha256-secret-key-2026';

/**
 * Generates an HMAC-SHA256 signature for a ticket to prevent forgery.
 * Signature = HMAC-SHA256(ticketCode + leadEmail, HMAC_TICKET_SECRET)
 */
export function generateTicketSecurityHash(ticketCode: string, leadEmail: string): string {
  const normalizedEmail = leadEmail.trim().toLowerCase();
  const payload = `${ticketCode}${normalizedEmail}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

/**
 * Validates whether a given security hash matches the ticketCode + leadEmail signature.
 */
export function verifyTicketSecurityHash(ticketCode: string, leadEmail: string, hashToVerify: string): boolean {
  if (!ticketCode || !leadEmail || !hashToVerify) return false;
  const expectedHash = generateTicketSecurityHash(ticketCode, leadEmail);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(hashToVerify, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generates a unique, high-velocity campus ticket code.
 * Format: LV-TKT-2026-XXXX (e.g. LV-TKT-2026-X89K)
 */
export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // human-readable, no confusing I, 1, O, 0
  let randomSuffix = '';
  for (let i = 0; i < 4; i++) {
    const idx = crypto.randomInt(0, chars.length);
    randomSuffix += chars[idx];
  }
  return `LV-TKT-2026-${randomSuffix}`;
}

export interface TicketQrPayload {
  v: string;            // version
  code: string;         // ticketCode
  email: string;        // leadEmail
  name: string;         // attendee / member name
  event: string;        // event title
  sig: string;          // HMAC-SHA256 signature
  issuedAt: string;     // ISO timestamp
}

export function buildQrPayload(
  ticketCode: string,
  leadEmail: string,
  fullName: string,
  eventTitle: string,
  securityHash: string
): string {
  const payload: TicketQrPayload = {
    v: '2.0',
    code: ticketCode,
    email: leadEmail.trim().toLowerCase(),
    name: fullName.trim(),
    event: eventTitle,
    sig: securityHash,
    issuedAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}
