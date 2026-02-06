'use client'

import { useState } from "react";

const STEPS = [
  { id: 0, label: "Pre-Flight", emoji: "0" },
  { id: 1, label: "Agent Infrastructure", emoji: "1" },
  { id: 2, label: "Weekly Pulse API", emoji: "2" },
  { id: 3, label: "Weekly Pulse UI", emoji: "3" },
  { id: 4, label: "Agent Chat API", emoji: "4" },
  { id: 5, label: "Agent Chat UI", emoji: "5" },
  { id: 6, label: "Smart Segmentation", emoji: "6" },
  { id: 7, label: "Content Generator", emoji: "7" },
  { id: 8, label: "Retention Alerts", emoji: "8" },
  { id: 9, label: "Cron Jobs", emoji: "9" },
  { id: 10, label: "Ship It", emoji: "10" },
];

function CodeBlock({ title, code, variant }: { title: string; code: string; variant: 'prompt' | 'code' }) {
  const [copied, setCopied] = useState(false);
  const bg = variant === "prompt" ? "bg-gray-950" : "bg-gray-900";
  const headerBg = variant === "prompt" ? "bg-violet-900" : "bg-gray-800";
  const headerText = variant === "prompt" ? "text-violet-200" : "text-gray-400";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800">
      <div className={`${headerBg} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60"></div>
          </div>
          <span className={`text-[10px] font-mono ml-2 ${headerText}`}>{title}</span>
        </div>
        {variant === "prompt" && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-[10px] font-medium text-violet-300 hover:text-white transition-colors"
          >
            {copied ? "Copied!" : "Copy prompt"}
          </button>
        )}
      </div>
      <div className={`${bg} p-4 overflow-x-auto`}>
        <pre className="text-[11px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{code}</pre>
      </div>
    </div>
  );
}

function VerifyChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  return (
    <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-2">Verify before moving on</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <button key={i} onClick={() => setChecked(p => ({ ...p, [i]: !p[i] }))} className="flex items-center gap-2 w-full text-left">
            <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked[i] ? "bg-emerald-500 border-emerald-500" : "border-emerald-300"}`}>
              {checked[i] && <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
            <span className={`text-xs ${checked[i] ? "text-emerald-400 line-through" : "text-emerald-700"}`}>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Step 0: Pre-Flight ─── */
function Step0() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 0: Pre-Flight Setup</h3>
        <p className="text-sm text-gray-300">Verify your environment is ready for Phase 2. The Anthropic SDK is already installed.</p>
      </div>

      <div className="space-y-3">
        {[
          {
            title: "1. Verify Anthropic SDK",
            steps: [
              "Check package.json has @anthropic-ai/sdk (already installed)",
              "Create .env.local variable: ANTHROPIC_API_KEY=sk-ant-...",
              "Get API key from console.anthropic.com",
            ],
          },
          {
            title: "2. Add Env Var to Vercel",
            steps: [
              "Vercel Dashboard → sweatbuddy project → Settings → Environment Variables",
              "Add ANTHROPIC_API_KEY for Production + Preview",
              "Redeploy after adding",
            ],
          },
          {
            title: "3. Understand Current Stack",
            steps: [
              "Database: PostgreSQL + Prisma ORM",
              "Auth: Clerk (users) + Custom password (admin) + Magic link (organizers)",
              "Email: Resend",
              "Payments: Stripe + PayNow",
              "Host dashboard: /host/dashboard with stats, events, activity feed",
              "Admin dashboard: /admin with password auth",
            ],
          },
          {
            title: "4. Existing Data Models",
            steps: [
              "EventAttendance - tracks RSVPs with email, name, check-in status",
              "Activity - events with categories, pricing, location",
              "Organizer - host accounts linked to Instagram handles",
              "HostStats, HostStatsDaily - aggregated metrics",
              "Review - attendee reviews with ratings",
            ],
          },
        ].map((section, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-2">{section.title}</h4>
            <div className="space-y-1">
              {section.steps.map((step, j) => (
                <p key={j} className="text-xs text-gray-600">{step}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <VerifyChecklist items={[
        "ANTHROPIC_API_KEY is in .env.local",
        "ANTHROPIC_API_KEY is in Vercel environment variables",
        "npm run dev works without errors",
        "/host/dashboard loads and shows stats",
        "You understand the existing data models",
      ]} />
    </div>
  );
}

/* ─── Step 1: Agent Infrastructure ─── */
function Step1() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 1: Agent Infrastructure</h3>
        <p className="text-sm text-gray-300">Create the core AI agent utilities and database models for storing agent conversations and generated content.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Zero.</span> New files only. Creates lib/ai/ utilities and adds Prisma models.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Create AI agent infrastructure for SweatBuddies.

## Context
SweatBuddies uses:
- PostgreSQL + Prisma ORM (schema at apps/web/prisma/schema.prisma)
- Anthropic SDK already installed (@anthropic-ai/sdk)
- Clerk for user auth, custom auth for organizers
- Host dashboard at /host/dashboard

## What to build

### 1. Add Prisma models (apps/web/prisma/schema.prisma)

Add these models to track AI interactions:

model AgentConversation {
  id            String   @id @default(cuid())
  organizerId   String
  organizer     Organizer @relation(fields: [organizerId], references: [id])
  title         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  messages      AgentMessage[]
}

model AgentMessage {
  id              String   @id @default(cuid())
  conversationId  String
  conversation    AgentConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role            String   // 'user' | 'assistant'
  content         String   @db.Text
  createdAt       DateTime @default(now())
}

model WeeklyPulse {
  id            String   @id @default(cuid())
  organizerId   String
  organizer     Organizer @relation(fields: [organizerId], references: [id])
  weekStart     DateTime
  weekEnd       DateTime
  summary       String   @db.Text
  highlights    Json     // Array of highlight strings
  insights      Json     // Array of insight objects
  suggestions   Json     // Array of action suggestions
  metrics       Json     // Stats snapshot
  createdAt     DateTime @default(now())

  @@unique([organizerId, weekStart])
}

model GeneratedContent {
  id            String   @id @default(cuid())
  organizerId   String
  organizer     Organizer @relation(fields: [organizerId], references: [id])
  type          String   // 'instagram_caption' | 'whatsapp_message' | 'event_description' | 'email'
  eventId       String?
  prompt        String   @db.Text
  content       String   @db.Text
  metadata      Json?    // Additional context like tone, length, etc.
  createdAt     DateTime @default(now())
}

Also add relations to Organizer model:
  agentConversations AgentConversation[]
  weeklyPulses       WeeklyPulse[]
  generatedContent   GeneratedContent[]

### 2. Create lib/ai/client.ts

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export { anthropic }

export const AGENT_MODEL = 'claude-sonnet-4-20250514'

export interface AgentContext {
  organizerName: string
  communityName: string
  communityType: string
  totalEvents: number
  totalAttendees: number
  recentActivity: Array<{
    type: string
    attendeeName: string
    eventName: string
    timestamp: string
  }>
  topRegulars: Array<{
    name: string
    attendanceCount: number
  }>
  atRiskMembers: Array<{
    name: string
    daysSinceLastAttended: number
  }>
  upcomingEvents: Array<{
    name: string
    date: string
    goingCount: number
  }>
}

### 3. Create lib/ai/prompts.ts

System prompts for different agent tasks:

export const WEEKLY_PULSE_SYSTEM_PROMPT = \`You are a friendly AI assistant for SweatBuddies, a fitness community platform in Singapore.

You're writing a weekly pulse summary for a host. Be warm, encouraging, and actionable.

Guidelines:
- Use casual, friendly tone (like a supportive friend)
- Celebrate wins, no matter how small
- Be specific with data and names
- Keep suggestions practical and bite-sized
- Use Singapore context when relevant
- No corporate jargon
- Keep it concise but meaningful\`

export const CHAT_SYSTEM_PROMPT = \`You are a helpful AI assistant for SweatBuddies hosts in Singapore.

You help hosts:
- Understand their community metrics
- Get ideas for growing their community
- Write content for social media and messages
- Handle tricky situations with attendees
- Plan events and activities

Guidelines:
- Be warm, friendly, and encouraging
- Give specific, actionable advice
- Reference their actual data when relevant
- Keep responses concise unless detail is requested
- Use Singapore context (locations, culture, timing)
- If you don't know something specific, say so\`

export const CONTENT_SYSTEM_PROMPT = \`You are a creative assistant helping SweatBuddies hosts write engaging content.

You write:
- Instagram captions (engaging, with relevant hashtags)
- WhatsApp messages (casual, friendly)
- Event descriptions (clear, exciting)
- Email messages (warm, professional)

Guidelines:
- Match the host's community vibe
- Use emojis sparingly but effectively
- Include calls-to-action
- Keep it authentic, not salesy
- Consider Singapore audience\`

### 4. Create lib/ai/context.ts

Helper to build agent context from database:

import { prisma } from '@/lib/prisma'

export async function buildAgentContext(organizerId: string): Promise<AgentContext> {
  // Fetch organizer with their events
  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
    include: {
      events: {
        where: { status: 'APPROVED' },
        include: {
          attendees: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!organizer) throw new Error('Organizer not found')

  // Calculate stats
  const allAttendees = organizer.events.flatMap(e => e.attendees)
  const uniqueEmails = new Set(allAttendees.map(a => a.email))

  // Get recent activity (last 7 days)
  const recentActivity = allAttendees
    .filter(a => {
      const date = new Date(a.createdAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return date > weekAgo
    })
    .slice(0, 10)
    .map(a => ({
      type: 'rsvp',
      attendeeName: a.name || a.email.split('@')[0],
      eventName: organizer.events.find(e => e.id === a.eventId)?.name || 'Event',
      timestamp: a.createdAt.toISOString(),
    }))

  // Calculate top regulars
  const attendanceCounts: Record<string, { name: string; count: number }> = {}
  allAttendees.forEach(a => {
    const key = a.email
    if (!attendanceCounts[key]) {
      attendanceCounts[key] = { name: a.name || a.email.split('@')[0], count: 0 }
    }
    attendanceCounts[key].count++
  })
  const topRegulars = Object.values(attendanceCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(r => ({ name: r.name, attendanceCount: r.count }))

  // Upcoming events
  const now = new Date()
  const upcomingEvents = organizer.events
    .filter(e => e.date && new Date(e.date) > now)
    .slice(0, 5)
    .map(e => ({
      name: e.name,
      date: e.date?.toISOString() || '',
      goingCount: e.attendees.length,
    }))

  return {
    organizerName: organizer.name || organizer.instagramHandle,
    communityName: organizer.name || 'Your community',
    communityType: 'Fitness', // Could be derived from event categories
    totalEvents: organizer.events.length,
    totalAttendees: uniqueEmails.size,
    recentActivity,
    topRegulars,
    atRiskMembers: [], // Will implement in Step 6
    upcomingEvents,
  }
}

### 5. Run migrations

After adding the Prisma models, run:
npx prisma db push

## Important
- Do NOT modify any existing files except prisma/schema.prisma
- All new code goes in lib/ai/
- Use the existing Prisma client pattern from lib/prisma.ts
- The models should relate to the existing Organizer model`} />

      <VerifyChecklist items={[
        "lib/ai/client.ts exists with Anthropic client",
        "lib/ai/prompts.ts exists with system prompts",
        "lib/ai/context.ts exists with buildAgentContext function",
        "Prisma schema has AgentConversation, AgentMessage, WeeklyPulse, GeneratedContent models",
        "npx prisma db push ran successfully",
        "npm run dev still works",
      ]} />
    </div>
  );
}

/* ─── Step 2: Weekly Pulse API ─── */
function Step2() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 2: Weekly Pulse API</h3>
        <p className="text-sm text-gray-300">Create the API route that generates AI-powered weekly summaries for hosts with real data.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Zero.</span> New API route only. No existing code modified.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Create the Weekly Pulse API for SweatBuddies hosts.

## Context
We've set up AI infrastructure in lib/ai/. Now create the API that generates personalized weekly summaries using Claude.

## What to build

### 1. API Route: app/api/host/pulse/route.ts

GET handler:
- Verify organizer session (use existing pattern from /api/host/dashboard)
- Check if a pulse already exists for this week
- If exists, return cached pulse
- If not, generate new pulse using Claude

POST handler (force regenerate):
- Same auth check
- Always generates fresh pulse
- Saves to WeeklyPulse table

### 2. Generation logic

Use the buildAgentContext() function to gather host's data, then:

const response = await anthropic.messages.create({
  model: AGENT_MODEL,
  max_tokens: 1500,
  system: WEEKLY_PULSE_SYSTEM_PROMPT,
  messages: [{
    role: 'user',
    content: \`Generate a weekly pulse for this host:

Host: \${context.organizerName}
Community: \${context.communityName}
Total Events: \${context.totalEvents}
Total Unique Attendees: \${context.totalAttendees}

Recent Activity (last 7 days):
\${context.recentActivity.map(a => \`- \${a.attendeeName} joined \${a.eventName}\`).join('\\n') || 'No activity this week'}

Top Regulars:
\${context.topRegulars.map(r => \`- \${r.name}: \${r.attendanceCount} events\`).join('\\n') || 'Building your community...'}

Upcoming Events:
\${context.upcomingEvents.map(e => \`- \${e.name}: \${e.goingCount} going\`).join('\\n') || 'No upcoming events'}

At-Risk Members (haven't attended recently):
\${context.atRiskMembers.map(m => \`- \${m.name}: \${m.daysSinceLastAttended} days\`).join('\\n') || 'Everyone is engaged!'}

Generate a warm, encouraging weekly pulse with:
1. A brief summary paragraph (2-3 sentences)
2. 2-3 highlights/wins from this week
3. 2-3 insights about their community
4. 2-3 actionable suggestions for next week

Format as JSON:
{
  "summary": "...",
  "highlights": ["...", "..."],
  "insights": ["...", "..."],
  "suggestions": ["...", "..."]
}\`
  }]
})

### 3. Response format

Return:
{
  "pulse": {
    "id": "...",
    "weekStart": "2024-01-08",
    "weekEnd": "2024-01-14",
    "summary": "Great week! ...",
    "highlights": [...],
    "insights": [...],
    "suggestions": [...],
    "metrics": {
      "newAttendees": 5,
      "totalRsvps": 12,
      "upcomingEvents": 3
    },
    "generatedAt": "..."
  }
}

### 4. Error handling

- If Claude API fails, return graceful error with fallback message
- Rate limit: max 1 generation per hour per host
- Log errors for debugging

## Important
- Use the existing organizer session verification pattern
- Parse Claude's JSON response safely (handle malformed JSON)
- Store the pulse in WeeklyPulse table for caching
- Week boundaries: Monday to Sunday (Singapore timezone)`} />

      <VerifyChecklist items={[
        "app/api/host/pulse/route.ts exists",
        "GET returns cached pulse if exists for current week",
        "POST generates fresh pulse using Claude",
        "Pulse is saved to WeeklyPulse table",
        "Test: curl or fetch /api/host/pulse returns valid response",
        "Error handling works (test with invalid API key)",
      ]} />
    </div>
  );
}

/* ─── Step 3: Weekly Pulse UI ─── */
function Step3() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 3: Weekly Pulse UI</h3>
        <p className="text-sm text-gray-300">Add the Weekly Pulse card to the host dashboard. Shows AI-generated insights in a beautiful, scannable format.</p>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-xs text-amber-700"><span className="font-bold">Risk level: Low.</span> Modifies host dashboard to add new section. Existing functionality unchanged.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Add Weekly Pulse UI to the SweatBuddies host dashboard.

## Context
The host dashboard is at apps/web/src/app/host/dashboard/page.tsx. It currently shows:
- Welcome message
- Stats cards (Events Live, People Joined, Earnings)
- Quick links (Community, Analytics, Earnings)
- Events tabs (Live, Pending, Past, etc.)
- Recent Activity sidebar
- Top Regulars sidebar
- At-Risk Members sidebar

We have a /api/host/pulse endpoint that returns AI-generated weekly summaries.

## What to build

### 1. Create WeeklyPulseCard component (components/host/WeeklyPulseCard.tsx)

A collapsible card that shows the AI pulse:

interface WeeklyPulseData {
  id: string
  weekStart: string
  weekEnd: string
  summary: string
  highlights: string[]
  insights: string[]
  suggestions: string[]
  metrics: {
    newAttendees: number
    totalRsvps: number
    upcomingEvents: number
  }
  generatedAt: string
}

Component features:
- Shows "Your Weekly Pulse" header with sparkle icon
- Collapsed by default, shows just summary preview
- Expand to see full highlights, insights, suggestions
- "Refresh" button to regenerate (calls POST /api/host/pulse)
- Loading state with skeleton
- Error state with retry button

Design:
- Card: bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-200
- Collapsed: show first 100 chars of summary + "Read more"
- Expanded sections:
  - Highlights with green checkmark icons
  - Insights with lightbulb icons
  - Suggestions with arrow-right icons
- Refresh button: text-violet-600 hover:text-violet-800, small spinner when loading
- Week range badge: "Jan 8-14" in top right corner

### 2. Add to host dashboard

In apps/web/src/app/host/dashboard/page.tsx:

1. Add state for pulse data:
   const [pulse, setPulse] = useState<WeeklyPulseData | null>(null)
   const [pulseLoading, setPulseLoading] = useState(true)

2. Fetch pulse in useEffect (after dashboard data):
   const pulseRes = await fetch('/api/host/pulse')
   if (pulseRes.ok) {
     const { pulse } = await pulseRes.json()
     setPulse(pulse)
   }

3. Add WeeklyPulseCard between welcome message and stats:
   {pulseLoading ? (
     <PulseCardSkeleton />
   ) : pulse ? (
     <WeeklyPulseCard pulse={pulse} onRefresh={handleRefreshPulse} />
   ) : null}

4. Add refresh handler:
   const handleRefreshPulse = async () => {
     const res = await fetch('/api/host/pulse', { method: 'POST' })
     if (res.ok) {
       const { pulse } = await res.json()
       setPulse(pulse)
     }
   }

### 3. Skeleton component

Create a simple skeleton that matches the card layout:
- Gradient background (same as card)
- Animated pulse rectangles for text
- Header placeholder

## Design Reference
Match the existing dashboard style:
- Font: Inter via next/font
- Cards: rounded-xl with subtle borders
- Colors: neutral-900 for text, neutral-500 for secondary
- Icons: lucide-react (Sparkles, CheckCircle, Lightbulb, ArrowRight, RefreshCw)

## Important
- Don't break existing dashboard functionality
- Pulse card should be visually distinct (gradient) but feel cohesive
- Handle loading/error states gracefully
- Keep the card compact when collapsed
- Refresh should show loading state on button only, not whole card`} />

      <VerifyChecklist items={[
        "WeeklyPulseCard component exists in components/host/",
        "Host dashboard shows pulse card below welcome message",
        "Pulse loads on dashboard mount",
        "Clicking pulse expands to show full content",
        "Refresh button regenerates pulse via POST",
        "Loading skeleton shows while fetching",
        "Existing dashboard features still work",
        "Mobile responsive layout works",
      ]} />
    </div>
  );
}

/* ─── Step 4: Agent Chat API ─── */
function Step4() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 4: Agent Chat API</h3>
        <p className="text-sm text-gray-300">Create the conversational AI API with streaming responses. Hosts can ask questions and get help from their AI assistant.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Zero.</span> New API routes only.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Create Agent Chat API for SweatBuddies hosts.

## Context
We have AI infrastructure in lib/ai/. Now create the chat API that allows hosts to have conversations with their AI assistant.

## What to build

### 1. Conversations List: app/api/host/chat/route.ts

GET handler:
- Get organizer from session
- Return list of conversations with last message preview
- Order by updatedAt desc

POST handler (create new conversation):
- Create AgentConversation with organizerId
- Return conversation id

Response format:
{
  "conversations": [
    {
      "id": "...",
      "title": "How to grow my community",
      "lastMessage": "Here are 3 ways to...",
      "updatedAt": "..."
    }
  ]
}

### 2. Single Conversation: app/api/host/chat/[conversationId]/route.ts

GET handler:
- Verify organizer owns this conversation
- Return conversation with all messages
- Include agent context summary

DELETE handler:
- Delete conversation and all messages

### 3. Send Message (Streaming): app/api/host/chat/[conversationId]/message/route.ts

POST handler with streaming:
- Verify ownership
- Save user message to AgentMessage
- Build context using buildAgentContext()
- Stream Claude response using Vercel AI SDK pattern OR manual streaming:

import { StreamingTextResponse } from 'ai' // or implement manually

const stream = await anthropic.messages.create({
  model: AGENT_MODEL,
  max_tokens: 1000,
  stream: true,
  system: CHAT_SYSTEM_PROMPT + \`

Current context for this host:
- Community: \${context.communityName}
- Total events: \${context.totalEvents}
- Total attendees: \${context.totalAttendees}
- Top regulars: \${context.topRegulars.map(r => r.name).join(', ')}
- Upcoming events: \${context.upcomingEvents.map(e => e.name).join(', ')}\`,
  messages: previousMessages.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  })).concat([{ role: 'user', content: userMessage }])
})

// Stream response chunks to client
// After stream completes, save assistant message to database

### 4. Manual streaming implementation (if not using Vercel AI SDK)

export async function POST(req: Request) {
  // ... validation

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = ''

      const response = await anthropic.messages.create({
        model: AGENT_MODEL,
        max_tokens: 1000,
        stream: true,
        system: CHAT_SYSTEM_PROMPT,
        messages: [...previousMessages, { role: 'user', content: userMessage }]
      })

      for await (const event of response) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }

      // Save complete response to database
      await prisma.agentMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullResponse,
        }
      })

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    }
  })
}

### 5. Quick actions endpoint: app/api/host/chat/quick/route.ts

POST handler for one-off queries without conversation:
- Takes a prompt type and optional context
- Returns single response (not streamed)

Types:
- "event_description" - Generate event description
- "instagram_caption" - Generate IG caption for event
- "whatsapp_invite" - Generate WhatsApp message
- "email_reminder" - Generate reminder email

Body:
{
  "type": "instagram_caption",
  "eventId": "...",
  "tone": "casual" | "professional" | "excited"
}

## Important
- Always verify organizer owns the conversation
- Streaming is important for good UX - implement properly
- Keep conversation history reasonable (last 20 messages for context)
- Save both user and assistant messages to database
- Handle Claude API errors gracefully
- Rate limit: max 50 messages per hour per host`} />

      <VerifyChecklist items={[
        "GET /api/host/chat returns conversation list",
        "POST /api/host/chat creates new conversation",
        "GET /api/host/chat/[id] returns conversation with messages",
        "POST /api/host/chat/[id]/message streams response",
        "Messages are saved to database after completion",
        "POST /api/host/chat/quick returns quick responses",
        "Ownership verification works (can't access other's chats)",
      ]} />
    </div>
  );
}

/* ─── Step 5: Agent Chat UI ─── */
function Step5() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 5: Agent Chat UI</h3>
        <p className="text-sm text-gray-300">Build the chat interface where hosts can talk to their AI assistant. Full chat experience with streaming responses.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Low.</span> New pages under /host/. Adds link to existing dashboard.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Build the Agent Chat UI for SweatBuddies hosts.

## Context
We have chat APIs at /api/host/chat/. Now build the UI.

## What to build

### 1. Chat Page: app/host/chat/page.tsx

Layout:
- Mobile: full-screen chat view
- Desktop: sidebar with conversation list + main chat area

Conversation List (sidebar on desktop, drawer on mobile):
- List of past conversations with title and preview
- "New Chat" button at top
- Active conversation highlighted
- Delete conversation with swipe or menu

Chat Area:
- Messages list (scrollable, auto-scroll on new messages)
- User messages: right-aligned, bg-neutral-900 text-white rounded-2xl
- Assistant messages: left-aligned, bg-neutral-100 text-neutral-900 rounded-2xl
- Typing indicator when waiting for response (animated dots)

Input Area:
- Fixed at bottom
- Textarea that grows up to 4 lines
- Send button (enabled only when input not empty)
- Quick action buttons above input: "✨ Ideas" "📝 Content" "📊 Analytics"

### 2. Chat Components

components/host/chat/ChatMessage.tsx:
- Handles both user and assistant messages
- Markdown rendering for assistant (code blocks, lists, bold)
- Timestamp on hover

components/host/chat/ChatInput.tsx:
- Textarea with auto-resize
- Send on Enter (Shift+Enter for newline)
- Quick action chips

components/host/chat/ConversationList.tsx:
- List of conversations
- New chat button
- Delete confirmation

### 3. Streaming implementation

Use fetch with streaming:

const sendMessage = async (message: string) => {
  // Add user message to UI immediately
  setMessages(prev => [...prev, { role: 'user', content: message, id: Date.now() }])

  // Add placeholder for assistant
  const assistantId = Date.now() + 1
  setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }])
  setIsStreaming(true)

  const response = await fetch(\`/api/host/chat/\${conversationId}/message\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  while (reader) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    setMessages(prev => prev.map(m =>
      m.id === assistantId
        ? { ...m, content: m.content + chunk }
        : m
    ))
  }

  setIsStreaming(false)
}

### 4. Quick Actions

When user clicks a quick action chip, pre-fill the input or send directly:

"✨ Ideas" → "Give me ideas to grow my community this week"
"📝 Content" → Opens content type selector (IG, WhatsApp, Email)
"📊 Analytics" → "Analyze my recent performance and give insights"

### 5. Welcome state (new conversation)

When no messages:
- Show friendly welcome: "Hi [name]! I'm your SweatBuddies AI assistant."
- Suggestion chips:
  - "How can I get more people to my events?"
  - "Write an Instagram caption for my next event"
  - "Who are my most engaged members?"
  - "What should I focus on this week?"

### 6. Add to dashboard navigation

In the host dashboard quick links section, add:
- "AI Assistant" link with MessageSquare icon → /host/chat

Also add to mobile bottom nav if exists.

## Design
- Chat bubbles: rounded-2xl, user=bg-neutral-900, assistant=bg-neutral-100
- Typing indicator: three dots with staggered animation
- Input: border border-neutral-200 rounded-xl, send button bg-neutral-900
- Quick actions: border border-neutral-200 rounded-full text-sm px-3 py-1.5
- Match existing dashboard typography and spacing

## Important
- Streaming must work smoothly (no flickering)
- Auto-scroll to bottom on new messages
- Handle errors gracefully (show retry option)
- Persist input draft in localStorage
- Conversation title auto-generated from first message`} />

      <VerifyChecklist items={[
        "app/host/chat/page.tsx exists and loads",
        "Can create new conversation",
        "Messages stream in character by character",
        "User messages appear immediately",
        "Conversation list shows all past chats",
        "Can delete conversations",
        "Quick action chips work",
        "Welcome state shows for new conversations",
        "Dashboard has link to AI Assistant",
        "Mobile layout works (full-screen chat)",
      ]} />
    </div>
  );
}

