#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FESTOS V2.0 HIGH-CONCURRENCY ORGANIC STRESS TESTING ENGINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * Simulates human-like campus traffic bursts for registration stress testing:
 *   - Compound Poisson Arrival Process with Pareto/Gaussian Jitter
 *   - Micro-batch clustering (2-3 simultaneous, then 1, then 5, etc.)
 *   - Automatic duration clamping to safe network concurrency thresholds
 *   - Dynamic event selection and team/solo participant generation
 *   - Real-time Terminal HUD dashboard with latency percentiles (p50, p95, p99)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import readline from 'readline';

// ─── TYPES & INTERFACES ────────────────────────────────────────────────────────
interface EventSummary {
  id: string;
  title: string;
  category: string;
  eventType: string;
  minTeamSize: number;
  maxTeamSize: number;
  feeAmount: number;
}

interface TestConfig {
  targetUrl: string;
  totalRequests: number;
  targetDurationSec: number;
  mode: 'fulfill' | 'checkout'; // 'fulfill' generates tickets (PAID), 'checkout' creates PENDING orders
}

interface RequestResult {
  index: number;
  status: number;
  durationMs: number;
  success: boolean;
  orderId?: string;
  registrationId?: string;
  ticketsCount?: number;
  error?: string;
}

// ─── SAMPLE REALISTIC DATASETS ────────────────────────────────────────────────
const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Dhruv', 'Kabir', 'Rohan', 'Alok', 'Anuj', 'Dev', 'Manish', 'Kunal', 'Abhishek',
  'Diya', 'Saanvi', 'Ananya', 'Aadhya', 'Pari', 'Anushka', 'Khushi', 'Sneha', 'Riya', 'Isha',
  'Kavya', 'Tanvi', 'Meera', 'Pooja', 'Shreya', 'Muskan', 'Simran', 'Neha', 'Divya', 'Sanya'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Kapoor', 'Jha', 'Thakur', 'Singh',
  'Patel', 'Yadav', 'Choudhary', 'Mishra', 'Pandey', 'Nair', 'Iyer', 'Reddy', 'Rao', 'Bose',
  'Banerjee', 'Das', 'Sen', 'Ghosh', 'Chatterjee', 'Agarwal', 'Goyal', 'Bansal', 'Jain', 'Mehta'
];

const COLLEGES = [
  "Lingaya's Vidyapeeth",
  'Delhi Technological University (DTU)',
  'Netaji Subhas University of Technology (NSUT)',
  'Maharaja Agrasen Institute of Technology (MAIT)',
  'Amity University, Noida',
  'J.C. Bose UST, YMCA Faridabad',
  'Manav Rachna International Institute (MRIIRS)',
  'Galgotias University',
  'Sharda University',
  'Bennett University'
];

