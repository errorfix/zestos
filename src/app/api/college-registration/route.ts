import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createInstituteRegistration, calculateContingentPricing } from '@/lib/collegeDb';
import { createRazorpayOrder } from '@/lib/razorpay';

const contingentCheckoutSchema = z.object({
  instituteName: z.string().min(2, 'Institution Name is required'),
  leaderName: z.string().min(2, 'Team Leader Name is required'),
  leaderEmail: z.string().email('Valid Email address is required'),
  leaderPhone: z.string().min(10, 'Valid 10-digit mobile number is required'),
  leaderPhotoUrl: z.string().optional(),
  squads: z
    .array(
      z.object({
        eventId: z.string().min(1, 'Event selection is required'),
        participants: z
          .array(
            z.object({
              fullName: z.string().min(2, 'Participant Name is required'),
              phone: z.string().min(10, 'Valid 10-digit mobile number is required'),
              photoUrl: z.string().optional(),
              isTeamLeader: z.boolean().optional(),
            })
          )
          .min(1, 'At least 1 participant is required per squad'),
      })
    )
    .min(1, 'At least one event squad must be added to the contingent cart'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = contingentCheckoutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed. Please check all participant details.',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const { instituteName, leaderName, leaderEmail, leaderPhone, leaderPhotoUrl, squads } = parsed.data;

    // Calculate exact pricing
    const pricing = await calculateContingentPricing(instituteName, squads);

    // Create Razorpay order
    const receipt = `col_${Date.now().toString().slice(-8)}`;
    const razorpayOrder = await createRazorpayOrder({
      amount: pricing.finalAmountPaise,
      receipt,
      notes: {
        type: 'COLLEGE_CONTINGENT',
        instituteName,
        leaderName,
        leaderEmail,
        leaderPhone,
        totalParticipants: pricing.totalUniqueParticipants.toString(),
      },
    });

    // Create pending institute registration in database
    const { registrationId } = await createInstituteRegistration({
      instituteName,
      leaderName,
      leaderEmail,
      leaderPhone,
      leaderPhotoUrl,
      squads,
      razorpayOrderId: razorpayOrder.id,
      paymentMethod: 'ONLINE_RAZORPAY',
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

    return NextResponse.json({
      success: true,
      registrationId,
      orderId: razorpayOrder.id,
      amount: pricing.finalAmountPaise,
      currency: 'INR',
      keyId,
      isMock: razorpayOrder.isMock || false,
      pricing,
    });
  } catch (error) {
    console.error('[CollegeRegistration] Checkout creation error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to initialize contingent checkout' },
      { status: 500 }
    );
  }
}
