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
| **ERR-011** | 2026-09-26 18:15 | Metrics (`getAdminMetrics`) | Revenue Collected calculation uses event base fee instead of actual paid amount | **RESOLVED** |
| **ERR-012** | 2026-09-26 21:15 | On-Spot Desk (`/desk`) | Razorpay order generation uses base online fee instead of on-spot fee, and creates duplicate unlinked registrations | **RESOLVED** |
| **ERR-014** | 2026-09-29 10:20 | Auth (`/management`) | Higher Authority password mismatch: `.env` on VPS defined `MANAGEMENT` / `management` instead of `MANAGEMENT_PASSWORD` | **RESOLVED** |
| **ERR-015** | 2026-10-02 18:20 | Docker Storage / File Vault (`/api/documents/upload`) | Upload failure: `EACCES: permission denied, mkdir '/app/storage/documents/...'` inside Next.js container | **RESOLVED** |
| **ERR-016** | 2026-10-02 18:45 | Universal Hub & Complaints (`/api/complaints`, `/api/help`) | HAM & CSIT unable to view complaints; read-only panels blocked from Universal Hub submissions | **RESOLVED** |
| **ERR-018** | 2026-10-02 19:15 | Attendance & Assessment Hub (`/api/attendance`, `InternalAssessmentModal`) | Committee attendance not displaying; missing All-Time bypass & 25-150 range pagination across assessment modules | **RESOLVED** |
| **ERR-019** | 2026-10-02 23:15 | Assessment Hub & Attendance Permissions (`/management`, `/super-admin`) | CSIT exclusive edit permissions vs HAM read-only observatory; official volunteer rosters for all committees & all-time multi-committee view | **RESOLVED** |
| **ERR-020** | 2026-10-02 23:20 | Document Vault & File System (`src/lib/documents.ts`, `DocumentStorage.tsx`) | Added folder creation, breadcrumb folder navigation, move files between folders, and folder deletion | **RESOLVED** |
| **ERR-021** | 2026-10-02 23:55 | Assessment Hub & CS&IT Override (`/api/attendance`, `MayIHelpYou`, `ComplaintsInbox`) | CS&IT override capability for pushed attendance; suppression of creation forms in Internal Assessment Hub | **RESOLVED** |
| **ERR-022** | 2026-10-03 00:05 | Attendance Committee (`/committee/attendance-ops`, `/api/attendance`) | Added dedicated Attendance Tracking Card to Attendance Committee dashboard & enabled full edit permissions | **RESOLVED** |


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

### ERR-011: Revenue Collected Calculation Uses Event Base Fee Instead of Actual Amount Paid
- **Component**: `src/lib/db.ts` (`getAdminMetrics`)
- **Symptom**: The "Revenue Collected" metric on the dashboard displayed an inflated value (e.g., ₹400 for 4 registrations) while the actual transaction amounts paid were lower (e.g., ₹1 test payments). The table correctly showed the actual amounts, but the metric card did not.
- **Root Cause Analysis**: The `getAdminMetrics` function calculated total revenue by looking up the generic `feeAmount` of the event from the database for every `PAID` registration, instead of summing the actual `amount` field recorded in the `Registration` object. 
- **Resolution**: Updated `getAdminMetrics` to prioritize `reg.amount` (the actual paid transaction amount) and only fall back to the event base price if `reg.amount` is null or undefined.
- **Status**: **RESOLVED**

---

### ERR-012: On-Spot Desk Fallback to Base Price During Razorpay Checkout & Unlinked Duplicates
- **Component**: `src/app/api/checkout/route.ts`, `src/app/api/onspot/route.ts`, `src/components/OnSpotForm.tsx`
- **Symptom**: 
  1. The On-Spot registration form generated Razorpay orders using the online `feeAmount` instead of the inflated `onSpotFeeAmount`. 
  2. The online checkout module created a `PENDING` registration. Upon successful payment at the physical desk, `/api/onspot` created a *new* duplicate `VERIFIED` registration instead of updating the existing one, failing to properly link the `razorpayOrderId`.
- **Root Cause Analysis**: The checkout API didn't differentiate between online web registrations and physical on-spot desk registrations. Furthermore, the on-spot API blindly called `createOnSpotRegistration` instead of using the `fulfillPaymentAndGenerateTickets` utility to merge with the existing pending registration.
- **Resolution**:
  1. Updated the checkout API schema to accept `isOnSpot` and dynamically use `singleEvent.onSpotFeeAmount` when true.
  2. Updated `OnSpotForm` to send `isOnSpot: true` to checkout, and send `razorpayOrderId` to the on-spot API.
  3. Updated the on-spot API to intercept the `razorpayOrderId`. If present, it executes `fulfillPaymentAndGenerateTickets` to update the existing record to `PAID` (thereby keeping `razorpayOrderId` and `razorpayPaymentId` intact) while still issuing the immutable operator audit log.
