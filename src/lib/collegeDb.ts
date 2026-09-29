import prisma from './prisma';
import { getEvents } from './db';
import { getCollegePricingExceptions } from './collegePricingExceptions';
import { PRELOADED_COLLEGES } from './collegeList';
import { generateTicketCode, generateTicketSecurityHash } from './crypto';

export interface SquadMemberInput {
  fullName: string;
  phone: string;
  photoUrl?: string;
  isTeamLeader?: boolean;
}

export interface SquadInput {
  eventId: string;
  participants: SquadMemberInput[];
}

export interface PricingCalculationResult {
  instituteName: string;
  totalUniqueParticipants: number;
  existingQuotaUsed: number;
  newQuotaUsed: number;
  day1ParticipantsCount: number;
  day2ParticipantsCount: number;
  day1DiscountedCount: number;
  day1ElevatedCount: number;
  day1AmountInr: number;
  day2AmountInr: number;
  exceptionsAmountInr: number;
  subtotalInr: number;
  isFloorApplied: boolean;
  finalAmountInr: number;
  finalAmountPaise: number;
  squadsBreakdown: Array<{
    eventId: string;
    eventTitle: string;
    eventDate: string | null;
    participantCount: number;
    exceptionMode: 'DEFAULT' | 'ADDITIVE' | 'REPLACEMENT';
    exceptionFeeInr: number;
  }>;
}

/**
 * Returns a list of all colleges (curated preloaded + all dynamically added ones from DB).
 */
export async function getAllCollegesList(): Promise<string[]> {
  const dynamicColleges = new Set<string>();

  try {
    const fromRegs = await prisma.instituteRegistration.findMany({
      select: { instituteName: true },
      distinct: ['instituteName'],
    });
    fromRegs.forEach((r) => {
      if (r.instituteName && r.instituteName.trim()) {
        dynamicColleges.add(r.instituteName.trim());
      }
    });

    const fromIndividuals = await prisma.registration.findMany({
      select: { college: true },
      distinct: ['college'],
    });
    fromIndividuals.forEach((r) => {
      if (r.college && r.college.trim()) {
        dynamicColleges.add(r.college.trim());
      }
    });
  } catch (err) {
    console.warn('[getAllCollegesList] Could not fetch dynamic colleges:', err);
  }

  const combined = Array.from(new Set([...PRELOADED_COLLEGES, ...Array.from(dynamicColleges)]));
  return combined.sort((a, b) => a.localeCompare(b));
}

/**
 * Computes exact tiered pricing for a college contingent submission.
 * - Quota of 20 participants per college (counting both Day 1 and Day 2 participants).
 * - Day 1 participants within quota: ₹100/person.
 * - Day 1 participants above quota: ₹150/person.
 * - Day 2 participants: flat ₹150/person (and consumes slots in the 20-person quota).
 * - Minimum order floor: ₹1,000 per submission.
 * - Event exceptions: ADDITIVE (+ event fee) or REPLACEMENT (event fee replaces campus entry).
 */
