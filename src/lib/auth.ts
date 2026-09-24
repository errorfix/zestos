// ─── Role-Based Authentication System ────────────────────────────────────────
// Extensible credential registry: each role maps to a password + permissions.
// Adding a new committee = add one entry to ROLE_REGISTRY.

export const ADMIN_COOKIE_NAME = 'festos_admin_session';

const AUTH_SECRET =
  process.env.ADMIN_AUTH_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'festos-zest2k26-lingayas-master-auth-secret-key-32chars';

// ─── Role Definitions ────────────────────────────────────────────────────────

export type Permission =
  | 'view_dashboard'
  | 'view_registrations'
  | 'manage_events'      // create / edit / delete events
  | 'access_onspot'
  | 'access_checkin'
  | 'manage_roles';       // future: manage other committee accounts

export interface RoleDefinition {
  id: string;
  label: string;
  password: string;
  permissions: Permission[];
  dashboard: string;       // redirect target after login
  hidden?: boolean;        // if true, not shown in the login dropdown
}

/**
 * Central role registry — the SINGLE source of truth for all roles.
 * To add a new committee, just push a new entry here.
 */
export const ROLE_REGISTRY: RoleDefinition[] = [
  {
    id: 'SUPER_ADMIN',
    label: 'Super Admin',
    password: process.env.SUPER_ADMIN_PASSWORD || 'phoenix@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'manage_events',
      'access_onspot',
      'access_checkin',
      'manage_roles',
    ],
    dashboard: '/super-admin',
  },
  {
    id: 'REGISTRATION_COMMITTEE',
    label: 'Registration & Invitation Committee',
    password: process.env.RI_COMMITTEE_PASSWORD || 'falcon@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_onspot',
      'access_checkin',
    ],
    dashboard: '/admin',
  },
  {
    id: 'INFORMALZ_COMMITTEE',
    label: 'Informalz Committee',
    password: process.env.INFORMALZ_COMMITTEE_PASSWORD || 'tiger@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/informalz',
  },
  {
    id: 'MUSIC_COMMITTEE',
    label: 'Cultural Music Committee',
    password: process.env.MUSIC_COMMITTEE_PASSWORD || 'melody@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/music',
  },
  {
    id: 'DANCE_COMMITTEE',
    label: 'Cultural Dance Committee',
    password: process.env.DANCE_COMMITTEE_PASSWORD || 'rhythm@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/dance',
  },
  {
    id: 'FASHION_COMMITTEE',
    label: 'Cultural Fashion Committee',
    password: process.env.FASHION_COMMITTEE_PASSWORD || 'vogue@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/fashion',
  },
  {
    id: 'THEATRE_COMMITTEE',
    label: 'Cultural Theatre Committee',
    password: process.env.THEATRE_COMMITTEE_PASSWORD || 'drama@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/theatre',
  },
  {
    id: 'LITERARY_COMMITTEE',
    label: 'Literary & Quizzing Committee',
    password: process.env.LITERARY_COMMITTEE_PASSWORD || 'words@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/literary',
  },
  {
    id: 'GAMING_COMMITTEE',
    label: 'Esports & Gaming Committee',
    password: process.env.GAMING_COMMITTEE_PASSWORD || 'nexus@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
      'access_checkin',
    ],
    dashboard: '/committee/gaming',
  },
  {
    id: 'STAGE_COMMITTEE',
    label: 'Stage Committee',
    password: process.env.STAGE_COMMITTEE_PASSWORD || 'lion@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
    ],
    dashboard: '/stage',
  },
  {
    id: 'GATE_SECURITY',
    label: 'Gate Security & Check-In Team',
    password: process.env.CHECKIN_PASSWORD || process.env.GATE_SECURITY_PASSWORD || 'gate@lv321',
    permissions: [
      'access_checkin',
    ],
    dashboard: '/checkin',
  },
  {
    id: 'MANAGEMENT',
    label: 'Higher Authority & Management (Read-Only)',
    password: process.env.MANAGEMENT_PASSWORD || 'apex@lv321',
    permissions: [
      'view_dashboard',
      'view_registrations',
    ],
    dashboard: '/management',
  },
];

/** Roles visible in the login dropdown */
export function getVisibleRoles(): Pick<RoleDefinition, 'id' | 'label'>[] {
  return ROLE_REGISTRY.filter((r) => !r.hidden).map(({ id, label }) => ({ id, label }));
}

/** Lookup a role definition by id */
export function getRoleById(roleId: string): RoleDefinition | undefined {
  return ROLE_REGISTRY.find((r) => r.id === roleId);
}

// ─── Credential Validation ───────────────────────────────────────────────────

export interface CredentialResult {
  valid: boolean;
  role: RoleDefinition | null;
}

/**
 * Validate credentials against the role registry.
 * Accepts a roleId (from dropdown) + password.
 */
export function validateCredentials(roleId: string, password: string): CredentialResult {
  const role = getRoleById(roleId);
  if (!role) return { valid: false, role: null };

  const cleanPass = password.trim();
  if (cleanPass === role.password) {
    return { valid: true, role };
  }

  return { valid: false, role: null };
}

// ─── Permission Checking ─────────────────────────────────────────────────────

export function hasPermission(session: AdminSession | null, permission: Permission): boolean {
  if (!session) return false;
  const role = getRoleById(session.roleId);
  if (!role) return false;
  return role.permissions.includes(permission);
}

export function requireRole(session: AdminSession | null, roleId: string): boolean {
  if (!session) return false;
  return session.roleId === roleId;
}

// ─── Session Token Types ─────────────────────────────────────────────────────

export interface AdminSession {
  roleId: string;
  roleLabel: string;
  iat: number;
  exp: number;
}

// ─── Crypto Helpers (Web Crypto — works in Node, Edge, Browser) ──────────────

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

// ─── Session Token Creation & Verification ───────────────────────────────────

export async function createAdminSessionToken(
  roleId: string,
  rememberMe = false
): Promise<string> {
  const role = getRoleById(roleId);
  const iat = Math.floor(Date.now() / 1000);
  const duration = rememberMe ? 7 * 24 * 3600 : 24 * 3600;
  const exp = iat + duration;

  const session: AdminSession = {
    roleId,
    roleLabel: role?.label || roleId,
    iat,
    exp,
  };

  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = await computeHmacSignature(payload, AUTH_SECRET);

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<AdminSession | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;

  const expectedSig = await computeHmacSignature(payloadBase64, AUTH_SECRET);
  if (signature !== expectedSig) {
    return null;
  }

  try {
    const raw = base64UrlDecode(payloadBase64);
    const session: AdminSession = JSON.parse(raw);

    const now = Math.floor(Date.now() / 1000);
    if (session.exp < now) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
