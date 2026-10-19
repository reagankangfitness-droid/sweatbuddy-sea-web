'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Download, Loader2 } from 'lucide-react'

type ResearchResponse = {
  id: string
  name: string
  email: string
  phone: string | null
  recentAction: string
  actionTiming: string
  gymsConsidered: string | null
  trainingStyles: string[]
  informationGaps: string[]
  paidReportIntent: string
  eligibilityScore: number
  qualified: boolean
  createdAt: string
}

export default function GymResearchAdminPage() {
  const [responses, setResponses] = useState<ResearchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/gym-research')
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load responses')
        setResponses(data.responses)
      })
      .catch((requestError) => setError(requestError instanceof Error ? requestError.message : 'Could not load responses'))
      .finally(() => setLoading(false))
  }, [])

  function downloadCsv() {
    const headers = ['Name', 'Email', 'Qualified', 'Score', 'Action', 'Timing', 'Gyms considered', 'Training styles', 'Information gaps', 'S$9 report', 'Submitted']
    const rows = responses.map((item) => [item.name, item.email, item.qualified, item.eligibilityScore, item.recentAction, item.actionTiming, item.gymsConsidered, item.trainingStyles.join('; '), item.informationGaps.join('; '), item.paidReportIntent, item.createdAt])
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    link.download = `gym-research-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const qualified = responses.filter((item) => item.qualified)
  const willingToPay = responses.filter((item) => item.paidReportIntent === 'YES')

  return (
    <div className="min-h-screen bg-neutral-900 p-5 text-white lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-pink-400">Validation research</p><h1 className="mt-2 text-3xl font-bold">Gym research</h1><p className="mt-2 text-sm text-neutral-400">Questionnaire responses from prospective gym users.</p></div>
          <button onClick={downloadCsv} disabled={!responses.length} className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-black disabled:opacity-40"><Download className="h-4 w-4" /> Export CSV</button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Metric label="Responses" value={responses.length} />
          <Metric label="Qualified" value={qualified.length} />
          <Metric label="Would pay S$9" value={willingToPay.length} />
        </div>

        {loading ? <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin text-neutral-500" /></div> : error ? <p className="mt-8 rounded-xl bg-red-950 p-4 text-red-200">{error}</p> : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950">
            {responses.length === 0 ? <p className="p-10 text-center text-neutral-500">No responses yet. Share /gym-research to begin recruiting.</p> : responses.map((item) => (
              <div key={item.id} className="border-b border-neutral-800 p-5 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2"><p className="font-bold">{item.name}</p>{item.qualified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Qualified</span>}</div><p className="mt-1 text-sm text-neutral-400">{item.email}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-pink-400">Score {item.eligibilityScore}</p><p className="mt-1 text-xs text-neutral-500">{new Date(item.createdAt).toLocaleDateString('en-SG')}</p></div>
                </div>
                <div className="mt-4 grid gap-3 text-xs text-neutral-300 sm:grid-cols-3"><Info label="Recent decision" value={`${item.recentAction} · ${item.actionTiming}`} /><Info label="Information gaps" value={item.informationGaps.join(', ')} /><Info label="S$9 report" value={item.paidReportIntent} /></div>
                {item.gymsConsidered && <p className="mt-4 text-sm text-neutral-400"><span className="font-bold text-neutral-200">Considered:</span> {item.gymsConsidered}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5"><p className="text-3xl font-bold">{value}</p><p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">{label}</p></div> }
function Info({ label, value }: { label: string; value: string }) { return <div><p className="mb-1 uppercase tracking-wider text-neutral-600">{label}</p><p>{value}</p></div> }
