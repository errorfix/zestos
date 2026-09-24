import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventById, createPendingRegistration, createFreeRegistration } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';

const checkoutSchema = z
  .object({
    eventId: z.string().optional(),
    eventIds: z.array(z.string()).min(1).optional(),
    leadName: z.string().min(2, 'Lead Attendee Name must be at least 2 characters'),
    leadEmail: z.string().email('A valid college email address is required'),
    dayOption: z.enum(['SINGLE_DAY', 'BOTH_DAYS']).optional(),
    trackUploadUrl: z.string().optional(),
    trackNotes: z.string().optional(),
    teamMembers: z
      .array(
        z.object({
          fullName: z.string().min(2, 'Team member full name is required'),
          rollNumber: z.string().optional(),
        })
      )
      .default([]),
  })
  .refine((data) => data.eventId || (data.eventIds && data.eventIds.length > 0), {
    message: 'Either eventId or eventIds must be provided',
    path: ['eventId'],
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

    const {
      eventId,
      eventIds,
      leadName,
      leadEmail,
      dayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    } = parsed.data;

    // Handle Multi-Event Registration (e.g. Informalz with unlimited selection)
    const targetEventIds = eventIds || (eventId ? [eventId] : []);

    if (targetEventIds.length > 1) {
      const fetchedEvents = await Promise.all(targetEventIds.map((id) => getEventById(id)));
      const validEvents = fetchedEvents.filter((e): e is NonNullable<typeof e> => e !== null);

      if (validEvents.length !== targetEventIds.length) {
        return NextResponse.json(
          { error: 'One or more selected events were not found or are inactive' },
          { status: 404 }
        );
      }

      // Check if all selected events are free (Informalz events)
      const allFree = validEvents.every((e) => e.feeAmount === 0);
      if (!allFree) {
        return NextResponse.json(
          { error: 'Multi-event registration is currently available for 100% Free events (Informalz).' },
          { status: 400 }
        );
      }

      // Create free registrations for all selected events
      const freeRegs = await Promise.all(
        validEvents.map((evt) =>
          createFreeRegistration({
            eventId: evt.id,
            leadName,
            leadEmail,
            teamMembers,
            trackUploadUrl,
            trackNotes,
          })
        )
      );

      const allRegIds = freeRegs.map((r) => r.registrationId);
      const allTickets = freeRegs.flatMap((r) => r.tickets);

      return NextResponse.json({
        success: true,
        registrationId: freeRegs[0].registrationId,
        allRegistrationIds: allRegIds,
        isFree: true,
        amount: 0,
        currency: 'INR',
        eventTitle: validEvents.map((e) => e.title).join(', '),
        tickets: allTickets,
      });
    }

    const singleEventId = targetEventIds[0];

    // 1. Fetch Event and Validate Constraints
    const event = await getEventById(singleEventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found or inactive' }, { status: 404 });
    }

    const totalParticipants = 1 + teamMembers.length;
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

    // 2. Calculate Effective Fee
    let calculatedFeePaise = event.feeAmount;
    if (event.hasDayOptions) {
      if (dayOption === 'BOTH_DAYS') {
        calculatedFeePaise = 25000; // ₹250
      } else {
        calculatedFeePaise = 15000; // ₹150
      }
    }

    // 3. Handle 100% FREE Events (Informalz & Gaming / Esports)
    if (calculatedFeePaise === 0) {
      const freeReg = await createFreeRegistration({
        eventId: event.id,
        leadName,
        leadEmail,
        teamMembers,
        trackUploadUrl,
        trackNotes,
      });

      return NextResponse.json({
        success: true,
        registrationId: freeReg.registrationId,
        isFree: true,
        amount: 0,
        currency: 'INR',
        eventTitle: event.title,
        tickets: freeReg.tickets,
      });
    }

    // 4. Paid Events: Generate Razorpay Order
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;
    const razorpayOrder = await createRazorpayOrder({
      amount: calculatedFeePaise,
      receipt,
      notes: {
        eventId: event.id,
        eventTitle: event.title,
        leadEmail,
        dayOption: dayOption || 'DEFAULT',
      },
    });

    // 5. Create PENDING Registration Record in Database
    const regResult = await createPendingRegistration({
      eventId: event.id,
      leadName,
      leadEmail,
      teamMembers,
      razorpayOrderId: razorpayOrder.id,
      dayOption,
      trackUploadUrl,
      trackNotes,
    });

    return NextResponse.json({
      success: true,
      registrationId: regResult.id,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      eventTitle: event.title,
      isMock: razorpayOrder.isMock,
      isFree: false,
    });
  } catch (error) {
    console.error('Checkout initialization error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error during checkout' },
      { status: 500 }
    );
  }
}
