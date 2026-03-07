import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/host/', '/settings/', '/api/', '/profile', '/my-bookings', '/saved', '/crews'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