// Lightweight valid SVG Base64 avatar (satisfies min 10 chars, < 150 bytes, zero network drag)
function generateCompactAvatar(seed: string): string {
  const colors = ['%234F46E5', '%23059669', '%23DC2626', '%23D97706', '%237C3AED', '%232563EB'];
  const color = colors[Math.abs(seed.split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)) % colors.length];
  const initial = seed.charAt(0).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect width='80' height='80' fill='${color}'/><text x='50%25' y='55%25' font-family='sans-serif' font-size='36' font-weight='bold' fill='%23FFFFFF' text-anchor='middle' dominant-baseline='middle'>${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── COMPOUND POISSON BATCH GENERATOR ──────────────────────────────────────────
/**
 * Organic burst distribution:
 * Real students submit in natural waves:
 *   - 1 at once (15%): solitary attendee
 *   - 2 at once (30%): friends submitting together
 *   - 3 at once (30%): small friend group
 *   - 4-5 at once (17%): campus team rush
 *   - 6-7 at once (8%): notification blast burst
 */
function generateOrganicMicroBatches(total: number): number[] {
  const batches: number[] = [];
  let remaining = total;

  while (remaining > 0) {
    if (remaining <= 3) {
      batches.push(remaining);
      break;
    }

    const roll = Math.random();
    let size = 1;

    if (roll < 0.15) {
      size = 1;
    } else if (roll < 0.45) {
      size = 2;
    } else if (roll < 0.75) {
      size = 3;
    } else if (roll < 0.92) {
      size = randomInt(4, 5);
    } else {
      size = randomInt(6, 7);
    }

    size = Math.min(size, remaining);
    batches.push(size);
    remaining -= size;
  }

  return batches;
}

// ─── DURATION CLAMPING & SAFETY CALCULATOR ─────────────────────────────────────
function calculateClampedDuration(totalRequests: number, requestedDurationSec: number): {
  clampedDurationSec: number;
  wasClamped: boolean;
  minDurationSec: number;
  estMaxRps: number;
} {
  // Conservative estimate: safe sustained concurrency of 25-30 sockets, 60ms average RTT
  const safeConcurrency = 30;
  const estRttSec = 0.06;
  const minDurationSec = Math.max(1, Math.ceil((totalRequests * estRttSec) / safeConcurrency));

  if (requestedDurationSec < minDurationSec) {
    return {
      clampedDurationSec: minDurationSec,
      wasClamped: true,
      minDurationSec,
      estMaxRps: Math.round(totalRequests / minDurationSec),
    };
  }

  return {
    clampedDurationSec: requestedDurationSec,
    wasClamped: false,
    minDurationSec,
    estMaxRps: Math.round(totalRequests / requestedDurationSec),
  };
}

// ─── TERMINAL HUD DASHBOARD ───────────────────────────────────────────────────
class TerminalDashboard {
  private startTime = Date.now();
  private total: number;
  private durationSec: number;
  private completed = 0;
  private successes = 0;
  private failures = 0;
  private statusCodes: Record<number, number> = {};
  private latencies: number[] = [];
  private currentRps = 0;
  private lastCompleted = 0;
  private lastSampleTime = Date.now();
  private activeInterval: NodeJS.Timeout | null = null;

  constructor(total: number, durationSec: number) {
    this.total = total;
    this.durationSec = durationSec;
  }

  start() {
    this.startTime = Date.now();
    this.lastSampleTime = Date.now();
    // Render HUD every 120ms
    this.activeInterval = setInterval(() => this.render(), 120);
  }

  record(result: RequestResult) {
    this.completed++;
    if (result.success) {
      this.successes++;
    } else {
      this.failures++;
    }
    this.statusCodes[result.status] = (this.statusCodes[result.status] || 0) + 1;
    this.latencies.push(result.durationMs);

    // Calculate instantaneous RPS every 500ms
    const now = Date.now();
    const elapsedSinceSample = (now - this.lastSampleTime) / 1000;
    if (elapsedSinceSample >= 0.5) {
      this.currentRps = Math.round((this.completed - this.lastCompleted) / elapsedSinceSample);
      this.lastCompleted = this.completed;
      this.lastSampleTime = now;
    }
  }

  private getPercentile(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[index];
  }

  render() {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    const avgRps = elapsedSec > 0 ? (this.completed / elapsedSec).toFixed(1) : '0';
    const percent = Math.min(100, (this.completed / this.total) * 100);
    const remainingSec = Math.max(0, this.durationSec - elapsedSec);

    // ASCII progress bar (28 chars)
    const barWidth = 28;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));

    const p50 = this.getPercentile(50);
    const p95 = this.getPercentile(95);
    const p99 = this.getPercentile(99);

    const statusParts = Object.entries(this.statusCodes)
      .map(([code, count]) => `${code}:${count}`)
      .join(' ');

    const line1 = `\x1b[1;36m[PROGRESS]\x1b[0m [${bar}] ${this.completed}/${this.total} (${percent.toFixed(1)}%) | \x1b[1;33mElapsed:\x1b[0m ${elapsedSec.toFixed(1)}s / \x1b[1;33mETA:\x1b[0m ${remainingSec.toFixed(1)}s`;
    const line2 = `\x1b[1;32m[SPEED]\x1b[0m    Current: \x1b[1;37m${this.currentRps}\x1b[0m req/s | Avg: \x1b[1;37${avgRps}\x1b[0m req/s | \x1b[1;35m[LATENCY]\x1b[0m p50: \x1b[1;37m${p50}ms\x1b[0m | p95: \x1b[1;37m${p95}ms\x1b[0m | p99: \x1b[1;37m${p99}ms\x1b[0m`;
    const line3 = `\x1b[1;34m[STATUS]\x1b[0m   ✓ OK: \x1b[1;32m${this.successes}\x1b[0m | ✗ Fail: \x1b[1;31m${this.failures}\x1b[0m | Codes: [${statusParts || 'none'}]`;

    // Clear 3 lines up and redraw
    process.stdout.write(`\r\x1b[K${line1}\n\x1b[K${line2}\n\x1b[K${line3}\x1b[2A\r`);
  }

  stop() {
    if (this.activeInterval) {
      clearInterval(this.activeInterval);
      this.activeInterval = null;
    }
    // Move cursor down past the 3 HUD lines
    process.stdout.write('\n\n\n');
  }

  printFinalSummary() {
    const elapsedSec = (Date.now() - this.startTime) / 1000;
    const avgRps = elapsedSec > 0 ? (this.completed / elapsedSec).toFixed(1) : '0';
    const p50 = this.getPercentile(50);
    const p95 = this.getPercentile(95);
    const p99 = this.getPercentile(99);

    console.log('\n═════════════════════════════════════════════════════════════════════════════');
    console.log('                 📊 STRESS TEST COMPREHENSIVE REPORT                       ');
    console.log('═════════════════════════════════════════════════════════════════════════════');
    console.log(`• Total Requests Sent:     ${this.completed} / ${this.total}`);
    console.log(`• Successful Fulfillments: ${this.successes} (${((this.successes / this.completed) * 100).toFixed(1)}%)`);
    console.log(`• Failed Requests:         ${this.failures}`);
    console.log(`• Total Execution Time:    ${elapsedSec.toFixed(2)} seconds`);
    console.log(`• Average Throughput:      ${avgRps} requests/sec`);
    console.log(`• Latency Percentiles:     p50: ${p50}ms | p95: ${p95}ms | p99: ${p99}ms`);
    console.log(`• HTTP Status Breakdown:   ${JSON.stringify(this.statusCodes)}`);
    console.log('═════════════════════════════════════════════════════════════════════════════\n');
  }
}

