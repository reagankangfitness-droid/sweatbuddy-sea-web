const barHeights = [25, 35, 32, 48, 55, 52, 68, 82]
const weekLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6', 'Wk 7', 'Wk 8']

const kpis = [
  { value: '247', label: 'Total Members', change: '↑ 23% this month', color: 'text-emerald-500' },
  { value: '78%', label: 'Retention Rate', change: '↑ 5% vs last month', color: 'text-brand-blue-glow' },
  { value: '$4.2K', label: 'Monthly Revenue', change: '↑ 31% growth', color: 'text-[#F59E0B]' },
  { value: '8.4', label: 'Avg Sessions/Member', change: '↑ 1.2 this month', color: 'text-purple-400' },
]

export function DashboardMockAnalytics() {
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
          <div className="font-sans font-bold text-base">📊 Growth Analytics</div>
          <div className="text-[0.75rem] text-gray-400">Last 8 weeks</div>
        </div>

        {/* Bar chart */}
        <div className="h-40 flex items-end gap-1.5 px-2">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className="flex-1 landing-bar rounded-t min-h-[10px] transition-all duration-400 hover:opacity-80"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Week labels */}
        <div className="flex justify-between px-2">
          {weekLabels.map((label) => (
            <span key={label} className="text-[0.65rem] text-gray-400">{label}</span>
          ))}
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white/[0.04] rounded-xl p-3">
              <div className={`font-sans font-bold text-lg ${kpi.color}`}>
                {kpi.value}
              </div>
              <div className="text-[0.68rem] text-gray-400">{kpi.label}</div>
              <div className="text-[0.68rem] font-semibold text-emerald-500">{kpi.change}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
