# ─── FESTOS V2.0 PRODUCTION MULTI-STAGE DOCKERFILE ────────────────────────────
# Designed for high-concurrency hosting on Ubuntu 24.04 LTS VPS
# Minimal Alpine footprint (~160MB), non-root execution, Prisma OpenSSL engines.

# Stage 1: Dependencies Cache
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Stage 2: Application Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client engines for Linux target
RUN npx prisma generate

# Build Next.js standalone distribution
RUN npm run build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Enforce secure least-privilege non-root execution
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Standalone server and static assets from Next.js output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Periodic container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/roles || exit 1

CMD ["node", "server.js"]