export async function calculateContingentPricing(
  instituteName: string,
  squads: SquadInput[]
): Promise<PricingCalculationResult> {
  const allEvents = await getEvents();
  const exceptionsMap = getCollegePricingExceptions();

  // 1. Fetch existing paid participants count for this institute to know current quota used
  let existingQuotaUsed = 0;
  try {
    const existingParticipants = await prisma.instituteParticipant.findMany({
      where: {
        instituteName: { equals: instituteName.trim(), mode: 'insensitive' },
        registration: { paymentStatus: 'PAID' },
      },
      select: { phone: true },
      distinct: ['phone'],
    });
    existingQuotaUsed = existingParticipants.length;
  } catch (err) {
    console.warn('[calculateContingentPricing] Could not query existing institute quota:', err);
  }

  // 2. Identify unique participants and their day requirements in this submission
  const phoneToDays = new Map<string, Set<'DAY_1' | 'DAY_2'>>();
  const phoneToSquadIndices = new Map<string, number[]>();

  squads.forEach((squad, sqIdx) => {
    const ev = allEvents.find((e) => e.id === squad.eventId);
    const dateStr = (ev?.date || '').toLowerCase();
    const isDay2 = dateStr.includes('day 2') || dateStr.includes('31');
    const festivalDay: 'DAY_1' | 'DAY_2' = isDay2 ? 'DAY_2' : 'DAY_1';

    squad.participants.forEach((p) => {
      const cleanPhone = p.phone.trim().replace(/\s+/g, '');
      if (!cleanPhone) return;

      if (!phoneToDays.has(cleanPhone)) {
        phoneToDays.set(cleanPhone, new Set());
      }
      phoneToDays.get(cleanPhone)!.add(festivalDay);

      if (!phoneToSquadIndices.has(cleanPhone)) {
        phoneToSquadIndices.set(cleanPhone, []);
      }
      phoneToSquadIndices.get(cleanPhone)!.push(sqIdx);
    });
  });

  const totalUniqueParticipants = phoneToDays.size;

  // Count Day 1 and Day 2 distinct attendee days
  let day1Count = 0;
  let day2Count = 0;

  for (const days of phoneToDays.values()) {
    if (days.has('DAY_1')) day1Count++;
    if (days.has('DAY_2')) day2Count++;
  }

  // 3. Exception Surcharge Calculation
  let exceptionsAmountInr = 0;
  const squadsBreakdown = squads.map((squad) => {
    const ev = allEvents.find((e) => e.id === squad.eventId);
    const mode = exceptionsMap[squad.eventId] || 'DEFAULT';
    let exceptionFeeInr = 0;

    const baseEventFeeInr = Math.round((ev?.feeAmount || 0) / 100);

    if (mode === 'ADDITIVE') {
      exceptionFeeInr = baseEventFeeInr * squad.participants.length;
    } else if (mode === 'REPLACEMENT') {
      // Event fee replaces campus fee for this squad
      exceptionFeeInr = baseEventFeeInr * squad.participants.length;
    }

    exceptionsAmountInr += exceptionFeeInr;

    return {
      eventId: squad.eventId,
      eventTitle: ev?.title || 'Unknown Event',
      eventDate: ev?.date || null,
      participantCount: squad.participants.length,
      exceptionMode: mode,
      exceptionFeeInr,
    };
  });

  // 4. Tiered Campus Entry Calculation
  // A college has up to 20 discounted slots.
  // Quota consumed so far = existingQuotaUsed
  // Available quota remaining for ₹100 tier = Math.max(0, 20 - existingQuotaUsed)
  // Day 2 participants always consume quota slots, even though they cost ₹150 flat.
  const quotaRemaining = Math.max(0, 20 - existingQuotaUsed);

  // Day 1 participants that fit in quota get ₹100, remaining Day 1 participants get ₹150
  const day1DiscountedCount = Math.min(day1Count, quotaRemaining);
  const day1ElevatedCount = Math.max(0, day1Count - day1DiscountedCount);

  const day1AmountInr = day1DiscountedCount * 100 + day1ElevatedCount * 150;
  const day2AmountInr = day2Count * 150;

  const subtotalInr = day1AmountInr + day2AmountInr + exceptionsAmountInr;

  // 5. Enforce ₹1,000 Minimum Floor
  const isFloorApplied = subtotalInr < 1000;
  const finalAmountInr = Math.max(1000, subtotalInr);
  const finalAmountPaise = finalAmountInr * 100;

  return {
    instituteName,
    totalUniqueParticipants,
    existingQuotaUsed,
    newQuotaUsed: existingQuotaUsed + totalUniqueParticipants,
    day1ParticipantsCount: day1Count,
    day2ParticipantsCount: day2Count,
    day1DiscountedCount,
    day1ElevatedCount,
    day1AmountInr,
    day2AmountInr,
    exceptionsAmountInr,
    subtotalInr,
    isFloorApplied,
    finalAmountInr,
    finalAmountPaise,
    squadsBreakdown,
  };
}

/**
 * Creates an Institute Registration record in PENDING state.
 */
