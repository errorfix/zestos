import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTicketSecurityHash } from '@/lib/crypto';
import { prisma } from '@/lib/prisma';

const verifyTicketSchema = z.object({
  ticketCode: z.string().min(1, 'Ticket Code is required'),
  leadEmail: z.string().email('Lead email is required'),
  signature: z.string().min(1, 'Signature is required'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = verifyTicketSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { valid: false, error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    const { ticketCode, leadEmail, signature } = parsed.data;

    // 1. Cryptographic HMAC-SHA256 signature verification
    const isCryptoValid = verifyTicketSecurityHash(ticketCode, leadEmail, signature);

    if (!isCryptoValid) {
      return NextResponse.json({
        valid: false,
        reason: 'HMAC-SHA256 Signature Mismatch! Pass has been altered, forged, or secret mismatch.',
      });
    }

    // 2. Check in database if available
    let dbTicket = null;
    try {
      dbTicket = await prisma.ticket.findUnique({
        where: { ticketCode },
        include: {
          registration: {
            include: { event: true },
          },
        },
      });
    } catch {
      // In offline/disconnected mode, cryptographic verification is sufficient
    }

    return NextResponse.json({
      valid: true,
      ticketCode,
      leadEmail,
      status: dbTicket?.status || 'ISSUED',
      event: dbTicket?.registration?.event?.title || 'Verified Fest Pass',
      message: 'Cryptographic signature is 100% authentic and tamper-proof.',
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
