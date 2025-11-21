import { z } from 'zod'

export const activitySchema = z.object({
  title: z.string().min(3, 'Activity title must be at least 3 characters').max(100),
  description: z.string(),
  type: z.enum(['RUN', 'GYM', 'YOGA', 'HIKE', 'CYCLING', 'OTHER']),
  city: z.string(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  startTime: z.string(),
  endTime: z.string(),
  maxPeople: z.coerce.number().int().positive().optional().or(z.undefined()),
  imageUrl: z.string(),
  price: z.coerce.number().nonnegative(),
  currency: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional(),
})

export type ActivityFormData = z.infer<typeof activitySchema>
