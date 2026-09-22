import { NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';
import { fulfillPaymentAndGenerateTickets } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // Handle payment captured / order paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        console.log(`[Webhook] Fulfilling order ${orderId} with payment ${paymentId}`);
        await fulfillPaymentAndGenerateTickets({
          orderId,
          paymentId,
        });
      }
    }

    return NextResponse.json({ status: 'ok', received: true });
  } catch (error) {
    console.error('[Webhook] Error processing Razorpay webhook:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
