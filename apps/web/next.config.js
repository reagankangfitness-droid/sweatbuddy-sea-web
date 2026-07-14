const path = require('path')
const { withSentryConfig } = require('@sentry/nextjs')

const isProduction = process.env.NODE_ENV === 'production'
const scriptSrc = isProduction
  ? "'self' 'unsafe-inline' https:"
  : "'self' 'unsafe-inline' 'unsafe-eval' https:"
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "worker-src 'self' blob:",
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable compression
  compress: true,

  // Pin the monorepo root locally; Vercel sets its own project root for file tracing.
  turbopack: {
    root: process.env.VERCEL ? process.cwd() : path.join(__dirname, '../..'),
  },

  // Experimental features for performance
  experimental: {
    // Optimize package imports for smaller bundles
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'date-fns'],
  },

  // Optimized image settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "cdn.evbuc.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "**",
      },
    ],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Optimized device sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Cache images for 30 days
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // Transpile packages
  transpilePackages: ['@sweatbuddy/ui', '@sweatbuddy/types'],

  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Redirects
  async redirects() {
    return [
      // Legacy route redirects
      { source: '/organizer/:path*', destination: '/buddy?view=map', permanent: false },
      { source: '/crews', destination: '/buddy', permanent: false },
      { source: '/community', destination: '/communities', permanent: true },
      { source: '/saved', destination: '/my-sessions', permanent: true },
      { source: '/cities', destination: '/buddy?view=map', permanent: true },
      { source: '/cities/singapore', destination: '/singapore', permanent: true },
      { source: '/cities/bangkok', destination: '/bangkok', permanent: true },
      { source: '/cities/:slug', destination: '/buddy?view=map&city=:slug', permanent: true },
      { source: '/coach/templates', destination: '/host/templates', permanent: true },
      { source: '/coach/templates/new', destination: '/host/templates', permanent: true },
      { source: '/coach/templates/:path*', destination: '/host/templates', permanent: true },
      { source: '/onboarding/coach', destination: '/host', permanent: true },
      { source: '/onboarding/p2p', destination: '/buddy', permanent: true },

      // Host surface consolidation
      { source: '/host/dashboard', destination: '/hub', permanent: true },
      { source: '/host/analytics', destination: '/hub', permanent: true },
      { source: '/host/content', destination: '/hub', permanent: true },
      { source: '/host/growth', destination: '/hub', permanent: true },
      { source: '/host/earnings', destination: '/hub', permanent: true },
      { source: '/host/waves', destination: '/buddy/host/new', permanent: true },

      // SEO preservation
      { source: '/discover', destination: '/buddy', permanent: true },
      { source: '/explore', destination: '/buddy', permanent: true },
      { source: '/events', destination: '/buddy?view=map', permanent: true },
      { source: '/events/:path*', destination: '/buddy?view=map', permanent: true },
      { source: '/app', destination: '/buddy', permanent: true },
      { source: '/activities/create', destination: '/buddy/host/new', permanent: true },
      { source: '/my-events', destination: '/my-bookings', permanent: false },
      { source: '/my-activities', destination: '/my-bookings', permanent: false },
    ]
  },

  // Security and caching headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy,
          },
        ],
      },
      {
        // Cache static assets aggressively (1 year)
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images (1 day with revalidation)
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // API responses - short cache for dynamic data
        source: '/api/activities',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        // Individual activity pages - shorter cache
        source: '/api/activities/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=120',
          },
        ],
      },
      {
        // Events API - short CDN cache, revalidateTag handles real invalidation
        source: '/api/events',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=10, stale-while-revalidate=30',
          },
        ],
      },
      {
        // Event attendees - shorter cache
        source: '/api/events/:eventId/attendees',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=30, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },

}

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}, {
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
})
