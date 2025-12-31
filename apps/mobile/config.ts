export const config = {
  clerk: {
    publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  },
  stream: {
    apiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY || '',
  },
  stripe: {
    publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://www.sweatbuddies.co',
  },
} as const
