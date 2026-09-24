import { prisma } from './prisma';
import { SEED_EVENTS, InitialEventData } from './mockEvents';
import { generateTicketCode, generateTicketSecurityHash, verifyTicketSecurityHash } from './crypto';
import fs from 'fs';
import path from 'path';

export interface LocalRegistration {
  id: string;
  eventId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  college?: string | null;
  photoUrl?: string | null;
  payerName?: string | null;
  amount?: number | null;
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string;
  dayOption?: string | null;
  trackUploadUrl?: string | null;
  trackNotes?: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: Date;
  teamMembers: Array<{
    id: string;
    fullName: string;
    rollNumber: string | null;
    phone?: string | null;
    college?: string | null;
    photoUrl?: string | null;
  }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: 'ISSUED' | 'CHECKED_IN';
    securityHash: string;
    fullName: string;
    college?: string | null;
    photoUrl?: string | null;
    checkedInAt?: Date | null;
  }>;
  event?: InitialEventData;
}

interface PersistedCache {
  registrations: Record<string, LocalRegistration>;
  events: Record<string, InitialEventData>;
}

const CACHE_FILE = path.join(process.cwd(), '.festos_cache.json');

function saveToDisk(regs: Map<string, LocalRegistration>, evts: Map<string, InitialEventData>) {
  try {
    const payload: PersistedCache = {
      registrations: Object.fromEntries(regs.entries()),
      events: Object.fromEntries(evts.entries()),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  } catch {
    // Non-fatal
  }
}

function loadFromDisk(): {
  regs: Map<string, LocalRegistration>;
  evts: Map<string, InitialEventData>;
} {
  const regs = new Map<string, LocalRegistration>();
  const evts = new Map<string, InitialEventData>();

  for (const e of SEED_EVENTS) {
    evts.set(e.id, { ...e });
  }

  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.registrations) {
        for (const [k, v] of Object.entries(data.registrations)) {
          regs.set(k, v as LocalRegistration);
        }
      }
      if (data.events) {
        for (const [k, v] of Object.entries(data.events)) {
          evts.set(k, v as InitialEventData);
        }
      }
    }
  } catch {
    // Non-fatal
  }
  return { regs, evts };
}

declare global {
  // eslint-disable-next-line no-var
  var festosMemoryRegistrations: Map<string, LocalRegistration> | undefined;
  // eslint-disable-next-line no-var
  var festosMemoryEvents: Map<string, InitialEventData> | undefined;
}

const initialDisk = loadFromDisk();
const memoryRegistrations: Map<string, LocalRegistration> =
  global.festosMemoryRegistrations || initialDisk.regs;
const memoryEvents: Map<string, InitialEventData> =
  global.festosMemoryEvents || initialDisk.evts;

if (process.env.NODE_ENV !== 'production') {
  global.festosMemoryRegistrations = memoryRegistrations;
  global.festosMemoryEvents = memoryEvents;
}

function syncDisk() {
  saveToDisk(memoryRegistrations, memoryEvents);
}

// ----------------- EVENT OPERATIONS -----------------

export async function getEvents(): Promise<InitialEventData[]> {
  try {
    const dbEvents = await prisma.event.findMany({
      orderBy: { title: 'asc' },
    });
    if (dbEvents.length > 0) {
      return dbEvents.map((evt) => {
        const mem = memoryEvents.get(evt.id);
        return {
          id: evt.id,
          title: evt.title,
          category: evt.category,
          eventType: (evt.eventType as 'Individual' | 'Team') || mem?.eventType || 'Individual',
          feeAmount: evt.feeAmount,
          minTeamSize: evt.minTeamSize,
          maxTeamSize: evt.maxTeamSize,
          prize1: evt.prize1 || undefined,
          prize2: evt.prize2 || undefined,
          description: evt.description || mem?.description,
          rules: evt.rules || mem?.rules,
          venue: evt.venue || mem?.venue,
          date: evt.date || mem?.date,
          status: (evt.status as 'OPEN' | 'CLOSED') || mem?.status || 'OPEN',
          requiresTrackUpload: evt.requiresTrackUpload ?? mem?.requiresTrackUpload ?? false,
          hasDayOptions: evt.hasDayOptions ?? mem?.hasDayOptions ?? false,
          onSpotFeeAmount: evt.onSpotFeeAmount ?? mem?.onSpotFeeAmount,
          maxCapacity: mem?.maxCapacity,
        };
      });
    }
  } catch {
    // Fall back to memory
  }
  return Array.from(memoryEvents.values());
}

