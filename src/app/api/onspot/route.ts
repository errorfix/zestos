import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOnSpotRegistration, getEventById } from '@/lib/db';

const onSpotSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  leadName: z.string().min(2, 'Lead Attendee Name is required'),
  leadEmail: z.string().email('Valid email is required'),
  leadPhone: z.string().min(10, 'A valid 10-digit contact number is required'),
  college: z.string().optional(),
  photoUrl: z.string().optional(),
  paymentMethod: z
    .enum(['ONSPOT_CASH', 'ONSPOT_UPI', 'ONLINE_RAZORPAY', 'FREE_REGISTRATION'])
    .default('ONSPOT_CASH'),
  razorpayPaymentId: z.string().optional(),
  payerName: z.string().optional(),
  dayOption: z.enum(['SINGLE_DAY', 'BOTH_DAYS']).optional(),
  trackUploadUrl: z.string().optional(),
  trackNotes: z.string().optional(),
  teamMembers: z
    .array(
      z.object({
        fullName: z.string().min(2, 'Team member name required'),
        phone: z.string().optional(),
        college: z.string().optional(),
        photoUrl: z.string().optional(),
        rollNumber: z.string().optional(),
      })
    )
    .default([]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = onSpotSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid on-spot form submission', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      eventId,
      leadName,
      leadEmail,
      leadPhone,
      college,
      photoUrl,
      paymentMethod,
      razorpayPaymentId,
      payerName,
      dayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    } = parsed.data;

    const event = await getEventById(eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const totalParticipants = 1 + teamMembers.length;
    if (totalParticipants < event.minTeamSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum ${event.minTeamSize} participant(s) required for "${event.title}".`,
        },
        { status: 400 }
      );
    }

    if (totalParticipants > event.maxTeamSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${event.maxTeamSize} participant(s) allowed for "${event.title}".`,
        },
        { status: 400 }
      );
    }

    let calculatedFeePaise = event.feeAmount;
    if (event.hasDayOptions) {
      calculatedFeePaise = dayOption === 'BOTH_DAYS' ? 25000 : 15000;
    }

    const result = await createOnSpotRegistration({
      eventId,
      leadName,
      leadEmail,
      leadPhone,
      college,
      photoUrl,
      paymentMethod,
      razorpayPaymentId,
      payerName,
      amount: calculatedFeePaise,
      dayOption,
      trackUploadUrl,
      trackNotes,
      teamMembers,
    });

    return NextResponse.json({
      success: true,
      registrationId: result.registrationId,
      tickets: result.tickets,
      eventTitle: event.title,
      feeCollected: calculatedFeePaise / 100,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'On-spot registration failed' },
      { status: 500 }
    );
  }
}
