# SweatBuddy

A full-stack monorepo to find workout experiences near you, built with modern web technologies.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: NestJS 10, Prisma 5, PostgreSQL
- **Authentication**: Clerk
- **Monorepo**: pnpm workspaces, Turborepo
- **Database**: PostgreSQL (Neon)

## Project Structure

```
sweatbuddy/
├── apps/
│   ├── web/          # Next.js frontend application
│   ├── api/          # NestJS backend API
│   └── mobile/       # Expo React Native mobile app
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

**Backend (`apps/api/.env`):**
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
PORT=3001
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

See the [Authentication Setup](#authentication-setup) section for details on getting Clerk keys.

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

## Authentication Setup

This project uses [Clerk](https://clerk.com) for authentication. Follow these steps to set it up:

### 1. Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your preferred authentication methods (Email, Google, GitHub, etc.)

### 2. Get Your API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 3. Configure Environment Variables

Create `apps/web/.env.local` and add your Clerk keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### 4. Test Authentication

1. Start the development server: `pnpm dev`
2. Visit http://localhost:3000
3. Click "Sign In" to test the authentication flow
4. After signing in, you'll be redirected to `/dashboard`

### Protected Routes

The middleware (`apps/web/src/middleware.ts`) protects all routes except:
- `/` - Public home page
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page

All other routes require authentication. Users will be redirected to `/sign-in` if not authenticated.

### Components Available

- `<UserButton />` - User profile button in header
- `<SignIn />` - Pre-built sign in form
- `<SignUp />` - Pre-built sign up form
- `<SignedIn>` - Renders children only when user is signed in
- `<SignedOut>` - Renders children only when user is signed out

## Adding shadcn/ui Components

To add new shadcn/ui components to the web app:

```bash
cd apps/web
npx shadcn-ui@latest add [component-name]
```

To share components across the monorepo, move them to `packages/ui/src/components/`.

## License

MIT