// ─── DATA GENERATION ──────────────────────────────────────────────────────────
function generateAttendeePayload(event: EventSummary, index: number) {
  const firstName = randomItem(FIRST_NAMES);
  const lastName = randomItem(LAST_NAMES);
  const leadName = `${firstName} ${lastName}`;
  const leadEmail = `stress_test_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}@testcampus.edu`;
  const leadPhone = `9${randomInt(100000000, 999999999)}`;
  const college = randomItem(COLLEGES);
  const photoUrl = generateCompactAvatar(firstName);

  // Determine if Solo or Team (respecting event constraints)
  const isTeam = event.maxTeamSize > 1 && (event.minTeamSize > 1 || Math.random() < 0.45);
  const teamSize = isTeam ? randomInt(event.minTeamSize, event.maxTeamSize) : 1;
  const teamMembers: Array<{ fullName: string; phone: string; college: string; photoUrl: string; rollNumber: string }> = [];

  if (teamSize > 1) {
    for (let i = 1; i < teamSize; i++) {
      const tmFirst = randomItem(FIRST_NAMES);
      const tmLast = randomItem(LAST_NAMES);
      teamMembers.push({
        fullName: `${tmFirst} ${tmLast}`,
        phone: `9${randomInt(100000000, 999999999)}`,
        college,
        photoUrl: generateCompactAvatar(tmFirst),
        rollNumber: `23BTECH${randomInt(100, 999)}`,
      });
    }
  }

  return {
    eventId: event.id,
    leadName,
    leadEmail,
    leadPhone,
    college,
    photoUrl,
    dayOption: 'DAY_1',
    teamMembers,
  };
}

// ─── EXECUTE SINGLE REGISTRATION WORKFLOW ──────────────────────────────────────
async function executeRegistration(
  targetUrl: string,
  event: EventSummary,
  index: number,
  mode: 'fulfill' | 'checkout'
): Promise<RequestResult> {
  const start = Date.now();
  const payload = generateAttendeePayload(event, index);

  try {
    // 1. Submit Checkout
    const checkoutRes = await fetch(`${targetUrl}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stress-test': 'true',
      },
      body: JSON.stringify(payload),
    });

    const checkoutJson = (await checkoutRes.json()) as {
      success?: boolean;
      orderId?: string;
      registrationId?: string;
      isFree?: boolean;
      error?: string;
    };

    if (!checkoutRes.ok || !checkoutJson.success) {
      return {
        index,
        status: checkoutRes.status,
        durationMs: Date.now() - start,
        success: false,
        error: checkoutJson.error || `HTTP ${checkoutRes.status}`,
      };
    }

    // If free event or checkout-only mode requested, we are done
    if (mode === 'checkout' || checkoutJson.isFree) {
      return {
        index,
        status: checkoutRes.status,
        durationMs: Date.now() - start,
        success: true,
        orderId: checkoutJson.orderId,
        registrationId: checkoutJson.registrationId,
      };
    }

    // 2. Fulfill Payment to generate Tickets & QR Security Hashes
    const orderId = checkoutJson.orderId!;
    const paymentId = `pay_stress_${Date.now()}_${index}`;

    const verifyRes = await fetch(`${targetUrl}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-stress-test': 'true',
      },
      body: JSON.stringify({
        orderId,
        paymentId,
        signature: 'stress_test_mock_sig',
        payerName: payload.leadName,
      }),
    });

    const verifyJson = (await verifyRes.json()) as {
      success?: boolean;
      tickets?: unknown[];
      error?: string;
    };

    return {
      index,
      status: verifyRes.status,
      durationMs: Date.now() - start,
      success: Boolean(verifyRes.ok && verifyJson.success),
      orderId,
      registrationId: checkoutJson.registrationId,
      ticketsCount: verifyJson.tickets ? verifyJson.tickets.length : 1,
      error: verifyJson.error,
    };
  } catch (err) {
    return {
      index,
      status: 0,
      durationMs: Date.now() - start,
      success: false,
      error: (err as Error).message || 'Network fetch failure',
    };
  }
}

