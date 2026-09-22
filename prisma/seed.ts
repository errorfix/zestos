import { PrismaClient } from '@prisma/client';
import { SEED_EVENTS } from '../src/lib/mockEvents';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Lingaya\'s Vidyapeeth events into database...');

  for (const event of SEED_EVENTS) {
    const upserted = await prisma.event.upsert({
      where: { id: event.id },
      update: {
        title: event.title,
        category: event.category,
        feeAmount: event.feeAmount,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
      },
      create: {
        id: event.id,
        title: event.title,
        category: event.category,
        feeAmount: event.feeAmount,
        minTeamSize: event.minTeamSize,
        maxTeamSize: event.maxTeamSize,
      },
    });
    console.log(`✓ Event configured: ${upserted.title} [${upserted.category}] - ₹${upserted.feeAmount / 100}`);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