/* ─── Step 6: Smart Segmentation ─── */
function Step6() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 6: Smart Attendee Segmentation</h3>
        <p className="text-sm text-gray-300">Automatically segment attendees into Regulars, New, and At-Risk using attendance patterns. Powers retention features.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Low.</span> Adds computed fields and new API. Enhances existing At-Risk display.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Implement smart attendee segmentation for SweatBuddies.

## Context
The host dashboard already shows "Top Regulars" and "At-Risk Members" sections.
The data comes from /api/host/dashboard which queries EventAttendance.
We need to formalize segmentation logic and make it available throughout the app.

## What to build

### 1. Segmentation logic: lib/segmentation.ts

Define segments:
- REGULAR: Attended 3+ events in last 60 days
- ENGAGED: Attended 2 events in last 60 days
- NEW: First event was within last 30 days
- AT_RISK: Was regular/engaged but no attendance in last 30 days
- LAPSED: No attendance in last 60 days
- CHURNED: No attendance in last 90 days

export type AttendeeSegment = 'regular' | 'engaged' | 'new' | 'at_risk' | 'lapsed' | 'churned'

export interface SegmentedAttendee {
  email: string
  name: string | null
  segment: AttendeeSegment
  totalAttendance: number
  lastAttendedDate: Date | null
  firstAttendedDate: Date | null
  daysSinceLastAttended: number | null
  eventsAttendedLast60Days: number
}

