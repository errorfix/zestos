import { PrismaClient } from '@prisma/client';
import { SEED_EVENTS } from '../src/lib/mockEvents';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ZEST 2K26 official events into Supabase database...');

  for (const event of SEED_EVENTS) {
    const upserted = await prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        category: event.category,
        eventType: event.eventType,
        feeAmount: event.feeAmount,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
        prize1: event.prize1,
        prize2: event.prize2,
        description: event.description,
        rules: event.rules,
        venue: event.venue,
        date: event.date,
        status: event.status,
        requiresTrackUpload: event.requiresTrackUpload,
        hasDayOptions: event.hasDayOptions,
      },
      create: {
        id: event.id,
        title: event.title,
        category: event.category,
        eventType: event.eventType,
        feeAmount: event.feeAmount,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
        prize1: event.prize1,
        prize2: event.prize2,
        description: event.description,
        rules: event.rules,
        venue: event.venue,
        date: event.date,
        status: event.status,
        requiresTrackUpload: event.requiresTrackUpload,
        hasDayOptions: event.hasDayOptions,
      },
    });
    const feeStr = upserted.feeAmount === 0 ? 'FREE' : `₹${upserted.feeAmount / 100}`;
    console.log(`✓ Event configured: ${upserted.title} [${upserted.category}] - ${feeStr} (${upserted.eventType})`);
  }

  console.log('✅ All 31 ZEST 2K26 events seeded successfully into Supabase!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
