import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { fulfillPaymentAndGenerateTickets } from '@/lib/db';

const verifySchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().optional().default(''),
  payerName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = verifySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid verification payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { orderId, paymentId, signature, payerName } = parsed.data;

    // Validate cryptographic signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Cryptographic payment signature validation failed.' },
        { status: 400 }
      );
    }

    // Fulfill registration: update to PAID, record paymentId & payerName, and generate cryptographic tickets
    const result = await fulfillPaymentAndGenerateTickets({
      orderId,
      paymentId,
      payerName,
    });

    return NextResponse.json({
      success: true,
      registrationId: result.registrationId,
      tickets: result.tickets,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