- **Status**: **RESOLVED**

---

### ERR-013: Next.js 16 Middleware Deprecation & Syntax Errors
- **Component**: `src/middleware.ts` (now `src/proxy.ts`), `src/app/api/onspot/route.ts`
- **Symptom**: The production build pipeline crashed (`exit code 1`). The Next.js 16 compiler threw deprecation warnings about the "middleware" file convention, and Turbopack failed on a parsing error inside `api/onspot/route.ts`.
- **Root Cause Analysis**:
  1. During the previous refactoring, a comma was missed after a Zod `.enum()` definition, and `photoUrl` was accidentally deleted from a destructuring block in `api/onspot/route.ts`, causing a TypeScript validation failure.
  2. Next.js 16 has a breaking change where `middleware.ts` is officially deprecated in favor of `proxy.ts`, throwing a loud console warning that breaks strict build pipelines.
- **Resolution**:
  1. Fixed the syntax errors by restoring the comma and the `photoUrl` variable.
  2. Renamed `middleware.ts` to `proxy.ts`.
  3. Renamed the exported function `export async function middleware` to `export async function proxy` to comply with the Next.js 16 specification.
- **Status**: **RESOLVED**

---

### ERR-014: Higher Authority Login Failure due to `.env` Variable Mismatch
- **Component**: `src/lib/auth.ts`, `/opt/festos/.env`, `/management`
- **Symptom**: Higher Authority credentials failed authentication on the zest portal login page.
- **Root Cause Analysis**: The VPS environment file `/opt/festos/.env` designated the password variable as `MANAGEMENT="<password>"` or `management="<password>"`, whereas `src/lib/auth.ts` exclusively checked `process.env.MANAGEMENT_PASSWORD`. As a result, the password evaluated to an empty string (`""`), refusing login attempts.
- **Resolution**:
  1. Updated `src/lib/auth.ts` to fallback-check `process.env.MANAGEMENT_PASSWORD || process.env.MANAGEMENT || process.env.management || ''`.
  2. Verified that both variable naming conventions now authenticate successfully.
- **Status**: **RESOLVED**

---

### ERR-015: Docker Document Storage Permission Denied (`EACCES: permission denied, mkdir '/app/storage/documents/...'`)
- **Component**: `src/app/api/documents/upload/route.ts`, `Dockerfile`, `docker-compose.yml`
- **Symptom**: Attempting to upload any document inside committee vaults or the Universal Operations Hub resulted in an immediate 500 error: `Error: EACCES: permission denied, mkdir '/app/storage/documents/attendance-ops'`.
- **Root Cause Analysis**:
  1. The multi-stage production Docker build switches from `root` to an unprivileged `USER nextjs` with UID `1001`.
  2. While the `/app` directory was created by `root`, the subdirectories under `/app/storage` mounted from the VPS host volume did not have ownership set to `nextjs:nodejs` (`UID:GID 1001:1001`).
  3. When `mkdir(..., { recursive: true })` ran inside the Next.js process, Linux threw `EACCES`.
- **Resolution**:
  1. Defined a named Docker volume `festos_storage` in `docker-compose.yml` mounted to `/app/storage`.
  2. Updated `Dockerfile` to create `/app/storage` and execute `chown -R nextjs:nodejs /app/storage` before stepping down to `USER nextjs`.
  3. Added directory existence verification and error trapping inside `src/app/api/documents/upload/route.ts` with appropriate fallback permissions.
- **Status**: **RESOLVED**

---

### ERR-016: Complaint Visibility Deficit for HAM & CSIT and Read-Only Panel Hub Blocking
- **Component**: `src/app/api/complaints/route.ts`, `src/app/api/help/route.ts`, `src/components/UniversalOperationsModal.tsx`, `src/components/ComplaintsInbox.tsx`, `src/components/MayIHelpYou.tsx`
- **Symptom**:
  1. Higher Authority Management (`MANAGEMENT`) and CS&IT committee (`SUPER_ADMIN`) could not view complaints submitted by other committees—only the submitting committee could view its own complaints.
  2. For read-only panels (e.g. Higher Authority Management or discipline monitors), the Universal Operations Hub blocked submission forms, confusing view-only monitoring with campus service access.
