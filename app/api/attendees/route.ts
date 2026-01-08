// Attendees API Route
// Handles registering attendees for events
// Key decisions:
// - Check capacity before registration
// - Handle duplicate registration gracefully
// - Return full event data for UI updates

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAttendeeSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// POST /api/attendees - Register attendee for event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createAttendeeSchema.parse(body)

    // Check if event exists and has capacity
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        _count: {
          select: { attendees: true }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event._count.attendees >= event.capacity) {
      return NextResponse.json(
        { error: 'Event is at full capacity' },
        { status: 400 }
      )
    }

    // Create attendee
    const attendee = await prisma.attendee.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        eventId: validatedData.eventId,
      }
    })

    return NextResponse.json(
      { data: attendee, message: 'Registration successful' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Handle unique constraint violation (duplicate registration)
    if ((error as any)?.code === 'P2002') {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 400 }
      )
    }

    console.error('Error creating attendee:', error)
    return NextResponse.json(
      { error: 'Failed to register attendee' },
      { status: 500 }
    )
  }
}