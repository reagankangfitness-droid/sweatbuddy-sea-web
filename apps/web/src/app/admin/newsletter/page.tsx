'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  Mail,
  Download,
  Search,
  Loader2,
  Users,
  TrendingUp,
  Calendar,
  Inbox
} from 'lucide-react'

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

interface NewsletterSubscriber {
  email: string
  name: string | null
  subscribedAt: string
  source: string
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('all')

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const fetchSubscribers = async () => {
    try {
      const response = await fetch('/api/newsletter/subscribers', {
        headers: { 'x-admin-secret': ADMIN_SECRET },
      })
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
      }
    } catch {
      toast.error('Failed to fetch subscribers')
    } finally {
      setLoading(false)
    }
  }

  // Get unique sources
  const sources = Array.from(new Set(subscribers.map(s => s.source || 'unknown')))

  // Filter subscribers
  const filteredSubscribers = subscribers.filter(s => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesSource = selectedSource === 'all' || s.source === selectedSource
    return matchesSearch && matchesSource
  })

  // Export to CSV
  const exportToCSV = () => {
    let csvContent = 'Email,Name,Subscribed Date,Source\n'
    filteredSubscribers.forEach(s => {
      csvContent += `"${s.email}","${s.name || ''}","${format(new Date(s.subscribedAt), 'yyyy-MM-dd HH:mm')}","${s.source}"\n`
    })

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sweatbuddies-newsletter-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
    toast.success(`Exported ${filteredSubscribers.length} subscribers`)
  }

  // Calculate stats
  const thisWeek = subscribers.filter(s => {
    const subDate = new Date(s.subscribedAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return subDate >= weekAgo
  }).length

  const thisMonth = subscribers.filter(s => {
    const subDate = new Date(s.subscribedAt)
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    return subDate >= monthAgo
  }).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-neutral-50">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-neutral-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Newsletter</h1>
          <p className="text-neutral-500 mt-1">Manage your email subscribers</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{subscribers.length}</p>
              <p className="text-xs text-neutral-500">Total Subscribers</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{thisWeek}</p>
              <p className="text-xs text-neutral-500">This Week</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{thisMonth}</p>
              <p className="text-xs text-neutral-500">This Month</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{sources.length}</p>
              <p className="text-xs text-neutral-500">Sources</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-4 py-3 bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 appearance-none"
        >
          <option value="all">All Sources</option>
          {sources.map(source => (
            <option key={source} value={source}>
              {source.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">No subscribers found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left p-4 text-neutral-600 text-sm font-medium">Email</th>
                    <th className="text-left p-4 text-neutral-600 text-sm font-medium">Name</th>
                    <th className="text-left p-4 text-neutral-600 text-sm font-medium">Source</th>
                    <th className="text-left p-4 text-neutral-600 text-sm font-medium">Subscribed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map((subscriber, index) => (
                    <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                      <td className="p-4">
                        <a href={`mailto:${subscriber.email}`} className="text-blue-600 hover:underline">
                          {subscriber.email}
                        </a>
                      </td>
                      <td className="p-4 text-neutral-900">{subscriber.name || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-sm capitalize">
                          {(subscriber.source || 'unknown').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-500 text-sm">
                        {format(new Date(subscriber.subscribedAt), 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-neutral-100">
              {filteredSubscribers.map((subscriber, index) => (
                <div key={index} className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <a href={`mailto:${subscriber.email}`} className="text-blue-600 hover:underline text-sm break-all">
                        {subscriber.email}
                      </a>
                      {subscriber.name && (
                        <p className="text-neutral-900 font-medium mt-1">{subscriber.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-700 text-xs capitalize">
                      {(subscriber.source || 'unknown').replace('_', ' ')}
                    </span>
                    <span className="text-neutral-400 text-xs">
                      {format(new Date(subscriber.subscribedAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Results count */}
      {filteredSubscribers.length > 0 && (
        <p className="text-neutral-400 text-sm mt-4 text-center">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </p>
      )}
    </div>
  )
}
