# Sea Workout

A full-stack monorepo for tracking fitness activities, built with modern web technologies.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS 10, Prisma 5, PostgreSQL
- **Monorepo**: pnpm workspaces, Turborepo
- **Database**: PostgreSQL (Neon)

## Project Structure

```
sea-workout/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── api/          # NestJS backend API
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   └── types/        # Shared TypeScript types
├── turbo.json        # Turborepo configuration
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database (or Neon account)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:

Create `apps/api/.env`:
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
PORT=3001
```

3. Generate Prisma client and push schema:
```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:push
cd ../..
```

### Development

Start both web and api applications concurrently:

```bash
pnpm dev
```

This will start:
- Frontend (Next.js): http://localhost:3000
- Backend (NestJS): http://localhost:3001

### Available Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm build            # Build all apps
pnpm lint             # Lint all apps

# Individual apps
cd apps/web
pnpm dev              # Start Next.js app only

cd apps/api
pnpm dev              # Start NestJS API only
pnpm prisma:studio    # Open Prisma Studio
pnpm prisma:migrate   # Run database migrations
```

## Apps

### Web (`apps/web`)

Next.js 14 application with:
- App Router architecture
- TypeScript strict mode
- Tailwind CSS for styling
- shadcn/ui components pre-configured
- src-folder structure

### API (`apps/api`)

NestJS application with:
- RESTful API endpoints
- Prisma ORM for database access
- PostgreSQL database (Neon)
- Activity resource example (CRUD operations)

**API Endpoints:**
- `GET /` - Health check
- `GET /activities` - Get all activities
- `GET /activities/:id` - Get activity by ID
- `POST /activities` - Create new activity
- `PUT /activities/:id` - Update activity
- `DELETE /activities/:id` - Delete activity

## Packages

### UI (`packages/ui`)

Shared React components built with shadcn/ui:
- Button component
- Card components
- Common utilities (cn function)

### Types (`packages/types`)

Shared TypeScript types and interfaces:
- Activity types
- Common API types
- DTOs for API requests

## Database Schema

### Activity Model

```prisma
model Activity {
  id          String   @id @default(cuid())
  name        String
  description String?
  duration    Int      // in minutes
  calories    Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Adding shadcn/ui Components

To add new shadcn/ui components to the web app:

```bash
cd apps/web
npx shadcn-ui@latest add [component-name]
```

To share components across the monorepo, move them to `packages/ui/src/components/`.

## License

MIT
