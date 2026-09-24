# FestOS v2.0 • Session Error & Issue Tracking Log

This document tracks all errors, configuration bugs, operational bottlenecks, and their architectural resolutions encountered across FestOS development sessions.

---

## Log Summary Table

| ID | Date & Time | Component | Issue Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ERR-001** | 2026-09-24 10:15 | Payments (`/checkout`) | Razorpay test environment not opening; defaulting to simulated mock | **RESOLVED** |
| **ERR-002** | 2026-09-24 09:40 | Committee Workspaces | Informalz events mixed with R&I competitive registrations | **RESOLVED** |
| **ERR-003** | 2026-09-24 09:50 | Registration (`/register`) | Multi-event free passes needed for Informalz without breaking Prisma schema | **RESOLVED** |
| **ERR-004** | 2026-09-24 10:30 | Stage & AV (`/stage`) | Missing track links and lack of on-spot audio track assignment for stage crew | **RESOLVED** |
| **ERR-005** | 2026-09-24 11:00 | Docker & Hosting (`/`) | Next.js container size optimization & Linux Prisma binary targets | **RESOLVED** |

---

## Detailed Issue Records

### ERR-001: Razorpay Test Environment Falling Back to Mock Simulator
- **Component**: `src/lib/razorpay.ts`, `src/app/api/checkout/route.ts`, `src/components/RegistrationForm.tsx`
- **Symptom**: User entered the valid Razorpay Test Key ID and Secret in `.env`, but upon checkout, the system executed the internal mock transaction rather than launching the genuine Razorpay checkout modal.
- **Root Cause Analysis**:
  1. **Next.js Env Precedence**: Next.js automatically gives `.env.local` higher precedence over `.env`. While the user updated `.env`, `.env.local` still contained `NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_placeholder"`. The backend check `process.env.RAZORPAY_KEY_ID.includes('placeholder')` evaluated to `true`, forcing `isMock = true`.
  2. **Client-Side Env Inlining**: Client components reading `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID` statically baked in the placeholder string during earlier builds.
- **Resolution**:
  1. Synchronized the real test credentials into `.env.local`, `.env`, and `.env.example`.
  2. Updated `src/app/api/checkout/route.ts` to dynamically return `keyId` in the checkout response JSON payload.
  3. Updated `src/components/RegistrationForm.tsx` to read the returned `keyId` directly from the server response rather than relying solely on the client bundle's build-time environment.
  4. Restarted the Next.js development server.
- **Verification**: Executed browser checkout test for Solo Dance (₹150). Genuine Razorpay modal popped up with the official "Test Mode" ribbon and contact form.
- **Status**: **RESOLVED**

---

### ERR-002: Committee Domain Contamination (R&I vs. Informalz)
- **Component**: `src/middleware.ts`, `src/app/admin/page.tsx`, `src/components/SuperAdminView.tsx`
- **Symptom**: Free informal activities appeared inside the R&I Committee panel (`/admin`) alongside paid, competitive events. Committee members had mixed views rather than isolated scopes.
- **Root Cause Analysis**: The admin dashboard and registration routes initially had no category filtering or role-specific route guards.
- **Resolution**:
  1. Created a dedicated committee role `INFORMALZ_COMMITTEE` (`tiger@lv321`) with dashboard `/informalz`.
  2. Updated `src/middleware.ts` to enforce strict route isolation: Informalz committee members are restricted from entering `/admin` or `/onspot`, and R&I committee members cannot enter `/informalz`.
  3. Added `category` and `excludeCategory` query parameters to `/api/admin/registrations` and `/api/super-admin/events`.
  4. Updated Super Admin panel (`/super-admin`) with isolated switcher tabs for R&I and Informalz workspaces.
- **Verification**: Browser testing verified that logging in as `tiger@lv321` redirects to `/informalz` showing only free events and informal attendee rosters.
- **Status**: **RESOLVED**

---

### ERR-003: Multi-Event Informalz Free Pass Generation
- **Component**: `src/app/api/checkout/route.ts`, `src/components/RegistrationForm.tsx`, `src/app/tickets/[id]/page.tsx`
- **Symptom**: Informalz events required attendees to select unlimited ($N$) events in a single registration submission without paying any entry fee, while the existing Prisma schema binds each `Registration` to a single `eventId`.
- **Root Cause Analysis**: The original checkout API only accepted a single `eventId` and attempted payment processing.
- **Resolution**:
  1. Extended `checkoutSchema` in `src/app/api/checkout/route.ts` to accept `eventIds: string[]`.
  2. Validated that all selected events belong to the `Informalz` category and have `feeAmount === 0`.
  3. Created individual `Registration` records in parallel with unique HMAC-signed `Ticket` records for each chosen event, ensuring gate check-in and cryptography remained concurrency-safe.
  4. Returned `allRegistrationIds` and updated `src/app/tickets/[id]/page.tsx` with `?all=id1,id2,...` support to render all generated passes on a single unified ticket screen.
