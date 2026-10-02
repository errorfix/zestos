/**
 * Official Default Volunteer Rosters for all FestOS Committees.
 * Ensures every committee has verified student volunteers pre-configured,
 * so operators only need to mark presence and apply changes.
 */

export interface DefaultVolunteer {
  rollNumber: string;
  studentName: string;
  committeeSlug: string;
  committeeId: string;
}

export const OFFICIAL_COMMITTEE_VOLUNTEERS: Record<string, Array<{ rollNumber: string; studentName: string }>> = {
  dance: [
    { rollNumber: '23BTECH011', studentName: 'Aarav Sharma' },
    { rollNumber: '23BTECH012', studentName: 'Priya Singh' },
    { rollNumber: '23BTECH013', studentName: 'Rohan Verma' },
    { rollNumber: '23BTECH014', studentName: 'Ananya Gupta' },
    { rollNumber: '23BTECH015', studentName: 'Karan Patel' },
    { rollNumber: '23BTECH016', studentName: 'Sneha Reddy' },
  ],
  music: [
    { rollNumber: '23BTECH021', studentName: 'Kabir Mehta' },
    { rollNumber: '23BTECH022', studentName: 'Rhea Sen' },
    { rollNumber: '23BTECH023', studentName: 'Arjun Nair' },
    { rollNumber: '23BTECH024', studentName: 'Meera Kapoor' },
    { rollNumber: '23BTECH025', studentName: 'Devansh Joshi' },
  ],
  fashion: [
    { rollNumber: '23BTECH031', studentName: 'Isha Malhotra' },
    { rollNumber: '23BTECH032', studentName: 'Varun Dhawan' },
    { rollNumber: '23BTECH033', studentName: 'Tanvi Rao' },
    { rollNumber: '23BTECH034', studentName: 'Siddharth Roy' },
  ],
  theatre: [
    { rollNumber: '23BTECH041', studentName: 'Aditya Chopra' },
    { rollNumber: '23BTECH042', studentName: 'Divya Bhatia' },
    { rollNumber: '23BTECH043', studentName: 'Manish Pandey' },
    { rollNumber: '23BTECH044', studentName: 'Simran Kaur' },
  ],
  literary: [
    { rollNumber: '23BTECH051', studentName: 'Nikhil Bansal' },
    { rollNumber: '23BTECH052', studentName: 'Pooja Hegde' },
    { rollNumber: '23BTECH053', studentName: 'Tarun Singhal' },
    { rollNumber: '23BTECH054', studentName: 'Kavita Joshi' },
  ],
  gaming: [
    { rollNumber: '23BTECH061', studentName: 'Dhruv Rathee' },
    { rollNumber: '23BTECH062', studentName: 'Akash Deep' },
    { rollNumber: '23BTECH063', studentName: 'Kunal Shah' },
    { rollNumber: '23BTECH064', studentName: 'Sahil Khan' },
  ],
  stage: [
    { rollNumber: '23BTECH071', studentName: 'Gaurav Taneja' },
    { rollNumber: '23BTECH072', studentName: 'Shreya Ghoshal' },
    { rollNumber: '23BTECH073', studentName: 'Abhinav Bindra' },
    { rollNumber: '23BTECH074', studentName: 'Ritu Phogat' },
  ],
  'gate-security': [
    { rollNumber: '23BTECH081', studentName: 'Vikas Yadav' },
    { rollNumber: '23BTECH082', studentName: 'Deepak Hooda' },
    { rollNumber: '23BTECH083', studentName: 'Rahul Chahar' },
    { rollNumber: '23BTECH084', studentName: 'Aman Sehrawat' },
  ],
  registration: [
    { rollNumber: '23BTECH091', studentName: 'Harsh Rajput' },
    { rollNumber: '23BTECH092', studentName: 'Kritika Kamra' },
    { rollNumber: '23BTECH093', studentName: 'Yash Dayal' },
    { rollNumber: '23BTECH094', studentName: 'Nikita Tomar' },
  ],
  informalz: [
    { rollNumber: '23BTECH101', studentName: 'Ravi Bishnoi' },
    { rollNumber: '23BTECH102', studentName: 'Swati Mohan' },
    { rollNumber: '23BTECH103', studentName: 'Pranav Anand' },
    { rollNumber: '23BTECH104', studentName: 'Divyansh Singh' },
  ],
  discipline: [
    { rollNumber: '23BTECH111', studentName: 'Mohit Sharma' },
    { rollNumber: '23BTECH112', studentName: 'Neetu David' },
    { rollNumber: '23BTECH113', studentName: 'Chetan Sakariya' },
    { rollNumber: '23BTECH114', studentName: 'Rajeshwari Gayakwad' },
  ],
  infra: [
    { rollNumber: '23BTECH121', studentName: 'Sanjay Bangar' },
    { rollNumber: '23BTECH122', studentName: 'Poonam Yadav' },
    { rollNumber: '23BTECH123', studentName: 'Praveen Kumar' },
    { rollNumber: '23BTECH124', studentName: 'Devesh Saini' },
  ],
  hospitality: [
    { rollNumber: '23BTECH131', studentName: 'Anjali Bhagwat' },
    { rollNumber: '23BTECH132', studentName: 'Deepika Kumari' },
    { rollNumber: '23BTECH133', studentName: 'Sumit Antil' },
    { rollNumber: '23BTECH134', studentName: 'Bhavina Patel' },
  ],
  csit: [
    { rollNumber: '23BTECH141', studentName: 'Tushar Deshpande' },
    { rollNumber: '23BTECH142', studentName: 'Shikha Pandey' },
    { rollNumber: '23BTECH143', studentName: 'Mayank Markande' },
    { rollNumber: '23BTECH144', studentName: 'Pooja Vastrakar' },
  ],
  management: [
    { rollNumber: '23BTECH151', studentName: 'Alok Kumar' },
    { rollNumber: '23BTECH152', studentName: 'Sunita Meena' },
    { rollNumber: '23BTECH153', studentName: 'Ramesh Chandra' },
  ],
  sponsorship: [
    { rollNumber: '23BTECH161', studentName: 'Ashish Nehra' },
    { rollNumber: '23BTECH162', studentName: 'Smriti Mandhana' },
    { rollNumber: '23BTECH163', studentName: 'Vijay Shankar' },
  ],
  'certifications-prize': [
    { rollNumber: '23BTECH171', studentName: 'Bhuvaneshwar Kumar' },
    { rollNumber: '23BTECH172', studentName: 'Harmanpreet Kaur' },
    { rollNumber: '23BTECH173', studentName: 'Shardul Thakur' },
    { rollNumber: '23BTECH174', studentName: 'Jemimah Rodrigues' },
  ],
};

/**
 * Returns default volunteer roster for a specific committee slug, or for all committees if slug is 'all'.
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