// ─── FETCH LIVE EVENTS ────────────────────────────────────────────────────────
async function fetchTargetEvents(targetUrl: string): Promise<EventSummary[]> {
  try {
    const res = await fetch(`${targetUrl}/api/events`);
    if (res.ok) {
      const data = (await res.json()) as { events?: EventSummary[] };
      if (data.events && data.events.length > 0) {
        return data.events.map((e) => ({
          id: e.id,
          title: e.title,
          category: e.category,
          eventType: e.eventType || 'Individual',
          minTeamSize: e.minTeamSize || 1,
          maxTeamSize: e.maxTeamSize || 1,
          feeAmount: e.feeAmount || 0,
        }));
      }
    }
  } catch {
    // Non-fatal, fallback to default seed events
  }

  return [
    { id: 'evt_after_dark', title: 'After Dark', category: 'Literary', eventType: 'Individual', minTeamSize: 1, maxTeamSize: 1, feeAmount: 15000 },
    { id: 'evt_western_dance', title: 'Western Dance — RAZMADAZ', category: 'Cultural - Dance', eventType: 'Team', minTeamSize: 4, maxTeamSize: 15, feeAmount: 100000 },
    { id: 'evt_hindi_solo', title: 'Hindi Solo — ARYA', category: 'Cultural - Music', eventType: 'Individual', minTeamSize: 1, maxTeamSize: 1, feeAmount: 15000 },
    { id: 'evt_bulls_eye_blitz', title: "Bull's Eye Blitz", category: 'Informalz', eventType: 'Individual', minTeamSize: 1, maxTeamSize: 1, feeAmount: 15000 },
  ];
}

// ─── INTERACTIVE CLI PROMPT ────────────────────────────────────────────────────
async function promptConfig(): Promise<TestConfig> {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx < args.length - 1 ? args[idx + 1] : null;
  };

  const hasFlag = (flag: string) => args.includes(flag);

  let targetUrl = getArg('--url') || 'http://localhost:3000';
  let totalRequests = parseInt(getArg('-n') || getArg('--count') || '0', 10);
  let durationInput = getArg('-d') || getArg('--duration') || '';
  let mode: 'fulfill' | 'checkout' = hasFlag('--checkout-only') ? 'checkout' : 'fulfill';

  // If parameters provided via CLI flags, parse directly
  if (totalRequests > 0 && durationInput) {
    let targetDurationSec = parseInt(durationInput, 10);
    if (durationInput.endsWith('m')) targetDurationSec = parseInt(durationInput, 10) * 60;
    if (durationInput.endsWith('s')) targetDurationSec = parseInt(durationInput, 10);
    return { targetUrl, totalRequests, targetDurationSec, mode };
  }

  // Otherwise, interactive wizard
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise((resolve) => rl.question(q, resolve));

  console.log('\n╔═════════════════════════════════════════════════════════════════════════════╗');
  console.log('║       ⚡ FESTOS V2.0 ORGANIC REGISTRATION STRESS TESTING SUITE             ║');
  console.log('╚═════════════════════════════════════════════════════════════════════════════╝\n');

  const urlAnswer = await ask('🌐 Target Base URL [http://localhost:3000]: ');
  if (urlAnswer.trim()) targetUrl = urlAnswer.trim().replace(/\/$/, '');

  const countAnswer = await ask('👥 Total Registrations to Simulate [e.g. 5000, 50, 3]: ');
  totalRequests = Math.max(1, parseInt(countAnswer.trim(), 10) || 100);

  const durAnswer = await ask('⏱️  Target Duration in seconds [e.g. 60, 180s, 5m] (default 60s): ');
  let targetDurationSec = 60;
  if (durAnswer.trim()) {
    if (durAnswer.trim().endsWith('m')) targetDurationSec = parseInt(durAnswer.trim(), 10) * 60;
    else targetDurationSec = parseInt(durAnswer.trim(), 10) || 60;
  }

  const modeAnswer = await ask('🎫 Mode: [1] End-to-End (Paid Tickets + QR Hashes) [DEFAULT], [2] Checkout Only: ');
  if (modeAnswer.trim() === '2') mode = 'checkout';

  rl.close();
  return { targetUrl, totalRequests, targetDurationSec, mode };
}