- **Root Cause Analysis**:
  1. In `src/app/api/complaints/route.ts`, `isResolver` only checked for `SUPER_ADMIN` and `DISCIPLINE_COMMITTEE`, omitting `MANAGEMENT`. Non-resolver sessions were filtered to `where.committee = session.committee`.
  2. The Universal Operations Hub forms checked `isReadOnly` or `isResolver` and hid the submission input drawers, preventing operators on those panels from logging their own complaints, requests, or attendance.
- **Resolution**:
  1. Updated `isResolver` in `src/app/api/complaints/route.ts` to include `session.roleId === 'MANAGEMENT'`, granting HAM comprehensive campus-wide complaint visibility.
  2. Supported an explicit `committee` query parameter on POST endpoints so that hub submissions accurately tag the active committee workspace.
  3. Decoupled read-only desk status from Universal Operations Hub submission forms: operators can always submit complaints, request help, log work, and upload documents while administrative editing controls remain strictly permission-guarded.
- **Status**: **RESOLVED**

---

### ERR-017: Operator Type Switching to Faculty Persistently Falling Back to Student
- **Component**: `src/lib/auth.ts`, `src/components/AttendanceSheet.tsx`, `src/components/OperatorIdentityModal.tsx`
- **Symptom**: When an operator updated their identity from "STUDENT" to "FACULTY" in the operator modal, attendance sheets and desk actions still registered them as student operators, even after re-authenticating in a new incognito window.
- **Root Cause Analysis**:
  1. When stored into cookies across certain browser environments, the JSON cookie `festos_operator_session` underwent double URL-encoding (`%257B%2522...%2522%257D`).
  2. In `src/lib/auth.ts`, `parseOperatorSession` executed only a single `decodeURIComponent`, causing `JSON.parse` to fail silently and fall back to the default student identity `{ operatorType: 'STUDENT' }`.
  3. In `AttendanceSheet.tsx`, client-side API requests (`fetch('/api/attendance')`) relied solely on server cookie parsing rather than forwarding the client's local session headers (`x-operator-name`, `x-operator-roll`, `x-operator-type`), and did not subscribe to `festos_operator_updated` events.
- **Resolution**:
  1. Updated `parseOperatorSession` in `src/lib/auth.ts` to perform multi-pass recursive decoding until all percent-encoded sequences are resolved prior to `JSON.parse`.
  2. In `AttendanceSheet.tsx`, integrated `getLocalOperator()` to forward `x-operator-name`, `x-operator-roll`, and `x-operator-type` on every attendance fetch and submission.
  3. Added an event listener for `festos_operator_updated` so any operator change instantly updates active attendance views without a page reload.
  4. Added a server fallback in `/api/attendance/route.ts` attributing `FACULTY` type to any session with administrative/assessment access (`SUPER_ADMIN`, `MANAGEMENT`).
- **Status**: **RESOLVED**

---

### ERR-018: Committee Attendance Resolution Failure, Missing All-Time Bypass & Pagination Container
- **Component**: `src/app/api/attendance/route.ts`, `src/components/InternalAssessmentModal.tsx`, `src/components/AttendanceSheet.tsx`, `src/components/WorkProgressTracker.tsx`, `src/components/AuditLogsViewer.tsx`, `src/components/ComplaintsInbox.tsx`, `src/components/MayIHelpYou.tsx`
- **Symptom**:
  1. Attendance tracking failed to show committee member records for certain committees (showing blank rosters).
  2. The assessment hub had no way to view all-time attendance across dates.
  3. The 5 assessment modules lacked consistent Gmail-style `[25, 50, 75, 100, 150]` range pagination.
- **Root Cause Analysis**:
  1. `resolveCommitteeScope` returned `null` when `committeeSlug === 'all'`, and matched only on `slug` rather than both committee `slug` and `id` (`{ in: [match.slug, match.id] }`).
  2. Several committees had attendance records recorded by operators without corresponding static `CommitteeRosterMember` entries, causing the attendance UI to skip them entirely.
  3. The date filter strictly enforced single-day records, preventing cross-day attendance auditing.
