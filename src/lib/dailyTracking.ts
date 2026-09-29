import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
import { createAuditLog } from './db';
import { COMMITTEE_METAS, getCommitteeById } from './committeeConstants';
import {
  TrackingStatus,
  DailyTrackingItem,
  PRESET_HEADS,
  TrackingFilters,
  HeadProgressStat,
  CommitteeComplianceStat,
  DailyTrackingStatsResponse,
} from './dailyTrackingTypes';

export * from './dailyTrackingTypes';

const TRACKING_CACHE_FILE = path.join(process.cwd(), '.festos_daily_tracking.json');

// Memory cache for zero-latency lookups
let inMemoryTracking: Map<string, DailyTrackingItem> | null = null;

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Default starter tracking logs to ensure Super Admin and Higher Authority panels
 * immediately display realistic operational data across all committees.
 */
function getInitialSeedData(): DailyTrackingItem[] {
  const today = getTodayString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  return [
    {
      id: 'dt-music-01',
      committeeId: 'MUSIC_COMMITTEE',
      committeeName: 'Cultural Music Committee',
      date: today,
      head: 'Logistics & Infrastructure',
      subhead: 'Audio & Sound Equipment',
      title: 'Acoustic Soundcheck & Drum Kit Rental',
      workDescription: 'Finalized agreement with Apex Sound Hire for live drum set, 6 Shure SM58 mics, and monitor foldbacks for Battle of the Bands.',
      status: 'COMPLETED',
      progressPercentage: 100,
      blockers: null,
      operatorName: 'Aryan Verma',
      operatorRollNo: '23BCS041',
      operatorType: 'STUDENT',
      attachmentsUrl: 'https://drive.google.com',
      superAdminRemarks: 'Approved. Coordinate with Stage Committee for load-in timings.',
      superAdminReviewed: true,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'dt-music-02',
      committeeId: 'MUSIC_COMMITTEE',
      committeeName: 'Cultural Music Committee',
      date: today,
      head: 'Hospitality & Protocol',
      subhead: 'Judges Hospitality & Escorts',
      title: 'External Music Jury Confirmation',
      workDescription: 'Contacted 2 external judges from Delhi Music Academy. Awaiting signed confirmation letters.',
      status: 'IN_PROGRESS',
      progressPercentage: 65,
      blockers: 'Awaiting faculty dean approval for judge honorarium voucher.',
      operatorName: 'Dr. Neha Sharma',
      operatorRollNo: 'FAC-ENG-108',
      operatorType: 'FACULTY',
      attachmentsUrl: null,
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'dt-dance-01',
      committeeId: 'DANCE_COMMITTEE',
      committeeName: 'Cultural Dance Committee',
      date: today,
      head: 'Logistics & Infrastructure',
      subhead: 'Stage Setup & Barricades',
      title: 'Wooden Flooring Check for Western Dance',
      workDescription: 'Inspected main auditorium stage wooden flooring. Need non-slip resin tape along the front rim to prevent accidents.',
      status: 'BLOCKED',
      progressPercentage: 40,
      blockers: 'Maintenance team has not provided non-slip grip tape yet.',
      operatorName: 'Simran Kaur',
      operatorRollNo: '22BBA019',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: 'Urgent: Maintenance supervisor contacted for same-day delivery.',
      superAdminReviewed: true,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: 'dt-stage-01',
      committeeId: 'STAGE_COMMITTEE',
      committeeName: 'Stage Committee',
      date: today,
      head: 'Event Rules & Execution',
      subhead: 'Anchor Scripts & Stage Cue Sheets',
      title: 'Stage Audio Cues & Drive Tracks Audit',
      workDescription: 'Verified 24 audio tracks submitted through Google Drive. Re-contacted 3 teams whose Drive access permissions were restricted.',
      status: 'IN_PROGRESS',
      progressPercentage: 80,
      blockers: '3 teams yet to grant public read permission to audio files.',
      operatorName: 'Rohan Mehra',
      operatorRollNo: '21BME092',
      operatorType: 'STUDENT',
      attachmentsUrl: 'https://drive.google.com',
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'dt-reg-01',
      committeeId: 'REGISTRATION_COMMITTEE',
      committeeName: 'Registration & Invitation Committee',
      date: today,
      head: 'Security, Gate & Discipline',
      subhead: 'Gate Queuing & Barcode Scanner Desks',
      title: 'On-Spot Cash Desks & QR Scanner Handhelds',
      workDescription: 'Configured 4 camera tablets and verified receipt printer thermal rolls at Gate 1 and Gate 2.',
      status: 'COMPLETED',
      progressPercentage: 100,
      blockers: null,
      operatorName: 'Prof. S. K. Gupta',
      operatorRollNo: 'FAC-CS-022',
      operatorType: 'FACULTY',
      attachmentsUrl: null,
      superAdminRemarks: 'Excellent setup.',
      superAdminReviewed: true,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'dt-fashion-01',
      committeeId: 'FASHION_COMMITTEE',
      committeeName: 'Cultural Fashion Committee',
      date: today,
      head: 'Media, PR & Creative',
      subhead: 'Banners, Standees & Backdrop Printing',
      title: 'Runway Lighting Truss & Ramp Backdrop',
      workDescription: 'Reviewed 3D layout of Glamour Nova runway ramp with light designer. Final dimensions confirmed as 32ft x 8ft.',
      status: 'IN_PROGRESS',
      progressPercentage: 70,
      blockers: null,
      operatorName: 'Tanvi Chawla',
      operatorRollNo: '23BDES015',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'dt-gaming-01',
      committeeId: 'GAMING_COMMITTEE',
      committeeName: 'Esports & Gaming Committee',
      date: yesterday,
      head: 'Logistics & Infrastructure',
      subhead: 'Power, Generator & Cabling',
      title: 'High-Speed LAN Switches & Power Backup',
      workDescription: 'Setup 64-port Gigabit switch and tested ping latencies below 12ms for BGMI and Free Fire arena.',
      status: 'COMPLETED',
      progressPercentage: 100,
      blockers: null,
      operatorName: 'Kunal Joshi',
      operatorRollNo: '22BCA073',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: 'Ready for tournament.',
      superAdminReviewed: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'dt-theatre-01',
      committeeId: 'THEATRE_COMMITTEE',
      committeeName: 'Cultural Theatre Committee',
      date: today,
      head: 'Hospitality & Protocol',
      subhead: 'Green Room Refreshments',
      title: 'Outdoor Nukkad Natak Circle Demarcation',
      workDescription: 'Chalked circular stage boundaries in central open courtyard; tested wireless lapel and boundary microphones.',
      status: 'IN_PROGRESS',
      progressPercentage: 85,
      blockers: null,
      operatorName: 'Devansh Roy',
      operatorRollNo: '23BA007',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: 'dt-literary-01',
      committeeId: 'LITERARY_COMMITTEE',
      committeeName: 'Literary & Quizzing Committee',
      date: today,
      head: 'Event Rules & Execution',
      subhead: 'Rulebooks & Eligibility Criteria',
      title: 'Bilingual Debate Motions & Quiz Buzzer Software',
      workDescription: 'Curated 10 debate motions and tested electronic buzzer system with Raspberry Pi interface.',
      status: 'COMPLETED',
      progressPercentage: 100,
      blockers: null,
      operatorName: 'Ananya Sen',
      operatorRollNo: '22BCS112',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'dt-informalz-01',
      committeeId: 'INFORMALZ_COMMITTEE',
      committeeName: 'Informalz Committee',
      date: today,
      head: 'Operations & Coordination',
      subhead: 'Inter-Committee Coordination',
      title: 'Stall Allocation & Fun Games Equipment',
      workDescription: 'Procured tug-of-war hemp ropes, arm wrestling table cushions, and printed token tickets for 16 informal games.',
      status: 'IN_PROGRESS',
      progressPercentage: 75,
      blockers: null,
      operatorName: 'Gaurav Bisht',
      operatorRollNo: '23BBA045',
      operatorType: 'STUDENT',
      attachmentsUrl: null,
      superAdminRemarks: null,
      superAdminReviewed: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ];
}

function loadTrackingFromDisk(): Map<string, DailyTrackingItem> {
  const map = new Map<string, DailyTrackingItem>();
  try {
    if (fs.existsSync(TRACKING_CACHE_FILE)) {
      const raw = fs.readFileSync(TRACKING_CACHE_FILE, 'utf-8');
      const items: DailyTrackingItem[] = JSON.parse(raw);
      for (const item of items) {
        map.set(item.id, item);
      }
      return map;
    }
  } catch (err) {
    console.warn('[DailyTracking] Could not read disk cache, initializing seeds:', err);
  }

  // Populate seeds if file does not exist
  const seeds = getInitialSeedData();
  for (const s of seeds) {
    map.set(s.id, s);
  }
  saveTrackingToDisk(map);
  return map;
}

function saveTrackingToDisk(map: Map<string, DailyTrackingItem>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(TRACKING_CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DailyTracking] Failed to write disk cache:', err);
  }
}

