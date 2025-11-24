'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UserPlus } from 'lucide-react'
import { InviteModal } from './invite-modal'

interface InviteFriendButtonProps {
  activityId: string
  activityTitle: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function InviteFriendButton({
  activityId,
  activityTitle,
  variant = 'outline',
  size = 'default',
  className,
}: InviteFriendButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Invite a Friend
      </Button>

      <InviteModal
        activityId={activityId}
        activityTitle={activityTitle}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  )
}
