const members = [
  { initials: 'SL', name: 'Sarah Lim', detail: 'Joined 3 months ago · Run Club, HIIT', sessions: '12 sessions', color: 'bg-brand-blue/20 text-brand-blue-glow', sessionColor: 'text-emerald-500' },
  { initials: 'MR', name: 'Marcus Rivera', detail: 'Joined 6 months ago · Bootcamp', sessions: '28 sessions', color: 'bg-emerald-500/20 text-emerald-500', sessionColor: 'text-emerald-500' },
  { initials: 'JT', name: 'Jess Tan', detail: 'Joined 1 week ago · Yoga', sessions: '2 sessions', color: 'bg-[#F59E0B]/20 text-[#F59E0B]', sessionColor: 'text-emerald-500' },
  { initials: 'AK', name: 'Amir Khan', detail: 'Joined 2 months ago · Run Club', sessions: '⚠ Inactive 3 wks', color: 'bg-red-500/15 text-red-500', sessionColor: 'text-red-500' },
  { initials: 'NP', name: 'Natalie Park', detail: 'Joined 4 months ago · HIIT, Yoga', sessions: '19 sessions', color: 'bg-purple-500/20 text-purple-400', sessionColor: 'text-emerald-500' },
]

export function DashboardMockCommunity() {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-dark-card shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
      {/* Browser bar */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
      </div>

      <div className="p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-sans font-bold text-base">👥 Community Members</div>
          <div className="text-[0.78rem] text-gray-400">247 members</div>
        </div>

        {/* Member list */}
        {members.map((member) => (
          <div key={member.initials} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${member.color}`}>
              {member.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.85rem] font-semibold">{member.name}</div>
              <div className="text-[0.72rem] text-gray-400">{member.detail}</div>
            </div>
            <div className={`text-[0.8rem] font-semibold shrink-0 ${member.sessionColor}`}>
              {member.sessions}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