// ─── MAIN ORCHESTRATOR ─────────────────────────────────────────────────────────
async function main() {
  const config = await promptConfig();

  // 1. Calculate safe duration clamping
  const { clampedDurationSec, wasClamped, minDurationSec, estMaxRps } = calculateClampedDuration(
    config.totalRequests,
    config.targetDurationSec
  );

  console.log('\n─────────────────────────────────────────────────────────────────────────────');
  console.log(`🎯 Target URL:          ${config.targetUrl}`);
  console.log(`👥 Total Registrations:  ${config.totalRequests.toLocaleString()}`);
  console.log(`⏱️  Configured Duration: ${clampedDurationSec}s (~${estMaxRps} req/s)`);
  if (wasClamped) {
    console.log(`⚠️  \x1b[33m[SAFETY CLAMP]\x1b[0m Requested ${config.targetDurationSec}s clamped to ${clampedDurationSec}s to prevent socket collapse (min: ${minDurationSec}s).`);
  }
  console.log(`🎫 Testing Mode:        ${config.mode === 'fulfill' ? 'End-to-End (Full Tickets & Hashes)' : 'Checkout Only (Pending Orders)'}`);
  console.log('─────────────────────────────────────────────────────────────────────────────\n');

  // 2. Fetch live events from target website
  process.stdout.write('🔍 Discovering active festival events from target server... ');
  const events = await fetchTargetEvents(config.targetUrl);
  console.log(`✓ Loaded ${events.length} active events.`);

  // 3. Generate micro-batches according to Compound Poisson Process
  const batches = generateOrganicMicroBatches(config.totalRequests);
  console.log(`🌊 Traffic Plan: Divided into ${batches.length} organic burst clusters (1 to 7 reqs/burst).`);

  // Nominal inter-burst delay
  const totalIntervals = Math.max(1, batches.length - 1);
  const nominalDelayMs = (clampedDurationSec * 1000) / totalIntervals;

  console.log(`🚀 Commencing organic registration wave in 2 seconds...\n`);
  await new Promise((r) => setTimeout(r, 2000));

  // 4. Initialize Terminal Dashboard HUD
  const dashboard = new TerminalDashboard(config.totalRequests, clampedDurationSec);
  dashboard.start();

  let globalIndex = 0;

  // Handle graceful Ctrl+C cancellation
  process.on('SIGINT', () => {
    dashboard.stop();
    console.log('\n\n🛑 Stress test interrupted by user.');
    dashboard.printFinalSummary();
    process.exit(0);
  });

  // 5. Execute Bursts
  for (let b = 0; b < batches.length; b++) {
    const batchSize = batches[b];
    const burstPromises: Promise<void>[] = [];

    // Launch burst concurrent requests
    for (let i = 0; i < batchSize; i++) {
      globalIndex++;
      const currentIdx = globalIndex;
      const event = randomItem(events);

      burstPromises.push(
        executeRegistration(config.targetUrl, event, currentIdx, config.mode).then((result) => {
          dashboard.record(result);
        })
      );
    }

    // Await current micro-batch completion
    await Promise.all(burstPromises);

    // Apply Pareto/Gaussian jitter sleep between bursts
    if (b < batches.length - 1) {
      // Jitter factor between 0.35 and 1.65 (organic human pacing)
      const jitter = 0.35 + Math.random() * 1.3;
      const sleepMs = Math.max(15, Math.round(nominalDelayMs * jitter));
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  // 6. Finish & Report
  dashboard.stop();
  dashboard.printFinalSummary();
}

main().catch((err) => {
  console.error('\n❌ Fatal stress test error:', err);
  process.exit(1);
});