export async function createInstituteRegistration(params: {
  instituteName: string;
  leaderName: string;
  leaderEmail: string;
  leaderPhone: string;
  squads: SquadInput[];
  razorpayOrderId?: string;
  paymentMethod?: string;
}): Promise<{ registrationId: string; pricing: PricingCalculationResult }> {
  const pricing = await calculateContingentPricing(params.instituteName, params.squads);
  const allEvents = await getEvents();

  // Create InstituteRegistration
  const instituteReg = await prisma.instituteRegistration.create({
    data: {
      instituteName: params.instituteName.trim(),
      leaderName: params.leaderName.trim(),
      leaderEmail: params.leaderEmail.trim().toLowerCase(),
      leaderPhone: params.leaderPhone.trim(),
      totalAmount: pricing.finalAmountPaise,
      paymentStatus: 'PENDING',
      paymentMethod: params.paymentMethod || 'ONLINE_RAZORPAY',
      razorpayOrderId: params.razorpayOrderId || null,
    },
  });

  // Create participants for all squads
  for (const squad of params.squads) {
    const ev = allEvents.find((e) => e.id === squad.eventId);
    const dateStr = (ev?.date || '').toLowerCase();
    const isDay2 = dateStr.includes('day 2') || dateStr.includes('31');
    const festivalDay = isDay2 ? 'DAY_2' : 'DAY_1';

    for (let i = 0; i < squad.participants.length; i++) {
      const p = squad.participants[i];
      const isLeader = i === 0;

      await prisma.instituteParticipant.create({
        data: {
          registrationId: instituteReg.id,
          instituteName: params.instituteName.trim(),
          eventId: squad.eventId,
          fullName: p.fullName.trim(),
          phone: p.phone.trim().replace(/\s+/g, ''),
          photoUrl: p.photoUrl || null,
          isTeamLeader: isLeader,
          festivalDay,
        },
      });
    }
  }

  return { registrationId: instituteReg.id, pricing };
}

/**
 * Confirms payment for an Institute Registration and generates day-wise QR passes,
 * deduplicating by phone number so an existing participant from the same institute
 * receives their previously issued Day 1 or Day 2 QR code.
 */
export async function confirmInstitutePaymentAndIssuePasses(params: {
  registrationId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
}): Promise<{
  success: boolean;
  registration: any;
  ticketsIssued: Array<{
    fullName: string;
    phone: string;
    festivalDay: string;
    ticketCode: string;
    isReused: boolean;
  }>;
}> {
  const reg = await prisma.instituteRegistration.findUnique({
    where: { id: params.registrationId },
    include: {
      participants: {
        include: { event: true },
      },
    },
  });

  if (!reg) throw new Error('Institute registration not found');

  // Mark as PAID
  await prisma.instituteRegistration.update({
    where: { id: params.registrationId },
    data: {
      paymentStatus: 'PAID',
      razorpayPaymentId: params.razorpayPaymentId,
      ...(params.razorpayOrderId ? { razorpayOrderId: params.razorpayOrderId } : {}),
    },
  });

  const ticketsIssued: Array<{
    fullName: string;
    phone: string;
    festivalDay: string;
    ticketCode: string;
    isReused: boolean;
  }> = [];

  // Group participants by (phone, festivalDay) to generate or reuse tickets
  for (const p of reg.participants) {
    const cleanPhone = p.phone.trim().replace(/\s+/g, '');
    const day = p.festivalDay || 'DAY_1';

    // 1. Check if participant already has a ticket generated in this run
    const existingInRun = ticketsIssued.find((t) => t.phone === cleanPhone && t.festivalDay === day);
    if (existingInRun) {
      await prisma.instituteParticipant.update({
        where: { id: p.id },
        data: { ticketCode: existingInRun.ticketCode },
      });
      continue;
    }

    // 2. Check if a ticket was previously issued for this phone + day under this institute
    const previouslyIssued = await prisma.instituteParticipant.findFirst({
      where: {
        instituteName: { equals: reg.instituteName, mode: 'insensitive' },
        phone: cleanPhone,
        festivalDay: day,
        ticketCode: { not: null },
        registration: { paymentStatus: 'PAID' },
      },
      select: { ticketCode: true, securityHash: true },
    });

    if (previouslyIssued && previouslyIssued.ticketCode) {
      // Reuse existing day ticket
      await prisma.instituteParticipant.update({
        where: { id: p.id },
        data: {
          ticketCode: previouslyIssued.ticketCode,
          securityHash: previouslyIssued.securityHash,
        },
      });

      ticketsIssued.push({
        fullName: p.fullName,
        phone: cleanPhone,
        festivalDay: day,
        ticketCode: previouslyIssued.ticketCode,
        isReused: true,
      });
    } else {
      // Generate fresh day ticket code
      const dayPrefix = day === 'DAY_2' ? 'LV-COL-D2' : 'LV-COL-D1';
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newTicketCode = `${dayPrefix}-${randomSuffix}`;
      const securityHash = generateTicketSecurityHash(newTicketCode, reg.leaderEmail);

      await prisma.instituteParticipant.update({
        where: { id: p.id },
        data: {
          ticketCode: newTicketCode,
          securityHash,
        },
      });

      ticketsIssued.push({
        fullName: p.fullName,
        phone: cleanPhone,
        festivalDay: day,
        ticketCode: newTicketCode,
        isReused: false,
      });
    }
  }

  return {
    success: true,
    registration: reg,
    ticketsIssued,
  };
}

