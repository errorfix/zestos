export type SponsorshipKind =
  | 'TITLE_SPONSOR'
  | 'POWERED_BY'
  | 'ASSOCIATE_SPONSOR'
  | 'IN_KIND_BEVERAGES'
  | 'IN_KIND_MERCHANDISE'
  | 'MEDIA_STREAMING'
  | 'STALL_CANOPY'
  | 'PRIZE_POOL_PARTNER'
  | 'OTHER';

export type DealStatus =
  | 'REACHED_OUT'
  | 'PITCH_SENT'
  | 'CALL_SCHEDULED'
  | 'IN_NEGOTIATION'
  | 'VERBALLY_COMMITTED'
  | 'MOU_SIGNED'
  | 'PAYMENT_RECEIVED'
  | 'REJECTED';

export interface SponsorshipDeal {
  id: string;
  companyName: string;
  brandSector: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  sponsorshipKind: SponsorshipKind;
  dealStatus: DealStatus;
  pitchedAmountInr: number;
  committedAmountInr: number;
  receivedAmountInr: number;
  deliverablesSummary: string;
  mouDocumentUrl?: string | null;
  paymentProofUrl?: string | null;
  operatorName: string;
  operatorRollNo: string;
  operatorType?: 'STUDENT' | 'FACULTY' | null;
  remarks?: string | null;
  superAdminNotes?: string | null;
  superAdminVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SponsorshipStatsResponse {
  totalBrandsReached: number;
  pitchesSent: number;
  inNegotiation: number;
  dealsClosed: number;
  fundsPledgedInr: number;
  fundsReceivedInr: number;
  collectionPercentage: number;
  deals: SponsorshipDeal[];
  topPartners: SponsorshipDeal[];
}

export const SPONSORSHIP_KIND_LABELS: Record<SponsorshipKind, string> = {
  TITLE_SPONSOR: 'Title Sponsor',
  POWERED_BY: 'Powered By Partner',
  ASSOCIATE_SPONSOR: 'Associate Sponsor',
  IN_KIND_BEVERAGES: 'In-Kind: Food & Beverages',
  IN_KIND_MERCHANDISE: 'In-Kind: Kits & Merch',
  MEDIA_STREAMING: 'Media & Streaming Partner',
  STALL_CANOPY: 'Stall & Canopy Exhibitor',
  PRIZE_POOL_PARTNER: 'Prize Pool Sponsor',
  OTHER: 'Custom Partnership',
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  REACHED_OUT: 'Initial Outreach',
  PITCH_SENT: 'Pitch Deck Sent',
  CALL_SCHEDULED: 'Meeting Scheduled',
  IN_NEGOTIATION: 'In Negotiation',
  VERBALLY_COMMITTED: 'Verbally Committed',
  MOU_SIGNED: 'MoU Signed',
  PAYMENT_RECEIVED: 'Payment / Goods Received',
  REJECTED: 'Declined / Dropped',
};
