import Image from 'next/image'
import type { FamiliarFace } from '@/lib/familiar-faces'

interface FamiliarFacesLineProps {
  familiarFaces: FamiliarFace[]
}

function displayName(face: FamiliarFace): string {
  return face.firstName || face.name || 'Someone'
}

export function FamiliarFacesLine({ familiarFaces }: FamiliarFacesLineProps) {
  if (familiarFaces.length === 0) return null

  return (
    <div className="flex items-center gap-2">
      {/* Avatar stack */}
      <div className="flex -space-x-1.5 flex-shrink-0">
        {familiarFaces.slice(0, 3).map((face, i) => (
          face.imageUrl ? (
            <Image
              key={i}
              src={face.imageUrl}
              alt={displayName(face)}
              width={22}
              height={22}
              className="rounded-full border border-neutral-800"
              unoptimized
            />
          ) : (
            <div
              key={i}
              className="w-[22px] h-[22px] rounded-full bg-emerald-800 border border-neutral-800 flex items-center justify-center text-[10px] font-medium text-emerald-300"
            >
              {displayName(face).charAt(0)}
            </div>
          )
        ))}
      </div>

      {/* Text */}
      <span className="text-xs text-emerald-400 truncate">
        {familiarFaces.length === 1 ? (
          <><strong>{displayName(familiarFaces[0])}</strong> has worked out with you before</>
        ) : familiarFaces.length === 2 ? (
          <><strong>{displayName(familiarFaces[0])}</strong> and <strong>{displayName(familiarFaces[1])}</strong> have worked out with you before</>
        ) : (
          <><strong>{displayName(familiarFaces[0])}</strong>, <strong>{displayName(familiarFaces[1])}</strong> and <strong>{familiarFaces.length - 2} {familiarFaces.length - 2 === 1 ? 'other' : 'others'}</strong> you&apos;ve worked out with are going</>
        )}
      </span>
    </div>
  )
}
