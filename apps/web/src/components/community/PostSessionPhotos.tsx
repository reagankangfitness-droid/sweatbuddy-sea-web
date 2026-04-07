'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Camera } from 'lucide-react'

interface PastSession {
  id: string
  title: string
  imageUrl: string
  startTime: string
}

interface PostSessionPhotosProps {
  sessions: PastSession[]
}

export function PostSessionPhotos({ sessions }: PostSessionPhotosProps) {
  if (sessions.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-[#9A9AAA]" />
        <h2 className="text-xl font-semibold text-[#1A1A1A]">Moments</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/activities/${session.id}`}
            className="shrink-0 group"
          >
            <div className="relative w-44 h-32 rounded-2xl overflow-hidden shadow-sm">
              <Image
                src={session.imageUrl}
                alt={session.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-xs font-medium text-white truncate">
                  {session.title}
                </p>
                <p className="text-[10px] text-white/70">
                  {new Date(session.startTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
