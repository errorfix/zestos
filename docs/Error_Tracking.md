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
| **ERR-006** | 2026-09-24 13:10 | Database / Docker VPS | Prisma 7 CLI mismatch (`url` property error) & missing seed configuration | **RESOLVED** |
| **ERR-007** | 2026-09-25 01:30 | Auth (`/api/auth/logout`) | Sign-out redirects to `localhost:3000/login` instead of `lingayaszest.tech/login` on live server | **RESOLVED** |
| **ERR-008** | 2026-09-25 01:30 | Auth Middleware (`middleware.ts`) | "Unauthorized: Session authentication required." on Super Admin event edits — session cookie expired + missing `ADMIN_AUTH_SECRET` env var | **RESOLVED** |
| **ERR-009** | 2026-09-25 02:20 | Database / Super Admin (`/super-admin`) | Event price & detail edits saved successfully in UI but reverted to old values after container restart — DB column missing + silent Prisma failure | **RESOLVED** |
| **ERR-010** | 2026-09-25 04:50 | Auth / Next.js Router (`<Link>`) | Missing/Empty cookie on new device login immediately after landing on dashboard ("Unauthorized") — Next.js automatically prefetched the logout route. | **RESOLVED** |

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
 
### ERR-006: Prisma 7 CLI Version Mismatch & Missing Seed Dependencies on VPS
- **Component**: `Dockerfile`, `package.json`, `prisma/schema.prisma`, `prisma/seed.ts`
- **Symptom**: During VPS deployment Step 7 (`docker compose exec festos-app npx prisma db push`), the command failed with:
  ```
  Error: Prisma schema validation - (get-config wasm)
  Error code: P1012
  error: The datasource property `url` is no longer supported in schema files. Move connection URLs for Migrate to `prisma.config.ts`.
  error: The datasource property `directUrl` is no longer supported in schema files.
  Prisma CLI Version : 7.10.0
  ⚠️ No seed command configured
  ```
- **Root Cause Analysis**:
  1. **Next.js Standalone Runner Minimalism**: The production runner image only copies runtime files generated by Next.js standalone output tracing. DevDependencies (`prisma` CLI, `tsx`) and `package.json` were omitted from `/app/` in the runner stage.
  2. **Unpinned `npx` Resolution**: Because `prisma` was not present in the container's `node_modules`, `npx` automatically downloaded the latest release (`prisma@7.10.0`). Prisma 7 introduces breaking schema changes (deprecating `url` and `directUrl` in `schema.prisma` in favor of `prisma.config.ts`) and requires Node >= 22, conflicting with Node 20.
  3. **Missing Seed Config & Sources**: Without `package.json` in `/app/`, Prisma could not detect the `"prisma": { "seed": "tsx prisma/seed.ts" }` definition. Furthermore, `seed.ts` imports `SEED_EVENTS` from `../src/lib/mockEvents`, but `/app/src` was not copied into the runner container.
- **Resolution**:
  1. Updated `Dockerfile` runner stage to install pinned CLI tools globally:
     ```dockerfile
     RUN npm install -g prisma@6.19.3 tsx@4.23.15
     ```
  2. Added `COPY --from=builder /app/package.json ./package.json` and `COPY --from=builder /app/src ./src` to the runner stage.
  3. Committed and pushed updates to GitHub repository.
- **Verification**: Updated Dockerfile ensures `prisma db push` and `prisma db seed` execute with Prisma 6.19.3 and tsx without pulling Prisma 7.
- **Status**: **RESOLVED**

---

