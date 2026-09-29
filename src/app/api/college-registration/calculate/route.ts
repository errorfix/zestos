import { NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateContingentPricing } from '@/lib/collegeDb';

const calculateSchema = z.object({
  instituteName: z.string().min(1, 'Institute name is required'),
  squads: z.array(
    z.object({
      eventId: z.string().min(1),
      participants: z.array(
        z.object({
          fullName: z.string().min(1),
          phone: z.string().min(5),
          photoUrl: z.string().optional(),
          isTeamLeader: z.boolean().optional(),
        })
      ).min(1),
    })
  ).min(1, 'At least one event squad is required'),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = calculateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid calculation payload' },
        { status: 400 }
      );
    }

    const { instituteName, squads } = parsed.data;
    const result = await calculateContingentPricing(instituteName, squads);

    return NextResponse.json({ success: true, pricing: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}
