import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const response = await utapi.uploadFiles(file)
  if (response.error) return NextResponse.json({ error: response.error.message }, { status: 500 })

  return NextResponse.json({ url: response.data.ufsUrl || response.data.url })
}
