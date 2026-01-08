// TypeScript Types
// Derived from Prisma models with useful computed properties

import { Event, Attendee } from '@prisma/client'

// Event with attendee count for list views
export type EventWithCount = Event & {
  _count: {
    attendees: number
  }
}

// Event with full attendees for detail view
export type EventWithAttendees = Event & {
  attendees: Attendee[]
  _count: {
    attendees: number
  }
}

// API Response types
export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

// Computed properties helper
export function getAvailableSpots(event: EventWithCount | EventWithAttendees): number {
  return event.capacity - event._count.attendees
}

export function isEventFull(event: EventWithCount | EventWithAttendees): boolean {
  return getAvailableSpots(event) <= 0
}