import { ChevronRight } from 'lucide-react'

// 通用区块：标题 + 可选徽章 + 可选 CTA + 内容
export default function SectionBlock({ title, extra, cta, ctaAction, children, className = '' }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg md:text-xl font-bold text-ink-900">{title}</h2>
          {extra}
        </div>
        {cta && (
          <button onClick={ctaAction}
            className="clickable text-sm text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
            {cta} <ChevronRight size={14} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}
