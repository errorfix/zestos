export type TrackingStatus = 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'BLOCKED' | 'PENDING_REVIEW';

export interface DailyTrackingItem {
  id: string;
  committeeId: string;
  committeeName: string;
  date: string; // YYYY-MM-DD
  head: string;
  subhead: string;
  title: string;
  workDescription: string;
  status: TrackingStatus;
  progressPercentage?: number;
  blockers?: string | null;
  operatorName: string;
  operatorRollNo: string;
  operatorType?: 'STUDENT' | 'FACULTY' | null;
  attachmentsUrl?: string | null;
  superAdminRemarks?: string | null;
  superAdminReviewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRESET_HEADS: Record<string, string[]> = {
  'Logistics & Infrastructure': [
    'Stage Setup & Barricades',
    'Audio & Sound Equipment',
    'Lighting & Rigging',
    'Power, Generator & Cabling',
    'Seating & Green Room Logistics',
    'Inventory & Equipment Procurement',
  ],
  'Hospitality & Protocol': [
    'Celebrity / VIP Artist Liaison',
    'Judges Hospitality & Escorts',
    'Hotel & Travel Bookings',
    'Green Room Refreshments',
    'Food & Meal Passes Distribution',
  ],
  'Sponsorship & Finance': [
    'Sponsor Pitch & Deliverables',
    'MoU & Contract Signings',
    'Vendor Billing & Invoices',
    'Petty Cash Management',
    'Budget Utilization Tracking',
  ],
  'Media, PR & Creative': [
    'Social Media Announcements',
    'Teaser Videos & Reels Production',
    'Banners, Standees & Backdrop Printing',
    'Campus Posters Distribution',
    'Photography & Videography Crew',
  ],
  'Event Rules & Execution': [
    'Rulebooks & Eligibility Criteria',
    'Judges Scoring Sheets & Rubrics',
    'Anchor Scripts & Stage Cue Sheets',
    'Timeline & Slot Management',
    'Participant Briefing & Verification',
  ],
  'Security, Gate & Discipline': [
    'Gate Queuing & Barcode Scanner Desks',
    'Volunteer Deployment & Badging',
    'Crowd Control & Emergency Lanes',
    'First Aid & Medical Emergency Readiness',
    'Anti-Cheating & Stage Discipline',
  ],
  'Operations & Coordination': [
    'Inter-Committee Coordination',
    'Faculty Approvals & Permissions',
    'Daily Wrap-up Meeting & Reporting',
    'Lost & Found Desk',
  ],
};

export interface TrackingFilters {
  committeeId?: string;
  date?: string;
  head?: string;
  subhead?: string;
  status?: TrackingStatus;
  search?: string;
}

export interface HeadProgressStat {
  head: string;
  totalItems: number;
  avgProgress: number;
  completedCount: number;
  blockedCount: number;
  inProgressCount: number;
}

export interface CommitteeComplianceStat {
  committeeId: string;
  committeeName: string;
  slug: string;
  updatedToday: boolean;
  totalItemsToday: number;
  lastUpdateDate?: string;
  totalItemsOverall: number;
  avgProgress: number;
  blockedCount: number;
}

export interface DailyTrackingStatsResponse {
  todayDate: string;
  totalUpdatesOverall: number;
  updatesLoggedToday: number;
  totalCommitteesCount: number;
  committeesReportingTodayCount: number;
  reportingCompliancePercentage: number;
  activeBlockersCount: number;
  overallProgressPercentage: number;
  headWiseStats: HeadProgressStat[];
  committeeComplianceList: CommitteeComplianceStat[];
  recentBlockers: DailyTrackingItem[];
}