export function calculateSegment(attendee: {
  totalAttendance: number
  lastAttendedDate: Date | null
  firstAttendedDate: Date | null
  eventsAttendedLast60Days: number
}): AttendeeSegment {
  const now = new Date()
  const daysSinceLast = attendee.lastAttendedDate
    ? Math.floor((now.getTime() - attendee.lastAttendedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null
  const daysSinceFirst = attendee.firstAttendedDate
    ? Math.floor((now.getTime() - attendee.firstAttendedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // New: first event within 30 days
  if (daysSinceFirst !== null && daysSinceFirst <= 30) {
    return 'new'
  }

  // Churned: no activity in 90+ days
  if (daysSinceLast !== null && daysSinceLast >= 90) {
    return 'churned'
  }

  // Lapsed: no activity in 60-89 days
  if (daysSinceLast !== null && daysSinceLast >= 60) {
    return 'lapsed'
  }

  // At-risk: was engaged but no activity in 30-59 days
  if (daysSinceLast !== null && daysSinceLast >= 30 && attendee.totalAttendance >= 2) {
    return 'at_risk'
  }

  // Regular: 3+ events in last 60 days
  if (attendee.eventsAttendedLast60Days >= 3) {
    return 'regular'
  }

  // Engaged: 2 events in last 60 days
  if (attendee.eventsAttendedLast60Days >= 2) {
    return 'engaged'
  }

  return 'new' // Default for single attendance
}

### 2. Segmentation API: app/api/host/attendees/route.ts

GET handler:
- Query all EventAttendance for organizer's events
- Group by email
- Calculate segment for each
- Return with optional segment filter

Query params:
- segment: filter by segment type
- sort: 'recent' | 'attendance' | 'name'
- limit: pagination

Response:
{
  "attendees": [...SegmentedAttendee],
  "summary": {
    "regular": 12,
    "engaged": 8,
    "new": 15,
    "at_risk": 3,
    "lapsed": 5,
    "churned": 2
  }
}

### 3. Update host dashboard API: app/api/host/dashboard/route.ts

Enhance the existing dashboard endpoint to include:
- Proper segment calculation for atRiskMembers
- Add segment counts to stats
- Include "engaged" and "new" counts

### 4. Update buildAgentContext to use segmentation

In lib/ai/context.ts, update atRiskMembers calculation:
- Use the calculateSegment function
- Include segment in the context for AI

### 5. Community page enhancement: app/host/community/page.tsx

If this page exists, add:
- Segment filter tabs: All, Regulars, Engaged, New, At-Risk
- Color-coded segment badges on each attendee
- Segment summary cards at top

Segment badge colors:
- Regular: bg-emerald-100 text-emerald-700
- Engaged: bg-blue-100 text-blue-700
- New: bg-violet-100 text-violet-700
- At-Risk: bg-orange-100 text-orange-700
- Lapsed: bg-amber-100 text-amber-700
- Churned: bg-neutral-100 text-neutral-500

## Important
- Segmentation should be calculated server-side
- Cache results for performance (recalculate on attendance changes)
- Use Singapore timezone for date calculations
- All queries should scope to organizer's events only`} />

      <VerifyChecklist items={[
        "lib/segmentation.ts exists with calculateSegment function",
        "GET /api/host/attendees returns segmented attendees",
        "Dashboard API includes segment counts",
        "At-Risk Members section shows properly segmented data",
        "Segment badges appear on attendee lists",
        "Filter by segment works on community page",
        "Agent context includes proper at-risk data",
      ]} />
    </div>
  );
}

/* ─── Step 7: Content Generator ─── */
function Step7() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 7: AI Content Generator</h3>
        <p className="text-sm text-gray-300">Quick-access content generation for Instagram captions, WhatsApp messages, and event descriptions. One-click copy.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Low.</span> New UI component + existing quick API. Adds to event management pages.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Build the AI Content Generator for SweatBuddies hosts.

## Context
We have /api/host/chat/quick for one-off AI generation. Now build a polished UI for content generation that hosts can access from event pages.

## What to build

### 1. Content Generator Modal: components/host/ContentGeneratorModal.tsx

Props:
- isOpen: boolean
- onClose: () => void
- eventId?: string (optional, pre-fills event context)
- eventName?: string
- eventDetails?: { day, time, location, description }

Tabs:
1. Instagram Caption
2. WhatsApp Invite
3. Event Description
4. Email

Each tab shows:
- Tone selector: Casual / Professional / Excited / Motivational
- Length selector: Short / Medium / Long (for IG/WhatsApp)
- Event context (auto-filled if eventId provided)
- "Generate" button
- Generated content area
- "Copy" button + "Regenerate" button

### 2. Generation flow

const generateContent = async (type: string, options: { tone: string, length: string }) => {
  setIsGenerating(true)

  const res = await fetch('/api/host/chat/quick', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      eventId,
      tone: options.tone,
      length: options.length,
    })
  })

  const { content } = await res.json()
  setGeneratedContent(content)
  setIsGenerating(false)

  // Save to GeneratedContent table for history
}

