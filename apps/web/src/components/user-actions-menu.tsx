'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Flag, Ban, UserX } from 'lucide-react'
import { ReportUserModal } from '@/components/report-user-modal'
import { BlockUserDialog } from '@/components/block-user-dialog'
import { cn } from '@/lib/utils'

interface UserActionsMenuProps {
  userId: string
  userName?: string
  isBlocked?: boolean
  onBlockStatusChange?: () => void
  triggerClassName?: string
  align?: 'start' | 'center' | 'end'
}

export function UserActionsMenu({
  userId,
  userName,
  isBlocked = false,
  onBlockStatusChange,
  triggerClassName,
  align = 'end',
}: UserActionsMenuProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleUnblock = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unblock user')
      }

      onBlockStatusChange?.()
    } catch (error) {
      console.error('Error unblocking user:', error)
    }
    setMenuOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        className={triggerClassName}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="sr-only">User actions</span>
      </Button>

      {menuOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[160px] rounded-md border bg-white shadow-lg',
            align === 'end' && 'right-0',
            align === 'start' && 'left-0',
            align === 'center' && 'left-1/2 -translate-x-1/2'
          )}
        >
          <div className="py-1">
            <button
              onClick={() => {
                setMenuOpen(false)
                setReportModalOpen(true)
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-neutral-100"
            >
              <Flag className="w-4 h-4 mr-2" />
              Report user
            </button>
            <div className="border-t border-neutral-100 my-1" />
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                className="flex w-full items-center px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                <UserX className="w-4 h-4 mr-2" />
                Unblock user
              </button>
            ) : (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  setBlockDialogOpen(true)
                }}
                className="flex w-full items-center px-3 py-2 text-sm text-red-600 hover:bg-neutral-100"
              >
                <Ban className="w-4 h-4 mr-2" />
                Block user
              </button>
            )}
          </div>
        </div>
      )}

      <ReportUserModal
        userId={userId}
        userName={userName}
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />

      <BlockUserDialog
        userId={userId}
        userName={userName}
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        onBlockSuccess={onBlockStatusChange}
      />
    </div>
  )
}
