import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const isRazorpayConfigured = Boolean(
  keyId && keySecret && !keyId.includes('placeholder') && !keySecret.includes('placeholder')
);

export const razorpayClient = isRazorpayConfigured
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

/**
 * Creates a Razorpay Order or generates a valid mock Order ID for dev/testing.
 */
export async function createRazorpayOrder({
  amount, // in paise
  receipt,
  notes = {},
}: {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string; isMock: boolean }> {
  if (razorpayClient) {
    const order = await razorpayClient.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes,
    });
    return {
      id: order.id,
      amount: typeof order.amount === 'number' ? order.amount : amount,
      currency: order.currency || 'INR',
      isMock: false,
    };
  }

  // Graceful staging simulation order when live test keys are not yet configured
  const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    id: mockOrderId,
    amount,
    currency: 'INR',
    isMock: true,
  };
}

/**
 * Validates Razorpay Webhook signature using HMAC-SHA256
 */
export function verifyRazorpayWebhookSignature(bodyText: string, signature: string): boolean {
  if (!webhookSecret) return false;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyText)
    .digest('hex');
  return expectedSignature === signature;
}

/**
 * Validates Payment Checkout signature returned on client modal completion:
 * hmac_sha256(order_id + "|" + payment_id, secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!isRazorpayConfigured || orderId.startsWith('order_sim_') || keySecret.includes('placeholder')) {
    return true; // Graceful mock/local staging sandbox mode
  }
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generatedSignature === signature;
}
