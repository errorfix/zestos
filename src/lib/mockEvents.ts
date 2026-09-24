export interface InitialEventData {
  id: string;
  title: string;
  category: string; // Cultural - Music, Cultural - Dance, Cultural - Theatre, Cultural - Fashion, Literary, Informalz, Gaming
  eventType: 'Individual' | 'Team';
  feeAmount: number; // in paise (e.g. 100000 = ₹1000, 15000 = ₹150, 0 = FREE)
  minTeamSize: number;
  maxTeamSize: number;
  prize1?: string;
  prize2?: string;
  description?: string;
  rules?: string;
  venue?: string;
  date?: string;
  maxCapacity?: number;
  status: 'OPEN' | 'CLOSED';
  requiresTrackUpload: boolean;
  hasDayOptions: boolean; // For ₹150 / Day or ₹250 / Both Days
}

export const STAGE_GOOGLE_DRIVE_FOLDER =
  'https://drive.google.com/drive/folders/1ORiYoFawuMWA0fOST-qfO2uBvEEZxTOE?usp=sharing';

export const SEED_EVENTS: InitialEventData[] = [
  // ================= 🎭 CULTURAL — MUSIC =================
  {
    id: 'evt_battle_of_bands_minerva',
    title: 'Battle of Bands — MINERVA',
    category: 'Cultural - Music',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 3,
    maxTeamSize: 8,
    description:
      'A live band competition featuring singers and instrumentalists. Bands compete through live performances showcasing coordination, stage presence, and musical synergy.',
    rules:
      'Performance time: 15 minutes including sound check. Drum kit provided, bring own guitars/processors. No pre-recorded backing tracks for lead vocals.',
    venue: 'Open Air Amphitheatre',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_cords_united_duet',
    title: 'Hindi Duet — CORDS UNITED',
    category: 'Cultural - Music',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 2,
    maxTeamSize: 2,
    description:
      'A two-performer Hindi vocal competition focused on harmony, vocal quality and presentation. Participants can perform with live instruments or permitted backing tracks.',
    rules: 'Time limit: 4-6 minutes. Live acoustic instrument or single backing track permitted.',
    venue: 'Auditorium Hall A',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_sur_sangam_group',
    title: 'Hindi Group Song — SUR-SANGAM',
    category: 'Cultural - Music',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 3,
    maxTeamSize: 15,
    description:
      'A group Hindi singing competition where teams showcase vocal coordination, musical arrangement and stage presentation.',
    rules: 'Time limit: 8 minutes. Minimum 3 singers on stage. Classical, semi-classical, or folk arrangements allowed.',
    venue: 'Auditorium Hall A',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_hindi_solo_arya',
    title: 'Hindi Solo — ARYA',
    category: 'Cultural - Music',
    eventType: 'Individual',
    feeAmount: 15000, // ₹150 / Day base
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A solo Hindi singing competition testing vocal ability, pitch, rhythm, expression and lyrical clarity.',
    rules: 'Time limit: 3-5 minutes. Karaokes must be uploaded in advance.',
    venue: 'Auditorium Hall B',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },

  // ================= 💃 CULTURAL — DANCE =================
  {
    id: 'evt_solo_dance',
    title: 'Solo Dance',
    category: 'Cultural - Dance',
    eventType: 'Individual',
    feeAmount: 15000, // ₹150 / Day base
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'An individual dance performance open to different dance styles and music choices. Participants are evaluated on execution, choreography, expressions and stage presence.',
    rules: 'Performance duration: 3-5 minutes. Props allowed with prior approval. Audio tracks must be uploaded prior to event.',
    venue: 'Main Stage',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_duet_dance',
    title: 'Duet Dance',
    category: 'Cultural - Dance',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 2,
    maxTeamSize: 2,
    description:
      'A two-person dance performance focused on coordination, synchronization and stage chemistry.',
    rules: 'Performance duration: 4-6 minutes. Chemistry and synchronized rhythm will be prioritized by judges.',
    venue: 'Main Stage',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_western_dance_razmadaz',
    title: 'Western Dance — RAZMADAZ',
    category: 'Cultural - Dance',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 4,
    maxTeamSize: 20,
    description:
      'A high-energy western group dance competition featuring choreography, formations, synchronization and stage presence.',
    rules: 'Time duration: 6-10 minutes. Any western genre: Hip-Hop, Popping, Contemporary, Jazz, etc.',
    venue: 'Main Open Air Stage',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_folk_dance_nachleve',
    title: 'Folk Dance — NACHLEVE',
    category: 'Cultural - Dance',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 4,
    maxTeamSize: 25,
    description:
      "A traditional dance showcase celebrating India's diverse folk cultures through choreography, costumes, music and cultural storytelling.",
    rules: 'Time duration: 6-10 minutes. Authentic traditional folk costumes and music required.',
    venue: 'Main Open Air Stage',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },

  // ================= 🎭 CULTURAL — THEATRE =================
  {
    id: 'evt_nukkad_natak',
    title: 'Nukkad Natak',
    category: 'Cultural - Theatre',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 5,
    maxTeamSize: 25,
    description:
      'A street-play competition focused on storytelling and delivering a meaningful message through live performance, creativity and team coordination.',
    rules: 'Time duration: 15-20 minutes. Acoustic instruments only (dholak, gulal, dafli allowed). No electronic amplification.',
    venue: 'University Fountain Courtyard',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_stage_play',
    title: 'Stage Play',
    category: 'Cultural - Theatre',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 4,
    maxTeamSize: 20,
    description:
      'A theatrical production involving acting, storytelling and stage coordination. Teams present a Hindi or bilingual play within the prescribed performance duration.',
    rules: 'Time duration: 25-30 minutes plus 5 minutes setup. Stage script and BGM track list must be submitted.',
    venue: 'Main Auditorium',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },
  {
    id: 'evt_monologue',
    title: 'Monologue',
    category: 'Cultural - Theatre',
    eventType: 'Individual',
    feeAmount: 15000, // ₹150 / Day base
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A solo theatrical performance where one participant portrays a character or communicates a story through dialogue and expression.',
    rules: 'Time duration: 3-5 minutes. Language: Hindi or English.',
    venue: 'Auditorium Hall B',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },

  // ================= 👗 CULTURAL — FASHION =================
  {
    id: 'evt_fashion_show',
    title: 'Fashion Show',
    category: 'Cultural - Fashion',
    eventType: 'Team',
    feeAmount: 100000, // ₹1,000 / Team
    minTeamSize: 6,
    maxTeamSize: 25,
    description:
      'A team-based fashion presentation combining models, costumes, theme, music and storytelling.',
    rules: 'Time duration: 12-15 minutes on ramp. Soundtrack and lighting sheet must be pre-uploaded.',
    venue: 'Open Air Amphitheatre',
    date: 'Day 2 Gala Night',
    status: 'OPEN',
    requiresTrackUpload: true,
    hasDayOptions: false,
  },

  // ================= 📚 LITERARY COMMITTEE =================
  {
    id: 'evt_mindflick_scene',
    title: 'Mindflick: Guess the Scene',
    category: 'Literary',
    eventType: 'Individual',
    feeAmount: 15000, // ₹150 / Day base
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A visual and pop-culture challenge where participants identify scenes, characters, dialogues, music or visual clues. Multiple rounds test observation, memory and quick thinking.',
    rules: 'Buzzer round rules apply. Negative marking in final lightning round.',
    venue: 'Seminar Hall 2',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_after_dark',
    title: 'After Dark',
    category: 'Literary',
    eventType: 'Individual',
    feeAmount: 15000, // ₹150 / Day base
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'An open-mic style literary event where participants can explore poetry, storytelling, music, monologues, comedy and spoken word.',
    rules: 'Time limit: 4 minutes per performer. Original compositions earn bonus points.',
    venue: 'Cafeteria Lawn Stage',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },

  // ================= 🎯 INFORMALZ EVENTS — 100% FREE =================
  {
    id: 'evt_warriors_pull',
    title: "Warrior's Pull",
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 4,
    maxTeamSize: 8,
    description:
      'A team-based strength and coordination challenge (tug of war) where teams compete head-to-head while following safety and referee instructions.',
    venue: 'Sports Ground',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_strong_arm_showdown',
    title: 'Strong Arm Showdown',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A one-on-one arm-strength challenge (arm wrestling) where participants compete through successive elimination rounds.',
    venue: 'Student Activity Center',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_the_big_reveal',
    title: 'The Big Reveal',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'An open talent showcase giving participants a short platform to present their unique abilities and entertain the audience.',
    venue: 'Central Lawn Stage',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_pass_the_hoop',
    title: 'Pass the Hoop',
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 4,
    maxTeamSize: 6,
    description:
      'A teamwork and coordination challenge where participants pass a hoop through the entire team without breaking their connection.',
    venue: 'Main Foyer',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_sky_float',
    title: 'Sky Float',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description: 'A fun coordination challenge combining balloon control with cup stacking.',
    venue: 'SAC Hall',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_rise_and_push',
    title: 'Rise & Push',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A physical endurance challenge based on push-ups, where participants compete to complete the maximum valid repetitions.',
    venue: 'Gymnasium Arena',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_dark_navigator',
    title: 'Dark Navigator',
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 2,
    maxTeamSize: 2,
    description:
      'A blindfolded navigation challenge requiring verbal communication and complete trust between teammates.',
    venue: 'Obstacle Course (Block B)',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_lift_league',
    title: 'Lift League',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description: 'An individual strength challenge focused on deadlift performance and valid repetitions.',
    venue: 'Gymnasium Arena',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_musical_chair',
    title: 'Musical Chair',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description: 'A classic elimination game involving music, movement and lightning-fast reactions.',
    venue: 'Central Lawn',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_professors_got_talent',
    title: "Professor's Got Talent",
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A special talent showcase exclusively for faculty members, giving professors an opportunity to present their talents.',
    venue: 'Main Auditorium',
    date: 'Day 2 Afternoon',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_chest_of_champions',
    title: 'Chest of Champions',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'An individual strength challenge based on bicep curls, where participants compete for the highest number of valid repetitions.',
    venue: 'Gymnasium Arena',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_spray_nation',
    title: 'Spray Nation',
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 2,
    maxTeamSize: 4,
    description:
      'A collaborative live-art challenge where teams transform a blank surface into a creative artwork based on an on-the-spot theme.',
    venue: 'Art Alley (Behind Block C)',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_match_made_on_campus',
    title: 'Match Made On Campus',
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 2,
    maxTeamSize: 2,
    description:
      'A pair-based coordination challenge built around teamwork and communication, progressing through elimination rounds and a final challenge.',
    venue: 'Amphitheatre Courtyard',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_bulls_eye_blitz',
    title: "Bull's Eye Blitz",
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A precision-based target challenge (darts & archery) where participants attempt to score maximum points through limited attempts.',
    venue: 'Activity Arena',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_smash_showdown',
    title: 'Smash Showdown',
    category: 'Informalz',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 2,
    maxTeamSize: 4,
    description:
      'A fast-paced team sporting challenge focused on quick reactions, coordination and competitive play.',
    venue: 'Badminton / TT Courts',
    date: 'Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
  {
    id: 'evt_emoji_flicks',
    title: 'Emoji Flicks',
    category: 'Informalz',
    eventType: 'Individual',
    feeAmount: 0, // FREE
    minTeamSize: 1,
    maxTeamSize: 1,
    description:
      'A fun visual and pop-culture challenge built around emoji-based clues, testing recognition and quick thinking.',
    venue: 'Seminar Hall 3',
    date: 'Day 1',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },

  // ================= 🎮 GAMING / ESPORTS — 100% FREE =================
  {
    id: 'evt_gaming_esports',
    title: 'Gaming — Esports (BGMI & Free Fire)',
    category: 'Gaming',
    eventType: 'Team',
    feeAmount: 0, // FREE
    minTeamSize: 4,
    maxTeamSize: 5,
    description:
      'A competitive esports tournament featuring BGMI and Free Fire. Teams compete through official tournament formats with registered players and strict anti-cheating regulations.',
    rules:
      'Custom rooms will be shared 15 mins before match. Emulators strictly banned (mobile devices only). Squad of 4 + 1 optional substitute.',
    venue: 'Computer Center (LAN / Wi-Fi Arena)',
    date: 'Day 1 & Day 2',
    status: 'OPEN',
    requiresTrackUpload: false,
    hasDayOptions: false,
  },
];
