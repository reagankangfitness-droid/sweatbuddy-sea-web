'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl: string | null
  createdAt: Date
}

interface DashboardActivitiesProps {
  initialActivities: Activity[]
}

export function DashboardActivities({ initialActivities }: DashboardActivitiesProps) {
  const router = useRouter()
  const [activities, setActivities] = useState(initialActivities)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClick = (activityId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteId(activityId)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/activities/${deleteId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete activity')
      }

      // Remove the activity from the list
      setActivities(activities.filter(a => a.id !== deleteId))
      toast.success('Activity deleted successfully!')
      router.refresh()
    } catch (error) {
      console.error('Error deleting activity:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete activity')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground mb-4">
          No activities yet. Create your first one!
        </p>
        <Link href="/activities/create">
          <Button>Create Activity</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <div key={activity.id} className="relative group">
            <Link href={`/activities/${activity.id}`}>
              <div className="rounded-lg border overflow-hidden card-hover-lift card-hover-glow">
                {activity.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={activity.imageUrl}
                      alt={activity.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold">{activity.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary-dark">
                      {activity.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    📍 {activity.city}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {activity.startTime && (
                      <span>🕒 {new Date(activity.startTime).toLocaleDateString()}</span>
                    )}
                    {activity.maxPeople && (
                      <span>👥 Max {activity.maxPeople}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10"
              onClick={(e) => handleDeleteClick(activity.id, e)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the activity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
