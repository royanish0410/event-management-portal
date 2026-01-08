    // Attendee Delete API Route
// Handles unregistering attendees from events

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/attendees/[id] - Unregister attendee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.attendee.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Attendee removed successfully' }
    )
  } catch (error) {
    console.error('Error deleting attendee:', error)
    return NextResponse.json(
      { error: 'Failed to remove attendee' },
      { status: 500 }
    )
  }
}