### 3. Content type specifics

Instagram Caption:
- Include relevant hashtags
- Add call-to-action
- Emoji usage based on tone
- Character count indicator

WhatsApp Invite:
- Conversational tone
- Include event details inline
- Easy to forward
- Location link if available

Event Description:
- For listing on SweatBuddies
- Clear structure: what, when, where, who
- Highlight benefits
- Include logistics

Email:
- Subject line + body
- Reminder or announcement type selector
- Professional formatting

### 4. Quick access button on event pages

In event edit/view pages (app/host/events/[eventId]/...):
- Add "✨ Generate Content" button
- Opens ContentGeneratorModal with event pre-filled

### 5. Update /api/host/chat/quick to handle all types

Ensure the quick endpoint can generate all content types:

switch (type) {
  case 'instagram_caption':
    prompt = \`Write an Instagram caption for this fitness event:
    Event: \${event.name}
    Day: \${event.day}
    Time: \${event.time}
    Location: \${event.location}
    Description: \${event.description}

    Tone: \${tone}
    Length: \${length}

    Include relevant fitness/Singapore hashtags. End with a call-to-action.\`
    break

  case 'whatsapp_invite':
    prompt = \`Write a WhatsApp message to invite friends to this event:
    ...
    Make it casual and easy to forward. Include the key details.\`
    break

  // etc.
}

### 6. Content history (optional but nice)

Show "Recent generations" in the modal:
- Last 5 generated content pieces for this event
- Click to copy any previous generation

## Design

Modal:
- Width: max-w-xl
- Tabs: border-b with active indicator
- Tone/Length selectors: pill buttons (like the event tabs)
- Generate button: bg-neutral-900 text-white rounded-full
- Generated content: bg-neutral-50 rounded-xl p-4, font-mono for IG/WhatsApp
- Copy button: Shows "Copied!" for 2 seconds

Loading state:
- Skeleton lines while generating
- "Generating..." text with spinner

## Important
- Pre-fill event context when opened from event page
- Handle missing event gracefully (allow manual input)
- Copy to clipboard should work on mobile
- Save generated content for history and analytics`} />

      <VerifyChecklist items={[
        "ContentGeneratorModal component exists",
        "All 4 content types work (IG, WhatsApp, Description, Email)",
        "Tone and length selectors affect output",
        "Event context pre-fills when opened from event page",
        "Copy button works on desktop and mobile",
        "Generated content saves to database",
        "Loading states show during generation",
        "Button added to event edit/view pages",
      ]} />
    </div>
  );
}

