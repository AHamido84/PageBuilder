# Runs the site on any container host (Render, Railway, Fly.io, a VPS, ...). Vercel doesn't need this.
# See docs/DISASTER-RECOVERY.md.
#
#   docker build -t golden-seven .
#   docker run -p 3000:3000 --env-file .env.production golden-seven
#
# The database schema is applied on start (prisma migrate deploy -- a no-op when already current).
FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# NEXT_PUBLIC_* is baked in at build time. The build itself needs no database: these placeholders only
# satisfy env validation (the real values come from the runtime environment).
ARG NEXT_PUBLIC_SITE_URL=https://www.goldensevenfoods.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    SESSION_SECRET="build-time-placeholder-not-used-at-runtime-000" \
    npm run build

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT}"]
