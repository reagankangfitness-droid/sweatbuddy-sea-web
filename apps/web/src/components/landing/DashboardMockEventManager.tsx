const events = [
  { name: 'Morning Run Club', date: 'Every Sat, 7AM', rsvps: '24/30', status: 'Live', statusClass: 'bg-emerald-500/15 text-emerald-500' },
  { name: 'HIIT Bootcamp', date: 'Tue & Thu, 6PM', rsvps: '18/20', status: 'Live', statusClass: 'bg-emerald-500/15 text-emerald-500' },
  { name: 'Yoga in the Park', date: 'Sun, 8AM', rsvps: '12/15', status: 'Upcoming', statusClass: 'bg-brand-blue/15 text-brand-blue-glow' },
  { name: 'Strength Workshop', date: 'Mar 22, 10AM', rsvps: '—', status: 'Draft', statusClass: 'bg-gray-400/15 text-gray-400' },
]

const stats = [
  { value: '12', label: 'Active Events', color: 'text-brand-blue-glow' },
  { value: '89', label: 'RSVPs This Week', color: 'text-emerald-500' },
  { value: '94%', label: 'Show-up Rate', color: 'text-[#F59E0B]' },
]

export function DashboardMockEventManager() {
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
          <div className="font-[family-name:var(--font-outfit)] font-bold text-base">📅 My Events</div>
          <div className="bg-brand-blue text-white px-4 py-1.5 rounded-lg text-xs font-semibold font-[family-name:var(--font-outfit)]">
            + New Event
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 text-center">
              <div className={`font-[family-name:var(--font-outfit)] font-extrabold text-2xl ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[0.7rem] text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Event', 'Date', 'RSVPs', 'Status'].map((header) => (
                  <th
                    key={header}
                    className="text-left text-[0.7rem] text-gray-400 font-medium uppercase tracking-wider py-2 border-b border-white/[0.06]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.name}>
                  <td className="py-2.5 text-[0.82rem] border-b border-white/[0.03]">{event.name}</td>
                  <td className="py-2.5 text-[0.82rem] border-b border-white/[0.03] text-gray-400">{event.date}</td>
                  <td className="py-2.5 text-[0.82rem] border-b border-white/[0.03]">{event.rsvps}</td>
                  <td className="py-2.5 text-[0.82rem] border-b border-white/[0.03]">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.68rem] font-semibold ${event.statusClass}`}>
                      {event.status}
                    </span>
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
