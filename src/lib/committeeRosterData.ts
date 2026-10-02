/**
 * Official Volunteer Rosters for FestOS Committees.
 * Student volunteer records are populated from actual registrations or database roster entries.
 */

export interface DefaultVolunteer {
  rollNumber: string;
  studentName: string;
  committeeSlug: string;
  committeeId: string;
}

export const OFFICIAL_COMMITTEE_VOLUNTEERS: Record<string, Array<{ rollNumber: string; studentName: string }>> = {};

/**
 * Returns volunteer roster for a specific committee slug, or for all committees if slug is 'all'.
 * Defaults to empty array unless explicit entries are configured.
 */
export function getDefaultRosterForCommittee(slug: string): Array<{
  id: string;
  committeeId: string;
  rollNumber: string;
  studentName: string;
  createdAt: Date;
}> {
  const now = new Date();
  if (slug === 'all') {
    const allMembers: Array<{
      id: string;
      committeeId: string;
      rollNumber: string;
      studentName: string;
      createdAt: Date;
    }> = [];
    for (const [commSlug, volunteers] of Object.entries(OFFICIAL_COMMITTEE_VOLUNTEERS)) {
      for (const v of volunteers) {
        allMembers.push({
          id: `def-${commSlug}-${v.rollNumber}`,
          committeeId: commSlug,
          rollNumber: v.rollNumber,
          studentName: v.studentName,
          createdAt: now,
        });
      }
    }
    return allMembers;
  }

  const normalized = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const volunteers = OFFICIAL_COMMITTEE_VOLUNTEERS[normalized] || [];
  return volunteers.map((v) => ({
    id: `def-${normalized}-${v.rollNumber}`,
    committeeId: normalized,
    rollNumber: v.rollNumber,
    studentName: v.studentName,
    createdAt: now,
  }));
}
