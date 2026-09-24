# FestOS v2.0 • Live Production Operations & Maintenance Guide

This document contains official operational procedures, live endpoint links, role-based committee credentials, daily backup routines, and maintenance workflows for the live deployment at **https://lingayaszest.tech**.

---

## 1. Live Deployment Details & Endpoints

| Resource | Value / URL |
| :--- | :--- |
| **Domain** | **[https://lingayaszest.tech](https://lingayaszest.tech)** |
| **Server Host IP** | `187.126.114.119` (Hostinger Ubuntu 24.04 LTS VPS) |
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

---

## 2. Committee Access & Role Passwords

Committee personnel log in directly at `https://lingayaszest.tech/login`. The system automatically sets an encrypted JWT HTTP-only cookie and redirects them to their designated panel:

| Committee Role | Password | Accessible Panel Route | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `phoenix@lv321` | `/super-admin` | Full system audit, revenue analytics, event toggles, export rosters. |
| **R&I Committee** | `falcon@lv321` | `/admin` | Registration verification, cash on-spot issuance, ticket check-in. |
| **Informalz Committee** | `tiger@lv321` | `/informalz` | Free informal game rosters, winner tracking, participant check-in. |
| **Stage / AV Committee** | `lion@lv321` | `/stage` | Audio/video track links, cue notes, on-spot track USB uploads. |

---

## 3. Automated Daily Database Backups

To ensure that student registrations, tickets, and transactions are permanently backed up, an automated backup script is scheduled on the VPS:

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
# Verify active cron schedule
crontab -l
```
Expected output:
```text
0 2 * * * /opt/festos/backup.sh
```

### Manual Instant Backup
Whenever performing major changes or before large event days, run an instant backup:
```bash
sudo /opt/festos/backup.sh
```
List all generated backups:
```bash
ls -lh /var/backups/festos/
```

---

## 4. How to Update the Live Website from GitHub

Whenever code is edited and pushed to GitHub (`git push origin main`), update the live VPS with this single command:

```bash
cd /opt/festos && git pull origin main && docker compose build --no-cache festos-app && docker compose up -d festos-app
```

> [!NOTE]
> Rebuilding `festos-app` does **NOT** touch or wipe the PostgreSQL database. All student registrations, tickets, and logs remain permanently safe in the `postgres_data` volume.

---

## 5. Switching Razorpay to Live Mode (Real Payments)

Currently, the system is configured in test mode. When you are ready to collect real participant payments:

1. Open `/opt/festos/.env` on the VPS:
   ```bash
   nano /opt/festos/.env
   ```
2. Replace the test keys with your official Razorpay Live credentials:
   ```ini
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXXXXXX"
   RAZORPAY_KEY_ID="rzp_live_XXXXXXXXXXXXXX"
   RAZORPAY_KEY_SECRET="your_live_secret_key"
   RAZORPAY_WEBHOOK_SECRET="your_live_webhook_secret"
   ```
3. Save (`CTRL+O`, `Enter`, `CTRL+X`).
4. Restart the web app to apply the live credentials:
   ```bash
   docker compose restart festos-app
   ```

---

## 6. Daily Monitoring & Operational Commands

### Check Container Health & Status
```bash
docker compose ps
```
Both `festos_postgres` and `festos_production` should show status: `Up (healthy)`.

### View Live Web Application Logs
```bash
docker compose logs -f festos-app
```

### View Live Database Logs
```bash
docker compose logs -f db
```

### Monitor Real-Time Server Resource Usage (CPU, RAM, Network)
```bash
docker stats
```

### Access PostgreSQL Interactive Console (psql)
```bash
docker compose exec db psql -U postgres -d zestos
```
Useful SQL queries:
```sql
-- Count total registrations
SELECT count(*) FROM "Registration";

-- Count registrations per event
SELECT e.title, count(r.id) FROM "Event" e LEFT JOIN "Registration" r ON e.id = r."eventId" GROUP BY e.title ORDER BY count DESC;

-- Exit psql
\q
```

### Restart All Services
```bash
docker compose restart
```

---

## 7. SSL Certificate Renewal

Let's Encrypt certificates are valid for 90 days. Certbot automatically installs a systemd renewal timer. To test automatic renewal:
```bash
sudo certbot renew --dry-run
```
*(If this outputs `Congratulations, all simulated renewals succeeded`, SSL will renew automatically in the background with zero downtime).*
