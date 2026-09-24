export type EventCategoryKey =
  | 'Cultural - Music'
  | 'Cultural - Dance'
  | 'Cultural - Fashion'
  | 'Cultural - Theatre'
  | 'Literary'
  | 'Gaming'
  | 'Informalz';

export const ALL_EVENT_CATEGORIES: EventCategoryKey[] = [
  'Cultural - Music',
  'Cultural - Dance',
  'Cultural - Fashion',
  'Cultural - Theatre',
  'Literary',
  'Gaming',
  'Informalz',
];

export interface CommitteeMeta {
  id: string;
  name: string;
  slug: string;
  badge: string;
  description: string;
  defaultCategories: EventCategoryKey[];
  color: {
    badgeBg: string;
    badgeText: string;
    border: string;
    iconBg: string;
    text: string;
  };
}

export const COMMITTEE_METAS: CommitteeMeta[] = [
  {
    id: 'MUSIC_COMMITTEE',
    name: 'Cultural Music Committee',
    slug: 'music',
    badge: 'Music Ops',
    description: 'Battle of the Bands, Solo Singing, Western Vocals, Classical Music, and Audio Tracks.',
    defaultCategories: ['Cultural - Music'],
    color: {
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-800',
      border: 'border-violet-300',
      iconBg: 'bg-violet-100',
      text: 'text-violet-700',
    },
  },
  {
    id: 'DANCE_COMMITTEE',
    name: 'Cultural Dance Committee',
    slug: 'dance',
    badge: 'Dance Ops',
    description: 'Western Solo, Classical Dance, Street Choreography, Group Dance Showdowns, and Audio Tracks.',
    defaultCategories: ['Cultural - Dance'],
    color: {
      badgeBg: 'bg-pink-50',
      badgeText: 'text-pink-800',
      border: 'border-pink-300',
      iconBg: 'bg-pink-100',
      text: 'text-pink-700',
    },
  },
  {
    id: 'FASHION_COMMITTEE',
    name: 'Cultural Fashion Committee',
    slug: 'fashion',
    badge: 'Fashion Ops',
    description: 'Glamour Nova Runway, Fashion Pageant, Costume Designers, and Stage Choreography.',
    defaultCategories: ['Cultural - Fashion'],
    color: {
      badgeBg: 'bg-fuchsia-50',
      badgeText: 'text-fuchsia-800',
      border: 'border-fuchsia-300',
      iconBg: 'bg-fuchsia-100',
      text: 'text-fuchsia-700',
    },
  },
  {
    id: 'THEATRE_COMMITTEE',
    name: 'Cultural Theatre Committee',
    slug: 'theatre',
    badge: 'Theatre Ops',
    description: 'Nukkad Natak Street Plays, Rangmanch Stage Dramas, Monologue Showcases, and Stage Cues.',
    defaultCategories: ['Cultural - Theatre'],
    color: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      border: 'border-amber-300',
      iconBg: 'bg-amber-100',
      text: 'text-amber-700',
    },
  },
  {
    id: 'LITERARY_COMMITTEE',
    name: 'Literary & Quizzing Committee',
    slug: 'literary',
    badge: 'Literary Ops',
    description: 'Bilingual Debates, Slam Poetry, Wordsmith Arena, and the Grand Campus Quiz Championships.',
    defaultCategories: ['Literary'],
    color: {
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-800',
      border: 'border-blue-300',
      iconBg: 'bg-blue-100',
      text: 'text-blue-700',
    },
  },
  {
    id: 'GAMING_COMMITTEE',
    name: 'Esports & Gaming Committee',
    slug: 'gaming',
    badge: 'Esports Ops',
    description: 'BGMI Squad Championships, Free Fire Arena, LAN Tournaments, and Anti-Cheat Monitoring.',
    defaultCategories: ['Gaming'],
    color: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-300',
      iconBg: 'bg-emerald-100',
      text: 'text-emerald-700',
    },
  },
  {
    id: 'STAGE_COMMITTEE',
    name: 'Stage Committee',
    slug: 'stage',
    badge: 'AV & Sound Ops',
    description: 'Monitors audio cues, Google Drive track links, sound technician cues, and stage timelines.',
    defaultCategories: ['Cultural - Music', 'Cultural - Dance', 'Cultural - Theatre', 'Cultural - Fashion'],
    color: {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      border: 'border-amber-300',
      iconBg: 'bg-amber-100',
      text: 'text-amber-800',
    },
  },
  {
    id: 'INFORMALZ_COMMITTEE',
    name: 'Informalz Committee',
    slug: 'informalz',
    badge: 'Informalz Ops',
    description: '16 non-competitive campus games, tug of war, arm wrestling, entertainment stalls, and spectator passes.',
    defaultCategories: ['Informalz'],
    color: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-800',
      border: 'border-purple-300',
      iconBg: 'bg-purple-100',
      text: 'text-purple-700',
    },
  },
  {
    id: 'REGISTRATION_COMMITTEE',
    name: 'Registration & Invitation Committee',
    slug: 'admin',
    badge: 'R&I Core',
    description: 'Master accreditation, college verifications, cash/UPI on-spot desks, and gate operations.',
    defaultCategories: ['Cultural - Music', 'Cultural - Dance', 'Cultural - Fashion', 'Cultural - Theatre', 'Literary', 'Gaming'],
    color: {
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-800',
      border: 'border-blue-300',
      iconBg: 'bg-blue-100',
      text: 'text-blue-800',
    },
  },
];

export type CommitteeFlagsStore = Record<string, Record<EventCategoryKey, boolean>>;

/**
 * Builds the initial default boolean flags for all committees.
 */
export function buildDefaultFlags(): CommitteeFlagsStore {
  const result: CommitteeFlagsStore = {};

  for (const committee of COMMITTEE_METAS) {
    const flagsForComm: Record<EventCategoryKey, boolean> = {
      'Cultural - Music': false,
      'Cultural - Dance': false,
      'Cultural - Fashion': false,
      'Cultural - Theatre': false,
      Literary: false,
      Gaming: false,
      Informalz: false,
    };

    for (const cat of committee.defaultCategories) {
      flagsForComm[cat] = true;
    }

    result[committee.id] = flagsForComm;
  }

  return result;
}

/**
 * Lookup committee metadata by slug (e.g. 'music' -> MUSIC_COMMITTEE)
 */
export function getCommitteeBySlug(slug: string): CommitteeMeta | undefined {
  return COMMITTEE_METAS.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
}

/**
 * Lookup committee metadata by ID (e.g. 'MUSIC_COMMITTEE')
 */
export function getCommitteeById(id: string): CommitteeMeta | undefined {
  return COMMITTEE_METAS.find((c) => c.id === id);
}