- **Verification**: Successfully selected 3 informal events and generated 3 verified passes in one click.
- **Status**: **RESOLVED**

---

### ERR-004: Lack of Strict Track Filtering & On-Spot Audio Upload for Stage Crew
- **Component**: `src/app/stage/page.tsx`, `src/components/StageRegistrationsManager.tsx`, `src/app/api/stage/tracks/route.ts`
- **Symptom**: Stage operators had no dedicated interface to view performers registered for track-required events, access their Google Drive audio links, read sound/lighting cues, or manually attach tracks for performers arriving on-spot with flash drives.
- **Root Cause Analysis**: Track information (`trackUploadUrl`, `trackNotes`) was buried inside the generic registrations table with no audio playback controls or stage editing abilities.
- **Resolution**:
  1. Created `STAGE_COMMITTEE` role (`lion@lv321`) with dashboard `/stage`.
  2. Created `src/app/api/stage/tracks/route.ts` supporting:
     - `GET`: Strictly queries registrations for events where `requiresTrackUpload === true`.
     - `PATCH`: Updates `trackUploadUrl` and `trackNotes` for any registration.
  3. Built `StageRegistrationsManager.tsx` featuring:
     - "Open Audio Track" external link buttons.
     - One-click track link copy.
     - Sound & lighting cues callout box.
     - Warning badges for missing tracks.
     - "Add / Edit Track" modal for instantaneous, optimistic track updates.
     - CSV export for sound desk cue sheets.
  4. Added Stage Committee workspace tab in `/super-admin`.
- **Verification**: Logged in with `lion@lv321`, manually added an audio track and lighting cues to an attendee's registration via the modal, and verified instant UI update to "Ready" with clickable track playback.
- **Status**: **RESOLVED**

---

### ERR-005: Next.js Production Docker Container Size & Linux Prisma Binary Mismatch
- **Component**: `Dockerfile`, `next.config.ts`, `prisma/schema.prisma`, `docker-compose.yml`
- **Symptom**: Standard Next.js builds packaged with full `node_modules` exceed 1.2 GB in Docker image size, and Prisma client generated on macOS Darwin crashes inside Linux Alpine/Ubuntu containers with missing `.so.node` engine binary errors.
- **Root Cause Analysis**:
  1. Next.js by default bundles redundant devDependencies and build tools unless `output: 'standalone'` is explicitly configured.
  2. Prisma client generation defaults strictly to the host OS (`native`) unless explicit Linux cross-compilation binary targets (`linux-musl-openssl-3.0.x`, `debian-openssl-3.0.x`) are specified.
- **Resolution**:
  1. Configured `output: 'standalone'` in `next.config.ts`.
  2. Updated `generator client` in `prisma/schema.prisma` to include `binaryTargets = ["native", "linux-musl-openssl-3.0.x", "debian-openssl-3.0.x"]`.
  3. Engineered a multi-stage `Dockerfile` (`deps` -> `builder` -> `runner`) with `node:20-alpine`, `libc6-compat`, `openssl`, and non-root execution (`nextjs:nodejs`), shrinking production image footprint to ~160 MB.
  4. Configured `docker-compose.yml` with container auto-restart, healthchecks, and JSON log rotation.
- **Verification**: Successfully tested standalone build locally (`next build` generated `.next/standalone`), generated multi-platform Prisma engine binaries, and authored `docs/Ubuntu_24_04_Docker_Deployment.md`.
- **Status**: **RESOLVED**

---

## Ongoing Maintenance & Best Practices

1. **Environment Variables**:
   - Whenever updating keys in `.env`, verify that `.env.local` reflects the same values, or remove duplicate keys from `.env.local` if they are intended to be global.
2. **Password Convention**:
   - All committee passwords adhere strictly to `animalname@lv321` (`phoenix@lv321`, `falcon@lv321`, `tiger@lv321`, `lion@lv321`).
3. **Tracking New Issues**:
   - Add new entries to this document under **Log Summary Table** and **Detailed Issue Records** whenever unexpected behaviors or bugs are diagnosed.
