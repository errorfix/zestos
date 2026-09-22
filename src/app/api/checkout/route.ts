import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventById, createPendingRegistration } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';

const checkoutSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  leadName: z.string().min(2, 'Lead Attendee Name must be at least 2 characters'),
  leadEmail: z.string().email('A valid college email address is required'),
  teamMembers: z.array(
    z.object({
      fullName: z.string().min(2, 'Team member full name is required'),
      rollNumber: z.string().optional(),
    })
  ).default([]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = checkoutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form submission', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { eventId, leadName, leadEmail, teamMembers } = parsed.data;

    // 1. Fetch Event and Validate Constraints
    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    const totalParticipants = 1 + teamMembers.length; // Lead + additional members
    if (totalParticipants < event.minTeamSize) {
      return NextResponse.json(
        {
          error: `Event "${event.title}" requires a minimum of ${event.minTeamSize} participant(s). Currently provided: ${totalParticipants}.`,
        },
        { status: 400 }
      );
    }

    if (totalParticipants > event.maxTeamSize) {
      return NextResponse.json(
        {
          error: `Event "${event.title}" allows a maximum of ${event.maxTeamSize} participant(s). Currently provided: ${totalParticipants}.`,
        },
        { status: 400 }
      );
    }

    // 2. Generate Razorpay Order
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;
    const razorpayOrder = await createRazorpayOrder({
      amount: event.feeAmount,
      receipt,
      notes: {
        eventId: event.id,
        eventTitle: event.title,
        leadEmail,
      },
    });

    // 3. Create PENDING Registration Record in Database
    const regResult = await createPendingRegistration({
      eventId: event.id,
      leadName,
      leadEmail,
      teamMembers,
      razorpayOrderId: razorpayOrder.id,
    });

    return NextResponse.json({
      success: true,
      registrationId: regResult.id,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      eventTitle: event.title,
      isMock: razorpayOrder.isMock,
    });
  } catch (error) {
    console.error('Checkout initialization error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error during checkout' },
      { status: 500 }
    );
  }
}
