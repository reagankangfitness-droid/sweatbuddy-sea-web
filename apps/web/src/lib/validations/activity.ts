import { z } from 'zod'

export const activitySchema = z.object({
  title: z.string().min(3, 'Activity title must be at least 3 characters').max(100),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  // Legacy type field - kept for backwards compatibility
  type: z.enum(['RUN', 'GYM', 'YOGA', 'HIKE', 'CYCLING', 'OTHER']),
  // New category system - will be mapped to legacy type automatically
  categorySlug: z.string().optional(),
  city: z.string().min(1).max(200),
  address: z.string().max(500).optional(),        // Full formatted address
  streetAddress: z.string().max(300).optional(),  // Street address
  postalCode: z.string().max(20).optional(),     // Postal/ZIP code
  country: z.string().max(100).optional(),        // Country
  placeId: z.string().max(300).optional(),        // Google Maps Place ID
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  startTime: z.string().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid start time format' }
  ),
  endTime: z.string().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: 'Invalid end time format' }
  ),
  maxPeople: z.number().int().positive().max(100000).optional(),
  imageUrl: z.string(),
  price: z.number().nonnegative().max(999999, 'Price too high'),
  currency: z.string().min(3).max(3),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
})

export type ActivityFormData = z.infer<typeof activitySchema>
