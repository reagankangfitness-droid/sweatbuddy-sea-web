# Deployment Configuration

## Vercel Project Setup

**IMPORTANT:** This project is linked to the `web` Vercel project.

### Correct Vercel Project
- **Project Name:** `web`
- **Production URL:** https://www.sweatbuddies.co
- **Vercel Dashboard:** https://vercel.com/reagankangfitness-droids-projects/web

### Environment Variables
All environment variables are configured in the `web` project:
- `DATABASE_URL` (Production database - Neon PostgreSQL)
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `UPLOADTHING_TOKEN`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `CLERK_WEBHOOK_SECRET`

### Deploying to Production
Always deploy from `/apps/web` directory:
```bash
cd /Users/reagankang/sweatbuddy/apps/web
git push && vercel --prod
```

### Verifying Project Link
To verify you're linked to the correct project:
```bash
cat .vercel/project.json
# Should show: "projectName":"web"
```

If you need to re-link:
```bash
vercel link --yes --scope reagankangfitness-droids-projects --project web
```

### ⚠️ Duplicate Projects to Delete
There are duplicate Vercel projects that should be deleted to avoid confusion:
- `sweatbuddy` - DELETE this project
- `sweatbuddy-sea-web-web` - DELETE this project

To delete these projects:
1. Go to https://vercel.com/reagankangfitness-droids-projects
2. Click on the project name
3. Go to Settings > General
4. Scroll to "Delete Project" and confirm deletion

### Custom Domains
Both domains are configured on the `web` project:
- www.sweatbuddies.co (primary)
- sweatbuddies.co (redirects to www)

## Troubleshooting

### Activities Not Displaying
If activities aren't showing on production:
1. Check that you're deploying to the `web` project (not `sweatbuddy`)
2. Verify DATABASE_URL is set in the `web` project environment variables
3. Test the API: `curl https://www.sweatbuddies.co/api/activities`

### Wrong Project Linked
If deployments go to the wrong project:
```bash
cd /Users/reagankang/sweatbuddy/apps/web
rm -rf .vercel
vercel link --yes --scope reagankangfitness-droids-projects --project web
```
