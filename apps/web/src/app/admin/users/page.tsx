'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { User, Loader2 } from 'lucide-react'
import { BanUserButton } from '@/components/admin/BanUserButton'

interface AdminUser {
  id: string
  name: string | null
  email: string
  imageUrl: string | null
  createdAt: string
  accountStatus: string
  bannedAt: string | null
  banReason: string | null
  p2pOnboardingCompleted: boolean
  sessionsHostedCount: number
  sessionsAttendedCount: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-100">User Management</h1>
        <p className="text-neutral-500 mt-1">
          {users.length} total &nbsp;·&nbsp;{' '}
          {users.filter(u => u.p2pOnboardingCompleted).length} onboarded &nbsp;·&nbsp;{' '}
          <span className="text-red-400">{users.filter(u => u.accountStatus === 'BANNED').length} banned</span>
        </p>
      </div>

      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Onboarded</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Hosted</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Attended</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`${user.accountStatus === 'BANNED' ? 'bg-red-950/20' : 'hover:bg-neutral-900/50'} transition-colors`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={user.name || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center">
                          <User className="w-4 h-4 text-neutral-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-100">{user.name || 'Anonymous'}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-400">
                    {new Date(user.createdAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    {user.p2pOnboardingCompleted ? (
                      <span className="text-xs bg-emerald-900/50 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">Yes</span>
                    ) : (
                      <span className="text-xs bg-neutral-800 text-neutral-500 px-2 py-0.5 rounded-full">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{user.sessionsHostedCount}</td>
                  <td className="px-6 py-4 text-sm text-neutral-300">{user.sessionsAttendedCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border w-fit ${
                        user.accountStatus === 'BANNED'
                          ? 'bg-red-900/50 text-red-400 border-red-800'
                          : user.accountStatus === 'SUSPENDED'
                          ? 'bg-orange-900/50 text-orange-400 border-orange-800'
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}>
                        {user.accountStatus}
                      </span>
                      {user.accountStatus === 'BANNED' && user.bannedAt && (
                        <span className="text-xs text-neutral-500">
                          {new Date(user.bannedAt).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {user.accountStatus === 'BANNED' && user.banReason && (
                        <span className="text-xs text-neutral-500 max-w-[140px] truncate" title={user.banReason}>
                          {user.banReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <BanUserButton userId={user.id} accountStatus={user.accountStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
