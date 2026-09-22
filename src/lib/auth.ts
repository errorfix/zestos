export const ADMIN_COOKIE_NAME = 'festos_admin_session';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@zest.lingayas.edu.in';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Zest@2026';
const AUTH_SECRET =
  process.env.ADMIN_AUTH_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'festos-zest2k26-lingayas-master-auth-secret-key-32chars';

export interface AdminSession {
  email: string;
  role: 'ADMIN' | 'COMMITTEE_LEAD';
  iat: number;
  exp: number;
}

/**
 * Validate committee administrator credentials
 */
export function validateAdminCredentials(email: string, pass: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Primary administrator check
  if (
    cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() &&
    cleanPass === DEFAULT_ADMIN_PASSWORD
  ) {
    return true;
  }

  // Support for general Lingaya's committee credentials
  if (
    (cleanEmail === 'admin@lingayas.edu.in' || cleanEmail === 'committee@zest.lingayas.edu.in') &&
    (cleanPass === 'Zest@2026' || cleanPass === 'Lingayas@2026')
  ) {
    return true;
  }

  return false;
}

/**
 * Compute HMAC-SHA256 signature using universal Web Crypto API (supported in Node.js, Edge Runtime, Browser)
 */
async function computeHmacSignature(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str).toString('base64url');
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf-8');
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Create an HMAC-SHA256 signed session token (Async Web Crypto)
 */
export async function createAdminSessionToken(email: string, rememberMe = false): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const duration = rememberMe ? 7 * 24 * 3600 : 24 * 3600; // 7 days or 24 hours
  const exp = iat + duration;

  const session: AdminSession = {
    email: email.trim().toLowerCase(),
    role: 'ADMIN',
    iat,
    exp,
  };

  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await computeHmacSignature(payload, AUTH_SECRET);

  return `${payload}.${signature}`;
}

/**
 * Verify HMAC-SHA256 signed session token (Async Web Crypto)
 */
export async function verifyAdminSessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;

  // Re-compute signature to prevent tampering
  const expectedSig = await computeHmacSignature(payloadBase64, AUTH_SECRET);

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const raw = base64UrlDecode(payloadBase64);
    const session: AdminSession = JSON.parse(raw);

    const now = Math.floor(Date.now() / 1000);
    if (session.exp < now) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}