/* ─── Step 8: Retention Alerts ─── */
function Step8() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 8: AI Retention Alerts</h3>
        <p className="text-sm text-gray-300">Proactive AI suggestions when members are at risk of churning. Actionable alerts with one-click outreach templates.</p>
      </div>

      <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
        <p className="text-xs text-amber-700"><span className="font-bold">Risk level: Low.</span> Enhances existing At-Risk section with AI suggestions.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Build AI Retention Alerts for SweatBuddies hosts.

## Context
The dashboard already shows "At-Risk Members" from Step 6 segmentation.
Now we enhance it with AI-powered suggestions for re-engaging these members.

## What to build

### 1. Retention Alert Component: components/host/RetentionAlert.tsx

Props:
- member: SegmentedAttendee
- onDismiss: () => void
- onActionTaken: (action: string) => void

Shows:
- Member info (name, last attended, total events)
- AI-generated suggestion for re-engagement
- Quick action buttons

Structure:
<div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <AlertTriangle className="text-orange-500" />
    <div className="flex-1">
      <p className="font-medium">{member.name} hasn't attended in {member.daysSinceLastAttended} days</p>
      <p className="text-sm text-orange-700 mt-1">
        {aiSuggestion}
      </p>
      <div className="flex gap-2 mt-3">
        <button className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-full">
          Send re-engagement message
        </button>
        <button className="text-xs border border-orange-300 text-orange-700 px-3 py-1.5 rounded-full">
          Dismiss
        </button>
      </div>
    </div>
  </div>
