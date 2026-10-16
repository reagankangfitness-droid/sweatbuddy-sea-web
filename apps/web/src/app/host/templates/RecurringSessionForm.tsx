'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface CommunityOption { id: string; name: string; category: string; usualArea: string | null }
const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export default function RecurringSessionForm({ communities }: { communities: CommunityOption[] }) {
  const router = useRouter()
  const first = communities[0]
  const [communityId, setCommunityId] = useState(first.id)
  const [title, setTitle] = useState(`${first.name} weekly session`)
  const [day, setDay] = useState('SATURDAY')
  const [startTime, setStartTime] = useState('08:00')
  const [address, setAddress] = useState(first.usualArea ?? '')
  const [maxPeople, setMaxPeople] = useState('')
  const [whatToBring, setWhatToBring] = useState('Water, comfortable activewear, and anything your community normally recommends.')
  const [beginnerFriendly, setBeginnerFriendly] = useState(true)
  const [saving, setSaving] = useState(false)

  function changeCommunity(id: string) {
    setCommunityId(id)
    const community = communities.find((item) => item.id === id)
    if (community) {
      setTitle(`${community.name} weekly session`)
      setAddress(community.usualArea ?? '')
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const community = communities.find((item) => item.id === communityId) ?? first
    setSaving(true)
    try {
      const response = await fetch('/api/host/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communityId,
          title,
          categorySlug: community.category,
          daysOfWeek: [day],
          startTime,
          timezone: 'Asia/Singapore',
          city: 'Singapore',
          address,
          latitude: 1.3521,
          longitude: 103.8198,
          maxPeople: maxPeople ? Number(maxPeople) : null,
          fitnessLevel: beginnerFriendly ? 'BEGINNER' : 'ALL',
          whatToBring,
          price: 0,
          currency: 'SGD',
        }),
      })
      const data = await response.json()
      if (data.code === 'FOUNDING_CLUB_REQUIRED') {
        toast.info('Upgrade to Founding Club to add another recurring schedule')
        router.push(data.checkoutUrl || '/for-organizers')
        return
      }
      if (!response.ok) throw new Error(data.error || 'Could not save schedule')
      toast.success('Recurring schedule published for the next four weeks')
      router.push('/hub')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EA] px-5 py-8 text-[#17130E]">
      <div className="mx-auto max-w-2xl">
        <Link href="/hub" className="inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> Organizer hub</Link>
        <p className="sb-eyebrow mt-10">Publish once</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Set your recurring schedule</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">We’ll create the next four sessions and keep the public community page current.</p>
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm">
          <Field label="Community"><select value={communityId} onChange={(event) => changeCommunity(event.target.value)} className="field">{communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select></Field>
          <Field label="Session title"><input required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} className="field" /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Day"><select value={day} onChange={(event) => setDay(event.target.value)} className="field">{days.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Start time"><input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} className="field" /></Field></div>
          <Field label="Meeting point"><input required value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Exact landmark or address" className="field" /></Field>
          <Field label="Capacity (optional)"><input type="number" min="1" max="1000" value={maxPeople} onChange={(event) => setMaxPeople(event.target.value)} placeholder="Unlimited" className="field" /></Field>
          <Field label="What should newcomers bring?"><textarea value={whatToBring} onChange={(event) => setWhatToBring(event.target.value)} rows={3} className="field py-3" /></Field>
          <label className="flex items-center gap-3 rounded-2xl bg-[#F8F4EA] p-4 text-sm font-semibold"><input type="checkbox" checked={beginnerFriendly} onChange={(event) => setBeginnerFriendly(event.target.checked)} className="h-5 w-5 accent-[#E83E6B]" /> First-timer friendly</label>
          <button disabled={saving} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#E83E6B] text-sm font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Publish next four weeks</button>
        </form>
      </div>
      <style jsx>{`.field{height:3rem;width:100%;border-radius:1rem;border:1px solid rgba(0,0,0,.12);background:white;padding:0 .9rem;font-size:.875rem;outline:none}.field:focus{border-color:#E83E6B}`}</style>
    </main>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wide text-black/55">{label}</span>{children}</label>
}
