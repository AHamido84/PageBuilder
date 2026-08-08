# Seven Eleven Trading — Website & CMS

Next.js (App Router, TypeScript) + Prisma/PostgreSQL foundation for the Seven Eleven Trading public site and admin CMS. See [PROJECT-PLAN.md](./PROJECT-PLAN.md) for the full architecture plan.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- PostgreSQL via Prisma 6
- Custom auth: bcrypt password hashing + signed JWT session cookie (`jose`)
- RBAC: `Role` / `Permission` / `RolePermission` tables, enforced in the proxy (middleware) and on every server action
- `next-intl` for Arabic (RTL, default) / English (LTR) localization
- Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, SESSION_SECRET, SEED_ADMIN_*
npx prisma migrate dev
npx prisma db seed
npm run dev
```

- Public site: `http://localhost:3000/ar` or `/en`
- Admin dashboard: `http://localhost:3000/admin/login` — sign in with the `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `npx prisma migrate dev` | Create/apply a migration |
| `npm run db:seed` | Seed roles, permissions, menus, site settings, and the super admin user |
| `npx prisma studio` | Browse the database |

## Project layout

```
prisma/schema.prisma        Full data model (see PROJECT-PLAN.md §4)
prisma/seed.ts               RBAC + super admin seed
src/app/[locale]/            Public site (ar/en)
src/app/admin/               Admin dashboard (not localized)
src/app/api/admin/media/     Secure file upload endpoint
src/lib/auth/                Password hashing, session, login/logout actions
src/lib/rbac/                Permission catalog + per-request permission checks
src/proxy.ts                 Route protection + locale routing (Next 16 "proxy" convention)
```
