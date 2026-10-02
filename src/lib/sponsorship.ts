import fs from 'fs';
import path from 'path';
import { createAuditLog } from './db';
import {
  SponsorshipDeal,
  SponsorshipKind,
  DealStatus,
  SponsorshipStatsResponse,
} from './sponsorshipTypes';

export * from './sponsorshipTypes';

const SPONSORSHIP_CACHE_FILE = path.join(process.cwd(), '.festos_sponsorship.json');

let inMemoryDeals: Map<string, SponsorshipDeal> | null = null;

function getInitialSeedDeals(): SponsorshipDeal[] {
  return [
    {
      id: 'sp-01',
      companyName: 'Red Bull India',
      brandSector: 'Beverage & Energy',
      contactPerson: 'Vikram Malhotra',
      contactEmail: 'vikram.m@redbull.com',
      contactPhone: '+91 98110 44221',
      sponsorshipKind: 'IN_KIND_BEVERAGES',
      dealStatus: 'PAYMENT_RECEIVED',
      deliverablesSummary: '1,500 cans of chilled Red Bull for performers & VIPs, 2 branded DJ canopies in main arena, logo on tickets.',
      mouDocumentUrl: 'https://drive.google.com',
      operatorName: 'Aman Singhal',
      operatorRollNo: '22BBA088',
      operatorType: 'STUDENT',
      remarks: 'Product delivery scheduled on Day 1 at 7:00 AM at Gate 2 loading dock.',
      superAdminNotes: 'Verified deliverables with estate & hospitality team.',
      superAdminVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'sp-02',
      companyName: 'boAt Lifestyle',
      brandSector: 'Consumer Electronics & Audio',
      contactPerson: 'Pooja Sethi',
      contactEmail: 'pooja.sethi@boat-lifestyle.com',
      contactPhone: '+91 99201 88344',
      sponsorshipKind: 'PRIZE_POOL_PARTNER',
      dealStatus: 'MOU_SIGNED',
      deliverablesSummary: '50 boAt Airdopes & Smartwatches for Battle of the Bands & Gaming winners, banner on stage podium.',
      mouDocumentUrl: 'https://drive.google.com',
      operatorName: 'Megha Gupta',
      operatorRollNo: '23BCS104',
      operatorType: 'STUDENT',
      remarks: 'Prize hampers and branded merchandises arriving on festival eve.',
      superAdminNotes: 'MoU signed by Dean of Student Affairs.',
      superAdminVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'sp-03',
      companyName: "Domino's Pizza (Jubilant FoodWorks)",
      brandSector: 'Food & Quick Service Dining',
      contactPerson: 'Raghav Aggarwal',
      contactEmail: 'raghav.a@jublfood.com',
      contactPhone: '+91 97188 55431',
      sponsorshipKind: 'STALL_CANOPY',
      dealStatus: 'PAYMENT_RECEIVED',
      deliverablesSummary: '2 food court stall spaces (20x10ft) near student center, food coupons for volunteer core.',
      mouDocumentUrl: 'https://drive.google.com',
      operatorName: 'Kavita Rathore',
      operatorRollNo: 'FAC-MGMT-014',
      operatorType: 'FACULTY',
      remarks: 'Stall layout confirmed with campus estate department.',
      superAdminNotes: 'Stall allocations verified.',
      superAdminVerified: true,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 'sp-04',
      companyName: 'Coding Ninjas / Naukri',
      brandSector: 'EdTech & Placements',
      contactPerson: 'Siddharth Jain',
      contactEmail: 'siddharth@codingninjas.com',
      contactPhone: '+91 98109 23112',
      sponsorshipKind: 'ASSOCIATE_SPONSOR',
      dealStatus: 'IN_NEGOTIATION',
      deliverablesSummary: 'Logo on main festival poster, tech track naming rights, digital flyers in all attendee registration emails.',
      mouDocumentUrl: null,
      operatorName: 'Aman Singhal',
      operatorRollNo: '22BBA088',
      operatorType: 'STUDENT',
      remarks: 'Finalizing clause 4 regarding campus database privacy. Follow-up meeting scheduled today at 4:30 PM.',
      superAdminNotes: null,
      superAdminVerified: false,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
    {
      id: 'sp-05',
      companyName: 'Unstop (formerly Dare2Compete)',
      brandSector: 'Competitions & Student Engagement',
      contactPerson: 'Ankita Rao',
      contactEmail: 'ankita@unstop.com',
      contactPhone: '+91 99870 12345',
      sponsorshipKind: 'MEDIA_STREAMING',
      dealStatus: 'VERBALLY_COMMITTED',
      deliverablesSummary: 'Official platform partner, banner listing on national unstop portal reaching 500k college students.',
      mouDocumentUrl: null,
      operatorName: 'Megha Gupta',
      operatorRollNo: '23BCS104',
      operatorType: 'STUDENT',
      remarks: 'Draft MoU sent for legal vetting.',
      superAdminNotes: null,
      superAdminVerified: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'sp-06',
      companyName: 'Monster Energy India',
      brandSector: 'Beverage & Action Sports',
      contactPerson: 'Karan Mehra',
      contactEmail: 'karan@monsterenergy.com',
      contactPhone: '+91 98200 44556',
      sponsorshipKind: 'TITLE_SPONSOR',
      dealStatus: 'PITCH_SENT',
      deliverablesSummary: 'Festival title naming: "Lingaya\'s Zest powered by Monster Energy", mega stage branding.',
      mouDocumentUrl: null,
      operatorName: 'Dr. R. K. Vashisht',
      operatorRollNo: 'FAC-DIR-001',
      operatorType: 'FACULTY',
      remarks: 'Pitch presentation sent to regional marketing head.',
      superAdminNotes: null,
      superAdminVerified: false,
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

function loadDealsFromDisk(): Map<string, SponsorshipDeal> {
  const map = new Map<string, SponsorshipDeal>();
  try {
    if (fs.existsSync(SPONSORSHIP_CACHE_FILE)) {
      const raw = fs.readFileSync(SPONSORSHIP_CACHE_FILE, 'utf-8');
      const list: SponsorshipDeal[] = JSON.parse(raw);
      for (const item of list) {
        map.set(item.id, item);
      }
      return map;
    }
  } catch (err) {
    console.warn('[Sponsorship] Could not read disk cache, initializing seeds:', err);
  }

  const seeds = getInitialSeedDeals();
  for (const s of seeds) {
    map.set(s.id, s);
  }
  saveDealsToDisk(map);
  return map;
}

function saveDealsToDisk(map: Map<string, SponsorshipDeal>) {
  try {
    const list = Array.from(map.values());
    fs.writeFileSync(SPONSORSHIP_CACHE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Sponsorship] Failed to write disk cache:', err);
  }
}

function getMemoryStore(): Map<string, SponsorshipDeal> {
  if (!inMemoryDeals) {
    inMemoryDeals = loadDealsFromDisk();
  }
  return inMemoryDeals;
}

// ─── CRUD Functions ─────────────────────────────────────────────────────────

export interface SponsorshipFilters {
  status?: DealStatus | 'ALL';
  kind?: SponsorshipKind | 'ALL';
  search?: string;
}

export async function getSponsorshipDeals(filters?: SponsorshipFilters): Promise<SponsorshipDeal[]> {
  const store = getMemoryStore();
  let items = Array.from(store.values());

  // Sort by updatedAt descending
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (filters?.status && filters.status !== 'ALL') {
    items = items.filter((i) => i.dealStatus === filters.status);
  }

  if (filters?.kind && filters.kind !== 'ALL') {
    items = items.filter((i) => i.sponsorshipKind === filters.kind);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    items = items.filter(
      (i) =>
        i.companyName.toLowerCase().includes(q) ||
        i.brandSector.toLowerCase().includes(q) ||
        i.contactPerson.toLowerCase().includes(q) ||
        i.contactEmail.toLowerCase().includes(q) ||
        i.operatorName.toLowerCase().includes(q) ||
        i.deliverablesSummary.toLowerCase().includes(q)
    );
  }

  return items;
}

export async function getSponsorshipDealById(id: string): Promise<SponsorshipDeal | null> {
  const store = getMemoryStore();
  return store.get(id) || null;
}

export interface CreateSponsorshipInput {
  companyName: string;
  brandSector: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  sponsorshipKind: SponsorshipKind;
  dealStatus?: DealStatus;
  deliverablesSummary: string;
  mouDocumentUrl?: string | null;
  operatorName: string;
  operatorRollNo: string;
  operatorType?: 'STUDENT' | 'FACULTY';
  remarks?: string | null;
}

export async function createSponsorshipDeal(
  input: CreateSponsorshipInput,
  operatorRoleId: string
): Promise<SponsorshipDeal> {
  const id = `sp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newDeal: SponsorshipDeal = {
    id,
    companyName: input.companyName.trim(),
    brandSector: input.brandSector.trim(),
    contactPerson: input.contactPerson.trim(),
    contactEmail: input.contactEmail.trim(),
    contactPhone: input.contactPhone.trim(),
    sponsorshipKind: input.sponsorshipKind,
    dealStatus: input.dealStatus || 'REACHED_OUT',
    deliverablesSummary: input.deliverablesSummary.trim(),
    mouDocumentUrl: input.mouDocumentUrl ? input.mouDocumentUrl.trim() : null,
    operatorName: input.operatorName.trim(),
    operatorRollNo: input.operatorRollNo.trim(),
    operatorType: input.operatorType || 'STUDENT',
    remarks: input.remarks ? input.remarks.trim() : null,
    superAdminNotes: null,
    superAdminVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const store = getMemoryStore();
  store.set(id, newDeal);
  saveDealsToDisk(store);

  try {
    await createAuditLog({
      targetId: id,
      targetType: 'SPONSORSHIP_DEAL',
      action: 'CREATE_SPONSORSHIP_PITCH',
      operatorName: newDeal.operatorName,
      operatorRollNo: newDeal.operatorRollNo,
      operatorType: newDeal.operatorType || 'STUDENT',
      committeeRoleId: operatorRoleId,
      changes: `Created sponsorship lead for "${newDeal.companyName}" (${newDeal.sponsorshipKind})`,
    });
  } catch {
    // Non-fatal
  }

  return newDeal;
}

export interface UpdateSponsorshipInput {
  companyName?: string;
  brandSector?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  sponsorshipKind?: SponsorshipKind;
  dealStatus?: DealStatus;
  deliverablesSummary?: string;
  mouDocumentUrl?: string | null;
  remarks?: string | null;
  superAdminNotes?: string | null;
  superAdminVerified?: boolean;
}

export async function updateSponsorshipDeal(
  id: string,
  updates: UpdateSponsorshipInput,
  operatorInfo?: {
    operatorName: string;
    operatorRollNo: string;
    operatorType?: 'STUDENT' | 'FACULTY';
    committeeRoleId: string;
  }
): Promise<SponsorshipDeal> {
  const store = getMemoryStore();
  const existing = store.get(id);
  if (!existing) {
    throw new Error(`Sponsorship deal ${id} not found.`);
  }

  const updated: SponsorshipDeal = {
    ...existing,
    companyName: updates.companyName !== undefined ? updates.companyName.trim() : existing.companyName,
    brandSector: updates.brandSector !== undefined ? updates.brandSector.trim() : existing.brandSector,
    contactPerson: updates.contactPerson !== undefined ? updates.contactPerson.trim() : existing.contactPerson,
    contactEmail: updates.contactEmail !== undefined ? updates.contactEmail.trim() : existing.contactEmail,
    contactPhone: updates.contactPhone !== undefined ? updates.contactPhone.trim() : existing.contactPhone,
    sponsorshipKind: updates.sponsorshipKind !== undefined ? updates.sponsorshipKind : existing.sponsorshipKind,
    dealStatus: updates.dealStatus !== undefined ? updates.dealStatus : existing.dealStatus,
    deliverablesSummary:
      updates.deliverablesSummary !== undefined ? updates.deliverablesSummary.trim() : existing.deliverablesSummary,
    mouDocumentUrl: updates.mouDocumentUrl !== undefined ? updates.mouDocumentUrl : existing.mouDocumentUrl,
    remarks: updates.remarks !== undefined ? updates.remarks : existing.remarks,
    superAdminNotes: updates.superAdminNotes !== undefined ? updates.superAdminNotes : existing.superAdminNotes,
    superAdminVerified:
      updates.superAdminVerified !== undefined ? updates.superAdminVerified : existing.superAdminVerified,
    updatedAt: new Date().toISOString(),
  };

  store.set(id, updated);
  saveDealsToDisk(store);

  if (operatorInfo) {
    try {
      await createAuditLog({
        targetId: id,
        targetType: 'SPONSORSHIP_DEAL',
        action: 'UPDATE_SPONSORSHIP_DEAL',
        operatorName: operatorInfo.operatorName,
        operatorRollNo: operatorInfo.operatorRollNo,
        operatorType: operatorInfo.operatorType || 'STUDENT',
        committeeRoleId: operatorInfo.committeeRoleId,
        changes: `Updated "${updated.companyName}" status to ${updated.dealStatus}`,
      });
    } catch {
      // Non-fatal
    }
  }

  return updated;
}

export async function deleteSponsorshipDeal(
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
  if (!existing) return false;

  store.delete(id);
  saveDealsToDisk(store);

  if (operatorInfo) {
    try {
      await createAuditLog({
        targetId: id,
        targetType: 'SPONSORSHIP_DEAL',
        action: 'DELETE_SPONSORSHIP_DEAL',
        operatorName: operatorInfo.operatorName,
        operatorRollNo: operatorInfo.operatorRollNo,
        operatorType: operatorInfo.operatorType || 'STUDENT',
        committeeRoleId: operatorInfo.committeeRoleId,
        changes: `Deleted sponsorship deal for "${existing.companyName}"`,
      });
    } catch {
      // Non-fatal
    }
  }

  return true;
}

export async function getSponsorshipStats(): Promise<SponsorshipStatsResponse> {
  const store = getMemoryStore();
  const list = Array.from(store.values());

  const totalBrandsReached = list.length;
  const pitchesSent = list.filter((i) => i.dealStatus !== 'REACHED_OUT').length;
  const inNegotiation = list.filter(
    (i) => i.dealStatus === 'IN_NEGOTIATION' || i.dealStatus === 'CALL_SCHEDULED' || i.dealStatus === 'VERBALLY_COMMITTED'
  ).length;
  const dealsClosed = list.filter(
    (i) => i.dealStatus === 'MOU_SIGNED' || i.dealStatus === 'PAYMENT_RECEIVED'
  ).length;
  const mouSigned = list.filter(
    (i) => i.dealStatus === 'MOU_SIGNED' || i.dealStatus === 'PAYMENT_RECEIVED'
  ).length;

  // Top confirmed partners sorted by recency
  const topPartners = list
    .filter((i) => i.dealStatus === 'MOU_SIGNED' || i.dealStatus === 'PAYMENT_RECEIVED')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return {
    totalBrandsReached,
    pitchesSent,
    inNegotiation,
    dealsClosed,
    mouSigned,
    deals: list,
    topPartners,
  };
}
