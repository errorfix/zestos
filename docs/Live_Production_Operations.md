# FestOS v2.0 • Live Production Operations & Maintenance Guide

This document contains official operational procedures, live endpoint links, role-based committee credentials, daily backup routines, the Operator Audit Logging architecture, and maintenance workflows for the live deployment at **https://lingayaszest.tech**.

---

## 1. Live Deployment Details & Endpoints

| Resource | Value / URL |
| :--- | :--- |
| **Domain** | **[https://lingayaszest.tech](https://lingayaszest.tech)** |
| **Server Host IP** | `187.126.114.119` (Hostinger Ubuntu 24.04 LTS VPS) |
| **TTL** | 150 |
| **Reverse Proxy** | Nginx 1.24 (Port 80/443 with Let's Encrypt SSL) |
| **Application Runtime** | Next.js 16 (Standalone Node 20 inside Docker) |
| **Database Engine** | PostgreSQL 16 Alpine (Internal Docker Network `db:5432`) |
| **Database Storage** | Persistent NVMe Volume `postgres_data` |

### Core Web Endpoints
- **Public Festival Landing Page**: `https://lingayaszest.tech/`
- **Student Event Registration**: `https://lingayaszest.tech/register`
- **Committee Login Portal**: `https://lingayaszest.tech/login`
- **Gate Physical QR Check-in**: `https://lingayaszest.tech/checkin`
- **On-Spot Registration Desk**: `https://lingayaszest.tech/onspot`
- **Higher Authority Observational Console**: `https://lingayaszest.tech/management`

---

## 2. Committee Access & Role Passwords

Committee personnel log in directly at `https://lingayaszest.tech/login`. The system automatically sets an encrypted JWT HTTP-only cookie and redirects them to their designated panel:

| Committee Role | Environment Variable | Accessible Panel Route | Responsibilities & Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `SUPER_ADMIN_PASSWORD` | `/super-admin` | Universal oversight, Boolean Access Flags matrix, event editing, and full audit logs. |
| **Registration & Invitation (R&I)** | `RI_COMMITTEE_PASSWORD` | `/admin` | Attendee rosters for competitive events, gate check-in, on-spot walk-ins. |
| **Informalz Committee** | `INFORMALZ_COMMITTEE_PASSWORD` | `/informalz` | Day 1 / Day 2 Informalz passes (₹150/₹300), game rosters, pass check-ins. |
| **Stage & AV Committee** | `STAGE_COMMITTEE_PASSWORD` | `/stage` | Track audio link uploads, sound cues, performer check-in. |
| **Cultural Music Committee** | `MUSIC_COMMITTEE_PASSWORD` | `/committee/music` | Music band battles, vocal solo rosters, and sound tracks. |
| **Cultural Dance Committee** | `DANCE_COMMITTEE_PASSWORD` | `/committee/dance` | Step Up dance, duet, group choreography rosters & audio tracks. |
| **Cultural Fashion Committee** | `FASHION_COMMITTEE_PASSWORD` | `/committee/fashion` | Vogue runway teams, participant rosters, theme tracks. |
| **Cultural Theatre Committee** | `THEATRE_COMMITTEE_PASSWORD` | `/committee/theatre` | Rangmanch, Nukkad Natak, street play rosters. |
| **Literary & Quizzing Committee** | `LITERARY_COMMITTEE_PASSWORD` | `/committee/literary` | Debate, quiz, and literary competition rosters. |
| **Esports & Gaming Committee** | `GAMING_COMMITTEE_PASSWORD` | `/committee/gaming` | BGMI, Valorant, FIFA tournament rosters. |
| **Gate Security & Check-In Team** | `CHECKIN_PASSWORD` | `/checkin` | High-speed QR scanning, offline HMAC validation, admission stamps. |
| **Higher Authority / Management** | `MANAGEMENT_PASSWORD` (or alias `MANAGEMENT`) | `/management` | Strictly read-only observational access across all committees, revenue, and audit trails. |
| **On-Spot Registration Desk** | `ONSPOT_DESK_PASSWORD` | `/desk` | Fast-track physical counter for cash and UPI on-spot registrations. |

> [!TIP]
> **Active Production Password Registry in VPS `.env`**:
> - `SUPER_ADMIN_PASSWORD`: `"phoenix@lv321"`
> - `RI_COMMITTEE_PASSWORD`: `"falcon@lv321"`
> - `INFORMALZ_COMMITTEE_PASSWORD`: `"tiger@lv321"`
> - `STAGE_COMMITTEE_PASSWORD`: `"lion@lv321"`
> - `MUSIC_COMMITTEE_PASSWORD`: `"Music@Zest26_1pY"`
> - `DANCE_COMMITTEE_PASSWORD`: `"Dance@Zest26_3rQ"`
> - `FASHION_COMMITTEE_PASSWORD`: `"Fashion@Zest26_5wN"`
> - `THEATRE_COMMITTEE_PASSWORD`: `"Theatre@Zest26_8dT"`
> - `LITERARY_COMMITTEE_PASSWORD`: `"Lit@Zest26_2sM"`
> - `GAMING_COMMITTEE_PASSWORD`: `"Game@Zest26_6jH"`
> - `CHECKIN_PASSWORD`: `"Gate@Zest26_8qW"`
> - `ONSPOT_DESK_PASSWORD`: `"desk@lv321"`
> - `MANAGEMENT_PASSWORD`: `"apex@lv321"`

> **Note:** For security, all passwords have been stripped from the source code. The passwords are now securely loaded from the `.env` file via `process.env` lookups. If a password environment variable is missing, that role's panel becomes inaccessible.

---

## 3. Security & Operator Audit Logging System

To meet stringent university accountability standards, FestOS implements an automated, immutable audit logging architecture.

### 3.1 Operator Identity Check-In Modal
- **Trigger**: When an operator accesses any committee console (`/admin`, `/super-admin`, `/stage`, `/committee/*`, `/onspot`, `/informalz`, `/management`), an immediate modal prompts for identification if not already registered in the browser session.
- **Fields Captured**:
  - **Designation**: Student Desk In-Charge (`STUDENT`) or Faculty Staff In-Charge (`FACULTY`).
  - **Full Legal Name**: (e.g. *Rohit Sharma* or *Dr. Priya Verma*).
  - **Identifier**: Student University Roll Number or Faculty Employee ID (e.g. *21BCSE104* or *FAC-882*).
- **Session Persistence**: Stored in a browser cookie (`festos_operator_session`) and `localStorage`.
- **Desk Operator Badge**: Header features a persistent badge displaying the active operator with a **"Switch"** button to allow smooth desk handovers during shifts.

### 3.2 Audit Log PostgreSQL Schema (`AuditLog`)
Every data mutation automatically records an entry in the PostgreSQL `AuditLog` table:

```prisma
model AuditLog {
  id              String   @id @default(cuid())
  targetId        String   // Object ID of the modified entity (Registration ID, Event ID, Ticket ID, etc.)
  action          String   // e.g. UPDATE_STAGE_TRACK, EDIT_EVENT, CREATE_EVENT, TOGGLE_COMMITTEE_FLAG, ONSPOT_REGISTRATION, TICKET_CHECKIN
  targetType      String   // e.g. REGISTRATION, EVENT, STAGE_TRACK, COMMITTEE_FLAG, TICKET
  operatorName    String   // Student Name or Faculty Name
  operatorRollNo  String   // Roll Number or Faculty ID
  operatorType    String?  @default("STUDENT") // STUDENT or FACULTY
  committeeRoleId String   // Committee Role under which mutation was performed
  changes         String?  // JSON stringified diff of modified fields
  createdAt       DateTime @default(now())

  @@index([targetId])
  @@index([operatorRollNo])
  @@index([action])
  @@index([createdAt])
}
```

### 3.3 Mutation Audit Coverage
The following system endpoints automatically capture the operator identity and target Object ID:
1. **Stage Tracks & AV Cues** (`PATCH /api/stage/tracks`):
   - Logs `UPDATE_STAGE_TRACK` with `targetId = registrationId`, sound notes, and audio link.
2. **Event Configuration** (`POST /api/super-admin/events`):
   - Logs `CREATE_EVENT` and `EDIT_EVENT` with `targetId = eventId`, fees, dates, and rule changes.
3. **Committee Access Flags** (`POST /api/super-admin/flags`):
   - Logs `TOGGLE_COMMITTEE_FLAG`, `BULK_UPDATE_FLAGS`, and `RESET_COMMITTEE_FLAGS`.
4. **On-Spot Registration Desk** (`POST /api/onspot`):
   - Logs `ONSPOT_REGISTRATION` with `targetId = registrationId`, fee collected, and tickets issued.
5. **Gate Check-In Admission** (`POST /api/checkin`):
   - Logs `TICKET_CHECKIN` with `targetId = ticketCode` and attendee name.

### 3.4 Real-Time Audit Trail Viewer (Super Admin Exclusive)
The live audit feed powered by `<AuditLogsViewer />` is **strictly exclusive to the Super Admin Panel** (`/super-admin`) and is blocked for all other panels (including Management and other committees):
- **Real-Time Live Stream (3.5s Polling)**: Automatically polls the PostgreSQL database every 3.5 seconds with an active radar beacon (`● REAL-TIME STREAM ACTIVE`) and a **Pause / Resume** toggle.
- **Instant Event Flash Ticker**: When any desk operator anywhere modifies a record (e.g. tracks, passes, events, check-ins), an animated real-time notification banner flashes at the top of the Super Admin console.
- **Backend API Isolation**: Endpoint `/api/admin/audit-logs` strictly enforces `session.roleId === 'SUPER_ADMIN'`, returning HTTP 403 Forbidden to any other session.
- **Filtering & Search**: Instant client-side search by operator name, roll number, action, or target ID with action-type dropdown filters.
- **Expandable Diffs**: Collapsible JSON diff viewer revealing the exact modified parameters and previous state.
- **One-Click CSV Export**: Allows downloading complete chronological records with timestamps, roll numbers, and action names for offline auditing.

---

## 4. Mobile View Responsive Design Optimizations

To ensure seamless operation on Android smartphones (360px – 412px viewports) used by campus attendees and desk volunteers:
- **Navbar Header**: Scaled from 80px (`h-20`) to 64px (`h-16 sm:h-20`) on mobile; University crest resized to `w-9 h-11`; subtitle automatically truncates gracefully.
- **Hero Typography**: Headline scales smoothly as `text-3xl xs:text-4xl sm:text-6xl`; UGC accreditation badge truncates cleanly without causing horizontal scrollbars.
- **Action Buttons**: Formatted as full-width responsive buttons (`flex-col xs:flex-row`) to prevent awkward button wrapping on narrow screens.
- **Countdown Timer**: Compact padding (`p-3 sm:p-5`), responsive typography (`text-lg sm:text-3xl`), and tight grid spacing (`gap-1.5 sm:gap-3`) preventing card overflows.
- **Metric Cards**: Resized to `p-2.5 sm:p-3.5` with `text-lg sm:text-2xl` font sizes for 2-column mobile grid.

---

## 5. Automated Daily Database Backups

Automated daily backup routine on the VPS:

### Backup Script Location: `/opt/festos/backup.sh`
```bash
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/festos"
mkdir -p "$BACKUP_DIR"

# Dump database directly from the running container into a compressed .sql.gz
docker compose -f /opt/festos/docker-compose.yml exec -T db pg_dump -U postgres zestos | gzip > "$BACKUP_DIR/zestos_$TIMESTAMP.sql.gz"

# Retain the last 14 days of backups, delete older snapshots
find "$BACKUP_DIR" -type f -name "zestos_*.sql.gz" -mtime +14 -exec rm {} \;
```

### Automated Midnight Cron Schedule (Runs daily at 02:00 AM)
```bash
crontab -l
# Expected output:
# 0 2 * * * /opt/festos/backup.sh
```

---

## 6. How to Deploy Updates from GitHub to Live Server

Whenever code changes are committed and pushed to GitHub (`main` branch), apply them on the live VPS with:

```bash
cd /opt/festos && git pull origin main && docker compose build --no-cache festos-app && docker compose up -d festos-app
```

### When Prisma Schema Changes (`prisma/schema.prisma` modified)
If the update includes database schema modifications (new models, new columns, or index updates), apply the schema changes to the live PostgreSQL container immediately after starting the app:

```bash
docker compose exec festos-app npx prisma db push
```

> [!NOTE]
> `npx prisma db push` synchronizes the live PostgreSQL database with `schema.prisma` safely without resetting existing tables. All registered participants, tickets, and audit logs are preserved in the persistent `postgres_data` volume.

---

## 7. Email Dispatch System (Resend)

Official passes are delivered via the Resend API (`src/lib/email.ts`):
- **API Key**: Managed in environment variable `RESEND_API_KEY`.
- **Sender Address**: `passes@lingayaszest.tech` (or verified domain address).
- **Trigger**: Automatic upon payment confirmation (Razorpay online or desk on-spot issuance).

---

## 8. Participant Data Edit Permission Flag System

### Overview
Only **Super Admin** (`/super-admin`) and **R&I Committee** (`/admin`) can edit participant records by default. All other committee panels are locked to read-only. The Super Admin can grant or revoke edit access per-panel in real-time through the **Committee Flags Manager** in the Super Admin dashboard.

### How Editing Works
1. **Super Admin toggles** the *"Allow Participant Data Edits"* switch in the Committee Flags Manager for a given panel.
2. The flag is persisted to disk (`.festos_committee_edit_flags.json`) and memory-cached.
3. When a committee panel loads `/api/admin/registrations`, the response includes `canEditParticipants: true/false`.
4. If `canEditParticipants` is `true`, an **"Edit"** button appears in each row of the Attendee Registry table.
5. Clicking "Edit" opens the `EditParticipantModal` — a full-form editor for: Lead Name, Email, Phone, College, Payment Status, Day Pass Option, Stage Track URL, AV Notes, and all Team Members.
6. On save, a `PATCH /api/admin/registrations` request is dispatched. The API verifies the session's edit permission, updates PostgreSQL via Prisma (`updateRegistrationParticipantData`), and syncs to in-memory cache.
7. An **immutable Audit Log entry** is created in the `AuditLog` table with: `action: UPDATE_PARTICIPANT_DATA`, `targetId: <registrationId>`, the operator's name, roll number, committee role, and timestamp — viewable only in the Super Admin real-time audit log viewer.

### Management Panel Restriction
- The **Management panel** (`/management`) is permanently set to read-only at the API layer (`MANAGEMENT` role is blocked in the PATCH handler regardless of any flag state).
- The Flags Manager UI also disables the toggle for `MANAGEMENT` with a tooltip explaining the permanent restriction.

### Flag Storage
| File | Purpose |
| :--- | :--- |
| `.festos_committee_flags.json` | Event category visibility flags per committee |
| `.festos_committee_edit_flags.json` | Participant data edit permission flags per committee |

Both files are git-ignored and persist across container restarts via the NVMe volume at `/opt/festos`.

---

## 9. College Contingent Registration Architecture & Data Structure

### 9.1 Multi-Event Cart & Contingent Registration Flow (`/register/college`)
To accommodate delegations competing across multiple activities (including solo, duet, and group events) without triggering false minimum-order penalties, the college registration follows a **Multi-Event Contingent Cart Architecture**:

1. **Institute Identification**:
   - Searchable Combobox / Creatable Select component.
   - Preloaded with known universities/institutes.
   - Allows typing fuzzy search; if college is not present, allows adding a new institution.
   - Prominent notice: *"Please ensure your Institution Name is entered with proper casing and official formatting (e.g. 'Lingaya's Vidyapeeth', 'Amity University Noida')."*

2. **Squad Entry & Event Selection**:
   - Select event from dropdown.
   - **Entry #1 is explicitly designated as the Team Leader** (Name, Personal Mobile, Photo).
   - Additional entries for team members (Name, Personal Mobile, Photo).
   - Validation Notice: *"Every student must provide their own personal mobile number. Do NOT enter coordinator or faculty phone numbers. Each attendee receives their personal Day-wise QR pass linked to this phone number."*
   - Operator/Contingent Leader clicks **"Add Event Squad to Contingent"** to push to cart.

3. **Multi-Event Cart & Summary**:
   - The contingent can add multiple events (e.g., Solo Singing, Duet Dance, Battle of Bands, Street Play).
   - Live summary calculates:
     - Total Unique Participants.
     - Day 1 Unique Passes.
     - Day 2 Unique Passes.
     - Itemized fee calculation with Day 1 tier and Day 2 flat fees.
     - Minimum Order Floor check (₹1,000 threshold).
   - Single unified Razorpay checkout for the entire contingent.

### 9.2 Exact Pricing & Tier Calculation Engine
Campus entry is tokenized on a per-day, per-person basis:

1. **Quota Calculation (20-Participant Threshold)**:
   - A college has a quota of **20 participants** eligible for the discounted rate.
   - The quota counter $N_{\text{quota}}$ includes **all unique participants registered across both Day 1 and Day 2**.
2. **Day 1 Pricing (October 30)**:
   - For Day 1 participants within the college's first 20 participants: **₹100 / person**.
   - For Day 1 participants from the 21st participant onwards: **₹150 / person**.
3. **Day 2 Pricing (October 31)**:
   - Day 2 participants are **always ₹150 / person** (no discounted tier).
   - Day 2 participants still consume slots toward the college's 20-participant quota.
4. **Minimum Order Floor**:
   - Each contingent checkout submission enforces a **minimum total charge of ₹1,000**.
   - If the calculated participant sum is < ₹1,000 (e.g. 8 Day 1 participants = ₹800), the cart total automatically floors to ₹1,000.
5. **Super Admin Event Exception Surcharges**:
   - In `/super-admin`, a dedicated **"College Registration Event Pricing Exceptions"** manager provides dropdown controls to mark specific events as exceptions:
     - **Mode A (Additive)**: Event fee is added on top of the campus entry fee.
     - **Mode B (Replacement)**: Event fee replaces the campus entry fee for participants in that activity.
     - Default for all other events: Standard campus entry fee rules apply.

### 9.3 Day-Wise QR Pass Deduplication Engine
- Keyed on `(phoneNumber, festivalDay)`.
- If *Aryan* participates in 3 different events on Day 1: **Exactly 1 Day 1 QR Pass is generated**.
- If *Aryan* participates in an event on Day 1 and an event on Day 2: **Exactly 2 passes are generated (1 for Day 1, 1 for Day 2)**.
- If a phone number is registered again in a subsequent contingent submission under the same institution, the system verifies their existing Day pass in PostgreSQL and links it rather than creating duplicate ticket codes.

### 9.4 Separated Committee Observational & Audit Consoles
To prevent mixing with individual registrations, a dedicated **"College Delegations"** tab is embedded in:
- **R&I Committee Panel** (`/admin`)
- **Super Admin Console** (`/super-admin`)
- **Higher Authority Panel** (`/management`)

**Hierarchical Roster Drilldown**:
```
[Select College / Institute Dropdown]
   └── [Team Leader Card: Name, Phone, Total Events, Total Contingent Size]
        └── [Participated Event Accordion]
             └── [Expandable Attendee Roster]
                  ├── #1 Team Leader (Badge, Phone, Photo, QR Pass Day 1/2)
                  ├── #2 Participant (Phone, Photo, QR Pass Day 1/2)
                  └── #3 Participant (Phone, Photo, QR Pass Day 1/2)
```

### 9.5 Prisma Schema Updater Code
```prisma
model InstituteRegistration {
  id                String                 @id @default(cuid())
  instituteName     String
  leaderName        String
  leaderEmail       String
  leaderPhone       String
  totalAmount       Int                    // Paid in paise (inclusive of ₹1,000 floor)
  paymentStatus     String                 @default("PENDING") // PENDING, PAID, FAILED
  paymentMethod     String?                @default("ONLINE_RAZORPAY")
  razorpayOrderId   String?                @unique
  razorpayPaymentId String?                @unique
  participants      InstituteParticipant[]
  createdAt         DateTime               @default(now())

  @@index([instituteName])
  @@index([leaderPhone])
}

model InstituteParticipant {
  id             String                @id @default(cuid())
  registrationId String
  registration   InstituteRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  eventId        String
  event          Event                 @relation(fields: [eventId], references: [id])
  fullName       String
  phone          String
  photoUrl       String?
  isTeamLeader   Boolean               @default(false)
  festivalDay    String?               // DAY_1, DAY_2, BOTH_DAYS
  ticketCode     String?               // Unique day-wise ticket code
  createdAt      DateTime              @default(now())

  @@index([phone])
  @@index([instituteName, phone])
}
```

### 9.6 Deployment Execution Requisites on Live VPS
Apply schema modifications and container updates on `/opt/festos`:
```bash
# 1. Pull latest code
cd /opt/festos && git pull origin main

# 2. Synchronize PostgreSQL database schema safely (non-destructive)
docker compose exec festos-app npx prisma db push

# 3. Rebuild and launch the application container
docker compose build --no-cache festos-app && docker compose up -d festos-app
```

---

## 10. Higher Authority (`/management`) Environment Configuration & Password Troubleshooting

### 10.1 Root Cause & Resolution
On the live VPS `/opt/festos/.env`, the credential variable was named `MANAGEMENT="<password>"` or `management="<password>"`, whereas `src/lib/auth.ts` looked solely for `MANAGEMENT_PASSWORD`.

`src/lib/auth.ts` has been updated to evaluate:
```typescript
password: process.env.MANAGEMENT_PASSWORD || process.env.MANAGEMENT || process.env.management || '',
```
Both variable names (`MANAGEMENT` and `MANAGEMENT_PASSWORD`) are now fully supported.

### 10.2 Reloading `.env` Changes in Docker
Docker Compose reads `.env` **only during container creation**. If `/opt/festos/.env` was modified while the container was running, Docker continues using the old values until re-created.

To reload updated passwords from `.env` on the VPS without a full image rebuild:
```bash
cd /opt/festos && docker compose up -d festos-app
```
This restarts `festos-app` with the active environment variables in ~3 seconds.


