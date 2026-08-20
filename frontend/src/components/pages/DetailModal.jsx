import { X } from 'lucide-react'

// 通用详情/表单弹窗：复用 LoginModal 的遮罩 + fade-in 卡片样式
export default function DetailModal({ open, onClose, title, children, footer, wide = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative bg-white rounded-xl2 shadow-hover w-full ${
          wide ? 'max-w-2xl' : 'max-w-md'
        } max-h-[85vh] overflow-y-auto p-6 fade-in`}
      >
        <button
          onClick={onClose}
          className="clickable absolute top-3 right-3 text-ink-500 hover:text-ink-900"
        >
          <X size={18} />
        </button>
        {title && <h3 className="text-lg font-bold text-ink-900 mb-4 pr-6">{title}</h3>}
        <div className="text-sm text-ink-700">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
