'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { LogoWithText } from '@/components/logo'

type FormState = {
  recentAction: string
  actionTiming: string
  gymsConsidered: string
  currentGym: string
  trainingFrequency: string
  trainingStyles: string[]
  researchActions: string[]
  informationGaps: string[]
  biggestSurprise: string
  contributionIntent: string[]
  paidReportIntent: string
  name: string
  email: string
  researchConsent: boolean
  website: string
}

const initial: FormState = {
  recentAction: '', actionTiming: '', gymsConsidered: '', currentGym: '', trainingFrequency: '',
  trainingStyles: [], researchActions: [], informationGaps: [], biggestSurprise: '', contributionIntent: [],
  paidReportIntent: '', name: '', email: '',
  researchConsent: false, website: '',
}

const actionOptions = [
  ['JOINED', 'Joined a gym'], ['SWITCHED', 'Switched gyms'], ['CANCELLED', 'Cancelled a membership'],
  ['COMPARED', 'Seriously compared gyms'], ['NONE', 'None of these'],
]
const timingOptions = [
  ['LAST_MONTH', 'Within the last month'], ['TWO_TO_THREE_MONTHS', '2–3 months ago'],
  ['FOUR_TO_SIX_MONTHS', '4–6 months ago'], ['OVER_SIX_MONTHS', 'More than 6 months ago'],
  ['NOT_APPLICABLE', 'Not applicable'],
]

export default function GymResearchForm() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ qualified: boolean } | null>(null)
  const [error, setError] = useState('')
  const totalSteps = 7

  const valid = useMemo(() => {
    if (step === 0) return form.researchConsent
    if (step === 1) return Boolean(form.recentAction && form.actionTiming && form.gymsConsidered.trim())
    if (step === 2) return Boolean(form.trainingFrequency && form.trainingStyles.length)
    if (step === 3) return form.researchActions.length > 0
    if (step === 4) return form.informationGaps.length > 0
    if (step === 5) return Boolean(form.paidReportIntent)
    return Boolean(form.name.trim() && /^\S+@\S+\.\S+$/.test(form.email.trim()))
  }, [form, step])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function toggle(key: 'trainingStyles' | 'researchActions' | 'informationGaps' | 'contributionIntent', value: string) {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value],
    }))
  }

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const search = new URLSearchParams(window.location.search)
      const response = await fetch('/api/gym-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'gym-research-screening',
          utmSource: search.get('utm_source'),
          utmMedium: search.get('utm_medium'),
          utmCampaign: search.get('utm_campaign'),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save your response')
      setResult({ qualified: data.qualified })
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Could not save your response')
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <Shell progress={100}>
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E83E6B] text-white"><Check className="h-7 w-7" /></div>
          <p className="sb-eyebrow mt-8">Response received</p>
          <h1 className="mt-3 text-4xl font-bold !text-[#17130E]">Thank you for helping us build something useful.</h1>
          <p className="mt-5 text-base leading-7 text-black/60">Your response is saved and will help us understand where gym information currently falls short.</p>
          <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-[#17130E] px-6 text-sm font-bold !text-white">Back to SweatBuddies</Link>
        </div>
      </Shell>
    )
  }

  return (
    <Shell progress={(step / (totalSteps - 1)) * 100}>
      <div className="mx-auto max-w-2xl py-10 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#E83E6B]">Gym research · {step + 1} of {totalSteps}</p>

        {step === 0 && <Intro form={form} set={set} />}
        {step === 1 && <Decision form={form} set={set} />}
        {step === 2 && <Training form={form} set={set} toggle={toggle} />}
        {step === 3 && <Research form={form} toggle={toggle} />}
        {step === 4 && <Gaps form={form} set={set} toggle={toggle} />}
        {step === 5 && <Contribution form={form} set={set} toggle={toggle} />}
        {step === 6 && <Contact form={form} set={set} />}

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || saving} className="inline-flex h-12 items-center gap-2 rounded-full border border-black/15 px-5 text-sm font-bold disabled:invisible"><ArrowLeft className="h-4 w-4" /> Back</button>
          {step < totalSteps - 1 ? (
            <button type="button" onClick={() => setStep((value) => value + 1)} disabled={!valid} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#17130E] px-6 text-sm font-bold !text-white disabled:cursor-not-allowed disabled:opacity-30">Continue <ArrowRight className="h-4 w-4" /></button>
          ) : (
            <button type="button" onClick={submit} disabled={!valid || saving} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#E83E6B] px-6 text-sm font-bold !text-white disabled:opacity-40">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit response</button>
          )}
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children, progress }: { children: React.ReactNode; progress: number }) {
  return <main className="min-h-screen bg-[#F8F4EA] text-[#17130E]"><header className="border-b border-black/10 bg-[#F8F4EA]"><div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5"><Link href="/"><LogoWithText size={25} color="#E83E6B" textColor="#17130E" /></Link><span className="text-xs font-semibold text-black/50">About 4 minutes</span></div><div className="h-1 bg-black/5"><div className="h-full bg-[#E83E6B] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div></header><div className="px-5">{children}</div></main>
}