/**
 * Returns all college delegations grouped by:
 * College -> Team Leader -> Events -> Participants
 * For R&I, Super Admin, and Higher Authority views.
 */
export async function getGroupedCollegeDelegations() {
  const registrations = await prisma.instituteRegistration.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      participants: {
        include: {
          event: true,
        },
        orderBy: [{ isTeamLeader: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });

  // Group by college name
  const collegeMap = new Map<string, typeof registrations>();

  registrations.forEach((reg) => {
    const key = reg.instituteName || 'Other Institutions';
    if (!collegeMap.has(key)) {
      collegeMap.set(key, []);
    }
    collegeMap.get(key)!.push(reg);
  });

  const result = Array.from(collegeMap.entries()).map(([instituteName, regs]) => {
    const totalRegistrations = regs.length;
    const paidRegistrations = regs.filter((r) => r.paymentStatus === 'PAID').length;
    const totalRevenuePaise = regs
      .filter((r) => r.paymentStatus === 'PAID')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const uniquePhones = new Set<string>();
    regs.forEach((r) => {
      r.participants.forEach((p) => {
        if (p.phone) uniquePhones.add(p.phone);
      });
    });

    return {
      instituteName,
      totalRegistrations,
      paidRegistrations,
      totalRevenueInr: Math.round(totalRevenuePaise / 100),
      totalUniqueParticipants: uniquePhones.size,
      registrations: regs.map((r) => {
        // Group participants by event
        const eventsMap = new Map<string, { event: any; participants: typeof r.participants }>();

        r.participants.forEach((p) => {
          const evId = p.eventId;
          if (!eventsMap.has(evId)) {
            eventsMap.set(evId, {
              event: p.event,
              participants: [],
            });
          }
          eventsMap.get(evId)!.participants.push(p);
        });

        const eventsList = Array.from(eventsMap.values()).map(({ event, participants }) => ({
          eventId: event?.id,
          eventTitle: event?.title || 'Unknown Event',
          eventCategory: event?.category || 'General',
          eventDate: event?.date || null,
          participantsCount: participants.length,
          participants,
        }));

        return {
          id: r.id,
          leaderName: r.leaderName,
          leaderEmail: r.leaderEmail,
          leaderPhone: r.leaderPhone,
          totalAmountInr: Math.round(r.totalAmount / 100),
          paymentStatus: r.paymentStatus,
          paymentMethod: r.paymentMethod,
          razorpayPaymentId: r.razorpayPaymentId,
          createdAt: r.createdAt,
          events: eventsList,
        };
      }),
    };
  });

  return result.sort((a, b) => a.instituteName.localeCompare(b.instituteName));
}
