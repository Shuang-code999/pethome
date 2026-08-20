import { Construction, ArrowLeft } from 'lucide-react'

// 通用"开发中"占位页面
export default function UnderDev({ title = '功能开发中', desc = '该功能正在紧张开发中，敬请期待～', onBack, accent = 'brand' }) {
  const color = accent === 'health' ? '#2EC4B6' : '#FF7A59'
  const bgClass = accent === 'health' ? 'from-health-50 to-teal-50' : 'from-brand-50 to-orange-50'
  const btnClass = accent === 'health' ? 'bg-health hover:bg-health/90' : 'bg-brand-500 hover:bg-brand-600'

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={onBack}
        className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-6">
        <ArrowLeft size={15} /> 返回上一页
      </button>

      <div className={`bg-gradient-to-br ${bgClass} rounded-xl2 shadow-card p-10 md:p-16 text-center`}>
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full animate-pulse" style={{ backgroundColor: color + '20' }} />
          <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '30' }}>
            <Construction size={40} style={{ color }} />
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-ink-900 mb-3">{title}</h2>
        <p className="text-sm md:text-base text-ink-500 max-w-md mx-auto mb-8 leading-relaxed">{desc}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onBack}
            className={`clickable ${btnClass} text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-hover`}>
            返回上一页
          </button>
          <button onClick={() => window.location.href = '/'}
            className="clickable bg-white border border-ink-200 text-ink-700 text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-ink-50">
            回到首页
          </button>
        </div>

        <div className="mt-10 pt-6 border-t border-white/60">
          <p className="text-xs text-ink-400">🐾 萌宠之家 · 让陪伴更长久</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[
          { num: '99+', label: '在建宠物' },
          { num: '52万+', label: '建档宠物' },
          { num: '4.9★', label: '用户评分' },
          { num: '7×24h', label: 'AI 问诊' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card p-4 text-center">
            <div className="text-lg font-bold" style={{ color }}>{s.num}</div>
            <div className="text-xs text-ink-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
