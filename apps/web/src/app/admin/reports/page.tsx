'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Flag,
  Loader2,
  AlertTriangle,
  Ban,
  ShieldAlert,
  Check,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED'
type ModerationAction = 'WARNING' | 'SUSPENSION' | 'BAN' | 'DISMISS'

interface ReportUser {
  id: string
  name: string
  email: string
  imageUrl: string | null
  accountStatus?: string
}

interface Report {
  id: string
  reason: string
  details: string | null
  status: ReportStatus
  actionTaken: ModerationAction | null
  resolutionNotes: string | null
  resolvedAt: string | null
  createdAt: string
  reporter: ReportUser
  reportedUser: ReportUser
}

interface StatusCounts {
  PENDING: number
  REVIEWED: number
  ACTIONED: number
  DISMISSED: number
}

const REASON_LABELS: Record<string, string> = {
  HARASSMENT: 'Harassment',
  SPAM: 'Spam',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  FAKE_PROFILE: 'Fake Profile',
  OTHER: 'Other',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  ACTIONED: 'bg-green-100 text-green-800',
  DISMISSED: 'bg-neutral-100 text-neutral-600',
}

const ACTION_COLORS: Record<ModerationAction, string> = {
  WARNING: 'bg-yellow-100 text-yellow-800',
  SUSPENSION: 'bg-orange-100 text-orange-800',
  BAN: 'bg-red-100 text-red-800',
  DISMISS: 'bg-neutral-100 text-neutral-600',
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    PENDING: 0,
    REVIEWED: 0,
    ACTIONED: 0,
    DISMISSED: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'all'>('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedAction, setSelectedAction] = useState<ModerationAction | null>(null)
  const [actionNotes, setActionNotes] = useState('')
  const [suspensionDays, setSuspensionDays] = useState(7)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const status = activeTab === 'all' ? 'all' : activeTab
      const response = await fetch(
        `/api/admin/reports?status=${status}&page=${page}&limit=20`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports)
      setStatusCounts(data.statusCounts)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, page])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleOpenActionModal = (report: Report) => {
    setSelectedReport(report)
    setSelectedAction(null)
    setActionNotes('')
    setSuspensionDays(7)
    setActionModalOpen(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedReport || !selectedAction) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          notes: actionNotes.trim() || undefined,
          suspensionDays: selectedAction === 'SUSPENSION' ? suspensionDays : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit action')
      }

      setActionModalOpen(false)
      fetchReports()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit action')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">User Reports</h1>
        <p className="text-neutral-600 mt-1">
          Review and moderate reported users
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => {
            setActiveTab('PENDING')
            setPage(1)
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'PENDING'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          )}
        >
          Pending
          {statusCounts.PENDING > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
              {statusCounts.PENDING}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab('all')
            setPage(1)
          }}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'all'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          )}
        >
          All Reports
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No reports to review</p>
        </div>
      ) : (
        <>
          {/* Reports list */}
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-neutral-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded',
                          STATUS_COLORS[report.status]
                        )}
                      >
                        {report.status}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(report.createdAt)}
                      </span>
                      {report.actionTaken && (
                        <span
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded',
                            ACTION_COLORS[report.actionTaken]
                          )}
                        >
                          {report.actionTaken}
                        </span>
                      )}
                    </div>

                    {/* Users */}
                    <div className="flex items-center gap-6 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                          {report.reporter.imageUrl ? (
                            <img
                              src={report.reporter.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-neutral-500">
                              {report.reporter.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {report.reporter.name}
                          </p>
                          <p className="text-xs text-neutral-500">Reporter</p>
                        </div>
                      </div>
                      <div className="text-neutral-400">reported</div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
                          {report.reportedUser.imageUrl ? (
                            <img
                              src={report.reportedUser.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-neutral-500">
                              {report.reportedUser.name?.charAt(0) || '?'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {report.reportedUser.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            Status: {report.reportedUser.accountStatus || 'ACTIVE'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reason & Details */}
                    <div className="mb-3">
                      <p className="text-sm font-medium text-neutral-900">
                        Reason: {REASON_LABELS[report.reason] || report.reason}
                      </p>
                      {report.details && (
                        <p className="text-sm text-neutral-600 mt-1">
                          {report.details}
                        </p>
                      )}
                    </div>

                    {/* Resolution notes */}
                    {report.resolutionNotes && (
                      <div className="bg-neutral-50 rounded p-3 text-sm">
                        <p className="font-medium text-neutral-700">Resolution notes:</p>
                        <p className="text-neutral-600">{report.resolutionNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === 'PENDING' && (
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActionModal(report)}
                      >
                        Take Action
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-neutral-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Take Action on Report</DialogTitle>
            <DialogDescription>
              Choose how to handle this report against{' '}
              {selectedReport?.reportedUser.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedAction('WARNING')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors',
                  selectedAction === 'WARNING'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">Warning</p>
                  <p className="text-xs text-neutral-500">Send a warning</p>
                </div>
              </button>
              <button
                onClick={() => setSelectedAction('SUSPENSION')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors',
                  selectedAction === 'SUSPENSION'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">Suspend</p>
                  <p className="text-xs text-neutral-500">Temp ban</p>
                </div>
              </button>
              <button
                onClick={() => setSelectedAction('BAN')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors',
                  selectedAction === 'BAN'
                    ? 'border-red-500 bg-red-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <Ban className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">Ban</p>
                  <p className="text-xs text-neutral-500">Permanent ban</p>
                </div>
              </button>
              <button
                onClick={() => setSelectedAction('DISMISS')}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-colors',
                  selectedAction === 'DISMISS'
                    ? 'border-neutral-500 bg-neutral-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                )}
              >
                <X className="w-5 h-5 text-neutral-600" />
                <div>
                  <p className="font-medium text-sm">Dismiss</p>
                  <p className="text-xs text-neutral-500">No action</p>
                </div>
              </button>
            </div>

            {/* Suspension duration */}
            {selectedAction === 'SUSPENSION' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Suspension duration (days)
                </label>
                <input
                  type="number"
                  value={suspensionDays}
                  onChange={(e) =>
                    setSuspensionDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))
                  }
                  min={1}
                  max={365}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Notes (optional)
              </label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={!selectedAction || isSubmitting}
              className={cn(
                selectedAction === 'BAN' && 'bg-red-600 hover:bg-red-700',
                selectedAction === 'SUSPENSION' && 'bg-orange-600 hover:bg-orange-700',
                selectedAction === 'WARNING' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Action
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