function Title({ children, help }: { children: React.ReactNode; help?: string }) {
  return <><h1 className="mt-4 text-3xl font-bold leading-tight !text-[#17130E] sm:text-5xl">{children}</h1>{help && <p className="mt-4 max-w-xl text-base leading-7 text-black/55">{help}</p>}</>
}

function Options({ options, value, onChange }: { options: string[][]; value: string; onChange: (value: string) => void }) {
  return <div className="mt-7 grid gap-3 sm:grid-cols-2">{options.map(([key, label]) => <button type="button" key={key} onClick={() => onChange(key)} className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${value === key ? 'border-[#E83E6B] bg-[#E83E6B]/10 text-[#E83E6B]' : 'border-black/10 bg-white hover:border-black/30'}`}>{label}</button>)}</div>
}

function Checks({ options, values, onToggle }: { options: string[][]; values: string[]; onToggle: (value: string) => void }) {
  return <div className="mt-7 grid gap-3 sm:grid-cols-2">{options.map(([key, label]) => <button type="button" key={key} aria-pressed={values.includes(key)} onClick={() => onToggle(key)} className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${values.includes(key) ? 'border-[#E83E6B] bg-[#E83E6B]/10' : 'border-black/10 bg-white hover:border-black/30'}`}><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${values.includes(key) ? 'border-[#E83E6B] bg-[#E83E6B] text-white' : 'border-black/20'}`}>{values.includes(key) && <Check className="h-3 w-3" />}</span>{label}</button>)}</div>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className="mt-2 h-[52px] w-full rounded-2xl border border-black/15 bg-white px-4 text-base outline-none focus:border-[#E83E6B]" /> }
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className="mt-2 w-full rounded-2xl border border-black/15 bg-white p-4 text-base outline-none focus:border-[#E83E6B]" /> }
function Label({ children }: { children: React.ReactNode }) { return <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-black/55">{children}</label> }

function Intro({ form, set }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return <><Title help="We’re researching how people choose gyms in Singapore. This is not a sales form, and honest answers—including negative ones—are useful.">Help us understand how people really choose a gym.</Title><div className="mt-8 rounded-3xl border border-black/10 bg-white p-5 text-sm leading-6 text-black/60"><p className="font-bold text-[#17130E]">What we’ll ask</p><p className="mt-2">Your most recent gym decision, what was difficult to compare, and which information would have helped. We will use responses only for product research and will not publish answers with your identity.</p></div><label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white p-4 text-sm leading-6"><input type="checkbox" checked={form.researchConsent} onChange={(event) => set('researchConsent', event.target.checked)} className="mt-1 h-5 w-5 accent-[#E83E6B]" /><span>I’m at least 18 and consent to SweatBuddies storing these answers for product research. I can ask for my response to be deleted.</span></label></>
}

function Decision({ form, set }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return <><Title help="Think about your most recent real decision, not your ideal process.">What happened the last time you considered a gym?</Title><Options options={actionOptions} value={form.recentAction} onChange={(value) => set('recentAction', value)} /><Label>When was this?</Label><Options options={timingOptions} value={form.actionTiming} onChange={(value) => set('actionTiming', value)} /><Label>Which gyms did you consider?</Label><Textarea rows={3} value={form.gymsConsidered} onChange={(event) => set('gymsConsidered', event.target.value)} placeholder="List at least one—even if you did not join" /><Label>Which gym do you currently use? (optional)</Label><Input value={form.currentGym} onChange={(event) => set('currentGym', event.target.value)} /></>
}

function Training({ form, set, toggle }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void; toggle: (key: 'trainingStyles', value: string) => void }) {
  return <><Title>Tell us about your training.</Title><Label>How often do you train?</Label><Options options={[["LESS_THAN_WEEKLY","Less than weekly"],["ONE_TO_TWO","1–2 times a week"],["THREE_TO_FOUR","3–4 times a week"],["FIVE_PLUS","5+ times a week"]]} value={form.trainingFrequency} onChange={(value) => set('trainingFrequency', value)} /><Label>What do you mainly train?</Label><Checks options={[["GENERAL","General fitness"],["BODYBUILDING","Bodybuilding"],["POWERLIFTING","Powerlifting"],["WEIGHTLIFTING","Olympic weightlifting"],["HYROX","HYROX / functional"],["CARDIO","Cardio"],["CLASSES","Group classes"],["OTHER","Other"]]} values={form.trainingStyles} onToggle={(value) => toggle('trainingStyles', value)} /></>
}

function Research({ form, toggle }: { form: FormState; toggle: (key: 'researchActions', value: string) => void }) {
  return <><Title help="Select everything you actually did.">How did you compare your options?</Title><Checks options={[["GOOGLE","Used Google Maps or search"],["SOCIAL","Checked social media"],["ASKED_COMMUNITY","Asked friends, Reddit or a community"],["CONTACTED","Contacted gyms directly"],["VISITED","Visited or trialled gyms"],["COMPARED_PRICES","Compared prices or contracts"],["NOTES","Kept notes or a spreadsheet"],["OTHER","Something else"]]} values={form.researchActions} onToggle={(value) => toggle('researchActions', value)} /></>
}

function Gaps({ form, set, toggle }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void; toggle: (key: 'informationGaps', value: string) => void }) {
  return <><Title help="Select the information that was difficult to find or trust.">What made the decision harder than it should have been?</Title><Checks options={[["TRUE_PRICE","True monthly cost and hidden fees"],["CONTRACT","Contract and cancellation terms"],["CROWDING","Crowding and equipment waits"],["EQUIPMENT","Exact equipment available"],["AMENITIES","Showers, lockers and towels"],["ATMOSPHERE","Atmosphere and filming culture"],["HOURS","Real access and operating hours"],["NOTHING","Nothing was difficult"]]} values={form.informationGaps} onToggle={(value) => toggle('informationGaps', value)} /><Label>What surprised or disappointed you after visiting or joining? (optional)</Label><Textarea rows={4} value={form.biggestSurprise} onChange={(event) => set('biggestSurprise', event.target.value)} placeholder="One concrete example is more useful than a general review" /></>
}

function Contribution({ form, set, toggle }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void; toggle: (key: 'contributionIntent', value: string) => void }) {
  return <><Title help="These answers help us assess whether member-reported gym data can stay accurate.">What would you be willing to contribute?</Title><Checks options={[["PRICE","An anonymous price quote"],["CROWD","A 10-second crowd check-in"],["EQUIPMENT","Confirm equipment available"],["CONTRACT","A redacted quotation or contract"],["NONE","I would not contribute"]]} values={form.contributionIntent} onToggle={(value) => toggle('contributionIntent', value)} /><Label>Would you pay S$9 for a personalized comparison of your five best gym options?</Label><Options options={[["YES","Yes, if I were choosing now"],["MAYBE","Maybe—it depends on the report"],["NO","No"]]} value={form.paidReportIntent} onChange={(value) => set('paidReportIntent', value)} /></>
}

function Contact({ form, set }: { form: FormState; set: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return <><Title help="We’ll use your email only to identify duplicate responses and share relevant research updates.">Last step: tell us who you are.</Title><div className="mt-7 grid gap-4 sm:grid-cols-2"><div><Label>Name</Label><Input required value={form.name} onChange={(event) => set('name', event.target.value)} autoComplete="name" /></div><div><Label>Email</Label><Input required type="email" value={form.email} onChange={(event) => set('email', event.target.value)} autoComplete="email" /></div></div><input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => set('website', event.target.value)} className="hidden" /></>
}
