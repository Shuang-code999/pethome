import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, History, Trash2, Package, PawPrint, FileText, Home as HomeIcon, X } from 'lucide-react'
import { readHistory, clearHistory, removeHistory, onHistoryChange } from '../../hooks/browsingHistory.js'
import PetImg from '../../components/PetImg.jsx'

const TYPE_META = {
  product: { label: '商品', icon: Package, color: '#10B981', path: (e) => e.path || `/mall/product/${e.id}` },
  post:    { label: '帖子', icon: FileText, color: '#6366F1', path: (e) => e.path || `/community/post/${e.id}` },
  pet:     { label: '宠物', icon: PawPrint, color: '#F59E0B', path: (e) => e.path || `/pet/${e.id}` },
  adopt:   { label: '领养', icon: HomeIcon, color: '#EC4899', path: (e) => e.path || `/community/adopt` },
}

function fmtTs(ts) {
  const d = new Date(ts)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 浏览记录：展示最近访问的商品 / 帖子 / 宠物 / 领养，可逐条删除或清空
export default function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState(() => readHistory())

  useEffect(() => onHistoryChange(() => setItems(readHistory())), [])

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={() => navigate('/me')} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回个人中心
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-indigo-700 rounded-xl2 p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative flex items-center justify-between">
          <div>
            <span className="inline-block text-[10px] bg-white/25 px-2 py-0.5 rounded font-semibold">足迹</span>
            <h1 className="text-xl md:text-2xl font-bold mt-2">浏览记录 · {items.length} 条</h1>
            <p className="text-sm opacity-90 mt-1">最近看过的商品、帖子、宠物</p>
          </div>
          <History size={48} className="opacity-50 hidden md:block" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card text-center py-12">
          <History size={40} className="text-ink-200 mx-auto mb-2" />
          <p className="text-sm text-ink-500">还没有浏览记录</p>
          <button onClick={() => navigate('/mall/food')} className="clickable mt-4 bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            去逛逛
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2">
            <button onClick={() => { if (confirm('确认清空全部浏览记录？')) clearHistory() }}
              className="clickable text-xs text-ink-400 hover:text-red-500 flex items-center gap-1">
              <Trash2 size={12} /> 清空
            </button>
          </div>
          <div className="space-y-2">
            {items.map((e, i) => {
              const meta = TYPE_META[e.type] || { label: e.type, icon: History, color: '#64748B', path: () => '/' }
              const Icon = meta.icon
              return (
                <div key={`${e.type}:${e.id}:${i}`}
                  onClick={() => navigate(meta.path(e))}
                  className="clickable bg-white rounded-xl2 shadow-card hover:shadow-hover p-3 flex items-center gap-3 cursor-pointer">
                  <div className="w-14 h-14 rounded-clay overflow-hidden bg-ink-100 shrink-0 relative">
                    {e.image
                      ? <PetImg src={e.image} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ color: meta.color }}><Icon size={22} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink-900 truncate">{e.title || '无标题'}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: meta.color + '1A', color: meta.color }}>{meta.label}</span>
                      <span className="text-[11px] text-ink-400">{fmtTs(e.ts)}</span>
                    </div>
                  </div>
                  <button onClick={(ev) => { ev.stopPropagation(); removeHistory(e.type, e.id) }}
                    className="clickable text-ink-300 hover:text-red-500 p-1">
                    <X size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