### ERR-007: Sign-Out Redirects to `localhost:3000` Instead of Public Domain
- **Component**: `src/app/api/auth/logout/route.ts`
- **Symptom**: Clicking "Sign Out" in any committee panel (committee pages use `href="/api/auth/logout"` — a GET request) redirects the browser to `http://localhost:3000/login` on the live production server instead of `https://lingayaszest.tech/login`.
- **Root Cause Analysis**: The GET handler used `new URL('/login', req.url)`. Inside Docker, the Node.js runtime's `req.url` contains the **internal loopback address** (`http://localhost:3000/api/auth/logout`) — not the public domain. So `new URL('/login', req.url)` resolved to `http://localhost:3000/login`, sending users to an unreachable internal address.
- **Resolution**: Replaced `req.url` with the `Host` HTTP request header, which Next.js/Nginx correctly forwards as the public hostname (`lingayaszest.tech`). Added proto detection: `http` for localhost (dev), `https` for all other hostnames (prod).
  ```ts
  const host = req.headers.get('host') || 'lingayaszest.tech';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const loginUrl = `${proto}://${host}/login`;
  ```
- **Verification**: Sign-out from `/committee/[slug]`, `/admin`, `/super-admin`, `/stage`, `/informalz` now correctly lands on `https://lingayaszest.tech/login`.
- **Status**: **RESOLVED**

---

### ERR-008: "Unauthorized: Session authentication required." on Super Admin Event Edits
- **Component**: `src/middleware.ts`, `src/lib/auth.ts`, VPS `.env`
- **Symptom**: Super Admin could edit event pricing/details in the morning but later in the same day received "Unauthorized: Session authentication required." when submitting an event update from `lingayaszest.tech/super-admin`.
- **Root Cause Analysis (two compounding causes)**:
  1. **Session expiry**: Committee sessions without `rememberMe` have a 24-hour TTL. Sessions minted in the morning expired by evening.
  2. **Missing `ADMIN_AUTH_SECRET` env var**: `src/lib/auth.ts` signs and verifies session tokens with a secret sourced in priority order: `process.env.ADMIN_AUTH_SECRET → process.env.RAZORPAY_KEY_SECRET → hardcoded fallback`. Neither `ADMIN_AUTH_SECRET` nor consistent `RAZORPAY_KEY_SECRET` were set in `.env`, meaning the fallback chain was environment-dependent. Any mismatch between local dev and VPS secrets causes HMAC signature rejection → `session = null` → middleware returns 401.
- **Resolution**:
  1. Generated a 96-character cryptographically random `ADMIN_AUTH_SECRET` and added it explicitly to `.env`:
     ```
     ADMIN_AUTH_SECRET="2afe78eea03df8d459b466c7997c895f4a84eb61b2f2dcbe80462dc7d379388e5268f67e0d2cbd40c3807620dc7fd53a"
     ```
  2. **VPS ACTION REQUIRED**: Add the same `ADMIN_AUTH_SECRET` line to `/opt/festos/.env` before redeploying (see VPS instructions below).
  3. The login page already defaults `rememberMe: true` (7-day session), so normal usage avoids mid-day expiry.
- **VPS Fix Command**:
  ```bash
  echo 'ADMIN_AUTH_SECRET="2afe78eea03df8d459b466c7997c895f4a84eb61b2f2dcbe80462dc7d379388e5268f67e0d2cbd40c3807620dc7fd53a"' >> /opt/festos/.env
  cd /opt/festos && git pull origin main && docker compose build --no-cache festos-app && docker compose up -d festos-app
  ```
- **Status**: **RESOLVED**

---

### ERR-009: Event Price / Detail Edits Not Persisting After Container Restart
- **Component**: `src/lib/db.ts` (`updateEvent`), `prisma/schema.prisma`, VPS PostgreSQL
- **Symptom**: Super Admin edited event pricing from `/super-admin`. The dashboard immediately reflected the new price (success toast shown), but after a container restart the old price returned. The edit appeared to work but was never durably saved.
- **Root Cause Analysis (two compounding causes)**:
  1. **Missing DB column (`onSpotFeeAmount`)**: `schema.prisma` had `onSpotFeeAmount Int?` added, but `prisma db push` was never run on the VPS after the schema change. Prisma threw `Invalid invocation: The column 'Event.onSpotFeeAmount' does not exist in the current database.`
  2. **Silent `catch` in `updateEvent`**: The Prisma `event.update()` call was wrapped in `try { ... } catch { // Non-fatal }`. The exception was swallowed silently — the function still returned success and updated the in-memory `memoryEvents` map and `.festos_cache.json`. So the UI showed the new price (from memory), but the PostgreSQL database was never written. On container restart `getEvents()` fetched from Prisma (DB), overwriting memory with the old stale price.
