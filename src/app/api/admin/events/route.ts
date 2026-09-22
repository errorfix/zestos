import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getEvents, createEvent, updateEvent } from '@/lib/db';

const eventUpsertSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  category: z.string().min(2, 'Category is required'),
  eventType: z.enum(['Individual', 'Team']).default('Individual'),
  feeInr: z.number().min(0, 'Fee must be non-negative'),
  minTeamSize: z.number().int().min(1, 'Min team size must be at least 1'),
  maxTeamSize: z.number().int().min(1, 'Max team size must be at least 1'),
  prize1: z.string().optional(),
  prize2: z.string().optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
  venue: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  requiresTrackUpload: z.boolean().default(false),
  hasDayOptions: z.boolean().default(false),
});

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = eventUpsertSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid event data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      category,
      eventType,
      feeInr,
      minTeamSize,
      maxTeamSize,
      prize1,
      prize2,
      description,
      rules,
      venue,
      date,
      status,
      requiresTrackUpload,
      hasDayOptions,
    } = parsed.data;

    if (minTeamSize > maxTeamSize) {
      return NextResponse.json(
        { error: 'Minimum team size cannot be greater than maximum team size.' },
        { status: 400 }
      );
    }

    const feeAmount = Math.round(feeInr * 100);

    if (id) {
      const updated = await updateEvent(id, {
        title,
        category,
        eventType,
        feeAmount,
        minTeamSize,
        maxTeamSize,
        prize1,
        prize2,
        description,
        rules,
        venue,
        date,
        status,
        requiresTrackUpload,
        hasDayOptions,
      });
      return NextResponse.json({ success: true, event: updated, action: 'updated' });
    } else {
      const created = await createEvent({
        title,
        category,
        eventType,
        feeAmount,
        minTeamSize,
        maxTeamSize,
        prize1,
        prize2,
        description,
        rules,
        venue,
        date,
        status,
        requiresTrackUpload,
        hasDayOptions,
      });
      return NextResponse.json({ success: true, event: created, action: 'created' });
    }
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to save event' },
      { status: 500 }
    );
  }
}
