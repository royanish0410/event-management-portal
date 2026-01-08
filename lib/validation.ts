// Zod Validation Schemas
// Shared between client forms and API route validation
// Ensures type safety across the entire stack

import { z } from 'zod'

// Event Schemas
export const createEventSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  date: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format')
    .refine((date) => new Date(date) > new Date(), 'Event date must be in the future'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity cannot exceed 10,000'),
})

export const updateEventSchema = createEventSchema.partial()

// Attendee Schemas
export const createAttendeeSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  eventId: z.string().cuid('Invalid event ID'),
})

// Type exports for TypeScript
export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateAttendeeInput = z.infer<typeof createAttendeeSchema>