function getMemoryStore(): Map<string, DailyTrackingItem> {
  if (!inMemoryTracking) {
    inMemoryTracking = loadTrackingFromDisk();
  }
  return inMemoryTracking;
}

// ─── Core CRUD Operations ───────────────────────────────────────────────────


export async function getDailyTrackingItems(filters?: TrackingFilters): Promise<DailyTrackingItem[]> {
  const store = getMemoryStore();
  let items = Array.from(store.values());

  // Try fetching fresh data from Prisma if available
  try {
    const dbItems = await prisma.dailyTrackingItem.findMany({
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    if (dbItems && dbItems.length > 0) {
      // Sync memory store with DB items
      for (const d of dbItems) {
        const mapped: DailyTrackingItem = {
          id: d.id,
          committeeId: d.committeeId,
          committeeName: d.committeeName,
          date: d.date,
          head: d.head,
          subhead: d.subhead,
          title: d.title,
          workDescription: d.workDescription,
          status: d.status as TrackingStatus,
          progressPercentage: d.progressPercentage,
          blockers: d.blockers,
          operatorName: d.operatorName,
          operatorRollNo: d.operatorRollNo,
          operatorType: (d.operatorType as 'STUDENT' | 'FACULTY') || 'STUDENT',
          attachmentsUrl: d.attachmentsUrl,
          superAdminRemarks: d.superAdminRemarks,
          superAdminReviewed: d.superAdminReviewed,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        };
        store.set(mapped.id, mapped);
      }
      saveTrackingToDisk(store);
      items = Array.from(store.values());
    }
  } catch {
    // Non-fatal fallback to disk/memory cache
  }

  // Sort descending by date, then createdAt
  items.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply filters
  if (filters?.committeeId && filters.committeeId !== 'ALL') {
    items = items.filter((i) => i.committeeId.toUpperCase() === filters.committeeId!.toUpperCase());
  }

  if (filters?.date) {
    items = items.filter((i) => i.date === filters.date);
  }

  if (filters?.head && filters.head !== 'ALL') {
    items = items.filter((i) => i.head.toLowerCase() === filters.head!.toLowerCase());
  }

  if (filters?.subhead && filters.subhead !== 'ALL') {
    items = items.filter((i) => i.subhead.toLowerCase() === filters.subhead!.toLowerCase());
  }

  if (filters?.status && (filters.status as string) !== 'ALL') {
    items = items.filter((i) => i.status === filters.status);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.workDescription.toLowerCase().includes(q) ||
        i.head.toLowerCase().includes(q) ||
        i.subhead.toLowerCase().includes(q) ||
        i.operatorName.toLowerCase().includes(q) ||
        (i.blockers && i.blockers.toLowerCase().includes(q))
    );
  }

  return items;
}

export async function getDailyTrackingById(id: string): Promise<DailyTrackingItem | null> {
  const store = getMemoryStore();
  if (store.has(id)) {
    return store.get(id)!;
  }

  try {
    const dbItem = await prisma.dailyTrackingItem.findUnique({ where: { id } });
    if (dbItem) {
      const mapped: DailyTrackingItem = {
        id: dbItem.id,
        committeeId: dbItem.committeeId,
        committeeName: dbItem.committeeName,
        date: dbItem.date,
        head: dbItem.head,
        subhead: dbItem.subhead,
        title: dbItem.title,
        workDescription: dbItem.workDescription,
        status: dbItem.status as TrackingStatus,
        progressPercentage: dbItem.progressPercentage,
        blockers: dbItem.blockers,
        operatorName: dbItem.operatorName,
        operatorRollNo: dbItem.operatorRollNo,
        operatorType: (dbItem.operatorType as 'STUDENT' | 'FACULTY') || 'STUDENT',
        attachmentsUrl: dbItem.attachmentsUrl,
        superAdminRemarks: dbItem.superAdminRemarks,
        superAdminReviewed: dbItem.superAdminReviewed,
        createdAt: dbItem.createdAt.toISOString(),
        updatedAt: dbItem.updatedAt.toISOString(),
      };
      store.set(mapped.id, mapped);
      saveTrackingToDisk(store);
      return mapped;
    }
  } catch {
    // Non-fatal
  }

  return null;
}

export interface CreateDailyTrackingInput {
  committeeId: string;
  committeeName?: string;
  date?: string; // defaults to today
  head: string;
  subhead: string;
  title: string;
  workDescription: string;
  status?: TrackingStatus;
  progressPercentage?: number;
  blockers?: string | null;
  operatorName: string;
  operatorRollNo: string;
  operatorType?: 'STUDENT' | 'FACULTY';
  attachmentsUrl?: string | null;
}

export async function createDailyTrackingItem(
  input: CreateDailyTrackingInput,
  operatorRoleId: string
): Promise<DailyTrackingItem> {
  const id = `dt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const date = input.date || getTodayString();
  const committee = getCommitteeById(input.committeeId);
  const committeeName = input.committeeName || committee?.name || input.committeeId;

  const newItem: DailyTrackingItem = {
    id,
    committeeId: input.committeeId,
    committeeName,
    date,
    head: input.head.trim(),
    subhead: input.subhead.trim(),
    title: input.title.trim(),
    workDescription: input.workDescription.trim(),
    status: input.status || 'IN_PROGRESS',
    progressPercentage: Math.min(100, Math.max(0, input.progressPercentage ?? 0)),
    blockers: input.blockers ? input.blockers.trim() : null,
    operatorName: input.operatorName.trim(),
    operatorRollNo: input.operatorRollNo.trim(),
    operatorType: input.operatorType || 'STUDENT',
    attachmentsUrl: input.attachmentsUrl ? input.attachmentsUrl.trim() : null,
    superAdminRemarks: null,
    superAdminReviewed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const store = getMemoryStore();
  store.set(id, newItem);
  saveTrackingToDisk(store);

  // Attempt DB persistence
  try {
    await prisma.dailyTrackingItem.create({
      data: {
        id: newItem.id,
        committeeId: newItem.committeeId,
        committeeName: newItem.committeeName,
        date: newItem.date,
        head: newItem.head,
        subhead: newItem.subhead,
        title: newItem.title,
        workDescription: newItem.workDescription,
        status: newItem.status,
        progressPercentage: newItem.progressPercentage,
        blockers: newItem.blockers,
        operatorName: newItem.operatorName,
        operatorRollNo: newItem.operatorRollNo,
        operatorType: newItem.operatorType,
        attachmentsUrl: newItem.attachmentsUrl,
        superAdminRemarks: newItem.superAdminRemarks,
        superAdminReviewed: newItem.superAdminReviewed,
      },
    });
  } catch (err) {
    console.warn('[DailyTracking] Prisma create skipped, saved to disk cache:', err);
  }

  // Audit log entry
  try {
    await createAuditLog({
      targetId: newItem.id,
      targetType: 'DAILY_TRACKING',
      action: 'CREATE_DAILY_TRACKING',
      operatorName: newItem.operatorName,
      operatorRollNo: newItem.operatorRollNo,
      operatorType: newItem.operatorType || 'STUDENT',
      committeeRoleId: operatorRoleId,
      changes: `Created daily tracking for ${newItem.head} > ${newItem.subhead}: "${newItem.title}" (${newItem.status})`,
    });
  } catch {
    // Non-fatal
  }

  return newItem;
}

export interface UpdateDailyTrackingInput {
  head?: string;
  subhead?: string;
  title?: string;
  workDescription?: string;
  status?: TrackingStatus;
  progressPercentage?: number;
  blockers?: string | null;
  attachmentsUrl?: string | null;
  superAdminRemarks?: string | null;
  superAdminReviewed?: boolean;
}

export async function updateDailyTrackingItem(
  id: string,
  updates: UpdateDailyTrackingInput,
  operatorInfo?: {
    operatorName: string;
    operatorRollNo: string;
    operatorType?: 'STUDENT' | 'FACULTY';
    committeeRoleId: string;
  }
): Promise<DailyTrackingItem> {
  const store = getMemoryStore();
  let existing = store.get(id);

  if (!existing) {
    const fetched = await getDailyTrackingById(id);
    if (!fetched) {
      throw new Error(`Daily tracking item ${id} not found.`);
    }
    existing = fetched;
  }

  const updated: DailyTrackingItem = {
    ...existing,
    head: updates.head !== undefined ? updates.head.trim() : existing.head,
    subhead: updates.subhead !== undefined ? updates.subhead.trim() : existing.subhead,
    title: updates.title !== undefined ? updates.title.trim() : existing.title,
    workDescription: updates.workDescription !== undefined ? updates.workDescription.trim() : existing.workDescription,
    status: updates.status !== undefined ? updates.status : existing.status,
    progressPercentage:
      updates.progressPercentage !== undefined
        ? Math.min(100, Math.max(0, updates.progressPercentage))
        : existing.progressPercentage,
    blockers: updates.blockers !== undefined ? updates.blockers : existing.blockers,
    attachmentsUrl: updates.attachmentsUrl !== undefined ? updates.attachmentsUrl : existing.attachmentsUrl,
    superAdminRemarks: updates.superAdminRemarks !== undefined ? updates.superAdminRemarks : existing.superAdminRemarks,
    superAdminReviewed:
      updates.superAdminReviewed !== undefined ? updates.superAdminReviewed : existing.superAdminReviewed,
    updatedAt: new Date().toISOString(),
  };

  store.set(id, updated);
  saveTrackingToDisk(store);

  try {
    await prisma.dailyTrackingItem.update({
      where: { id },
      data: {
        head: updated.head,
        subhead: updated.subhead,
        title: updated.title,
        workDescription: updated.workDescription,
        status: updated.status,
        progressPercentage: updated.progressPercentage,
        blockers: updated.blockers,
        attachmentsUrl: updated.attachmentsUrl,
        superAdminRemarks: updated.superAdminRemarks,
        superAdminReviewed: updated.superAdminReviewed,
      },
    });
  } catch (err) {
    console.warn('[DailyTracking] Prisma update skipped, saved to disk cache:', err);
  }

  if (operatorInfo) {
    try {
      await createAuditLog({
        targetId: id,
        targetType: 'DAILY_TRACKING',
        action: 'UPDATE_DAILY_TRACKING',
        operatorName: operatorInfo.operatorName,
        operatorRollNo: operatorInfo.operatorRollNo,
        operatorType: operatorInfo.operatorType || 'STUDENT',
        committeeRoleId: operatorInfo.committeeRoleId,
        changes: `Updated tracking item "${updated.title}" - Status: ${updated.status}, Progress: ${updated.progressPercentage}%`,
      });
    } catch {
      // Non-fatal
    }
  }

  return updated;
}

export async function deleteDailyTrackingItem(
  id: string,
  operatorInfo?: {
    operatorName: string;
    operatorRollNo: string;
    operatorType?: 'STUDENT' | 'FACULTY';
    committeeRoleId: string;
  }
): Promise<boolean> {
  const store = getMemoryStore();
  const existing = store.get(id);
  if (!existing) {
    return false;
  }

  store.delete(id);
  saveTrackingToDisk(store);

  try {
    await prisma.dailyTrackingItem.delete({ where: { id } });
  } catch {
    // Non-fatal
  }

  if (operatorInfo) {
    try {
      await createAuditLog({
        targetId: id,
        targetType: 'DAILY_TRACKING',
        action: 'DELETE_DAILY_TRACKING',
        operatorName: operatorInfo.operatorName,
        operatorRollNo: operatorInfo.operatorRollNo,
        operatorType: operatorInfo.operatorType || 'STUDENT',
        committeeRoleId: operatorInfo.committeeRoleId,
        changes: `Deleted tracking entry "${existing.title}" from committee ${existing.committeeName}`,
      });
    } catch {
      // Non-fatal
    }
  }

  return true;
}

// ─── Analytics & Statistics for Super Admin and Higher Authority ─────────────

export async function getDailyTrackingStats(): Promise<DailyTrackingStatsResponse> {
  const store = getMemoryStore();
  const allItems = Array.from(store.values());
  const today = getTodayString();

  const todayItems = allItems.filter((i) => i.date === today);
  const totalUpdatesOverall = allItems.length;
  const updatesLoggedToday = todayItems.length;

  // Track active committees from COMMITTEE_METAS
  const activeCommittees = COMMITTEE_METAS;
  const totalCommitteesCount = activeCommittees.length;

  // Committee compliance mapping
  const committeeComplianceList: CommitteeComplianceStat[] = activeCommittees.map((meta) => {
    const committeeItems = allItems.filter((i) => i.committeeId === meta.id);
    const commTodayItems = committeeItems.filter((i) => i.date === today);

    // Latest update date
    let lastUpdateDate: string | undefined = undefined;
    if (committeeItems.length > 0) {
      const sorted = [...committeeItems].sort((a, b) => b.date.localeCompare(a.date));
      lastUpdateDate = sorted[0].date;
    }

    const totalItemsOverall = committeeItems.length;
    const avgProgress =
      totalItemsOverall > 0
        ? Math.round(committeeItems.reduce((acc, curr) => acc + curr.progressPercentage, 0) / totalItemsOverall)
        : 0;

    const blockedCount = committeeItems.filter((i) => i.status === 'BLOCKED' || i.status === 'DELAYED').length;

    return {
      committeeId: meta.id,
      committeeName: meta.name,
      slug: meta.slug,
      updatedToday: commTodayItems.length > 0,
      totalItemsToday: commTodayItems.length,
      lastUpdateDate,
      totalItemsOverall,
      avgProgress,
      blockedCount,
    };
  });

  const committeesReportingTodayCount = committeeComplianceList.filter((c) => c.updatedToday).length;
  const reportingCompliancePercentage =
    totalCommitteesCount > 0 ? Math.round((committeesReportingTodayCount / totalCommitteesCount) * 100) : 0;

  const activeBlockers = allItems.filter((i) => i.status === 'BLOCKED' || i.status === 'DELAYED');
  const activeBlockersCount = activeBlockers.length;

  const overallProgressPercentage =
    allItems.length > 0
      ? Math.round(allItems.reduce((acc, curr) => acc + curr.progressPercentage, 0) / allItems.length)
      : 0;

  // Head-wise progress aggregation
  const headMap = new Map<
    string,
    { total: number; progressSum: number; completed: number; blocked: number; inProgress: number }
  >();

  // Ensure default heads are initialized
  for (const h of Object.keys(PRESET_HEADS)) {
    headMap.set(h, { total: 0, progressSum: 0, completed: 0, blocked: 0, inProgress: 0 });
  }

  for (const item of allItems) {
    const cur = headMap.get(item.head) || { total: 0, progressSum: 0, completed: 0, blocked: 0, inProgress: 0 };
    cur.total += 1;
    cur.progressSum += item.progressPercentage;
    if (item.status === 'COMPLETED') cur.completed += 1;
    else if (item.status === 'BLOCKED' || item.status === 'DELAYED') cur.blocked += 1;
    else cur.inProgress += 1;
    headMap.set(item.head, cur);
  }

  const headWiseStats: HeadProgressStat[] = Array.from(headMap.entries())
    .map(([head, data]) => ({
      head,
      totalItems: data.total,
      avgProgress: data.total > 0 ? Math.round(data.progressSum / data.total) : 0,
      completedCount: data.completed,
      blockedCount: data.blocked,
      inProgressCount: data.inProgress,
    }))
    .filter((h) => h.totalItems > 0 || Object.keys(PRESET_HEADS).includes(h.head));

  // Sort active blockers by most recently updated
  const recentBlockers = [...activeBlockers]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return {
    todayDate: today,
    totalUpdatesOverall,
    updatesLoggedToday,
    totalCommitteesCount,
    committeesReportingTodayCount,
    reportingCompliancePercentage,
    activeBlockersCount,
    overallProgressPercentage,
    headWiseStats,
    committeeComplianceList,
    recentBlockers,
  };
}

/**
 * Returns merged preset heads and subheads alongside any custom heads/subheads entered by users.
 */
export async function getAllHeadsAndSubheads(): Promise<Record<string, string[]>> {
  const store = getMemoryStore();
  const result: Record<string, Set<string>> = {};

  // Copy presets
  for (const [head, subheads] of Object.entries(PRESET_HEADS)) {
    result[head] = new Set(subheads);
  }

  // Merge items from tracking
  for (const item of store.values()) {
    if (!result[item.head]) {
      result[item.head] = new Set();
    }
    if (item.subhead) {
      result[item.head].add(item.subhead);
    }
  }

  // Convert Sets to Arrays
  const finalResult: Record<string, string[]> = {};
  for (const [head, subheadSet] of Object.entries(result)) {
    finalResult[head] = Array.from(subheadSet);
  }

  return finalResult;
}
