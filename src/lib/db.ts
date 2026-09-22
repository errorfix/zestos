import { prisma } from './prisma';
import { SEED_EVENTS, InitialEventData } from './mockEvents';
import { generateTicketCode, generateTicketSecurityHash } from './crypto';

// In-memory fallback cache for registrations and tickets when DB connection is pending
interface LocalRegistration {
  id: string;
  eventId: string;
  leadName: string;
  leadEmail: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: Date;
  teamMembers: Array<{ id: string; fullName: string; rollNumber: string | null }>;
  tickets: Array<{ id: string; ticketCode: string; status: string; securityHash: string; fullName: string }>;
  event?: InitialEventData;
}

import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.festos_cache.json');

function saveToDisk(map: Map<string, LocalRegistration>) {
  try {
    const data = Object.fromEntries(map.entries());
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // Non-fatal
  }
}

function loadFromDisk(): Map<string, LocalRegistration> {
  const map = new Map<string, LocalRegistration>();
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const obj = JSON.parse(raw);
      for (const [k, v] of Object.entries(obj)) {
        map.set(k, v as LocalRegistration);
      }
    }
  } catch (e) {
    // Non-fatal
  }
  return map;
}

declare global {
  // eslint-disable-next-line no-var
  var festosMemoryRegistrations: Map<string, LocalRegistration> | undefined;
}

const memoryRegistrations: Map<string, LocalRegistration> =
  global.festosMemoryRegistrations || loadFromDisk();

if (process.env.NODE_ENV !== 'production') {
  global.festosMemoryRegistrations = memoryRegistrations;
}

export async function getEvents(): Promise<InitialEventData[]> {
  try {
    const dbEvents = await prisma.event.findMany({
      orderBy: { feeAmount: 'asc' },
    });
    if (dbEvents.length > 0) {
      return dbEvents.map((evt) => {
        const seedMatch = SEED_EVENTS.find((s) => s.id === evt.id);
        return {
          id: evt.id,
          title: evt.title,
          category: evt.category,
          feeAmount: evt.feeAmount,
          minTeamSize: evt.minTeamSize,
          maxTeamSize: evt.maxTeamSize,
          description: seedMatch?.description,
          venue: seedMatch?.venue,
          date: seedMatch?.date,
          maxCapacity: seedMatch?.maxCapacity,
        };
      });
    }
  } catch (err) {
    console.warn('[DB] Prisma query failed or DB not connected, using seed events:', (err as Error).message);
  }
  return SEED_EVENTS;
}

export async function getEventById(id: string): Promise<InitialEventData | null> {
  const events = await getEvents();
  return events.find((e) => e.id === id) || null;
}

export async function createPendingRegistration({
  eventId,
  leadName,
  leadEmail,
  teamMembers,
  razorpayOrderId,
}: {
  eventId: string;
  leadName: string;
  leadEmail: string;
  teamMembers: Array<{ fullName: string; rollNumber?: string }>;
  razorpayOrderId: string;
}): Promise<{ id: string }> {
  try {
    const reg = await prisma.registration.create({
      data: {
        eventId,
        leadName,
        leadEmail,
        status: 'PENDING',
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
  } catch (err) {
    console.warn('[DB] Prisma write failed, falling back to local session store:', (err as Error).message);
    const regId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const event = SEED_EVENTS.find((e) => e.id === eventId);
    
    memoryRegistrations.set(regId, {
      id: regId,
      eventId,
      leadName,
      leadEmail,
      status: 'PENDING',
      razorpayOrderId,
      razorpayPaymentId: null,
      createdAt: new Date(),
      teamMembers: teamMembers.map((m, idx) => ({
        id: `tm_${idx}_${Date.now()}`,
        fullName: m.fullName,
        rollNumber: m.rollNumber || null,
      })),
      tickets: [],
      event,
    });

    saveToDisk(memoryRegistrations);

    return { id: regId };
  }
}

export async function fulfillPaymentAndGenerateTickets({
  orderId,
  paymentId,
}: {
  orderId: string;
  paymentId: string;
}): Promise<{ registrationId: string; tickets: Array<{ ticketCode: string; securityHash: string }> }> {
  try {
    // Check if in Prisma DB
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

      // Generate tickets for lead + team members
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

      // Update registration and create tickets in a transaction
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
  } catch (err) {
    console.warn('[DB] Prisma fulfillment failed, checking local memory store:', (err as Error).message);
  }

  // Memory store fallback
  for (const [id, reg] of memoryRegistrations.entries()) {
    if (reg.razorpayOrderId === orderId || id === orderId) {
      reg.status = 'PAID';
      reg.razorpayPaymentId = paymentId;

      if (reg.tickets.length === 0) {
        // Create ticket for lead
        const leadCode = generateTicketCode();
        reg.tickets.push({
          id: `tkt_lead_${Date.now()}`,
          ticketCode: leadCode,
          status: 'ISSUED',
          securityHash: generateTicketSecurityHash(leadCode, reg.leadEmail),
          fullName: reg.leadName,
        });

        // Create tickets for each team member
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

      saveToDisk(memoryRegistrations);

      return {
        registrationId: id,
        tickets: reg.tickets.map((t) => ({ ticketCode: t.ticketCode, securityHash: t.securityHash })),
      };
    }
  }

  throw new Error(`Registration with orderId "${orderId}" not found`);
}

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
              venue: seedMatch?.venue || "Lingaya's Vidyapeeth Campus",
              date: seedMatch?.date || 'March 2026',
              description: seedMatch?.description,
            }
          : null,
        tickets: dbReg.tickets.map((t, idx) => ({
          ...t,
          fullName: idx === 0 ? dbReg.leadName : dbReg.teamMembers[idx - 1]?.fullName || dbReg.leadName,
        })),
      };
    }
  } catch (err) {
    console.warn('[DB] Prisma fetch registration failed, checking memory:', (err as Error).message);
  }

  const mem = memoryRegistrations.get(registrationId);
  if (mem) {
    return {
      ...mem,
      event: mem.event || SEED_EVENTS.find((e) => e.id === mem.eventId) || null,
    };
  }

  return null;
}
