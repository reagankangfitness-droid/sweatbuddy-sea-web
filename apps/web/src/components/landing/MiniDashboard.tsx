export function MiniDashboard() {
  const bars = [40, 65, 50, 80, 60, 90, 75]
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div className="bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 p-5 max-w-sm w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-neutral-400">This Week</span>
        <span className="text-xs text-neutral-500">Nov 18 – 24</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-neutral-700/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-white">24</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">RSVPs</p>
        </div>
        <div className="bg-neutral-700/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-white">$480</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Revenue</p>
        </div>
        <div className="bg-neutral-700/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-white">92%</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Fill Rate</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-16">
        {bars.map((height, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className="w-full bg-neutral-600 rounded-sm"
              style={{ height: `${height}%` }}
            />
            <span className="text-[9px] text-neutral-500">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
