import { ArrowLeft } from 'lucide-react'

// 通用页面外壳：标题 + 返回首页 + 内容容器
export default function PageShell({ title, subtitle, onBack, children, accent = 'brand' }) {
  const accentCls =
    accent === 'health' ? 'bg-health-50 text-health' : accent === 'ink' ? 'bg-ink-100 text-ink-700' : 'bg-brand-50 text-brand-600'
  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button
        onClick={onBack}
        className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4"
      >
        <ArrowLeft size={15} /> 返回首页
      </button>

      <div className="flex items-center gap-3 mb-5">
        <span className={`text-xs font-semibold px-2 py-1 rounded ${accentCls}`}>模块</span>
        <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      </div>
      {subtitle && <p className="text-sm text-ink-500 mb-6 -mt-3">{subtitle}</p>}

      <div className="bg-white rounded-xl2 shadow-card p-5 md:p-6">{children}</div>
    </section>
  )
}
