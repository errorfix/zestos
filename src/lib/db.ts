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
  status: 'PENDING' | 'PAID' | 'FAILED';
  paymentMethod: string;
  dayOption?: string | null;
  trackUploadUrl?: string | null;
  trackNotes?: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: Date;
  teamMembers: Array<{ id: string; fullName: string; rollNumber: string | null }>;
  tickets: Array<{
    id: string;
    ticketCode: string;
    status: 'ISSUED' | 'CHECKED_IN';
    securityHash: string;
    fullName: string;
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
  teamMembers,
  razorpayOrderId,
  dayOption,
  trackUploadUrl,
  trackNotes,
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
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
  teamMembers,
  trackUploadUrl,
  trackNotes,
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
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
    },
    ...teamMembers.map((tm, idx) => ({
      id: `tkt_tm_${idx}_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: tm.fullName,
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
          })),
        },
        tickets: {
          create: ticketsToCreate.map((t) => ({
            ticketCode: t.ticketCode,
            status: 'ISSUED',
            securityHash: t.securityHash,
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
  paymentMethod,
  dayOption,
  trackUploadUrl,
  trackNotes,
  teamMembers = [],
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  paymentMethod: string;
  dayOption?: string;
  trackUploadUrl?: string;
  trackNotes?: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
}): Promise<{ registrationId: string; tickets: Array<{ ticketCode: string; securityHash: string }> }> {
  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const regId = `reg_spot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const receipt = `spot_rcpt_${Date.now()}`;

  const ticketsToCreate = [
    {
      id: `tkt_lead_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: leadName,
    },
    ...teamMembers.map((tm, idx) => ({
      id: `tkt_tm_${idx}_${Date.now()}`,
      ticketCode: generateTicketCode(),
      status: 'ISSUED' as const,
      securityHash: '',
      fullName: tm.fullName,
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
          })),
        },
        tickets: {
          create: ticketsToCreate.map((t) => ({
            ticketCode: t.ticketCode,
            status: 'ISSUED',
            securityHash: t.securityHash,
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
}: {
  orderId: string;
  paymentId: string;
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
        },
        ...existing.teamMembers.map((tm) => {
          const code = generateTicketCode();
          return {
            ticketCode: code,
            securityHash: generateTicketSecurityHash(code, existing.leadEmail),
            fullName: tm.fullName,
          };
        }),
      ];

      await prisma.$transaction([
        prisma.registration.update({
          where: { id: existing.id },
          data: {
            status: 'PAID',
            razorpayPaymentId: paymentId,
          },
        }),
        ...ticketsToCreate.map((t) =>
          prisma.ticket.create({
            data: {
              ticketCode: t.ticketCode,
              registrationId: existing.id,
              status: 'ISSUED',
              securityHash: t.securityHash,
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

      if (reg.tickets.length === 0) {
        const leadCode = generateTicketCode();
        reg.tickets.push({
          id: `tkt_lead_${Date.now()}`,
          ticketCode: leadCode,
          status: 'ISSUED',
          securityHash: generateTicketSecurityHash(leadCode, reg.leadEmail),
          fullName: reg.leadName,
        });

        for (const tm of reg.teamMembers) {
          const tmCode = generateTicketCode();
          reg.tickets.push({
            id: `tkt_${tm.id}`,
            ticketCode: tmCode,
            status: 'ISSUED',
            securityHash: generateTicketSecurityHash(tmCode, reg.leadEmail),
            fullName: tm.fullName,
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
}: {
  ticketCode: string;
  signature?: string;
}): Promise<{
  success: boolean;
  ticketCode: string;
  attendeeName: string;
  eventTitle: string;
  status: 'CHECKED_IN' | 'ALREADY_CHECKED_IN' | 'INVALID';
  checkedInAt: Date;
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
      if (signature) {
        const isValidSig = verifyTicketSecurityHash(
          dbTicket.ticketCode,
          dbTicket.registration.leadEmail,
          signature
        );
        if (!isValidSig) {
          return {
            success: false,
            ticketCode: normalizedCode,
            attendeeName: dbTicket.registration.leadName,
            eventTitle: dbTicket.registration.event.title,
            status: 'INVALID',
            checkedInAt: new Date(),
            message: 'HMAC signature verification failed. Forged or corrupted pass.',
          };
        }
      }

      if (dbTicket.status === 'CHECKED_IN') {
        return {
          success: false,
          ticketCode: normalizedCode,
          attendeeName: dbTicket.registration.leadName,
          eventTitle: dbTicket.registration.event.title,
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
        attendeeName: dbTicket.registration.leadName,
        eventTitle: dbTicket.registration.event.title,
        status: 'CHECKED_IN',
        checkedInAt: now,
        message: 'Access Granted: Ticket authentic and checked in.',
      };
    }
  } catch {
    // Non-fatal
  }

  for (const reg of memoryRegistrations.values()) {
    const ticket = reg.tickets.find((t) => t.ticketCode === normalizedCode);
    if (ticket) {
      if (signature) {
        const isValidSig = verifyTicketSecurityHash(ticket.ticketCode, reg.leadEmail, signature);
        if (!isValidSig) {
          return {
            success: false,
            ticketCode: normalizedCode,
            attendeeName: ticket.fullName,
            eventTitle: reg.event?.title || 'Campus Event',
            status: 'INVALID',
            checkedInAt: new Date(),
            message: 'HMAC signature verification failed. Pass is forged or invalid.',
          };
        }
      }

      if (ticket.status === 'CHECKED_IN') {
        return {
          success: false,
          ticketCode: normalizedCode,
          attendeeName: ticket.fullName,
          eventTitle: reg.event?.title || 'Campus Event',
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
        attendeeName: ticket.fullName,
        eventTitle: reg.event?.title || 'Campus Event',
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
    message: `Ticket code "${normalizedCode}" not found in registration database.`,
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
          fullName: idx === 0 ? dbReg.leadName : dbReg.teamMembers[idx - 1]?.fullName || dbReg.leadName,
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

export async function getAdminMetrics() {
  const registrations = await getAllRegistrations();
  const events = await getEvents();

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