</div>

### 2. Generate retention suggestions: app/api/host/retention/suggestions/route.ts

GET handler:
- Get at-risk members from segmentation
- For each (up to 5), generate a personalized suggestion using Claude
- Cache suggestions for 24 hours

Suggestion prompt:
\`This attendee (\${name}) attended \${totalAttendance} of your events but hasn't come in \${daysSinceLastAttended} days. Their last event was \${lastEventName}.

Generate a brief (1-2 sentences) personalized suggestion for how to re-engage them. Be warm and specific.\`

Response:
{
  "alerts": [
    {
      "memberId": "...",
      "memberName": "John",
      "email": "john@...",
      "daysSinceLastAttended": 35,
      "totalAttendance": 4,
      "lastEventName": "Morning Run",
      "suggestion": "John was a regular at your morning runs. Since he missed the last few, consider sending a personal \"we miss you!\" message mentioning the group energy isn't the same without him.",
      "suggestedAction": "send_message",
      "messageTemplate": "Hey John! The morning run crew has been asking about you..."
    }
  ]
}

### 3. Re-engagement message generator

When host clicks "Send re-engagement message":
- Open modal with pre-generated message
- Allow editing
- Options: Copy (for WhatsApp), Send email (if we have email sending)

Message template uses AI:
\`Generate a warm, personal re-engagement message for \${name} who hasn't attended in \${days} days. They attended \${count} events total. Keep it casual and not guilt-trippy. Max 3 sentences.\`

### 4. Update dashboard At-Risk section

In apps/web/src/app/host/dashboard/page.tsx:

Replace the basic At-Risk list with RetentionAlert components:
- Show top 3 alerts on dashboard
- "View all" link to /host/community?segment=at_risk
- Include AI suggestions inline

Fetch suggestions on dashboard load:
const { alerts } = await fetch('/api/host/retention/suggestions').then(r => r.json())

### 5. Track actions taken

When host takes action (sends message, dismisses):
- Log to database for analytics
- Don't show same suggestion for 7 days after action
- Track conversion (did member return?)

Add to schema:
model RetentionAction {
  id            String   @id @default(cuid())
  organizerId   String
  memberEmail   String
  action        String   // 'message_sent' | 'dismissed' | 'email_sent'
  suggestion    String
  createdAt     DateTime @default(now())

  // Did they return within 14 days?
  memberReturned Boolean @default(false)
  returnedAt     DateTime?
}

## Important
- Don't overwhelm hosts with alerts - max 3 on dashboard
- Suggestions should be actionable, not just observational
- Cache AI suggestions to avoid repeated API calls
- Respect privacy - suggestions should be based on attendance only`} />

      <VerifyChecklist items={[
        "RetentionAlert component exists with AI suggestions",
        "GET /api/host/retention/suggestions returns alerts",
        "Dashboard At-Risk section shows AI suggestions",
        "Re-engagement message modal works",
        "Actions (send, dismiss) are tracked",
        "Suggestions are cached for 24 hours",
        "Max 3 alerts shown on dashboard",
      ]} />
    </div>
  );
}

