#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FESTOS V2.0 • STRESS TEST DATA CLEANUP UTILITY
 * ═══════════════════════════════════════════════════════════════════════════════
 * Safely removes stress test data generated during load testing:
 *   - Identifies stress test registrations via email pattern, orderId, or paymentId
 *   - Cascades deletion of tickets and team members
 *   - Cleans up .festos_cache.json on disk if present
 *   - Option --all to purge all registrations (for a clean production slate)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const CACHE_FILE = path.join(process.cwd(), '.festos_cache.json');

async function main() {
  const args = process.argv.slice(2);
  const wipeAll = args.includes('--all') || args.includes('--wipe-all');
  const dryRun = args.includes('--dry-run');

  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log(wipeAll 
    ? '⚠️  WARNING: FULL PURGE MODE (--all) SELECTED: REMOVING ALL REGISTRATIONS'
    : '🧹 TARGETED MODE: REMOVING STRESS TEST REGISTRATIONS ONLY');
  if (dryRun) console.log('🔍 DRY RUN ENABLED: No changes will be committed');
  console.log('═════════════════════════════════════════════════════════════════════════════\n');

  // 1. PostgreSQL Database Cleanup
  try {
    const whereCondition = wipeAll
      ? {}
      : {
          OR: [
            { leadEmail: { startsWith: 'stress_test_' } },
            { leadEmail: { endsWith: '@testcampus.edu' } },
            { razorpayOrderId: { startsWith: 'order_stress_' } },
            { razorpayPaymentId: { startsWith: 'pay_stress_' } },
          ],
        };

    const count = await prisma.registration.count({ where: whereCondition });
    console.log(`📊 Found ${count} registration record(s) matching criteria in PostgreSQL.`);

    if (count > 0 && !dryRun) {
      // Find IDs for logging
      const targetRegs = await prisma.registration.findMany({
        where: whereCondition,
        select: { id: true, leadEmail: true },
      });

      const deleted = await prisma.registration.deleteMany({
        where: whereCondition,
      });

      console.log(`✅ Successfully deleted ${deleted.count} registration(s) (and cascaded tickets/members) from PostgreSQL.`);
    }
  } catch (err) {
    console.warn(`⚠️ PostgreSQL query error (database might be offline or using memory fallback):`, (err as Error).message);
  }

  // 2. Clean .festos_cache.json if present
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cacheData = JSON.parse(raw);

      if (cacheData.registrations) {
        let removedFromCache = 0;
        const remainingRegs: Record<string, unknown> = {};

        for (const [key, reg] of Object.entries(cacheData.registrations)) {
          const r = reg as {
            leadEmail?: string;
            razorpayOrderId?: string;
            razorpayPaymentId?: string;
          };

          const isStress =
            wipeAll ||
            r.leadEmail?.startsWith('stress_test_') ||
            r.leadEmail?.endsWith('@testcampus.edu') ||
            r.razorpayOrderId?.startsWith('order_stress_') ||
            r.razorpayPaymentId?.startsWith('pay_stress_');

          if (isStress) {
            removedFromCache++;
          } else {
            remainingRegs[key] = reg;
          }
        }

        console.log(`📂 Cache file: Found ${removedFromCache} matching item(s) in ${CACHE_FILE}.`);

        if (removedFromCache > 0 && !dryRun) {
          cacheData.registrations = remainingRegs;
          fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
          console.log(`✅ Successfully updated ${CACHE_FILE} (removed ${removedFromCache} record(s)).`);
        }
      }
    } else {
      console.log(`ℹ️ No .festos_cache.json found at ${CACHE_FILE}.`);
    }
  } catch (err) {
    console.warn(`⚠️ Error updating cache file:`, (err as Error).message);
  }

  console.log('\n═════════════════════════════════════════════════════════════════════════════');
  console.log('🎉 Cleanup routine completed.');
  console.log('💡 TIP: If running on a live VPS container, restart festos-app to reset in-memory cache:');
  console.log('   docker compose restart festos-app');
  console.log('═════════════════════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('Fatal error running cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
