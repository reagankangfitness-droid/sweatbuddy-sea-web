# SweatBuddy

SweatBuddy is a Next.js monorepo for discovering, hosting, booking, and managing workout sessions and fitness communities.

## Tech Stack

- **App**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js route handlers in `apps/web/src/app/api`
- **Database**: PostgreSQL with Prisma 5; source schema is `apps/web/prisma/schema.prisma`
- **Auth**: Clerk
- **Payments**: Stripe, Stripe Connect, and PayNow proof uploads
- **Integrations**: UploadThing, Resend, Upstash, Sentry, Anthropic
- **Monorepo**: pnpm workspaces and Turborepo

## Project Structure

```text
sweatbuddy/
├── apps/
│   └── web/                 # Next.js application and API routes
├── packages/
│   ├── ui/                  # Shared React components
│   ├── types/               # Shared TypeScript DTOs
│   └── database/            # Legacy database package; app schema lives in apps/web
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

There is currently no separate `apps/api` NestJS service and no mobile app in this workspace. The production backend surface is the Next.js API route tree under `apps/web`.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Install

```bash
pnpm install
```

### Environment

Create `apps/web/.env.local` with the secrets required by the features you are running locally. At minimum:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional feature-specific variables include UploadThing, Resend, Upstash, Sentry, Anthropic, admin, and cron secrets.

### Database

Run Prisma commands from `apps/web`; this is the schema source of truth.

```bash
cd apps/web
npx prisma generate
npx prisma validate
```

Use migrations or `prisma db push` according to the environment workflow for the database you are targeting.

### Development

```bash
pnpm dev
```

The web app starts through Turborepo and Next.js, normally at `http://localhost:3000`.

## Commands

```bash
pnpm build          # Build the workspace
pnpm lint           # Lint/type-check workspace packages

cd apps/web
npm run lint        # Lint the web app
npm run test:run    # Run Vitest tests
npx prisma validate # Validate the app Prisma schema
```

## Feature Areas

- P2P sessions: `/buddy`, `/buddy/host/*`, `/activities/[id]`
- Public event submissions: `/events`, `/e/[id]`, `/event/[slug]`
- Host tools: `/host/dashboard`, `/host/analytics`, `/host/community`, `/host/templates`, `/host/growth`
- Communities: `/communities`, `/communities/[slug]`, `/community`
- User profiles and social graph: `/profile`, `/user/[slug]`, `/hub`
- Admin tools: `/admin/*`
- Operational jobs: `/api/cron/*`

## Auth Notes

Clerk is the primary auth system. Some legacy organizer support remains in code for backwards compatibility, but new user-facing and host-facing work should use Clerk-backed users.

Route protection is split between middleware and per-route guards. Many API route groups are public at middleware level because they perform their own internal auth, so new API routes must explicitly enforce auth and authorization.

## Packages

### `packages/ui`

Small shared React component package. Lint currently runs TypeScript checking.

### `packages/types`

Shared DTOs. Keep these aligned with the Prisma schema and API responses before using them across app boundaries.

### `packages/database`

Legacy package retained for workspace compatibility. The active Prisma schema and generated client workflow are in `apps/web`.
