# SweatBuddy Deployment Guide

This guide explains how to deploy SweatBuddy to production using services like Render, Railway, or similar platforms.

## Architecture

SweatBuddy consists of two services:
1. **Web (Next.js)** - Frontend application
2. **API (NestJS)** - Backend API server

## Service Configuration

### Service 1: Web (Next.js Frontend)

**Settings:**
- **Name:** sweatbuddy-web
- **Root Directory:** (monorepo root)
- **Build Command:** `pnpm --filter web build`
- **Start Command:** `pnpm --filter web start`
- **Port:** 3000

**Environment Variables:**
```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# API URL (use your deployed API URL)
NEXT_PUBLIC_API_URL=https://your-api-url.com

# Database (if using Prisma from web)
DATABASE_URL=postgresql://...
```

### Service 2: API (NestJS Backend)

**Settings:**
- **Name:** sweatbuddy-api
- **Root Directory:** (monorepo root)
- **Build Command:** `pnpm --filter api build`
- **Start Command:** `pnpm --filter api start:prod`
- **Port:** 3333

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?schema=public

# Server Configuration
PORT=3333

# CORS Origins (add your deployed frontend URL)
CORS_ORIGINS=https://your-web-url.com,http://localhost:3000

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...

# Stream Chat
STREAM_API_KEY=...
STREAM_SECRET_KEY=...
```

## Pre-Deployment Checklist

### 1. Install Dependencies

Most deployment platforms will run `pnpm install` automatically. Ensure your `package.json` has the correct `engines` field:

```json
{
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### 2. Database Setup

1. Create a PostgreSQL database (recommended: Neon, Supabase, or Railway Postgres)
2. Set the `DATABASE_URL` environment variable for both services
3. Run Prisma migrations:
   ```bash
   pnpm --filter api prisma:push
   ```
4. (Optional) Seed the database:
   ```bash
   pnpm --filter api db:seed
   ```

### 3. Clerk Configuration

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a production application or promote your development app
3. Configure authorized domains:
   - Add your deployed web URL
   - Add your deployed API URL (for webhooks)
4. Copy your production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` for web service
   - `CLERK_SECRET_KEY` for both services

### 4. Stream Chat Configuration

1. Go to [Stream Dashboard](https://dashboard.getstream.io)
2. Create a production app or use existing app
3. Copy credentials:
   - `STREAM_API_KEY` for API service
   - `STREAM_SECRET_KEY` for API service

### 5. CORS Configuration

Update the `CORS_ORIGINS` environment variable in your API service to include your production web URL:

```bash
CORS_ORIGINS=https://your-production-domain.com
```

## Platform-Specific Guides

### Render

1. Create two Web Services:
   - **sweatbuddy-web**: Connect to your repo, set build/start commands as above
   - **sweatbuddy-api**: Connect to your repo, set build/start commands as above

2. Create a PostgreSQL database and link it to the API service

3. Set environment variables for each service via the Render dashboard

4. Deploy both services

### Railway

1. Create a new project from your GitHub repo

2. Add two services:
   - Web service with root path filter to `apps/web`
   - API service with root path filter to `apps/api`

3. Add a PostgreSQL database

4. Set environment variables for each service

5. Deploy

### Vercel (Web only) + Render/Railway (API)

1. Deploy Web to Vercel:
   - Connect your GitHub repo
   - Set Framework Preset to "Next.js"
   - Set Root Directory to `apps/web`
   - Configure environment variables

2. Deploy API to Render/Railway (see above)

3. Update `NEXT_PUBLIC_API_URL` in Vercel to point to your deployed API

## Post-Deployment

### 1. Test the Application

1. Visit your deployed web URL
2. Sign up with a test account
3. Create an activity
4. Verify the API is responding correctly

### 2. Monitor Logs

Check logs for both services to ensure there are no errors:
- Web service: Check for SSR errors, API connection issues
- API service: Check for database connection, authentication issues

### 3. Set up CI/CD (Optional)

Most platforms auto-deploy on git push. Ensure your deployment platforms are connected to your GitHub repository and configured to deploy on push to `main`.

## Troubleshooting

### Web service fails to build

- Ensure `pnpm` is installed: Check build logs for package manager
- Verify all dependencies are installed
- Check for TypeScript errors in the build output

### API service fails to connect to database

- Verify `DATABASE_URL` is correctly set
- Ensure database is accessible from your deployment platform
- Run `pnpm --filter api prisma:generate` before starting

### CORS errors

- Add your deployed web URL to `CORS_ORIGINS` in API service
- Ensure the format is correct (no trailing slashes)
- Restart the API service after updating

### Mobile app can't connect to API

- Update `EXPO_PUBLIC_API_URL` in your mobile app `.env`
- Rebuild and republish your Expo app
- Ensure the API URL uses HTTPS in production

## Environment Variables Reference

### Web Service

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

### API Service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Server port (default: 3333) |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key for JWT verification |
| `STREAM_API_KEY` | Yes | Stream Chat API key |
| `STREAM_SECRET_KEY` | Yes | Stream Chat secret key |

## Production Best Practices

1. **Use production keys:** Never use development keys in production
2. **Enable HTTPS:** Ensure all services use HTTPS
3. **Database backups:** Set up automated backups for your database
4. **Monitoring:** Set up error tracking (e.g., Sentry)
5. **Rate limiting:** Consider adding rate limiting to your API
6. **CDN:** Use a CDN for static assets (Vercel does this automatically)
