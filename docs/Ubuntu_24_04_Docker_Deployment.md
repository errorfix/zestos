# FestOS v2.0 • Ubuntu 24.04 LTS VPS Docker Deployment Guide

This guide provides end-to-end instructions for deploying FestOS v2.0 onto an **Ubuntu 24.04 LTS (Noble Numbat)** Virtual Private Server (VPS) with Docker, Docker Compose, Nginx Reverse Proxy, and automated Let's Encrypt SSL.

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
# Supabase Transaction & Session Pooler URLs
DATABASE_URL="postgresql://postgres.[USER]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[USER]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Public API Keys
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."

# Razorpay Production or Staging Keys
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

## 4. Build and Start the Docker Container

Build the multi-stage Next.js production image and start the container in detached mode:
```bash
docker compose up -d --build
```

Monitor live container startup logs:
```bash
docker compose logs -f festos-app
```

Check container status and health:
```bash
docker compose ps
```
The status should indicate `Up (healthy)`.

---

## 5. Synchronize Prisma Database Schema

Run database schema migration inside the running container to ensure all tables exist in Supabase:
```bash
docker compose exec festos-app npx prisma db push
```

Optional: Seed initial events if starting with a clean database:
```bash
docker compose exec festos-app npx prisma db seed
```

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

Obtain and configure your automated SSL Certificate with Certbot:
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will automatically modify `/etc/nginx/sites-available/festos` to enforce HTTPS redirect.

---

## 7. Ongoing Maintenance & Zero-Downtime Updates

When updates are pushed to GitHub `main`, deploy the update to your VPS with:
```bash
cd /opt/festos
git pull origin main
docker compose up -d --build
```
Docker will build the updated standalone image in the background and replace the running container smoothly.

### Useful Operational Commands:

- **View Live Logs**:
  ```bash
  docker compose logs -f --tail=100 festos-app
  ```
- **Restart Container**:
  ```bash
  docker compose restart festos-app
  ```
- **Stop Application**:
  ```bash
  docker compose down
  ```
- **Check Resource Utilization (CPU & RAM)**:
  ```bash
  docker stats festos_production
  ```
