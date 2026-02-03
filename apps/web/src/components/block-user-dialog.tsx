'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Loader2, Ban } from 'lucide-react'
import { toast } from 'sonner'

interface BlockUserDialogProps {
  userId: string
  userName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onBlockSuccess?: () => void
}

export function BlockUserDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onBlockSuccess,
}: BlockUserDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false)

  const handleBlock = async () => {
    setIsBlocking(true)
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to block user')
      }

      toast.success(userName ? `${userName} has been blocked` : 'User blocked')
      onOpenChange(false)
      onBlockSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to block user')
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-500" />
            Block {userName || 'this user'}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              When you block someone:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-2">
              <li>They won&apos;t be able to see your waves or activities</li>
              <li>You won&apos;t see their content in your feed</li>
              <li>Their messages in shared chats will be hidden from you</li>
              <li>They won&apos;t be notified that you blocked them</li>
            </ul>
            <p className="text-sm">
              You can unblock them anytime from your settings.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleBlock()
            }}
            disabled={isBlocking}
            className="bg-red-600 hover:bg-red-700"
          >
            {isBlocking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Blocking...
              </>
            ) : (
              'Block'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
