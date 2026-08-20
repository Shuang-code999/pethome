// 通用统计条：数字+标签横排
export default function StatBar({ stats, accent = 'brand' }) {
  const color = accent === 'health' ? '#2EC4B6' : '#FF7A59'
  return (
    <div className={`grid grid-cols-${Math.min(stats.length, 4)} gap-2 md:gap-4`}>
      {stats.map((s, i) => (
        <div key={i} className="bg-white rounded-xl shadow-card p-3 md:p-4 text-center">
          <div className="text-lg md:text-2xl font-bold" style={{ color }}>{s.value}</div>
          <div className="text-xs text-ink-500 mt-0.5">{s.label}</div>
          {s.sub && <div className="text-[10px] text-ink-400 mt-0.5">{s.sub}</div>}
        </div>
      ))}
    </div>
  )
}