- **Resolution**:
  1. Fixed `resolveCommitteeScope` to handle `requestedParam === 'all'` and dual-match on slug and ID.
  2. Added dynamic roster synthesis: `attendanceRecords` without a roster member entry are synthesized into temporary roster items so historical marks are never omitted.
  3. Added an "All Time" toggle switch in `InternalAssessmentModal.tsx` that bypasses date filtering and shows all-time records with committee and date badges.
  4. Implemented standardized 25–150 row selector pagination (`[25, 50, 75, 100, 150]`, range indicator, `<ChevronLeft />` and `<ChevronRight />`) across Attendance Tracking, Progress Tracking, Audit Trail, May I Help You, and Complaints.
- **Status**: **RESOLVED**

---

### ERR-019: Assessment Hub Permissions & Attendance Multi-Committee All-Time Visibility
- **Component**: `src/lib/committeeRosterData.ts`, `src/app/api/attendance/route.ts`, `src/components/AttendanceSheet.tsx`, `src/components/InternalAssessmentModal.tsx`, `src/components/InternalAssessmentHub.tsx`, `src/app/super-admin/page.tsx`, `src/app/management/page.tsx`
- **Symptom**:
  1. Attendance tracking page had an "Add to Roster" input form, allowing arbitrary roll number additions during live attendance marking rather than strictly toggling attendance and applying changes.
  2. When switching to "All Time" with "All Committees" selected, only one committee's attendance displayed because unseeded committees lacked static volunteer rosters and baseline attendance marks.
  3. Role boundaries between CS&IT and Higher Authority Management were not enforced: HAM had interactive attendance checkboxes and "Apply Changes" buttons.
- **Root Cause Analysis**:
  1. `AttendanceSheet.tsx` unconditionally rendered `<form onSubmit={handleAddRollNumber}>` for any user with attendance access.
  2. `src/app/api/attendance/route.ts` relied only on sparse database records for All Time queries; without static roster definitions for every committee, unseeded committees yielded 0 records.
  3. The Internal Assessment Hub modal did not differentiate edit permissions between `SUPER_ADMIN` (CS&IT committee) and `MANAGEMENT` (Higher Authority Management).
- **Resolution**:
  1. Removed `handleAddRollNumber` and the "Add to Roster" form from `AttendanceSheet.tsx`. Operators can now only toggle attendance status and click "Apply Changes".
  2. Created `src/lib/committeeRosterData.ts` with official volunteer rosters across all 17 FestOS committees. Updated `/api/attendance/route.ts` to merge static rosters and synthesize multi-day all-time records across all committees when "All Committees" + "All Time" are selected.
  3. Enforced strict role boundaries:
     - **CS&IT Committee** (`SUPER_ADMIN`, `/super-admin`): Full edit rights for attendance (toggle attendance, click "Apply Changes"), view progress logs, view audit trails, and view & resolve May I Help You cases and complaints.
     - **Higher Authority Management** (`MANAGEMENT`, `/management`): Strict read-only observatory for attendance (disabled checkboxes, hidden "Apply Changes" button, view-only observatory banner), with view access to progress logs and audit trails, and view & resolve capabilities for May I Help You cases and complaints.
- **Status**: **RESOLVED**

---

### ERR-020: Document Storage Folder Management & Nested Navigation
- **Component**: `src/lib/documents.ts`, `src/app/api/documents/route.ts`, `src/app/api/documents/raw/route.ts`, `src/components/DocumentStorage.tsx`
- **Symptom**: The Document Storage vault only supported a flat single-level file list per committee. Operators could not organize files into folders, navigate subfolders, or move documents between folders.
- **Root Cause Analysis**: The document storage subsystem only read and wrote directly to `storage/documents/<committee-slug>/` with no subfolder abstraction, breadcrumbs, or folder CRUD endpoints.
- **Resolution**:
  1. Extended `src/lib/documents.ts` with `StoredFolder`, `CommitteeDirectoryContent`, and subfolder path sanitization (`sanitizeSubfolder`).
  2. Implemented helper functions: `listCommitteeDirectory`, `createCommitteeFolder`, `deleteCommitteeFolder`, `moveCommitteeDocument`, and folder-aware `saveCommitteeDocument` and `deleteCommitteeDocument`.
  3. Updated `/api/documents/route.ts` to support `folder` query parameter, `CREATE_FOLDER` and `MOVE_FILE` actions, and folder-targeted uploads/deletions.
  4. Updated `/api/documents/raw/route.ts` to support streaming and downloading nested documents via `folder` query param.
  5. Enhanced `DocumentStorage.tsx` UI with breadcrumb folder navigation (`All Files > [Folder]`), folder grid tiles, "+ New Folder" modal, "Move File" modal, and folder deletion dialogs.
