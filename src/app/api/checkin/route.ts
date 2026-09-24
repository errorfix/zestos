import { NextResponse } from 'next/server';
import { z } from 'zod';
import { checkInTicket } from '@/lib/db';

const checkInSchema = z.object({
  ticketCode: z.string().min(1, 'Ticket code is required'),
  signature: z.string().optional(),
  action: z.enum(['LOOKUP', 'CHECK_IN', 'WAITLIST', 'RESET']).default('CHECK_IN'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = checkInSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid check-in request payload' },
        { status: 400 }
      );
    }

    const { ticketCode, signature, action } = parsed.data;
    const result = await checkInTicket({ ticketCode, signature, action });

    const httpStatus = result.success ? 200 : result.status === 'ALREADY_CHECKED_IN' ? 409 : 404;

    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Server error during check-in' },
      { status: 500 }
    );
  }
}
