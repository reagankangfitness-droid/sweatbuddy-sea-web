import { z } from 'zod'

export const eventFormSchema = z.object({
  // Step 1: Details
  eventName: z.string().min(1, 'Event name is required').max(200),
  description: z.string().max(5000),
  eventType: z.string().min(1, 'Activity type is required'),
  eventDate: z.string().min(1, 'Date is required'),
  eventTime: z.string().min(1, 'Start time is required'),
  endTime: z.string(),

  // Step 2: Location & Type
  location: z.string().min(1, 'Location is required'),
  latitude: z.number(),
  longitude: z.number(),
  placeId: z.string(),
  isRecurring: z.boolean(),
  eventDay: z.string(),
  scheduleEnabled: z.boolean(),
  scheduleDate: z.string(),
  scheduleTime: z.string(),

  // Step 3: Pricing & Capacity
  isFree: z.boolean(),
  price: z.string(),
  paynowQrCode: z.string(),
  paynowNumber: z.string(),
  maxSpots: z.string(),
  isFull: z.boolean(),

  // Step 4: Image & Review
  imageUrl: z.string().nullable(),

  // Organizer (pre-filled from Clerk, hidden from user)
  organizerName: z.string().min(1, 'Name is required'),
  instagramHandle: z.string().min(1, 'Instagram handle is required'),
  email: z.string().email('Valid email is required'),
})

export type EventFormData = z.infer<typeof eventFormSchema>

// Per-step validation subsets
export const step1Schema = eventFormSchema.pick({
  eventName: true,
  description: true,
  eventType: true,
  eventDate: true,
  eventTime: true,
  endTime: true,
})

export const step2Schema = eventFormSchema
  .pick({
    location: true,
    isRecurring: true,
    eventDay: true,
    scheduleEnabled: true,
    scheduleDate: true,
    scheduleTime: true,
  })
  .refine(
    (data) => !data.isRecurring || (data.isRecurring && data.eventDay),
    { message: 'Select a repeat frequency', path: ['eventDay'] },
  )

export const step3Schema = eventFormSchema
  .pick({
    isFree: true,
    price: true,
    maxSpots: true,
  })
  .refine(
    (data) => data.isFree || (!data.isFree && data.price && parseFloat(data.price) > 0),
    { message: 'Enter a valid price for your paid event', path: ['price'] },
  )

// Step 4 has no required fields (image is optional)
export const step4Schema = eventFormSchema.pick({
  imageUrl: true,
})