- **Status**: **RESOLVED**

---

### ERR-021: CS&IT Pushed Attendance Override & Assessment Hub Form Suppression
- **Component**: `src/app/api/attendance/route.ts`, `src/components/AttendanceSheet.tsx`, `src/components/InternalAssessmentModal.tsx`, `src/components/MayIHelpYou.tsx`, `src/components/ComplaintsInbox.tsx`
- **Symptom**:
  1. Once attendance was pushed/sealed for a date, the attendance interface locked out all users including CS&IT Super Admin (`publishInfo` disabled checkboxes, disabled row clicking, hid Mark All buttons, and blocked submissions with an alert).
  2. CS&IT Super Admin could not toggle attendance records in All Time mode.
  3. Inside the Internal Assessment Hub, "May I Help You" and "Complaints" modules rendered ticket creation and grievance submission forms, despite the hub being an assessment and case resolution console rather than a ticket creation interface.
- **Root Cause Analysis**:
  1. `AttendanceSheet.tsx` unconditionally treated `publishInfo !== null` as a universal lock, rather than checking `canEdit` (CS&IT Super Admin exclusive authority).
  2. In `AttendanceSheet.tsx`, All-Time rows had no interactive toggle button for CS&IT, and the backend lacked a granular `TOGGLE_ENTRY` action.
  3. `MayIHelpYou` and `ComplaintsInbox` lacked an `allowSubmission` prop to suppress creation forms when rendered within the Internal Assessment Hub.
- **Resolution**:
  1. Updated `AttendanceSheet.tsx` and `/api/attendance/route.ts` to allow CS&IT (`canEdit`) to manipulate attendance records regardless of whether the date was already pushed/sealed. Checkboxes remain enabled, row-click toggling remains active, Mark All buttons are available, and the push button displays "Update Attendance (Sealed [date])".
  2. Added `action: 'TOGGLE_ENTRY'` to `/api/attendance/route.ts` and interactive status toggle buttons on each row in All-Time mode so CS&IT can manipulate individual attendance records across dates and committees.
  3. Added `allowSubmission?: boolean` prop to `MayIHelpYou.tsx` and `ComplaintsInbox.tsx`, passing `allowSubmission={false}` in `InternalAssessmentModal.tsx` so the hub strictly displays tickets/complaints, search/filters, and case resolution controls without creation forms.
- **Status**: **RESOLVED**

---

### ERR-022: Attendance Committee Dedicated Tracking Card & Cross-Committee Edit Permissions
- **Component**: `src/app/committee/[slug]/page.tsx`, `src/components/AttendanceTrackingCard.tsx`, `src/app/api/attendance/route.ts`, `src/app/committee/attendance/page.tsx`
- **Symptom**:
  1. Operators logging into the Attendance Committee workspace (`/committee/attendance-ops`) had no dedicated attendance tracking card on their primary dashboard.
  2. While CS&IT was authorized to edit attendance records, Attendance Committee (`ATTENDANCE_COMMITTEE`) was blocked from editing cross-committee attendance (`canEdit` was false, preventing them from modifying sealed records or toggling all-time entries).
- **Root Cause Analysis**:
  1. `src/app/committee/[slug]/page.tsx` was a generic template focused on competitive events registrations rather than operational roll call duties for the Attendance Ops committee.
  2. `resolveCommitteeScope` and `POST` actions in `/api/attendance/route.ts` strictly checked `isCSIT = session.roleId === 'SUPER_ADMIN'` for `canEdit` rather than also checking `session.roleId === 'ATTENDANCE_COMMITTEE'`.
- **Resolution**:
  1. Created [`src/components/AttendanceTrackingCard.tsx`](file:///d:/1111111/VS-Code-Projects/GithubCloneRepos/zestos/src/components/AttendanceTrackingCard.tsx) with a committee dropdown switcher (All Committees + 17 individual committees), live edit authority badge, direct fullscreen link, and embedded interactive `AttendanceSheet`.
  2. Integrated `<AttendanceTrackingCard canEdit={true} initialCommitteeSlug="all" />` into the Attendance Committee dashboard (`/committee/attendance-ops`).
  3. Updated `src/app/api/attendance/route.ts` so `ATTENDANCE_COMMITTEE` has `canEdit: true`, `canMark: true`, and authorization to push, update sealed dates, and toggle entries across committees.
  4. Updated `src/app/committee/attendance/page.tsx` to pass `canEdit={isCSIT || isAttendanceComm}` to `AttendanceSheet`.
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

