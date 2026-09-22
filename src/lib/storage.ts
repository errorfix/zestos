export interface TeamMemberDraft {
  fullName: string;
  rollNumber: string;
}

export interface RegistrationDraft {
  eventId: string;
  leadName: string;
  leadEmail: string;
  teamMembers: TeamMemberDraft[];
  lastSavedAt: string;
}

const STORAGE_KEY = 'festos_registration_draft_v2';

export function saveRegistrationDraft(draft: Omit<RegistrationDraft, 'lastSavedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: RegistrationDraft = {
      ...draft,
      lastSavedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[Storage] Failed to save draft to localStorage:', err);
  }
}

export function loadRegistrationDraft(): RegistrationDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RegistrationDraft;
  } catch (err) {
    console.warn('[Storage] Failed to read draft from localStorage:', err);
    return null;
  }
}

export function clearRegistrationDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[Storage] Failed to clear draft from localStorage:', err);
  }
}