export async function getEventById(id: string): Promise<InitialEventData | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) || null;
}

export async function createEvent(data: {
  title: string;
  category: string;
  eventType: 'Individual' | 'Team';
  feeAmount: number; // in paise
  minTeamSize: number;
  maxTeamSize: number;
  prize1?: string;
  prize2?: string;
  description?: string;
  rules?: string;
  venue?: string;
  date?: string;
  status?: 'OPEN' | 'CLOSED';
  requiresTrackUpload?: boolean;
  hasDayOptions?: boolean;
  onSpotFeeAmount?: number;
}): Promise<InitialEventData> {
  const id = `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const newEvent: InitialEventData = {
    id,
    title: data.title,
    category: data.category,
    eventType: data.eventType,
    feeAmount: data.feeAmount,
    minTeamSize: data.minTeamSize,
    maxTeamSize: data.maxTeamSize,
    prize1: data.prize1,
    prize2: data.prize2,
    description: data.description,
    rules: data.rules,
    venue: data.venue,
    date: data.date,
    status: data.status || 'OPEN',
    requiresTrackUpload: data.requiresTrackUpload || false,
    hasDayOptions: data.hasDayOptions || false,
    onSpotFeeAmount: data.onSpotFeeAmount,
  };

  try {
    await prisma.event.create({
      data: {
        id,
        title: newEvent.title,
        category: newEvent.category,
        eventType: newEvent.eventType,
        feeAmount: newEvent.feeAmount,
        minTeamSize: newEvent.minTeamSize,
        maxTeamSize: newEvent.maxTeamSize,
        prize1: newEvent.prize1,
        prize2: newEvent.prize2,
        description: newEvent.description,
        rules: newEvent.rules,
        venue: newEvent.venue,
        date: newEvent.date,
        status: newEvent.status,
        requiresTrackUpload: newEvent.requiresTrackUpload,
        hasDayOptions: newEvent.hasDayOptions,
        onSpotFeeAmount: newEvent.onSpotFeeAmount,
      },
    });
  } catch {
    // Non-fatal
  }

  memoryEvents.set(id, newEvent);
  syncDisk();
  return newEvent;
}

export async function updateEvent(
  id: string,
  data: Partial<InitialEventData>
): Promise<InitialEventData> {
  const existing = await getEventById(id);
  if (!existing) {
    throw new Error(`Event with id "${id}" not found`);
  }

  const updated: InitialEventData = {
    ...existing,
    ...data,
  };

  try {
    await prisma.event.update({
      where: { id },
      data: {
        title: updated.title,
        category: updated.category,
        eventType: updated.eventType,
        feeAmount: updated.feeAmount,
        minTeamSize: updated.minTeamSize,
        maxTeamSize: updated.maxTeamSize,
        prize1: updated.prize1,
        prize2: updated.prize2,
        description: updated.description,
        rules: updated.rules,
        venue: updated.venue,
        date: updated.date,
        status: updated.status,
        requiresTrackUpload: updated.requiresTrackUpload,
        hasDayOptions: updated.hasDayOptions,
        onSpotFeeAmount: updated.onSpotFeeAmount,
      },
    });
  } catch {
    // Non-fatal
  }

  memoryEvents.set(id, updated);
  syncDisk();
  return updated;
}

// ----------------- REGISTRATION OPERATIONS -----------------

export async function createPendingRegistration({
  eventId,
  leadName,
  leadEmail,
  leadPhone,
  college,
  photoUrl,
  payerName,
  amount,
  teamMembers,
  razorpayOrderId,
  dayOption,
  trackUploadUrl,
  trackNotes,
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  college?: string;
  photoUrl?: string;
  payerName?: string;
  amount?: number;
  teamMembers: Array<{
    fullName: string;
    rollNumber?: string;
    phone?: string;
    college?: string;
    photoUrl?: string;
  }>;
  razorpayOrderId: string;
  dayOption?: string;
  trackUploadUrl?: string;
  trackNotes?: string;
}): Promise<{ id: string }> {
  try {
    const reg = await prisma.registration.create({
      data: {
        eventId,
        leadName,
        leadEmail,
        leadPhone: leadPhone || null,
        college: college || null,
        photoUrl: photoUrl || null,
        payerName: payerName || leadName,
        amount: amount || null,
        status: 'PENDING',
        paymentMethod: 'ONLINE_RAZORPAY',
        dayOption: dayOption || null,
        trackUploadUrl: trackUploadUrl || null,
        trackNotes: trackNotes || null,
        razorpayOrderId,
        teamMembers: {
          create: teamMembers.map((m) => ({
            fullName: m.fullName,
            rollNumber: m.rollNumber || null,
            phone: m.phone || null,
            college: m.college || college || null,
            photoUrl: m.photoUrl || null,
          })),
        },
      },
    });
    return { id: reg.id };
  } catch {
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const event = await getEventById(eventId);

    memoryRegistrations.set(regId, {
      id: regId,
      eventId,
      leadName,
      leadEmail,
      leadPhone: leadPhone || null,
      college: college || null,
      photoUrl: photoUrl || null,
      payerName: payerName || leadName,
      amount: amount || null,
      status: 'PENDING',
      paymentMethod: 'ONLINE_RAZORPAY',
      dayOption: dayOption || null,
      trackUploadUrl: trackUploadUrl || null,
      trackNotes: trackNotes || null,
      razorpayOrderId,
      razorpayPaymentId: null,
      createdAt: new Date(),
      teamMembers: teamMembers.map((m, idx) => ({
        id: `tm_${idx}_${Date.now()}`,
        fullName: m.fullName,
        rollNumber: m.rollNumber || null,
        phone: m.phone || null,
        college: m.college || college || null,
        photoUrl: m.photoUrl || null,
      })),
      tickets: [],
      event: event || undefined,
    });

    syncDisk();
    return { id: regId };
  }
}

/**
 * Free Event Direct Registration (for Informalz & Gaming events with ₹0 fee)
 */
export async function createFreeRegistration({
  eventId,
  leadName,
  leadEmail,
  leadPhone,
  college,
  photoUrl,
  teamMembers = [],
  trackUploadUrl,
  trackNotes,
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  college?: string;
  photoUrl?: string;
  teamMembers?: Array<{
    fullName: string;
    rollNumber?: string;
    phone?: string;
    college?: string;
    photoUrl?: string;
  }>;
  trackUploadUrl?: string;
  trackNotes?: string;
}): Promise<{ registrationId: string; tickets: Array<{ ticketCode: string; securityHash: string }> }> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const regId = `reg_free_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const receipt = `free_pass_${Date.now()}`;

  const ticketsToCreate = [
    {
      id: `tkt_lead_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: leadName,
      college: college || "Lingaya's Vidyapeeth",
      photoUrl: photoUrl || null,
    },
    ...teamMembers.map((tm, idx) => ({
      id: `tkt_tm_${idx}_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: tm.fullName,
      college: tm.college || college || "Lingaya's Vidyapeeth",
      photoUrl: tm.photoUrl || photoUrl || null,
    })),
  ];

  for (const t of ticketsToCreate) {
    t.securityHash = generateTicketSecurityHash(t.ticketCode, leadEmail);
  }

  try {
    await prisma.registration.create({
      data: {
        id: regId,
        eventId,
        leadName,
        leadEmail,
        leadPhone: leadPhone || null,
        college: college || null,
        photoUrl: photoUrl || null,
        status: 'PAID',
        paymentMethod: 'FREE_REGISTRATION',
        dayOption: 'FREE_ACCESS',
        trackUploadUrl: trackUploadUrl || null,
        trackNotes: trackNotes || null,
        razorpayPaymentId: receipt,
        teamMembers: {
          create: teamMembers.map((m) => ({
            fullName: m.fullName,
            rollNumber: m.rollNumber || null,
            phone: m.phone || null,
            college: m.college || college || null,
            photoUrl: m.photoUrl || null,
          })),
        },
        tickets: {
          create: ticketsToCreate.map((t) => ({
            ticketCode: t.ticketCode,
            status: 'ISSUED',
            securityHash: t.securityHash,
            fullName: t.fullName,
            college: t.college,
            photoUrl: t.photoUrl,
          })),
        },
      },
    });
  } catch {
    // Non-fatal
  }

  memoryRegistrations.set(regId, {
    id: regId,
    eventId,
    leadName,
    leadEmail,
    leadPhone: leadPhone || null,
    college: college || null,
    photoUrl: photoUrl || null,
    status: 'PAID',
    paymentMethod: 'FREE_REGISTRATION',
    dayOption: 'FREE_ACCESS',
    trackUploadUrl: trackUploadUrl || null,
    trackNotes: trackNotes || null,
    razorpayOrderId: null,
    razorpayPaymentId: receipt,
    createdAt: new Date(),
    teamMembers: teamMembers.map((m, idx) => ({
      id: `tm_${idx}_${Date.now()}`,
      fullName: m.fullName,
      rollNumber: m.rollNumber || null,
      phone: m.phone || null,
      college: m.college || college || null,
      photoUrl: m.photoUrl || null,
    })),
    tickets: ticketsToCreate,
    event,
  });

  syncDisk();

  return {
    registrationId: regId,
    tickets: ticketsToCreate.map((t) => ({
      ticketCode: t.ticketCode,
      securityHash: t.securityHash,
    })),
  };
}

