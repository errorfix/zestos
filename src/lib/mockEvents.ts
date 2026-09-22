export interface InitialEventData {
  id: string;
  title: string;
  category: 'Technical' | 'Cultural' | 'E-Sports' | string;
  feeAmount: number; // in paise
  minTeamSize: number;
  maxTeamSize: number;
  description?: string;
  venue?: string;
  date?: string;
  maxCapacity?: number;
}

export const SEED_EVENTS: InitialEventData[] = [
  {
    id: "evt_hackvidyapeeth_2026",
    title: "HackVidyapeeth 2026 - 24H Hackathon",
    category: "Technical",
    feeAmount: 30000, // INR 300
    minTeamSize: 2,
    maxTeamSize: 4,
    description: "24-Hour flagship national hackathon building AI, Web3, and offline-first campus utilities. Hardware & high-speed Wi-Fi provided.",
    venue: "Main Auditorium & Innovation Lab",
    date: "March 28-29, 2026",
    maxCapacity: 120,
  },
  {
    id: "evt_coderelay_solo",
    title: "CodeRelay: Rapid Algorithmic Blitz",
    category: "Technical",
    feeAmount: 10000, // INR 100
    minTeamSize: 1,
    maxTeamSize: 1,
    description: "Individual high-speed algorithmic coding contest. 5 problems, 90 minutes. Strict memory limits and test cases.",
    venue: "Computer Center Lab 3",
    date: "March 28, 2026",
    maxCapacity: 80,
  },
  {
    id: "evt_resonance_bands",
    title: "Resonance: Battle of the Bands",
    category: "Cultural",
    feeAmount: 50000, // INR 500
    minTeamSize: 3,
    maxTeamSize: 6,
    description: "Inter-college acoustic and electric live band showdown. Full stage setup with pro sound systems provided.",
    venue: "Open Air Amphitheatre",
    date: "March 29, 2026",
    maxCapacity: 20,
  },
  {
    id: "evt_nrityangana_dance",
    title: "Nrityangana: Solo Dance Championship",
    category: "Cultural",
    feeAmount: 15000, // INR 150
    minTeamSize: 1,
    maxTeamSize: 1,
    description: "Solo classical, semi-classical, and western dance competition judged on choreography, expression, and rhythm.",
    venue: "Auditorium Hall B",
    date: "March 28, 2026",
    maxCapacity: 50,
  },
  {
    id: "evt_valorant_clash",
    title: "Valorant Campus Clash 2026",
    category: "E-Sports",
    feeAmount: 25000, // INR 250
    minTeamSize: 5,
    maxTeamSize: 5,
    description: "Standard 5v5 competitive bracket tournament on LAN. Single elimination with Best-of-3 finals.",
    venue: "E-Sports Arena (Seminar Hall 1)",
    date: "March 29, 2026",
    maxCapacity: 32,
  },
];
