import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/waiver-templates - List available waiver templates
export async function GET() {
  try {
    const templates = await prisma.waiverTemplate.findMany({
      where: { isActive: true },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        isDefault: true,
        content: true,
        version: true,
      }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching waiver templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waiver templates' },
      { status: 500 }
    )
  }
}