/* ─── Step 9: Cron Jobs ─── */
function Step9() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 9: Automated AI Jobs</h3>
        <p className="text-sm text-gray-300">Set up cron jobs to automatically generate weekly pulses and send retention alerts via email.</p>
      </div>

      <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
        <p className="text-xs text-blue-700"><span className="font-bold">Risk level: Low.</span> New cron routes. Uses existing email infrastructure.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Create automated AI cron jobs for SweatBuddies.

## Context
We have:
- Weekly Pulse generation (/api/host/pulse)
- Retention suggestions (/api/host/retention/suggestions)
- Email sending via Resend (lib/email.ts)
- Existing cron patterns (see app/api/cron/)

## What to build

### 1. Weekly Pulse Cron: app/api/cron/generate-weekly-pulses/route.ts

Runs: Every Monday at 9am Singapore time (via Vercel cron)

Logic:
1. Get all active organizers with events in the last 30 days
2. For each organizer, generate a weekly pulse
3. Save to WeeklyPulse table
4. Send email notification with pulse summary

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get active organizers
  const organizers = await prisma.organizer.findMany({
    where: {
      events: {
        some: {
          createdAt: { gte: subDays(new Date(), 30) }
        }
      }
    }
  })

  const results = []

  for (const organizer of organizers) {
    try {
      // Generate pulse (reuse existing logic)
      const pulse = await generateWeeklyPulse(organizer.id)

      // Send email
      await sendPulseEmail(organizer.email, pulse)

      results.push({ organizerId: organizer.id, status: 'success' })
    } catch (error) {
      results.push({ organizerId: organizer.id, status: 'error', error: error.message })
    }
  }

  return Response.json({ processed: results.length, results })
}

### 2. Pulse Email Template: lib/emails/weekly-pulse-email.ts

Create a nice HTML email template:

Subject: "Your Weekly Pulse: [Community Name]"

Content:
- Summary paragraph
- This week's highlights (bulleted)
- Quick stats (events, attendees, earnings)
- Link to full dashboard
- Footer with SweatBuddies branding

### 3. Retention Alert Cron: app/api/cron/send-retention-alerts/route.ts

Runs: Every Wednesday at 10am Singapore time

