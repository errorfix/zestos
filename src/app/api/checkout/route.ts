import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEventById, createPendingRegistration, createFreeRegistration } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';
import { sendPassEmail } from '@/lib/email';

const checkoutSchema = z
  .object({
    eventId: z.string().optional(),
    eventIds: z.array(z.string()).min(1).optional(),
    leadName: z.string().min(2, 'Full Name is required'),
    leadPhone: z.string().min(10, 'A valid 10-digit contact number is required'),
    leadEmail: z.string().email('A valid college email address is required'),
    college: z.string().min(2, 'College / Institute Name is required'),
    photoUrl: z.string().min(10, 'Participant Photo is required'),
    dayOption: z.string().optional(),
    trackUploadUrl: z.string().optional(),
    trackNotes: z.string().optional(),
    teamMembers: z
      .array(
        z.object({
          fullName: z.string().min(2, 'Team member full name is required'),
          rollNumber: z.string().optional(),
          phone: z.string().optional(),
          college: z.string().optional(),
          photoUrl: z.string().optional(),
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
      console.error('Validation error details:', JSON.stringify(parsed.error.format(), null, 2));
      return NextResponse.json(
        { error: 'Invalid form submission', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      eventId,
      eventIds,
      leadName,
      leadPhone,
      leadEmail,
      college,
      photoUrl,
      dayOption: incomingDayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    } = parsed.data;

    const targetEventIds = eventIds || (eventId ? [eventId] : []);
    const fetchedEvents = await Promise.all(targetEventIds.map((id) => getEventById(id)));
    const validEvents = fetchedEvents.filter((e): e is NonNullable<typeof e> => e !== null);

    if (validEvents.length !== targetEventIds.length) {
      return NextResponse.json(
        { error: 'One or more selected events were not found or are inactive' },
        { status: 404 }
      );
    }

    const isInformalzFlow = validEvents.some((e) => e.category.toLowerCase() === 'informalz');

    let calculatedFeePaise = 0;
    let resolvedDayOption = incomingDayOption || 'DAY_1';
    let combinedEventTitle = validEvents.map((e) => e.title).join(', ');

    if (isInformalzFlow) {
      // ─────────────────────────────────────────────────────────────────────────
      // 🎯 INFORMALZ DAY PASS PRICING MODEL
      // Selecting 1 or multiple events on Day 1 = ₹150
      // Selecting 1 or multiple events on Day 2 = ₹150
      // Selecting events spanning BOTH Day 1 and Day 2 = ₹250
      // ─────────────────────────────────────────────────────────────────────────
      let hasDay1 = false;
      let hasDay2 = false;

      for (const evt of validEvents) {
        const dateStr = (evt.date || '').toLowerCase();
        if (dateStr.includes('day 1') || dateStr.includes('1')) {
          hasDay1 = true;
        }
        if (dateStr.includes('day 2') || dateStr.includes('2')) {
          hasDay2 = true;
        }
        if (!dateStr.includes('day 1') && !dateStr.includes('day 2')) {
          // Default flexible events to Day 1 unless explicitly Day 2
          hasDay1 = true;
        }
      }

      if (incomingDayOption === 'BOTH_DAYS' || (hasDay1 && hasDay2)) {
        calculatedFeePaise = 25000; // ₹250 for Both Days Pass
        resolvedDayOption = 'BOTH_DAYS';
        combinedEventTitle = `Informalz All-Access Both Days Pass (${validEvents.length} Games)`;
      } else if (incomingDayOption === 'DAY_2' || hasDay2) {
        calculatedFeePaise = 15000; // ₹150 for Day 2 Pass
        resolvedDayOption = 'DAY_2';
        combinedEventTitle = `Informalz Day 2 Pass (${validEvents.length} Games)`;
      } else {
        calculatedFeePaise = 15000; // ₹150 for Day 1 Pass
        resolvedDayOption = 'DAY_1';
        combinedEventTitle = `Informalz Day 1 Pass (${validEvents.length} Games)`;
      }
    } else {
      // ─────────────────────────────────────────────────────────────────────────
      // 🎭 COMPETITIVE EVENTS (Single Event Arena with direct designated fee)
      // ─────────────────────────────────────────────────────────────────────────
      const singleEvent = validEvents[0];
      calculatedFeePaise = singleEvent.feeAmount;
      resolvedDayOption = singleEvent.date?.includes('Both')
        ? 'BOTH_DAYS'
        : singleEvent.date?.includes('2')
        ? 'DAY_2'
        : 'DAY_1';
      combinedEventTitle = singleEvent.title;

      // Validate team constraints
      const totalParticipants = 1 + teamMembers.length;
      if (totalParticipants < singleEvent.minTeamSize) {
        return NextResponse.json(
          {
            error: `Event "${singleEvent.title}" requires a minimum of ${singleEvent.minTeamSize} participant(s). Currently provided: ${totalParticipants}.`,
          },
          { status: 400 }
        );
      }
      if (totalParticipants > singleEvent.maxTeamSize) {
        return NextResponse.json(
          {
            error: `Event "${singleEvent.title}" allows a maximum of ${singleEvent.maxTeamSize} participant(s). Currently provided: ${totalParticipants}.`,
          },
          { status: 400 }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 💳 RAZORPAY ORDER GENERATION & REGISTRATION RECORD
    // ─────────────────────────────────────────────────────────────────────────
    const receipt = `rcpt_${Date.now().toString().slice(-8)}`;
    const primaryEventId = validEvents[0].id;

    // ─────────────────────────────────────────────────────────────────────────
    // 🎁 ZERO-FEE REGISTRATION FALLBACK (Non-Informalz, genuine free events)
    // ─────────────────────────────────────────────────────────────────────────
    if (!isInformalzFlow && calculatedFeePaise === 0) {
      const freeResult = await createFreeRegistration({
        eventId: primaryEventId,
        leadName,
        leadEmail,
        leadPhone,
        college,
        photoUrl,
        teamMembers,
        trackUploadUrl,
        trackNotes,
      });

      // Dispatch Pass Confirmation Email
      sendPassEmail({
        to: leadEmail,
        leadName,
        eventTitle: combinedEventTitle,
        eventCategory: validEvents[0].category,
        dayOption: resolvedDayOption,
        amount: 0,
        razorpayPaymentId: 'FREE_ENTRY',
        ticketCodes: freeResult.tickets.map((t) => t.ticketCode),
        registrationId: freeResult.registrationId,
        teamMembers: teamMembers.map((m) => ({ fullName: m.fullName })),
      }).catch((err) => console.error('[Email] Failed to dispatch free pass email:', err));

      return NextResponse.json({
        success: true,
        registrationId: freeResult.registrationId,
        isFree: true,
        eventTitle: combinedEventTitle,
      });
    }

    // 1. Create Razorpay order (passing payerName, payerPhone, and college in notes)
    const razorpayOrder = await createRazorpayOrder({
      amount: calculatedFeePaise,
      receipt,
      notes: {
        eventId: primaryEventId,
        eventTitle: combinedEventTitle,
        payerName: leadName,
        payerPhone: leadPhone,
        leadEmail,
        college,
        dayOption: resolvedDayOption,
      },
    });

    // 2. Create PENDING registration record in database
    const regResult = await createPendingRegistration({
      eventId: primaryEventId,
      leadName,
      leadEmail,
      leadPhone,
      college,
      photoUrl,
      payerName: leadName,
      amount: calculatedFeePaise,
      teamMembers,
      razorpayOrderId: razorpayOrder.id,
      dayOption: resolvedDayOption,
      trackUploadUrl,
      trackNotes,
    });

    return NextResponse.json({
      success: true,
      registrationId: regResult.id,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      eventTitle: combinedEventTitle,
      isMock: razorpayOrder.isMock,
      isFree: false,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
    });
  } catch (error) {
    console.error('Checkout initialization error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error during checkout' },
      { status: 500 }
    );
  }
}
