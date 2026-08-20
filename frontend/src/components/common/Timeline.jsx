// 通用时间线
export default function Timeline({ items, renderItem, accent = 'brand' }) {
  const color = accent === 'health' ? '#2EC4B6' : '#FF7A59'
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-ink-200" />
      {items.map((item, i) => (
        <div key={i} className="relative pb-4 last:pb-0">
          <div className="absolute -left-[18px] top-2 w-3 h-3 rounded-full ring-2 ring-white"
            style={{ backgroundColor: color }} />
          {renderItem(item, i)}
        </div>
      ))}
    </div>
  )
}