Logic:
1. Get organizers with at-risk members
2. Generate suggestions if not cached
3. Send email digest with top 3 alerts
4. Track that alert was sent (don't repeat for 7 days)

### 4. Retention Alert Email Template: lib/emails/retention-alert-email.ts

Subject: "3 members need your attention"

Content:
- Brief intro
- List of at-risk members with suggestions
- Quick action links (to dashboard)
- Tips for re-engagement

### 5. Configure Vercel Cron

Add to vercel.json:
{
  "crons": [
    {
      "path": "/api/cron/generate-weekly-pulses",
      "schedule": "0 1 * * 1"  // 9am Singapore = 1am UTC on Monday
    },
    {
      "path": "/api/cron/send-retention-alerts",
      "schedule": "0 2 * * 3"  // 10am Singapore = 2am UTC on Wednesday
    }
  ]
}

### 6. Add CRON_SECRET to environment

Generate a random secret and add to .env.local and Vercel:
CRON_SECRET=your-random-secret-here

### 7. Opt-out preferences

Add to Organizer or create OrganizerPreferences model:
- weeklyPulseEmailEnabled: Boolean @default(true)
- retentionAlertsEmailEnabled: Boolean @default(true)

Check preferences before sending emails.

### 8. Email tracking (optional)

Track email opens/clicks:
- Add tracking pixel to emails
- Log delivery status from Resend webhook

## Important
- Always verify CRON_SECRET to prevent unauthorized triggers
- Handle failures gracefully - don't fail entire batch for one error
- Log all cron runs for debugging
- Respect user preferences for email opt-out
- Singapore timezone = UTC+8`} />

      <VerifyChecklist items={[
        "app/api/cron/generate-weekly-pulses/route.ts exists",
        "app/api/cron/send-retention-alerts/route.ts exists",
        "Weekly pulse email template created",
        "Retention alert email template created",
        "vercel.json has cron configuration",
        "CRON_SECRET is in environment variables",
        "Email opt-out preferences added",
        "Test cron locally with curl and auth header",
      ]} />
    </div>
  );
}

/* ─── Step 10: Ship It ─── */
function Step10() {
  return (
    <div className="space-y-4">
      <div className="bg-black text-white rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Step 10: Polish + Deploy</h3>
        <p className="text-sm text-gray-300">Final testing, error handling, and deployment of all Phase 2 AI features.</p>
      </div>

      <CodeBlock variant="prompt" title="Paste this into Claude Code" code={`Final polish for SweatBuddies Phase 2 AI features.

## What to check and fix

### 1. Error Handling
- Weekly Pulse: graceful fallback if Claude API fails
- Chat: show "I'm having trouble right now" message on errors
- Content Generator: retry button on failures
- All AI features: rate limiting with clear user feedback

### 2. Loading States
- Pulse card: skeleton while loading
- Chat: typing indicator during streaming
- Content generator: progress indicator
- Retention alerts: skeleton cards

### 3. Mobile Testing
- Chat UI: full-screen on mobile, keyboard handling
- Content generator modal: scrollable on small screens
- Pulse card: readable and tappable on mobile
- All text inputs: proper mobile keyboard types

### 4. Rate Limits
- Chat: max 50 messages/hour/host
- Content: max 20 generations/hour/host
- Pulse: max 1 regeneration/hour
- Show clear feedback when limit reached

### 5. Caching
- Weekly pulse: cache for entire week
- Retention suggestions: cache for 24 hours
- Chat context: cache for session

### 6. Analytics Events
Add tracking for:
- pulse_viewed
- pulse_refreshed
- chat_message_sent
- content_generated
- content_copied
- retention_alert_actioned

### 7. Console Cleanup
- Remove console.logs
- Fix TypeScript warnings
- Run npm run build

### 8. Documentation
Add comments explaining:
- AI prompt structure
- Segmentation logic
- Cron job schedules

## Acceptance Criteria
- [ ] npm run build succeeds
- [ ] No console errors on any AI feature
- [ ] All AI features have loading states
- [ ] All AI features handle errors gracefully
- [ ] Rate limits work and show feedback
- [ ] Mobile layout works on all new features
- [ ] Cron jobs can be triggered manually for testing`} />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Deploy Checklist</h4>
        <div className="space-y-3">
          {[
            { step: "1. Build locally", cmd: "npm run build", desc: "Must succeed with zero errors" },
            { step: "2. Test AI features", cmd: "npm run dev", desc: "Test: pulse, chat, content gen, alerts" },
            { step: "3. Add env vars", cmd: "Vercel dashboard", desc: "ANTHROPIC_API_KEY, CRON_SECRET" },
            { step: "4. Commit", cmd: "git add . && git commit -m 'feat: phase 2 AI agent'", desc: "Single commit for Phase 2" },
            { step: "5. Push", cmd: "git push", desc: "Vercel auto-deploys" },
            { step: "6. Run migrations", cmd: "npx prisma db push", desc: "If not using auto-migrate" },
            { step: "7. Test production", cmd: "Visit production URL", desc: "Test all AI features live" },
            { step: "8. Monitor", cmd: "Check Vercel logs", desc: "Watch for API errors" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">{item.step}</p>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.cmd}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <VerifyChecklist items={[
        "npm run build succeeds with zero errors",
        "Weekly Pulse shows on dashboard with real data",
        "AI Chat streams responses correctly",
        "Content Generator creates all 4 content types",
        "Retention Alerts show with AI suggestions",
        "Cron jobs configured in vercel.json",
        "All env vars added to Vercel",
        "Committed and pushed to git",
        "Vercel build succeeded",
        "Production site: all AI features work",
      ]} />

      {/* Phase 2 complete celebration */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-6 border border-violet-200">
        <div className="text-center">
          <p className="text-3xl mb-3">🤖</p>
          <h3 className="text-lg font-bold text-gray-900">Phase 2 Complete</h3>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed max-w-md mx-auto">
            Your hosts now have an AI assistant! Weekly insights, conversational help, content generation, and proactive retention alerts — all powered by Claude.
          </p>
          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200 max-w-sm mx-auto text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phase 3 Preview</p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <p>→ Advanced analytics dashboard</p>
              <p>→ Cohort analysis & revenue forecasting</p>
              <p>→ Cross-community collaboration matching</p>
              <p>→ SEO optimization suggestions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Phase2Prompts() {
  const [step, setStep] = useState(0);
  const [completedSteps, setCompleted] = useState<Record<number, boolean>>({});

  const markComplete = (s: number) => setCompleted(p => ({ ...p, [s]: true }));
  const completedCount = Object.values(completedSteps).filter(Boolean).length;

  const renderStep = () => {
    switch (step) {
      case 0: return <Step0 />;
      case 1: return <Step1 />;
      case 2: return <Step2 />;
      case 3: return <Step3 />;
      case 4: return <Step4 />;
      case 5: return <Step5 />;
      case 6: return <Step6 />;
      case 7: return <Step7 />;
      case 8: return <Step8 />;
      case 9: return <Step9 />;
      case 10: return <Step10 />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">SweatBuddies · Phase 2</p>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Features</h1>
          <p className="text-sm text-gray-500 mt-1">11 steps. Powered by Claude. Run in order.</p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span>Progress</span>
            <span>{completedCount}/11 steps</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-violet-600 rounded-full h-1.5 transition-all duration-500" style={{ width: `${(completedCount / 11) * 100}%` }}></div>
          </div>
        </div>

        {/* Step selector */}
        <div className="flex flex-wrap gap-1.5 mb-6 justify-center">
          {STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                step === s.id
                  ? "bg-violet-600 text-white"
                  : completedSteps[s.id]
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
              }`}
            >
              {completedSteps[s.id] && step !== s.id && <span className="text-[9px]">✓</span>}
              <span>{s.emoji}. {s.label}</span>
            </button>
          ))}
        </div>

        {/* Step content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              step === 0 ? "text-gray-300" : "text-gray-600 hover:bg-gray-200"
            }`}
          >
            ← Previous
          </button>

          <button
            onClick={() => {
              markComplete(step);
              if (step < 10) setStep(step + 1);
            }}
            className="bg-violet-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            {step === 10 ? "Mark Complete ✓" : "Complete & Next →"}
          </button>
        </div>

        <div className="text-center mt-8 text-[10px] text-gray-400">SweatBuddies · Phase 2 · AI Agent Features</div>
      </div>
    </div>
  );
}