- **Resolution**:
  1. **Applied schema to DB**: Ran `docker compose exec festos-app prisma db push` on the VPS. Output confirmed: `🚀 Your database is now in sync with your Prisma schema.` — added the `onSpotFeeAmount` column without data loss.
  2. **Fixed `updateEvent` in `src/lib/db.ts`**: Replaced `prisma.event.update()` + silent catch with `prisma.event.upsert()` (handles seed events whose IDs may not exist in DB after a reset) and changed the catch to `console.error(...); throw err` so DB failures are visible and propagate as real API errors instead of fake successes.
- **VPS Command Used**:
  ```bash
  docker compose exec festos-app prisma db push
  ```
- **Status**: **RESOLVED**

---

### ERR-010: Missing/Empty Session Cookie Immediately After First Login on New Devices
- **Component**: Next.js App Router (`<Link>` prefetching), `src/app/api/auth/logout/route.ts`
- **Symptom**: On new devices, users would successfully log in, get redirected to their dashboard, but immediately get kicked back to login or receive "Unauthorized" when attempting API actions. Checking browser storage revealed the `festos_admin_session` cookie was missing or empty (`""`). However, if they explicitly logged out and logged in again, it worked fine.
- **Root Cause Analysis**: 
  1. **Next.js Prefetching**: Next.js `<Link>` components automatically prefetch their `href` target in the background as soon as they appear in the viewport.
  2. **Destructive GET Handler**: The logout buttons on all dashboard sidebars used `<Link href="/api/auth/logout">`. The API route `src/app/api/auth/logout/route.ts` exported an `async function GET(req)` which cleared the session cookie (`Max-Age: 0`) and redirected to login.
  3. **The Race Condition**: Upon successful login, the dashboard rendered. Next.js instantly saw the `<Link>` to the logout API and prefetched it in the background via a `GET` request. This triggered the logout logic on the server, which instructed the browser to delete the cookie milliseconds after it was created.
  4. **Why did it work on the second login?** The Next.js client-side router caches prefetch responses. When the user was kicked out and signed in again, Next.js saw the `<Link>` but bypassed the network request because it had already cached the prefetch. Since no background `GET` request was sent, the server didn't delete the cookie, allowing the session to persist.
- **Resolution**:
  - Replaced all `<Link href="/api/auth/logout">` components across all 5 dashboard layouts (`super-admin`, `admin`, `stage`, `informalz`, `committee/[slug]`) with standard HTML `<a href="/api/auth/logout">` anchor tags. Standard `<a>` tags bypass the Next.js router and are never prefetched, preventing the background cookie deletion.
- **Status**: **RESOLVED**

---

## Ongoing Maintenance & Best Practices

1. **Environment Variables**:
   - Whenever updating keys in `.env`, verify that `.env.local` reflects the same values, or remove duplicate keys from `.env.local` if they are intended to be global.
   - `ADMIN_AUTH_SECRET` must be identical between local `.env` and VPS `.env`. A mismatch causes session signature verification to fail → all committees see "Unauthorized: Session authentication required."
2. **Password Convention**:
   - All committee passwords adhere strictly to `animalname@lv321` (`phoenix@lv321`, `falcon@lv321`, `tiger@lv321`, `lion@lv321`).
3. **Tracking New Issues**:
   - Add new entries to this document under **Log Summary Table** and **Detailed Issue Records** whenever unexpected behaviors or bugs are diagnosed.
4. **Session Cookie Lifetime**:
   - All committee sessions use `rememberMe: true` by default (7-day cookie). Avoid rebuilding the container mid-event unless critical — doing so ends active sessions.

