// Event Detail API Route
// Handles fetching single event with attendees, updating, and deleting
// Key decisions:
// - Full attendee list for detail view
// - Cascade delete handled by Prisma schema

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateEventSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// GET /api/events/[id] - Get single event with attendees
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        attendees: {
          orderBy: { createdAt: 'desc' }
        },
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

    return NextResponse.json({ data: event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

// PATCH /api/events/[id] - Update event
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateEventSchema.parse(body)

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.description !== undefined && { 
          description: validatedData.description || null 
        }),
        ...(validatedData.capacity && { capacity: validatedData.capacity }),
      },
      include: {
        _count: {
          select: { attendees: true }
        }
      }
    })

    return NextResponse.json(
      { data: event, message: 'Event updated successfully' }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.event.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Event deleted successfully' }
    )
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}