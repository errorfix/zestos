# FestOS v2.0 • Ubuntu 24.04 LTS VPS Docker Deployment Guide

This guide provides end-to-end instructions for deploying FestOS v2.0 onto an **Ubuntu 24.04 LTS (Noble Numbat)** Virtual Private Server (VPS) with a dedicated self-hosted **PostgreSQL 16** container, **Next.js 16 (Standalone)**, **Nginx Reverse Proxy**, automated **Let's Encrypt SSL**, and daily automated database backups.

---

## 1. Initial VPS Server Hardening & Firewall

Connect to your Ubuntu 24.04 VPS via SSH:
```bash
ssh root@YOUR_SERVER_IP
```

Update package repositories and upgrade existing packages:
```bash
sudo apt update && sudo apt upgrade -y
```

Configure the UFW (Uncomplicated Firewall) to allow SSH, HTTP, and HTTPS:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

---

## 2. Install Docker & Docker Compose on Ubuntu 24.04

Install required prerequisite utilities:
```bash
sudo apt install -y ca-certificates curl gnupg lsb-release git
```

Add the official Docker GPG signing key:
```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Set up the Docker repository for Ubuntu 24.04 (`noble`):
```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Install Docker Engine, CLI, Containerd, and the Docker Compose plugin:
```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Verify installation:
```bash
docker --version
docker compose version
```

Enable Docker service to start automatically on system reboot:
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

---

## 3. Clone Repository & Configure Environment

Clone the repository to a production directory (e.g., `/opt/festos`):
```bash
sudo mkdir -p /opt/festos
sudo chown -R $USER:$USER /opt/festos
cd /opt/festos
git clone https://github.com/errorfix/zestos.git .
```

Create your production `.env` configuration file:
```bash
cp .env.example .env
nano .env
```

Ensure all production variables are populated:
```ini
# ─────────────────────────────────────────────────────────────────────────────
# Self-Hosted PostgreSQL Configuration (Inside Docker)
# ─────────────────────────────────────────────────────────────────────────────
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="YourStrongSecurePasswordHere123!"
POSTGRES_DB="zestos"

# Connect via internal Docker service "db" (0ms latency, unlimited connections)
DATABASE_URL="postgresql://postgres:YourStrongSecurePasswordHere123!@db:5432/zestos?schema=public"
DIRECT_URL="postgresql://postgres:YourStrongSecurePasswordHere123!@db:5432/zestos?schema=public"

# ─────────────────────────────────────────────────────────────────────────────
# Razorpay Production Keys
# ─────────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"

# Cryptography Pass Secret (Keep this 32+ characters, secret & constant)
HMAC_TICKET_SECRET="festos-v2-lingayas-vidyapeeth-hmac-sha256-secret-key-2026"

# Committee Passwords
SUPER_ADMIN_PASSWORD="phoenix@lv321"
RI_COMMITTEE_PASSWORD="falcon@lv321"
INFORMALZ_COMMITTEE_PASSWORD="tiger@lv321"
STAGE_COMMITTEE_PASSWORD="lion@lv321"
```

Save and exit `nano` (`CTRL+O`, `Enter`, `CTRL+X`).

---

## 4. Build and Start the Docker Services

Build the Next.js production image and start both the **PostgreSQL 16** database and the **FestOS WebApp** containers in detached mode:
```bash
docker compose up -d --build
```

Monitor live container startup logs:
```bash
docker compose logs -f
```

Check container status and health:
```bash
docker compose ps
```
Both `festos_postgres` and `festos_production` should indicate `Up (healthy)`.

---

## 5. Synchronize Database & Seed Initial Events

Because this is a brand-new high-performance PostgreSQL instance, run Prisma to generate all tables and seed the 31 events:

```bash
# Push database schema (creates tables: Event, Registration, AdminUser, AuditLog, etc.)
docker compose exec festos-app npx prisma db push

# Seed all 31 ZEST 2K26 competitive arenas & free informal games
docker compose exec festos-app npx prisma db seed
```

Verify that all tables and seed records are created:
```bash
docker compose exec db psql -U postgres -d zestos -c "\dt"
docker compose exec db psql -U postgres -d zestos -c "SELECT count(*) FROM \"Event\";"
```
*(Should return count: 31)*

---

## 6. Configure Nginx Reverse Proxy with Free SSL (HTTPS)

Install Nginx and Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Copy the provided Nginx configuration file:
```bash
sudo cp nginx/festos.conf /etc/nginx/sites-available/festos
```

Edit `/etc/nginx/sites-available/festos` to replace `your-domain.com` with your real domain:
```bash
sudo nano /etc/nginx/sites-available/festos
```

Enable the site and remove the default Nginx configuration:
```bash
sudo ln -sf /etc/nginx/sites-available/festos /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Test Nginx configuration syntax:
```bash
sudo nginx -t
```

Reload Nginx:
```bash
sudo systemctl reload nginx
```

Obtain a trusted, automated Let's Encrypt SSL certificate:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 7. How to Update the Website When Pushing Changes to GitHub

Whenever you commit and push new code to your GitHub `main` branch, updating the live VPS website takes 30 seconds:

```bash
cd /opt/festos
git pull origin main
docker compose build --no-cache festos-app
docker compose up -d festos-app
```

> [!NOTE]
> Rebuilding `festos-app` does **NOT** touch or delete the PostgreSQL database. All student registrations, tickets, and logs remain permanently safe in the `postgres_data` volume.

---

## 8. Automated Daily Database Backups

To ensure student registrations and ticket data are 100% safeguarded, set up an automated daily backup:

1. Create a backup script:
```bash
sudo mkdir -p /var/backups/festos
sudo tee /opt/festos/backup.sh > /dev/null << 'EOF'
#!/bin/bash
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/festos"
docker compose -f /opt/festos/docker-compose.yml exec -T db pg_dump -U postgres zestos | gzip > "$BACKUP_DIR/zestos_$TIMESTAMP.sql.gz"
# Keep only the last 14 days of backups
find "$BACKUP_DIR" -type f -name "zestos_*.sql.gz" -mtime +14 -exec rm {} \;
EOF
sudo chmod +x /opt/festos/backup.sh
```

2. Add a cron job to run every midnight at 02:00 AM:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/festos/backup.sh") | crontab -
```

---

## 9. Useful Operational & Monitoring Commands

- **View Live WebApp Logs**:
  ```bash
  docker compose logs -f festos-app
  ```
- **View Live Database Logs**:
  ```bash
  docker compose logs -f db
  ```
- **Check Container Resource Usage (CPU & Memory)**:
  ```bash
  docker stats
  ```
- **Direct Database Console (psql)**:
  ```bash
  docker compose exec db psql -U postgres -d zestos
  ```
- **Restart Services**:
  ```bash
  docker compose restart
  ```
