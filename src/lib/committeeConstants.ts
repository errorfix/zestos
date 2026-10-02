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
  {
    id: 'SPONSORSHIP_COMMITTEE',
    name: 'Sponsorship & Corporate Partnerships Committee',
    slug: 'sponsorship',
    badge: 'Deals & Corporate',
    description: 'Corporate brand outreach, sponsorship pitches, MoU contract execution, and fund receipts verification.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-300',
      iconBg: 'bg-emerald-100',
      text: 'text-emerald-800',
    },
  },
  {
    id: 'BRANDING_COMMITTEE',
    name: 'Branding & Social Media Committee',
    slug: 'branding',
    badge: 'Brand & Creative',
    description: 'Fest visual identity, banners, merchandise, teaser reels, and public brand presence.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-800',
      border: 'border-rose-300',
      iconBg: 'bg-rose-100',
      text: 'text-rose-700',
    },
  },
  {
    id: 'HOSPITALITY_COMMITTEE',
    name: 'Hospitality & Transport Committee',
    slug: 'hospitality',
    badge: 'Hospitality & Fleet',
    description: 'VIP artist protocol, campus guest housing, fleet transport, and food refreshments.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-800',
      border: 'border-teal-300',
      iconBg: 'bg-teal-100',
      text: 'text-teal-700',
    },
  },
  {
    id: 'CP_COMMITTEE',
    name: 'C&P (Certifications & Prizes) Committee',
    slug: 'cp',
    badge: 'Certificates & Prizes',
    description: 'Participant certificate issuance, winner trophies, medals, prize distribution, and podium recognition.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-800',
      border: 'border-indigo-300',
      iconBg: 'bg-indigo-100',
      text: 'text-indigo-700',
    },
  },
  {
    id: 'COMPAIRING_COMMITTEE',
    name: 'Compairing & Stage Emceeing Committee',
    slug: 'compairing',
    badge: 'Stage Anchors',
    description: 'Stage announcements, live event anchoring, audience engagement, and dignitary introductions.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-800',
      border: 'border-cyan-300',
      iconBg: 'bg-cyan-100',
      text: 'text-cyan-700',
    },
  },
  {
    id: 'GRIEVANCES_COMMITTEE',
    name: 'Grievances & Dispute Redressal Committee',
    slug: 'grievances',
    badge: 'Redressal Core',
    description: 'Official complaints inbox, participant disputes, rule arbitrations, and fairness resolution.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      border: 'border-orange-300',
      iconBg: 'bg-orange-100',
      text: 'text-orange-700',
    },
  },
  {
    id: 'FINE_ARTS_COMMITTEE',
    name: 'Fine Arts & Live Canvas Committee',
    slug: 'fine-arts',
    badge: 'Fine Arts',
    description: 'Canvas painting, live graffiti, rangoli exhibitions, sketching, and campus decor installations.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-lime-50',
      badgeText: 'text-lime-800',
      border: 'border-lime-300',
      iconBg: 'bg-lime-100',
      text: 'text-lime-700',
    },
  },
  {
    id: 'DISCIPLINE_COMMITTEE',
    name: 'Discipline & Campus Vigilance Committee',
    slug: 'discipline',
    badge: 'Security & Order',
    description: 'Campus perimeter security, crowd safety, queue discipline, and anti-ragging vigilance.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      border: 'border-slate-300',
      iconBg: 'bg-slate-200',
      text: 'text-slate-800',
    },
  },
  {
    id: 'ATTENDANCE_COMMITTEE',
    name: 'Attendance & Student Tracking Committee',
    slug: 'attendance-ops',
    badge: 'Attendance Core',
    description: 'Faculty-verified volunteer presence, committee roll calls, and institutional duty logs.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-violet-50',
      badgeText: 'text-violet-800',
      border: 'border-violet-300',
      iconBg: 'bg-violet-100',
      text: 'text-violet-700',
    },
  },
  {
    id: 'JUDGEMENT_COMMITTEE',
    name: 'Judgement & Scoring Committee',
    slug: 'judgement',
    badge: 'Scores & Results',
    description: 'Jury score consolidation, judge evaluation sheets, tie-breakers, and official result validation.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-800',
      border: 'border-yellow-300',
      iconBg: 'bg-yellow-100',
      text: 'text-yellow-800',
    },
  },
  {
    id: 'ALUMNI_COMMITTEE',
    name: 'Alumni Relations & Outreach Committee',
    slug: 'alumni',
    badge: 'Alumni Network',
    description: 'Alumni guest reception, mentorship lounges, legacy endowments, and alumni passes.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      border: 'border-sky-300',
      iconBg: 'bg-sky-100',
      text: 'text-sky-700',
    },
  },
  {
    id: 'INFRA_COMMITTEE',
    name: 'Infrastructure & Logistics Committee',
    slug: 'infra',
    badge: 'Infra & Vendors',
    description: 'Vendor contracts, main stage trusses, sound generators, acoustic barricades, and heavy electricals.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-zinc-100',
      badgeText: 'text-zinc-800',
      border: 'border-zinc-300',
      iconBg: 'bg-zinc-200',
      text: 'text-zinc-800',
    },
  },
  {
    id: 'MANAGEMENT',
    name: 'Higher Authority Management',
    slug: 'management',
    badge: 'Management Core',
    description: 'Central campus management, patron oversight, and administrative governance.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-800',
      border: 'border-purple-300',
      iconBg: 'bg-purple-100',
      text: 'text-purple-700',
    },
  },
  {
    id: 'SUPER_ADMIN',
    name: 'CS&IT Committee',
    slug: 'csit',
    badge: 'CS&IT Core',
    description: 'Central technical infrastructure, FestOS administration, and IT engineering operations.',
    defaultCategories: [],
    color: {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      border: 'border-emerald-300',
      iconBg: 'bg-emerald-100',
      text: 'text-emerald-700',
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
