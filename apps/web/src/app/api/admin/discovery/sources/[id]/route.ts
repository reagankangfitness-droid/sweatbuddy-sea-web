import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (typeof body.name === 'string') data.name = body.name.trim()
    if (typeof body.city === 'string') data.city = body.city.trim()
    if (typeof body.category === 'string') data.category = body.category.trim() || null
    if (typeof body.notes === 'string') data.notes = body.notes.trim() || null
    if (typeof body.status === 'string') data.status = body.status
    if (typeof body.sourceType === 'string') data.sourceType = body.sourceType.toUpperCase()

    if (typeof body.url === 'string') {
      data.url = new URL(body.url.trim()).toString()
    }

    const source = await prisma.discoverySource.update({
      where: { id },
      data,
    })

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Discovery source update error:', error)
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    await prisma.discoverySource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Discovery source delete error:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}
