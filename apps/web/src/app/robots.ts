import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/coach/', '/settings/', '/api/', '/profile', '/my-bookings', '/saved'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
