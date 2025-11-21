export const config = {
  clerk: {
    publishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  },
  stream: {
    apiKey: process.env.EXPO_PUBLIC_STREAM_API_KEY || '',
  },
} as const
