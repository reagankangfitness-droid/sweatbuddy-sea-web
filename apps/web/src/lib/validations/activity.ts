import { z } from 'zod'

export const activitySchema = z.object({
  title: z.string().min(3, 'Activity title must be at least 3 characters').max(100),
  description: z.string(),
  type: z.enum(['RUN', 'GYM', 'YOGA', 'HIKE', 'CYCLING', 'OTHER']),
  city: z.string(),
  address: z.string().optional(),        // Full formatted address
  streetAddress: z.string().optional(),  // Street address
  postalCode: z.string().optional(),     // Postal/ZIP code
  country: z.string().optional(),        // Country
  placeId: z.string().optional(),        // Google Maps Place ID
  latitude: z.number(),
  longitude: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  maxPeople: z.number().int().positive().optional(),
  imageUrl: z.string(),
  price: z.number().nonnegative(),
  currency: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
})

export type ActivityFormData = z.infer<typeof activitySchema>
