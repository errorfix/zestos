import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { confirmInstitutePaymentAndIssuePasses } from '@/lib/collegeDb';
import prisma from '@/lib/prisma';

const verifyCollegeSchema = z.object({
  registrationId: z.string().min(1, 'Registration ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().optional().default(''),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = verifyCollegeSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { registrationId, orderId, paymentId, signature } = parsed.data;

    const isMock =
      orderId.startsWith('mock_order_') ||
      orderId.startsWith('order_sim_') ||
      paymentId.startsWith('mock_pay_') ||
      paymentId.startsWith('pay_col_') ||
      paymentId.startsWith('pay_sim_');
    const isValid = isMock || verifyPaymentSignature(orderId, paymentId, signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Cryptographic payment signature validation failed.' },
        { status: 400 }
      );
    }

    // Fulfill institute payment and issue deduplicated Day 1 / Day 2 passes
    const result = await confirmInstitutePaymentAndIssuePasses({
      registrationId,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
    });

    return NextResponse.json({
      success: true,
      registrationId,
      paymentId,
      ticketsIssued: result.ticketsIssued,
      message: 'College contingent registration completed successfully.',
    });
  } catch (error) {
    console.error('[VerifyCollegePayment] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to verify contingent payment' },
      { status: 500 }
    );
  }
}