/**
 * On-Spot Fast-Track Registration for committee desks at event entrances
 */
export async function createOnSpotRegistration({
  eventId,
  leadName,
  leadEmail,
  leadPhone,
  college,
  photoUrl,
  paymentMethod,
  dayOption,
  razorpayPaymentId,
  payerName,
  amount,
  trackUploadUrl,
  trackNotes,
  teamMembers = [],
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  college?: string;
  photoUrl?: string;
  paymentMethod: string;
  dayOption?: string;
  razorpayPaymentId?: string;
  payerName?: string;
  amount?: number;
  trackUploadUrl?: string;
  trackNotes?: string;
  teamMembers?: Array<{
    fullName: string;
    rollNumber?: string;
    phone?: string;
    college?: string;
    photoUrl?: string;
  }>;
}): Promise<{ registrationId: string; tickets: Array<{ ticketCode: string; securityHash: string }> }> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const regId = `reg_spot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const receipt = razorpayPaymentId || `spot_rcpt_${Date.now()}`;
  const effectiveAmount =
    amount !== undefined
      ? amount
      : event.hasDayOptions
      ? dayOption === 'BOTH_DAYS'
        ? 25000
        : 15000
      : (event.onSpotFeeAmount != null ? event.onSpotFeeAmount : event.feeAmount);

  const ticketsToCreate = [
    {
      id: `tkt_lead_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: leadName,
      college: college || "Lingaya's Vidyapeeth",
      photoUrl: photoUrl || null,
    },
    ...teamMembers.map((tm, idx) => ({
      id: `tkt_tm_${idx}_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: tm.fullName,
      college: tm.college || college || "Lingaya's Vidyapeeth",
      photoUrl: tm.photoUrl || photoUrl || null,
    })),
  ];

  for (const t of ticketsToCreate) {
    t.securityHash = generateTicketSecurityHash(t.ticketCode, leadEmail);
  }

  try {
    await prisma.registration.create({
      data: {
        id: regId,
        eventId,
        leadName,
        leadEmail,
        leadPhone: leadPhone || null,
        college: college || null,
        photoUrl: photoUrl || null,
        payerName: payerName || leadName,
        amount: effectiveAmount,
        status: 'PAID',
        paymentMethod,
        dayOption: dayOption || null,
        trackUploadUrl: trackUploadUrl || null,
        trackNotes: trackNotes || null,
        razorpayPaymentId: receipt,
        teamMembers: {
          create: teamMembers.map((m) => ({
            fullName: m.fullName,
            rollNumber: m.rollNumber || null,
            phone: m.phone || null,
            college: m.college || college || null,
            photoUrl: m.photoUrl || null,
          })),
        },
        tickets: {
          create: ticketsToCreate.map((t) => ({
            ticketCode: t.ticketCode,
            status: 'ISSUED',
            securityHash: t.securityHash,
            fullName: t.fullName,
            college: t.college,
            photoUrl: t.photoUrl,
          })),
        },
      },
    });
  } catch {
    // Non-fatal
  }

  memoryRegistrations.set(regId, {
    id: regId,
    eventId,
    leadName,
    leadEmail,
    leadPhone: leadPhone || null,
    college: college || null,
    photoUrl: photoUrl || null,
    payerName: payerName || leadName,
    amount: effectiveAmount,
    status: 'PAID',
    paymentMethod,
    dayOption: dayOption || null,
    trackUploadUrl: trackUploadUrl || null,
    trackNotes: trackNotes || null,
    razorpayOrderId: null,
    razorpayPaymentId: receipt,
    createdAt: new Date(),
    teamMembers: teamMembers.map((m, idx) => ({
      id: `tm_${idx}_${Date.now()}`,
      fullName: m.fullName,
      rollNumber: m.rollNumber || null,
      phone: m.phone || null,
      college: m.college || college || null,
      photoUrl: m.photoUrl || null,
    })),
    tickets: ticketsToCreate,
    event,
  });

  syncDisk();

  return {
    registrationId: regId,
    tickets: ticketsToCreate.map((t) => ({
      ticketCode: t.ticketCode,
      securityHash: t.securityHash,
    })),
  };
}

export async function fulfillPaymentAndGenerateTickets({
  orderId,
  paymentId,
  payerName,
}: {
  orderId: string;
  paymentId: string;
  payerName?: string;
}): Promise<{ registrationId: string; tickets: Array<{ ticketCode: string; securityHash: string }> }> {
  try {
    const existing = await prisma.registration.findFirst({
      where: { razorpayOrderId: orderId },
      include: { teamMembers: true, event: true },
    });

    if (existing) {
      if (existing.status === 'PAID') {
        const existingTickets = await prisma.ticket.findMany({
          where: { registrationId: existing.id },
        });
        return {
          registrationId: existing.id,
          tickets: existingTickets.map((t) => ({ ticketCode: t.ticketCode, securityHash: t.securityHash })),
        };
      }

      const ticketsToCreate = [
        {
          ticketCode: generateTicketCode(),
          securityHash: generateTicketSecurityHash(generateTicketCode(), existing.leadEmail),
          fullName: existing.leadName,
          college: existing.college,
          photoUrl: existing.photoUrl,
        },
        ...existing.teamMembers.map((tm) => {
          const code = generateTicketCode();
          return {
            ticketCode: code,
            securityHash: generateTicketSecurityHash(code, existing.leadEmail),
            fullName: tm.fullName,
            college: tm.college || existing.college,
            photoUrl: tm.photoUrl || existing.photoUrl,
          };
        }),
      ];

      await prisma.$transaction([
        prisma.registration.update({
          where: { id: existing.id },
          data: {
            status: 'PAID',
            razorpayPaymentId: paymentId,
            ...(payerName ? { payerName } : {}),
          },
        }),
        ...ticketsToCreate.map((t) =>
          prisma.ticket.create({
            data: {
              ticketCode: t.ticketCode,
              registrationId: existing.id,
              status: 'ISSUED',
              securityHash: t.securityHash,
              fullName: t.fullName,
              college: t.college,
              photoUrl: t.photoUrl,
            },
          })
        ),
      ]);

      return {
        registrationId: existing.id,
        tickets: ticketsToCreate.map((t) => ({ ticketCode: t.ticketCode, securityHash: t.securityHash })),
      };
    }
  } catch {
    // Check memory store
  }

  for (const [id, reg] of memoryRegistrations.entries()) {
    if (reg.razorpayOrderId === orderId || id === orderId) {
      reg.status = 'PAID';
      reg.razorpayPaymentId = paymentId;
      if (payerName) reg.payerName = payerName;

      if (reg.tickets.length === 0) {
        const leadCode = generateTicketCode();
        reg.tickets.push({
          id: `tkt_lead_${Date.now()}`,
          ticketCode: leadCode,
          status: 'ISSUED',
          securityHash: generateTicketSecurityHash(leadCode, reg.leadEmail),
          fullName: reg.leadName,
          college: reg.college,
          photoUrl: reg.photoUrl,
        });

        for (const tm of reg.teamMembers) {
          const tmCode = generateTicketCode();
          reg.tickets.push({
            id: `tkt_${tm.id}`,
            ticketCode: tmCode,
            status: 'ISSUED',
            securityHash: generateTicketSecurityHash(tmCode, reg.leadEmail),
            fullName: tm.fullName,
            college: tm.college || reg.college,
            photoUrl: tm.photoUrl || reg.photoUrl,
          });
        }
      }

      syncDisk();

      return {
        registrationId: id,
        tickets: reg.tickets.map((t) => ({ ticketCode: t.ticketCode, securityHash: t.securityHash })),
      };
    }
  }

  throw new Error(`Registration with orderId "${orderId}" not found`);
}

// ----------------- CHECK-IN OPERATIONS -----------------

export async function checkInTicket({
  ticketCode,
  signature,
  action = 'CHECK_IN',
}: {
  ticketCode: string;
  signature?: string;
  action?: 'LOOKUP' | 'CHECK_IN' | 'WAITLIST' | 'RESET';
}): Promise<{
  success: boolean;
  ticketCode: string;
  attendeeName: string;
  college?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  eventTitle: string;
  eventCategory?: string | null;
  dayOption?: string | null;
  status: 'ISSUED' | 'CHECKED_IN' | 'WAITLIST' | 'ALREADY_CHECKED_IN' | 'INVALID';
  checkedInAt?: Date | string | null;
  message: string;
}> {
  const normalizedCode = ticketCode.trim().toUpperCase();

  try {
    const dbTicket = await prisma.ticket.findUnique({
      where: { ticketCode: normalizedCode },
      include: {
        registration: {
          include: { event: true, teamMembers: true },
        },
      },
    });

    if (dbTicket) {
      const reg = dbTicket.registration;
      const attendeeName = dbTicket.fullName || reg.leadName;
      const college = dbTicket.college || reg.college || null;
      const photoUrl = dbTicket.photoUrl || reg.photoUrl || null;
      const phone = reg.leadPhone || null;
      const eventTitle = reg.event.title;
      const eventCategory = reg.event.category;
      const dayOption = reg.dayOption;

      if (signature) {
        const isValidSig = verifyTicketSecurityHash(
          dbTicket.ticketCode,
          reg.leadEmail,
          signature
        );
        if (!isValidSig) {
          return {
            success: false,
            ticketCode: normalizedCode,
            attendeeName,
            college,
            phone,
            photoUrl,
            eventTitle,
            eventCategory,
            dayOption,
            status: 'INVALID',
            checkedInAt: new Date(),
            message: 'HMAC signature verification failed. Forged or corrupted pass.',
          };
        }
      }

      // Handle LOOKUP action (non-mutating inspect)
      if (action === 'LOOKUP') {
        const currentStatus = (dbTicket.status as 'ISSUED' | 'CHECKED_IN' | 'WAITLIST') || 'ISSUED';
        const msg =
          currentStatus === 'CHECKED_IN'
            ? `Pass was already checked in on ${new Date(dbTicket.checkedInAt || Date.now()).toLocaleTimeString()}.`
            : currentStatus === 'WAITLIST'
            ? 'Attendee is currently on WAITLIST (On Hold).'
            : 'Valid Pass Verified: Ready for Admission.';

        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: currentStatus,
          checkedInAt: dbTicket.checkedInAt,
          message: msg,
        };
      }

      // Handle WAITLIST action
      if (action === 'WAITLIST') {
        await prisma.ticket.update({
          where: { id: dbTicket.id },
          data: { status: 'WAITLIST' },
        });

        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'WAITLIST',
          checkedInAt: dbTicket.checkedInAt,
          message: 'Attendee placed on WAITLIST (On Hold).',
        };
      }

      // Handle RESET action
      if (action === 'RESET') {
        await prisma.ticket.update({
          where: { id: dbTicket.id },
          data: { status: 'ISSUED', checkedInAt: null },
        });

        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'ISSUED',
          checkedInAt: null,
          message: 'Ticket status reset to ISSUED.',
        };
      }

      // Default: CHECK_IN action
      if (dbTicket.status === 'CHECKED_IN') {
        return {
          success: false,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'ALREADY_CHECKED_IN',
          checkedInAt: dbTicket.checkedInAt || new Date(),
          message: `Replay Warning: Pass already scanned on ${new Date(
            dbTicket.checkedInAt || Date.now()
          ).toLocaleTimeString()}.`,
        };
      }

      const now = new Date();
      await prisma.ticket.update({
        where: { id: dbTicket.id },
        data: {
          status: 'CHECKED_IN',
          checkedInAt: now,
        },
      });

      return {
        success: true,
        ticketCode: normalizedCode,
        attendeeName,
        college,
        phone,
        photoUrl,
        eventTitle,
        eventCategory,
        dayOption,
        status: 'CHECKED_IN',
        checkedInAt: now,
        message: 'Access Granted: Attendee checked in & admitted.',
      };
    }
  } catch {
    // Fallback to memory
  }

  for (const reg of memoryRegistrations.values()) {
    const ticket = reg.tickets.find((t) => t.ticketCode === normalizedCode);
    if (ticket) {
      const attendeeName = ticket.fullName || reg.leadName;
      const college = ticket.college || reg.college || null;
      const photoUrl = ticket.photoUrl || reg.photoUrl || null;
      const phone = reg.leadPhone || null;
      const eventTitle = reg.event?.title || 'Campus Event';
      const eventCategory = reg.event?.category || 'General';
      const dayOption = reg.dayOption;

      if (signature) {
        const isValidSig = verifyTicketSecurityHash(ticket.ticketCode, reg.leadEmail, signature);
        if (!isValidSig) {
          return {
            success: false,
            ticketCode: normalizedCode,
            attendeeName,
            college,
            phone,
            photoUrl,
            eventTitle,
            eventCategory,
            dayOption,
            status: 'INVALID',
            checkedInAt: new Date(),
            message: 'HMAC signature verification failed. Pass is forged or invalid.',
          };
        }
      }

      if (action === 'LOOKUP') {
        const currentStatus = (ticket.status as 'ISSUED' | 'CHECKED_IN' | 'WAITLIST') || 'ISSUED';
        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: currentStatus,
          checkedInAt: ticket.checkedInAt,
          message:
            currentStatus === 'CHECKED_IN'
              ? `Pass was already checked in on ${new Date(ticket.checkedInAt || Date.now()).toLocaleTimeString()}.`
              : currentStatus === 'WAITLIST'
              ? 'Attendee is currently on WAITLIST (On Hold).'
              : 'Valid Pass Verified: Ready for Admission.',
        };
      }

      if (action === 'WAITLIST') {
        ticket.status = 'WAITLIST' as any;
        syncDisk();
        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'WAITLIST',
          checkedInAt: ticket.checkedInAt,
          message: 'Attendee placed on WAITLIST (On Hold).',
        };
      }

      if (action === 'RESET') {
        ticket.status = 'ISSUED';
        ticket.checkedInAt = undefined;
        syncDisk();
        return {
          success: true,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'ISSUED',
          checkedInAt: null,
          message: 'Ticket status reset to ISSUED.',
        };
      }

      if (ticket.status === 'CHECKED_IN') {
        return {
          success: false,
          ticketCode: normalizedCode,
          attendeeName,
          college,
          phone,
          photoUrl,
          eventTitle,
          eventCategory,
          dayOption,
          status: 'ALREADY_CHECKED_IN',
          checkedInAt: ticket.checkedInAt || new Date(),
          message: `Replay Warning: Pass already scanned on ${new Date(
            ticket.checkedInAt || Date.now()
          ).toLocaleTimeString()}.`,
        };
      }

      const now = new Date();
      ticket.status = 'CHECKED_IN';
      ticket.checkedInAt = now;
      syncDisk();

      return {
        success: true,
        ticketCode: normalizedCode,
        attendeeName,
        college,
        phone,
        photoUrl,
        eventTitle,
        eventCategory,
        dayOption,
        status: 'CHECKED_IN',
        checkedInAt: now,
        message: 'Access Granted: Ticket successfully verified & stamped.',
      };
    }
  }

  return {
    success: false,
    ticketCode: normalizedCode,
    attendeeName: 'Unknown',
    eventTitle: 'Unknown Event',
    status: 'INVALID',
    checkedInAt: new Date(),
    message: 'Invalid Pass: Ticket code not recognized in system database.',
  };
}

// ----------------- ADMIN & REGISTRY OPERATIONS -----------------

export async function getRegistrationDetails(registrationId: string) {
  try {
    const dbReg = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        teamMembers: true,
        tickets: true,
      },
    });
    if (dbReg) {
      const seedMatch = SEED_EVENTS.find((s) => s.id === dbReg.eventId);
      return {
        ...dbReg,
        event: dbReg.event
          ? {
              ...dbReg.event,
              eventType: (dbReg.event.eventType as 'Individual' | 'Team') || 'Individual',
              status: (dbReg.event.status as 'OPEN' | 'CLOSED') || 'OPEN',
              venue: dbReg.event.venue || seedMatch?.venue || "Lingaya's Vidyapeeth Campus",
              date: dbReg.event.date || seedMatch?.date || 'Day 1 & Day 2',
              description: dbReg.event.description || seedMatch?.description,
            }
          : null,
        tickets: dbReg.tickets.map((t, idx) => ({
          ...t,
          fullName: t.fullName || (idx === 0 ? dbReg.leadName : dbReg.teamMembers[idx - 1]?.fullName || dbReg.leadName),
          college: t.college || (idx === 0 ? dbReg.college : dbReg.teamMembers[idx - 1]?.college || dbReg.college),
          photoUrl: t.photoUrl || (idx === 0 ? dbReg.photoUrl : dbReg.teamMembers[idx - 1]?.photoUrl || dbReg.photoUrl),
        })),
      };
    }
  } catch {
    // Check memory store
  }

  const mem = memoryRegistrations.get(registrationId);
  if (mem) {
    return {
      ...mem,
      event: mem.event || (await getEventById(mem.eventId)),
    };
  }

  return null;
}

export async function getAllRegistrations() {
  try {
    const dbRegs = await prisma.registration.findMany({
      include: {
        event: true,
        teamMembers: true,
        tickets: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    if (dbRegs.length > 0) {
      return dbRegs;
    }
  } catch {
    // Fall back to memory
  }

  return Array.from(memoryRegistrations.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getAdminMetrics(options?: {
  category?: string;
  excludeCategory?: string;
}) {
  const allRegistrations = await getAllRegistrations();
  let events = await getEvents();

  if (options?.category) {
    const cat = options.category.toLowerCase();
    events = events.filter((e) => e.category.toLowerCase() === cat);
  }

  if (options?.excludeCategory) {
    const excl = options.excludeCategory.toLowerCase();
    events = events.filter((e) => e.category.toLowerCase() !== excl);
  }

  const validEventIds = new Set(events.map((e) => e.id));
  const registrations = (options?.category || options?.excludeCategory)
    ? allRegistrations.filter((r) => validEventIds.has(r.eventId))
    : allRegistrations;

  let totalRevenuePaise = 0;
  let totalIssuedTickets = 0;
  let totalCheckedInTickets = 0;
  const registrationsByEvent: Record<string, number> = {};

  for (const reg of registrations) {
    if (reg.status === 'PAID') {
      const evt = events.find((e) => e.id === reg.eventId) || reg.event;
      let effectiveFee = evt?.feeAmount || 0;
      if (reg.dayOption === 'BOTH_DAYS') {
        effectiveFee = 25000; // ₹250
      }
      totalRevenuePaise += effectiveFee;
      registrationsByEvent[reg.eventId] = (registrationsByEvent[reg.eventId] || 0) + 1;
    }
    for (const t of reg.tickets) {
      totalIssuedTickets++;
      if (t.status === 'CHECKED_IN') {
        totalCheckedInTickets++;
      }
    }
  }

  return {
    totalRegistrations: registrations.length,
    paidRegistrations: registrations.filter((r) => r.status === 'PAID').length,
    totalRevenueInr: totalRevenuePaise / 100,
    totalIssuedTickets,
    totalCheckedInTickets,
    checkInPercentage:
      totalIssuedTickets > 0 ? Math.round((totalCheckedInTickets / totalIssuedTickets) * 100) : 0,
    totalEvents: events.length,
    registrationsByEvent,
  };
}

// ----------------- STAGE COMMITTEE OPERATIONS -----------------

export async function updateRegistrationTrack(
  registrationId: string,
  data: { trackUploadUrl?: string | null; trackNotes?: string | null }
): Promise<LocalRegistration | null> {
  const cleanUrl = data.trackUploadUrl ? data.trackUploadUrl.trim() : null;
  const cleanNotes = data.trackNotes ? data.trackNotes.trim() : null;

  try {
    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        trackUploadUrl: cleanUrl,
        trackNotes: cleanNotes,
      },
      include: {
        event: true,
        teamMembers: true,
        tickets: true,
      },
    });

    if (updated) {
      const mem = memoryRegistrations.get(registrationId);
      if (mem) {
        mem.trackUploadUrl = cleanUrl;
        mem.trackNotes = cleanNotes;
        syncDisk();
      }
      return {
        ...updated,
        teamMembers: updated.teamMembers || [],
        tickets: updated.tickets.map((t, idx) => ({
          ...t,
          fullName: idx === 0 ? updated.leadName : updated.teamMembers[idx - 1]?.fullName || updated.leadName,
        })),
      } as unknown as LocalRegistration;
    }
  } catch {
    // Fall back to memory
  }

  const mem = memoryRegistrations.get(registrationId);
  if (mem) {
    mem.trackUploadUrl = cleanUrl;
    mem.trackNotes = cleanNotes;
    syncDisk();
    return mem;
  }

  return null;
}

export async function getStageMetrics() {
  const allRegistrations = await getAllRegistrations();
  const allEvents = await getEvents();

  const trackEvents = allEvents.filter((e) => e.requiresTrackUpload === true);
  const trackEventIds = new Set(trackEvents.map((e) => e.id));

  const trackRegistrations = allRegistrations.filter((r) => trackEventIds.has(r.eventId));

  let tracksAttached = 0;
  let tracksMissing = 0;
  let checkedInPerformers = 0;
  let totalPerformers = 0;

  for (const reg of trackRegistrations) {
    if (reg.trackUploadUrl && reg.trackUploadUrl.trim() !== '') {
      tracksAttached++;
    } else {
      tracksMissing++;
    }

    for (const t of reg.tickets) {
      totalPerformers++;
      if (t.status === 'CHECKED_IN') {
        checkedInPerformers++;
      }
    }
  }

  return {
    totalTrackRegistrations: trackRegistrations.length,
    tracksAttached,
    tracksMissing,
    totalTrackEvents: trackEvents.length,
    totalPerformers,
    checkedInPerformers,
  };
}
