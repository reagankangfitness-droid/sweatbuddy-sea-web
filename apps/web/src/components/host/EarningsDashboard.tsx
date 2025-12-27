'use client'

import { useState, useEffect } from 'react'
import { Loader2, TrendingUp, Calendar, Receipt, AlertCircle, ExternalLink } from 'lucide-react'

interface EarningsData {
  host: {
    instagramHandle: string
    stripeConnected: boolean
    stripeChargesEnabled: boolean
    stripePayoutsEnabled: boolean
  }
  summary: {
    totalRevenue: number
    totalPlatformFees: number
    totalStripeFees: number
    totalHostEarnings: number
    totalRefunded: number
    transactionCount: number
    currency: string
  }
  eventEarnings: Array<{
    eventId: string
    eventName: string
    eventDate: string | null
    ticketPrice: number
    ticketsSold: number
    ticketLimit: number | null
    totalRevenue: number
    platformFees: number
    stripeFees: number
    hostEarnings: number
    transactionCount: number
  }>
  recentActivity: Array<{
    id: string
    eventName: string
    attendeeEmail: string
    attendeeName: string | null
    amount: number
    date: string | null
  }>
  transactions: Array<{
    id: string
    eventId: string
    eventName: string
    amount: number
    platformFee: number
    stripeFee: number
    hostPayout: number
    status: string
    date: string
    refundedAt: string | null
    refundAmount: number | null
  }>
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
  }).format(cents / 100)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function EarningsDashboard() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'transactions'>('overview')

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const response = await fetch('/api/host/earnings')
        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = '/organizer'
            return
          }
          throw new Error('Failed to fetch earnings')
        }
        const earnings = await response.json()
        setData(earnings)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-neutral-100 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 bg-neutral-100 rounded-xl"></div>
          <div className="h-28 bg-neutral-100 rounded-xl"></div>
          <div className="h-28 bg-neutral-100 rounded-xl"></div>
        </div>
        <div className="h-64 bg-neutral-100 rounded-xl"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error || 'Failed to load earnings data'}</p>
      </div>
    )
  }

  const { host, summary, eventEarnings, recentActivity, transactions } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Earnings</h1>
        <p className="text-neutral-500 mt-1">
          Track your revenue from paid events
        </p>
      </div>

      {/* Stripe Status Warning */}
      {!host.stripeConnected && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Connect Stripe to receive payouts</p>
              <p className="text-sm text-amber-700 mt-1">
                You need to connect your Stripe account before you can accept payments.
              </p>
            </div>
          </div>
        </div>
      )}

      {host.stripeConnected && !host.stripePayoutsEnabled && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Complete Stripe setup</p>
              <p className="text-sm text-amber-700 mt-1">
                Your Stripe account needs additional information before you can receive payouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Your Earnings</span>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {formatCurrency(summary.totalHostEarnings)}
          </p>
          <p className="text-sm text-green-600 mt-1">
            from {summary.transactionCount} sale{summary.transactionCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-neutral-900">
            {formatCurrency(summary.totalRevenue)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">before fees</p>
        </div>

        <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-2">Total Fees</p>
          <p className="text-3xl font-bold text-neutral-900">
            {formatCurrency(summary.totalPlatformFees + summary.totalStripeFees)}
          </p>
          <p className="text-sm text-neutral-500 mt-1">
            Platform: {formatCurrency(summary.totalPlatformFees)} · Stripe: {formatCurrency(summary.totalStripeFees)}
          </p>
        </div>
      </div>

      {/* Refunds info */}
      {summary.totalRefunded > 0 && (
        <div className="bg-neutral-100 p-4 rounded-xl text-sm text-neutral-600">
          <span className="font-medium">Refunds:</span> {formatCurrency(summary.totalRefunded)} refunded
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-8">
          {(['overview', 'events', 'transactions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-neutral-900 text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab === 'overview' ? 'Recent Sales' : tab === 'events' ? 'By Event' : 'All Transactions'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No sales yet</p>
              <p className="text-sm mt-1">Sales from paid events will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl"
                >
                  <div>
                    <p className="font-medium text-neutral-900">{activity.eventName}</p>
                    <p className="text-sm text-neutral-500">
                      {activity.attendeeName || activity.attendeeEmail}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      +{formatCurrency(activity.amount)}
                    </p>
                    {activity.date && (
                      <p className="text-xs text-neutral-400">
                        {formatDateTime(activity.date)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {eventEarnings.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No paid events yet</p>
              <p className="text-sm mt-1">Create a paid event to start earning</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventEarnings.map((event) => (
                <div
                  key={event.eventId}
                  className="border border-neutral-200 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{event.eventName}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {event.eventDate ? formatDate(event.eventDate) : 'Recurring'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">
                        {formatCurrency(event.hostEarnings)}
                      </p>
                      <p className="text-xs text-neutral-400">your earnings</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">Tickets</p>
                      <p className="font-semibold text-neutral-900">
                        {event.ticketsSold}
                        {event.ticketLimit && ` / ${event.ticketLimit}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Price</p>
                      <p className="font-semibold text-neutral-900">
                        {formatCurrency(event.ticketPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Revenue</p>
                      <p className="font-semibold text-neutral-900">
                        {formatCurrency(event.totalRevenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Fees</p>
                      <p className="font-semibold text-neutral-400">
                        -{formatCurrency(event.platformFees + event.stripeFees)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 font-medium text-neutral-500">Date</th>
                    <th className="text-left py-3 font-medium text-neutral-500">Event</th>
                    <th className="text-right py-3 font-medium text-neutral-500">Amount</th>
                    <th className="text-right py-3 font-medium text-neutral-500">Fees</th>
                    <th className="text-right py-3 font-medium text-neutral-500">Payout</th>
                    <th className="text-left py-3 font-medium text-neutral-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-neutral-100">
                      <td className="py-3 text-neutral-600">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 font-medium text-neutral-900">
                        {tx.eventName}
                      </td>
                      <td className="py-3 text-right text-neutral-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 text-right text-neutral-400">
                        -{formatCurrency(tx.platformFee + tx.stripeFee)}
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(tx.hostPayout)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === 'SUCCEEDED'
                              ? 'bg-green-100 text-green-700'
                              : tx.status === 'REFUNDED'
                              ? 'bg-red-100 text-red-700'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {tx.status === 'SUCCEEDED' ? 'Paid' : tx.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-neutral-50 p-4 rounded-xl text-sm text-neutral-600">
        <p>
          <strong>How payouts work:</strong> Stripe automatically transfers your earnings to your
          connected bank account. Payouts typically arrive 2-7 business days after a sale.
        </p>
      </div>
    </div>
  )
}
