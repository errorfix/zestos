# FestOS v2.0 • System Features, Tech Stack & User Operations Architecture

> **Comprehensive Technical Blueprint & Operational Manual**  
> *Campus Fest Management, Ingress Verification & Financial Auditing Operating System*  
> *Target Campus: Lingaya's Vidyapeeth • Zest 2026*

---

## 1. Technical Architecture & Tech Stack

FestOS v2.0 is built as a high-concurrency, offline-resilient, unified full-stack web application designed to withstand thousands of simultaneous campus attendees, registrations, and gate check-ins without downtime or data loss.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                       CLIENT LAYER                                     │
│  Next.js 16 Client Components • React 19 • Tailwind CSS v4 • Lucide Icons • jsQR       │
│  Canvas Photo Compression (<100KB) • Razorpay Modal SDK • Thermal Print Media CSS      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / WebSockets / Edge Fetch
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                MIDDLEWARE & EDGE LAYER                                 │
│  src/proxy.ts • Web Crypto HMAC-SHA256 Session Validator • RBAC Route Firewall         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Dispatched Requests
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                                    APPLICATION LAYER                                   │
│  Next.js App Router API Handlers (/api/*) • React Server Components (RSC)               │
│  Dynamic Committee Flags Manager (.festos_committee_flags.json) • Audit Engine         │
└───────────────────────┬───────────────────────────────┬────────────────────────────────┘
                        │                               │
┌───────────────────────▼──────────────┐ ┌──────────────▼────────────────────────────────┐
│        DATA & PERSISTENCE            │ │             THIRD-PARTY SERVICES              │
│  PostgreSQL 16 Alpine (Docker Engine)│ │  Razorpay (Orders, Webhooks, Signature Check) │
│  Prisma ORM 6.19 (Engine / Client)   │ │  Resend API (Transactional HTML Pass Emails)  │
│  Connection Pooling & Cascading Keys │ │  Self-Hosted PostgreSQL (Hostinger VPS)      │
└──────────────────────────────────────┘ └───────────────────────────────────────────────┘
```

---

### 1.1 Frontend Architecture & Technologies
- **Core Framework**: **React 19.2** with **Next.js 16.3 (App Router)** leveraging React Server Components (RSC) for instantaneous initial page loads and Client Components for rich interactive interfaces.
- **Styling & Design System**: **Tailwind CSS v4** utilizing modern `@theme` CSS tokens, glassmorphism, responsive mobile-first grids, and specialized `@media print` style sheets engineered for 58mm/80mm thermal receipt printers and official pass PDF generation.
- **Client-Side Media & Camera Pipeline**:
  - `jsQR` HTML5 camera stream processing running directly within client request-animation-frames for real-time ticket QR code decoding.
  - HTML5 Canvas dynamic image compression pipeline: downsamples and compresses attendee webcam/file photo captures down to `<100 KB` base64 payloads before network dispatch, guarding against mobile network congestion.
- **Audio Sensory Feedback**: Web Audio synthesized cues delivering distinct audio chimes for valid check-ins and abrasive buzzer frequencies for duplicate/fraudulent scans.
- **Icons & Visual Language**: **Lucide React** iconography across all committee workspaces.

---

### 1.2 Backend & API Architecture
- **Runtime Environment**: **Node.js 20 LTS** operating in Alpine Linux containers.
- **API Architecture**: Next.js App Router API Route Handlers (`/api/*`) executing standard RESTful JSON contracts with strict request parsing and error handling:
  - `/api/checkout`: Dynamic Razorpay order creation and fee verification.
  - `/api/verify-payment`: Cryptographic verification of payment signatures.
  - `/api/onspot`: Walk-in registration terminal processing (Cash, Spot UPI, Free).
  - `/api/checkin`: Gate verification, duplicate lockout, and status transitions.
  - `/api/admin/*`: Multi-criteria queries, CSV streams, and status overrides.
  - `/api/super-admin/*`: Event CRUD, dynamic committee flags, and database maintenance.
  - `/api/webhooks`: Idempotent payment webhook listener handling asynchronous network drops.
- **State Management & Dynamic Flags**: Hybrid caching mechanism (`committeeFlags.ts`) maintaining an in-memory runtime cache synchronized with a local persistence store (`.festos_committee_flags.json`), allowing instant category permission updates without server restarts.

---

### 1.3 Database Architecture & Data Modeling
- **Database Engine**: **PostgreSQL 16** with UTF-8 encoding and optimized concurrency flags (`--lc-collate=C --lc-ctype=C`).
- **ORM & Schema Engine**: **Prisma ORM 6.19.3** with generated native Linux binary targets (`linux-musl-openssl-3.0.x`, `debian-openssl-3.0.x`).
- **Relational Schema Entities** (from `prisma/schema.prisma`):
  - **`Event`**: Stores festival events, categories, fee structures (paise integer precision), team size constraints (min/max), prize allocations, and track upload mandates.
  - **`Registration`**: Central record linking events, attendee dossiers, payment methods (`ONLINE_RAZORPAY`, `ONSPOT_CASH`, `ONSPOT_UPI`, `FREE_REGISTRATION`), payment status (`PAID`, `PENDING`, `FAILED`), and gateway identifiers (`razorpayOrderId`, `razorpayPaymentId`).
  - **`TeamMember`**: Multi-participant roster records cascaded to `Registration` (FullName, RollNumber, Phone, College, PhotoUrl).
  - **`Ticket`**: Individual attendee passes containing unique alphanumeric codes (`LV-TKT-2026-XXXX`), check-in state (`ISSUED` vs `CHECKED_IN`), check-in timestamps, and HMAC-SHA256 security hashes.
  - **`AuditLog`**: Tamper-evident ledger indexed on `targetId`, `operatorRollNo`, `action`, and `createdAt` capturing operator identity, modified diffs, and committee credentials.

---

### 1.4 Security, Cryptography & Authentication
- **Session Tokens**: Custom stateless HMAC-SHA256 signed session tokens built with standard Web Crypto API (`computeHmacSignature`, base64URL encoding). Tokens survive across Node.js runtime and Edge runtimes without external Redis/JWT dependencies.
- **Anti-Fraud Ticket Cryptography**: Every generated ticket code is hashed against a server-side secret (`HMAC_TICKET_SECRET`). The resulting cryptographic signature is embedded into the QR code and re-verified on scan to render counterfeit QR generators impossible.
- **Operator Accountability**: On-spot desk operators and admins cannot execute state changes anonymously; sessions require operator name and verified roll number, which are bound to every generated transaction.
- **Edge Route Firewall (`src/proxy.ts`)**: Evaluates incoming request paths against role definitions, enforcing physical redirects for UI pages and JSON `401`/`403` status codes for API calls.

---

### 1.5 External Integrations
- **Payment Processing**: **Razorpay Node SDK** handling INR payments, automated HMAC signature verification (`razorpay_signature`), and webhooks.
- **Transactional Email**: **Resend SDK** dispatching branded HTML passes with embedded QR code images, transaction reference IDs, and venue instructions directly to the attendee's inbox.
- **Cloud Media Assets**: Direct integration with Google Drive / cloud storage links for large performance audio/video tracks.

---

### 1.6 DevOps, Containerization & Deployment
- **Container Strategy**: Multi-stage **Dockerfile** (`node:20-alpine`) utilizing:
  1. *deps* layer for caching production modules.
  2. *builder* layer running `prisma generate` and `next build` (with `output: "standalone"`).
  3. *runner* layer executing non-root (`UID 1001: nextjs`) server binaries.
- **Orchestration**: `docker-compose.yml` linking the production Next.js app container (`festos_production`) directly to an isolated, high-performance PostgreSQL container (`festos_postgres`) with persistent Docker volumes (`postgres_data`).
- **Healthchecks**: Built-in container health probes monitoring `/api/auth/roles` and `pg_isready` for automated self-healing.

---

## 2. Role-Based Access Control (RBAC) Matrix

FestOS implements strict multi-tier security enforced at the middleware (`proxy.ts`), server-action level, and client UI level.

| Role Identifier | Role Label | Accessible Dashboards | Primary Operational Focus |
| :--- | :--- | :--- | :--- |
| **PUBLIC_USER** | Attendee / Student / Delegate | `/`, `/register`, `/tickets/[id]` | Event discovery, online registration, online payments, ticket retrieval |
| **SUPER_ADMIN** | Super Administrator | `/super-admin`, `/admin`, `/desk`, `/checkin`, `/stage`, `/management` | Full control: event CRUD, dynamic committee flags, system maintenance, database reset, global audit |
| **REGISTRATION_COMMITTEE** | Registration & Invitation (R&I) | `/admin`, `/desk`, `/checkin` | Registration approvals, manual payment reconciliation, CSV exports, attendee dossier inspection |
| **ONSPOT_DESK** | On-Spot Desk Counter Operator | `/desk` | Fast walk-in ticketing, Cash & On-Spot UPI collection, attendee photo compression, thermal pass generation |
| **GATE_SECURITY** | Gate Security & Volunteers | `/checkin` | High-speed camera QR scanning, offline HMAC validation, duplicate entry prevention |
| **STAGE_COMMITTEE** | Stage & Backstage Coordinators | `/stage` | Performance lineup, stage track playback / Drive links, sound/light cue management |
| **MUSIC_COMMITTEE** | Cultural Music Committee | `/committee/music` | Music event registrations, track review, participant rosters |
| **DANCE_COMMITTEE** | Cultural Dance Committee | `/committee/dance` | Dance event registrations, props & audio cue checks |
| **FASHION_COMMITTEE** | Cultural Fashion Committee | `/committee/fashion` | Team lineups, model count, theme verification |
| **THEATRE_COMMITTEE** | Cultural Theatre Committee | `/committee/theatre` | Play scripts, stage setup notes, backstage rosters |
| **LITERARY_COMMITTEE** | Literary & Quizzing Committee | `/committee/literary` | Debate, quiz, and creative writing rosters |
| **GAMING_COMMITTEE** | Esports & Gaming Committee | `/committee/gaming` | In-game IDs, team rosters, bracket check-in |
| **INFORMALZ_COMMITTEE** | Informalz Committee | `/informalz` | Fun events, rapid spot-events, spot ticket verification |
| **MANAGEMENT** | Higher Authority (Deans / Conveners) | `/management` | Read-only executive observatory, revenue tracking, ingress analytics |

---

## 3. Section-by-Section Features & Operations

### 3.1 Public Portal (`/`, `/register`, `/tickets/[id]`)
Designed for smooth mobile and desktop user experience during peak registration spikes.

#### Features & Operations:
1. **Hero & Fest Discovery**:
   - Dynamic countdown timer ticking down to fest inauguration.
   - Comprehensive festival schedule across Day 1 and Day 2.
   - Interactive category quick-nav (Music, Dance, Fashion, Theatre, Literary, Gaming, Informalz).
2. **Interactive Event Catalog**:
   - Real-time search across event titles, categories, venues, and descriptions.
   - Live badge indicators: `OPEN` vs `CLOSED`, `Free` vs `Paid`, `Individual` vs `Team` (with min/max size rules).
   - Event Details Modal: Full rules, prize pool breakdowns (1st & 2nd prizes), stage track upload guidelines.
3. **Multi-Step Online Registration Drawer**:
   - **Lead Attendee Dossier**: Name, Email, Phone, College / University name.
   - **Webcam / File Photo Capture**: Client-side canvas compression to under 100 KB before upload to eliminate server lag.
   - **Dynamic Team Roster**: Automatically renders exact number of input rows based on min/max team size constraints (Full name, Roll Number, Phone, College).
   - **Performance Stage Track**: Google Drive / Cloud link input + Sound and Lighting notes for stage crew.
   - **Day Selection**: Single-day vs multi-day festival pass selector.
4. **Checkout & Razorpay Payment Integration**:
   - Auto-calculation of registration fee in paise (INR).
   - Server-side order creation (`/api/checkout`) with HMAC tamper checks.
   - Modal Razorpay payment popup with UPI, Card, NetBanking, and Wallet support.
   - Client-side and server-side signature verification (`/api/verify-payment`).
   - Webhook listener (`/api/webhooks`) for payment capture redundancy.
5. **Digital Pass Generation (`/tickets/[id]`)**:
   - High-contrast, scannable QR Code containing the ticket code + HMAC-SHA256 signature hash.
   - Attendee credential card with compressed photo, roll number, college badge, event name, and transaction ref.
   - Single-click **"Download Pass"** and **"Print Ticket"** triggers.
   - Direct link to open ticket from confirmation email sent via Resend API.

---

### 3.2 On-Spot Desk Terminal (`/desk`, `/onspot`)
Built for fast, chaos-resilient walk-in counters on the day of the fest.

#### Features & Operations:
1. **Operator Identity Gate (`OperatorIdentityModal`)**:
   - Requires desk volunteer to submit their **Full Name**, **Roll Number / Faculty ID**, and **Role Type (Student/Faculty)**.
   - Stored in cryptographic session cookies for comprehensive operator attribution and audit logging.
2. **Rapid Registration Workflow**:
   - Quick-search event selector with instant pricing breakdown.
   - In-app camera snapshot or file upload for walk-in visitor photo ID.
   - Team member entry with quick-add hotkeys.
3. **Multi-Payment Settlement Modes**:
   - **ONSPOT_CASH**: Instant cash collection confirmation with zero gateway fees.
   - **ONSPOT_UPI**: Instant dynamic Razorpay UPI QR code generation on the screen; auto-detects payment completion without page refresh.
   - **FREE_REGISTRATION**: Zero-fee bypass for invited guests, internal faculty, or VIP delegates.
4. **Immediate Ticket Issuance**:
   - Instant ticket generation upon payment confirmation.
   - One-click thermal printer output optimized for 80mm/58mm receipt printers or standard A4 PDF.
   - Auto-dispatch of digital ticket pass to participant's email.
   - Live counter telemetry: Shows number of walk-in passes issued by current operator session.

---

### 3.3 Gate Security & Check-In Scanner (`/checkin`)
Optimized for high-throughput mobile device use at campus perimeter gates and auditorium entrances.

#### Features & Operations:
1. **Dual Scanning Engine**:
   - **Live Camera Feed Scanner**: Continuous video stream scanning using `jsQR` with torch/flashlight toggle.
   - **Manual Code Entry Fallback**: Fast numeric/alphanumeric keypad for manual code entry if an attendee's screen is cracked or dim.
2. **Cryptographic Validation & Anti-Fraud**:
   - Validates the ticket code against the database.
   - Re-computes HMAC-SHA256 hash using the secret key to detect forged QR codes.
3. **Duplicate Check-In Lockout**:
   - If ticket is valid and status is `ISSUED`: Marks status to `CHECKED_IN`, stamps `checkedInAt` timestamp, and triggers success chime.
   - If ticket was **already scanned**: Triggers loud error buzzer, red screen warning, and displays exact timestamp and gate of prior check-in.
4. **Security Dossier Verification**:
   - Instantly renders attendee's verified photo, college name, and team member list so gate guards can match identity.
5. **Ingress Metrics Counter**:
   - Real-time display of total participants checked in vs. total passes issued.

---

### 3.4 Committee Dashboards (`/committee/[slug]`, `/informalz`)
Specialized views tailored for individual cultural, technical, and sports committees.

#### Available Committee Portals:
- `/committee/music` • Cultural Music Committee
- `/committee/dance` • Cultural Dance Committee
- `/committee/fashion` • Cultural Fashion Committee
- `/committee/theatre` • Cultural Theatre Committee
- `/committee/literary` • Literary & Quizzing Committee
- `/committee/gaming` • Esports & Gaming Committee
- `/informalz` • Informalz Fun & Spot Events

#### Features & Operations:
1. **Dynamic Category Filtering**:
   - Only displays registrations belonging to event categories assigned to this committee by the Super Admin.
2. **Registration Table & Roster Manager**:
   - Real-time search by attendee name, email, college, phone, or transaction ID.
   - Filter by status (`PAID`, `PENDING`, `FAILED`).
   - Single-click CSV export of participant rosters for judges and stage crew.
3. **Stage Cue & Performance Asset Inspection**:
   - One-click link to listen to or download audio tracks uploaded by participants.
   - View lighting cues, song titles, and stage setup instructions.

---

### 3.5 Stage Management Console (`/stage`)
Dedicated to backstage coordinators, sound engineers, and auditorium masters of ceremony (MCs).

#### Features & Operations:
1. **Performance Order Lineup**:
   - Chronological and category-based sorting of stage performances.
   - Filter by Day 1 vs. Day 2 slots.
2. **Audio Track & Media Hub**:
   - Direct streaming / download links for Google Drive, Dropbox, or OneDrive media files submitted by teams.
   - Sound cue display: e.g., *"Fade in at intro, cut track at buzzer, blue spotlights on center stage"*.
3. **Backstage Ready / Call-Sheet Checklist**:
   - Mark teams as *"Backstage Reported"*, *"On Deck"*, or *"Performing"*.
   - Instant verification of team member headcount before walking onto the stage.
4. **Live Notes Update**:
   - Coordinators can update stage track notes directly during rehearsals; changes are logged with operator timestamps.

---

### 3.6 Central Admin Console (`/admin`)
The command hub for the Registration & Invitation (R&I) Committee.

#### Features & Operations:
1. **Financial & Registration Overview**:
   - Total registrations count, total tickets issued, total revenue collected, and pending checkout rates.
   - Breakdown of payment methods: Razorpay Online vs. Desk Cash vs. Desk UPI.
2. **Advanced Registration Data Grid (`AdminRegistrationsTable`)**:
   - Multi-parameter search: Search by attendee name, transaction ID (`pay_...`), order ID, email, phone, college, or ticket code.
   - Filter by event, committee, day, or payment status.
   - Detailed Drawer: View compressed ID photos, full team rosters, payment audit stamps, and cryptographic hash badges.
   - Single-click copy for Transaction IDs, Order IDs, and Ticket Codes.
3. **Administrative Actions**:
   - **Resend Ticket Email**: Re-triggers Resend email dispatch with ticket credentials.
   - **Manual Status Override**: Mark a pending or failed registration as `PAID` (for bank-transfer reconciliations) with operator audit trail.
   - **Full CSV / Excel Export**: Comprehensive delegate roster export with all demographic, payment, and ticket fields.

---

### 3.7 Management Observatory (`/management`)
An executive read-only dashboard designed for University Deans, Vice Chancellor, Registrar, Proctorial Board, and Fest Conveners.

#### Features & Operations:
1. **Executive Financial Summary**:
   - High-level gross revenue counter with net collections.
   - Real-time breakdown: Online Razorpay payments vs. Cash counter vs. Walk-in UPI.
2. **Ingress & Security Velocity**:
   - Ingress conversion rate (percentage of ticket holders who have entered the premises).
   - Peak gate influx pacing and security clearance rate.
3. **Demographic & College Distribution**:
   - Ratio of internal university students vs. external college delegates.
   - College-wise delegation count.
4. **Read-Only Roster Search**:
   - Search any student or team across the entire festival database without edit/delete buttons, preventing accidental data modification.

---

### 3.8 Super Admin Control Room (`/super-admin`)
The supreme command terminal with unrestricted system control.

#### Features & Operations:
1. **Dynamic Committee Category Flags (`SuperAdminFlagsManager`)**:
   - Real-time matrix of all 8+ committees and all event categories.
   - Checkbox toggles to dynamically grant or revoke category visibility for any committee without server restarts.
   - Persisted to runtime cache and `.festos_committee_flags.json`.
2. **Full Event Lifecycle Management (`AdminEventsManager`)**:
   - **Create New Event**: Title, category, event type (Individual/Team), min/max team size, registration fee, walk-in fee, prize descriptions, venue, date/slot, status (`OPEN`/`CLOSED`), and audio track upload requirement.
   - **Edit Event**: Modify rules, dates, venues, or fees on the fly.
   - **Emergency Toggle**: Instantly flip event status between `OPEN` and `CLOSED` to halt registrations when slots fill up.
   - **Delete Event**: Safe deletion with cascade protection.
3. **Global Audit Log Inspection (`AuditLogsViewer`)**:
   - Immutable audit trail of every administrative action performed in the system.
   - Logs operator full name, roll number, faculty/student badge, action type (`EDIT_EVENT`, `ONSPOT_REGISTRATION`, `TOGGLE_FLAG`, `STATUS_UPDATE`), target record ID, and exact JSON diff of changes.
4. **System Maintenance & Data Operations**:
   - **Database Export**: Export complete database records to JSON/CSV for archival.
   - **Emergency Database Reset**: Schema wipe and re-push utility with confirmation modal to reset test data before fest launch.

---

## 4. End-to-End User Action Reference Matrix

| Action / Operation | Public User | On-Spot Desk | Gate Security | Committee Admin | Stage Admin | Super Admin | Management |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Browse public event catalog & rules | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Online registration & Razorpay payment | ✅ | — | — | — | — | — | — |
| View / download / print personal digital pass | ✅ | — | — | — | — | — | — |
| Create walk-in registration (Cash / Spot UPI) | — | ✅ | — | — | — | ✅ | — |
| Issue thermal paper / PDF passes | — | ✅ | — | — | — | ✅ | — |
| Scan QR passes via mobile camera | — | — | ✅ | — | — | ✅ | — |
| Mark ticket as `CHECKED_IN` at gate | — | — | ✅ | — | — | ✅ | — |
| View committee-specific participant rosters | — | — | — | ✅ | — | ✅ | — |
| Export committee participant list to CSV | — | — | — | ✅ | — | ✅ | — |
| Download / preview performance audio tracks | — | — | — | ✅ | ✅ | ✅ | — |
| Update stage cues and lighting notes | — | — | — | — | ✅ | ✅ | — |
| Resend ticket email to attendee | — | — | — | ✅ | — | ✅ | — |
| Manually reconcile payment status | — | — | — | ✅ | — | ✅ | — |
| View macro financial & ingress stats (Read-Only) | — | — | — | — | — | ✅ | ✅ |
| Create, Edit, or Delete Events | — | — | — | — | — | ✅ | — |
| Toggle Committee Category Access Flags | — | — | — | — | — | ✅ | — |
| Inspect Operator Audit Logs & Roll Numbers | — | — | — | — | — | ✅ | — |
| Perform Database Reset / Purge Testing Data | — | — | — | — | — | ✅ | — |

---

## 5. Security & Anti-Fraud Implementations

1. **HMAC-SHA256 Digital Pass Signatures**:
   - Every ticket code generated (e.g., `LV-TKT-2026-X89K`) is cryptographically signed using a server-side secret (`HMAC_TICKET_SECRET`).
   - The QR code contains the ticket code and the signature hash.
   - When scanned at the gate, the server recomputes the signature. Even if an attacker creates a fake QR code with a valid format, it fails cryptographic verification.
2. **Single-Use Check-In Invariant**:
   - Once a ticket code is marked `CHECKED_IN`, the database rejects any subsequent scan attempts with a timestamped collision error.
3. **Role Boundary Isolation (`proxy.ts`)**:
   - Gate security credentials cannot access participant personal contact details, financials, or committee portals.
   - Committee coordinators cannot view registrations from other committees unless explicitly permitted by Super Admin flags.
   - On-spot desk operators cannot alter existing event pricing or system settings.
4. **Desk Operator Attribution**:
   - No desk ticket can be generated anonymously. Every walk-in registration records the operator's verified name, roll number, and timestamp in the `AuditLog` table.

---

## 6. Architectural Analysis: Does Segregating into Frontend vs Backend Make a Difference?

In modern architectures—especially in full-stack frameworks like **Next.js 16 (React Server Components + API Route Handlers)**—the question of whether to segregate documentation and architecture into "Frontend" and "Backend" is a fundamental design decision.

### Where Segregation Makes a Real Difference
1. **Security & Secrets Boundary (Zero-Trust Division)**:
   - **Frontend**: Anything executing in the browser (Client Components) is completely public. Secrets (`RAZORPAY_KEY_SECRET`, `HMAC_TICKET_SECRET`, database passwords) must **never** touch the client bundle. Segregating documentation highlights what runs in user space vs. what executes in trusted server space.
   - **Backend**: Server Components and Route Handlers have direct access to database sockets, environment variables, and the Node.js runtime.
2. **Failure Domains & High-Load Reliability**:
   - A client-side failure (e.g., a student's phone browser running out of memory during photo capture) only impacts that individual user.
   - A backend failure (e.g., PostgreSQL connection pool exhaustion or a memory leak in a Route Handler) halts registrations campus-wide. Clear segregation clarifies where resilience engineering (e.g., connection pooling, health checks, rate limiting) is required.
3. **Team Specialization & Maintenance**:
   - UI/UX contributors focus on Tailwind CSS, responsive mobile ergonomics, and print layouts without needing to understand SQL indexing.
   - Database and security engineers focus on transaction isolation, cryptographic hashing, and Docker configurations.

### Where Segregation is an Anti-Pattern (The Full-Stack Reality)
1. **React Server Components (RSC) Blur the Line**:
   - In Next.js App Router, a single file (like `page.tsx`) can fetch data directly from PostgreSQL on the server and render HTML directly to the client without exposing an intermediary REST API. Forcing strict "Frontend vs Backend" labels onto Server Components creates confusion.
2. **Feature-First / Domain-Driven Thinking**:
   - For fest operations (e.g., *"On-Spot Registration"*), what matters to stakeholders is the entire feature end-to-end: the desk form UI, the camera compression, the database write, the Razorpay QR generation, and the thermal print output. Segregating this into separate frontend and backend silos fragments the workflow and makes debugging harder.

### Conclusion: The Recommended Balance
The most effective approach (utilized in this document) is:
- **Segregate technically**: Clearly demarcate the **Technology Stack** (Client Libraries vs. Server Engines, Database & DevOps) so engineers understand execution contexts, security boundaries, and secrets.
- **Unify operationally**: Document **Features & User Roles end-to-end** across pages and workflows, because users, committee leads, and event conveners experience the platform as complete functional features, not decoupled layers.
