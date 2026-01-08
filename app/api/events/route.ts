// Events API Route
// Handles listing and creating events
// Key decisions:
// - Include attendee count for efficient list rendering
// - Validate with Zod before DB operations
// - Proper error handling with status codes

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEventSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/events - List all events with attendee counts
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: {
          select: { attendees: true }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = createEventSchema.parse(body)
    
    // Create event
    const event = await prisma.event.create({
      data: {
        title: validatedData.title,
        date: new Date(validatedData.date),
        description: validatedData.description || null,
        capacity: validatedData.capacity,
      },
      include: {
        _count: {
          select: { attendees: true }
        }
      }
    })

    return NextResponse.json(
      { data: event, message: 'Event created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}