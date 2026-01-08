// TanStack Query Hooks
// Centralized server-state management
// Key decisions:
// - Optimistic updates for better UX
// - Automatic cache invalidation
// - Toast notifications integrated

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { EventWithCount, EventWithAttendees } from './types'
import type { CreateEventInput, CreateAttendeeInput } from './validations'
import type { Attendee } from '@prisma/client'

// Query Keys
export const queryKeys = {
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
}

// Events Queries
export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: async () => {
      const response = await fetch('/api/events')
      if (!response.ok) throw new Error('Failed to fetch events')
      const json = await response.json()
      return json.data as EventWithCount[]
    },
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`)
      if (!response.ok) throw new Error('Failed to fetch event')
      const json = await response.json()
      return json.data as EventWithAttendees
    },
    enabled: !!id,
  })
}

// Event Mutations
export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateEventInput) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Failed to create event')
      return json.data as EventWithCount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
      toast.success('Event created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error || 'Failed to delete event')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
      toast.success('Event deleted successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Attendee Mutations with Optimistic Updates
export function useCreateAttendee(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<CreateAttendeeInput, 'eventId'>) => {
      const response = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, eventId }),
      })
      
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Failed to register')
      return json.data as Attendee
    },
    // Optimistic Update - Update UI immediately before server responds
    onMutate: async (newAttendee) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.event(eventId) })

      // Snapshot previous value
      const previousEvent = queryClient.getQueryData<EventWithAttendees>(
        queryKeys.event(eventId)
      )

      // Optimistically update
      if (previousEvent) {
        queryClient.setQueryData<EventWithAttendees>(
          queryKeys.event(eventId),
          {
            ...previousEvent,
            attendees: [
              {
                id: 'temp-' + Date.now(),
                name: newAttendee.name,
                email: newAttendee.email,
                eventId,
                createdAt: new Date(),
              },
              ...previousEvent.attendees,
            ],
            _count: {
              attendees: previousEvent._count.attendees + 1,
            },
          }
        )
      }

      return { previousEvent }
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousEvent) {
        queryClient.setQueryData(
          queryKeys.event(eventId),
          context.previousEvent
        )
      }
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success('Registration successful!')
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
    },
  })
}

export function useDeleteAttendee(eventId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendeeId: string) => {
      const response = await fetch(`/api/attendees/${attendeeId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error || 'Failed to remove attendee')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.events })
      toast.success('Attendee removed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}