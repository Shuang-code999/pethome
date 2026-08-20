import { useEffect, useState } from 'react'
import { X, MapPin, Star, Phone, Calendar, Loader2, ArrowLeft, Tag } from 'lucide-react'
import { api } from '../api'

const MODE_OPTIONS = ['全部', '到店', '上门', '双向']

function formatDistance(m) {
  if (m == null) return '—'
  if (m < 1000) return Math.round(m) + 'm'
  return (m / 1000).toFixed(1) + 'km'
}

const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200', dot: 'bg-pink-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', dot: 'bg-teal-500' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', dot: 'bg-indigo-500' },
  gray: { bg: 'bg-ink-100', text: 'text-ink-700', ring: 'ring-ink-200', dot: 'bg-ink-500' },
}

/**
 * 服务类型专页弹窗（覆盖整屏 modal 风格）：
 * - 顶部：服务类型名 + 描述 + 返回按钮
 * - 中部：宠物类型筛选 chip + 模式 toggle + 排序
 * - 列表：服务方卡片（含预约按钮 → 后端跳转链接 /service/{type}/book/{id}）
 */
export default function ServiceTypeModal({ open, typeInfo, petTypes, onClose, onBook, onLoginRequired, logged }) {
  const [pet, setPet] = useState('全部')
  const [mode, setMode] = useState('全部')
  const [sort, setSort] = useState('distance')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    if (!open || !typeInfo) return
    setPet('全部')
    setMode('全部')
    setSort('distance')
    setDetail(null)
  }, [open, typeInfo])

  useEffect(() => {
    if (!open || !typeInfo) return
    let cancelled = false
    setLoading(true)
    const params = { type: typeInfo.code, pet, sort }
    if (mode !== '全部') params.mode = mode
    api.serviceServices(params).then(res => {
      if (cancelled) return
      setServices(res.data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [open, typeInfo, pet, mode, sort])

  if (!open || !typeInfo) return null
  const colors = COLOR_MAP[typeInfo.color] || COLOR_MAP.blue

  const handleBook = (svc) => {
    if (!logged) {
      onLoginRequired && onLoginRequired()
      return
    }
    onBook && onBook(typeInfo, svc)
  }

  return (
    <div className="fixed inset-0 z-[70] bg-white flex flex-col">
      {/* 顶部 */}
      <div className={`${colors.bg} border-b border-ink-100 px-4 py-3 flex items-center gap-3 shrink-0`}>
        <button onClick={onClose} className="clickable p-1.5 -ml-1 rounded-full hover:bg-white/50">
          <ArrowLeft size={18} className="text-ink-700" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-bold ${colors.text}`}>{typeInfo.name}</h2>
            <span className={`text-[10px] px-1.5 py-0.5 ${colors.bg} ${colors.text} border ${colors.ring} rounded-full`}>
              {typeInfo.mode}
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-0.5 truncate">{typeInfo.desc}</p>
        </div>
        <span className="text-[11px] text-ink-500 bg-white/70 px-2 py-0.5 rounded-full">
          {services.length} 家
        </span>
      </div>

      {/* 筛选 */}
      <div className="px-4 py-2 border-b border-ink-100 space-y-2 shrink-0 bg-white">
        {/* 宠物类型 chip */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-[11px] text-ink-400 shrink-0">宠物</span>
          {(petTypes || []).map(p => (
            <button key={p} onClick={() => setPet(p)}
              className={`clickable shrink-0 text-[11px] px-2.5 py-1 rounded-full ${pet === p ? `${colors.bg} ${colors.text} ring-1 ${colors.ring}` : 'bg-ink-100 text-ink-600'}`}>
              {p}
            </button>
          ))}
        </div>
        {/* 模式 + 排序 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-ink-400">模式</span>
            {MODE_OPTIONS.map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`clickable text-[11px] px-2 py-0.5 rounded ${mode === m ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600'}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <span className="text-[11px] text-ink-400">排序</span>
            {[{ v: 'distance', l: '距离' }, { v: 'rating', l: '评分' }].map(o => (
              <button key={o.v} onClick={() => setSort(o.v)}
                className={`clickable text-[11px] px-2 py-0.5 rounded ${sort === o.v ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-600'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> 搜索附近服务方…
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-10 text-ink-400 text-sm">
            暂无「{pet}」相关{typeInfo.name}，试试其他筛选条件
          </div>
        ) : (
          <div className="space-y-3">
            {services.map(s => (
              <div key={s.id} onClick={() => setDetail(s)}
                className="clickable bg-white border border-ink-200 hover:border-ink-300 hover:shadow-card rounded-xl p-3 transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-16 h-16 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 font-bold text-lg`}>
                    {s.name?.[0] || '服'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-ink-900 text-sm truncate">{s.name}</span>
                      <span className={`shrink-0 text-[9px] px-1.5 py-0.5 ${colors.bg} ${colors.text} rounded`}>
                        {s.serviceMode}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-500 mt-0.5">
                      <Star size={11} className="fill-amber-500" /> {(s.rating || 0).toFixed(1)}
                      <span className="text-ink-400">· {formatDistance(s.distance)}</span>
                      <span className="text-brand-600 font-medium ml-auto">{s.priceRange}</span>
                    </div>
                    <div className="text-[11px] text-ink-400 mt-0.5 truncate">{s.address}</div>
                    {s.petTypes && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {s.petTypes.split(',').filter(Boolean).slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 bg-ink-50 text-ink-600 rounded-full">
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
                  <button onClick={(e) => { e.stopPropagation(); setDetail(s) }}
                    className="clickable flex-1 text-[11px] py-1.5 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-lg">
                    查看详情
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleBook(s) }}
                    className={`clickable flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 ${colors.dot} text-white rounded-lg font-medium`}>
                    <Calendar size={11} /> 立即预约
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setDetail(null)} />
          <div className="relative bg-white rounded-t-2xl sm:rounded-xl2 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 fade-in">
            <button onClick={() => setDetail(null)}
              className="clickable absolute top-3 right-3 text-ink-500 hover:text-ink-900">
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 pr-8">
              <h3 className="text-base font-bold text-ink-900">{detail.name}</h3>
              <span className={`text-[10px] px-1.5 py-0.5 ${colors.bg} ${colors.text} rounded`}>
                {detail.serviceMode}
              </span>
            </div>
            <div className="text-xs text-ink-500 mt-1">{detail.category} · {typeInfo.name}</div>

            <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-xl font-bold text-ink-900">{(detail.rating || 0).toFixed(1)}</span>
              </div>
              <div className="text-brand-600 font-bold text-sm">¥ {detail.priceRange?.replace(/[¥/单晚次期]/g, '')}</div>
              <div className="ml-auto text-xs text-ink-500 flex items-center gap-0.5">
                <MapPin size={11} /> {formatDistance(detail.distance)}
              </div>
            </div>

            <div className="space-y-2 text-sm mt-3">
              {detail.address && (
                <div className="flex items-start gap-2 text-ink-700">
                  <MapPin size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{detail.address}</span>
                </div>
              )}
              {detail.tel && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Phone size={14} className="text-brand-500 shrink-0" />
                  <span>{detail.tel}</span>
                </div>
              )}
              {detail.openTime && (
                <div className="text-ink-700 text-xs">
                  <span className="text-ink-400">营业时间</span> {detail.openTime}
                </div>
              )}
              {detail.petTypes && (
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {detail.petTypes.split(',').filter(Boolean).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-ink-50 text-ink-700 rounded-full">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {detail.tags && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {detail.tags.split(/[,，]/).filter(Boolean).map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {detail.description && (
              <div className="border-t border-ink-100 pt-3 mt-3">
                <div className="text-xs font-semibold text-ink-700 mb-1">服务介绍</div>
                <p className="text-sm text-ink-600 leading-relaxed">{detail.description}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 mt-4 border-t border-ink-100">
              {detail.tel ? (
                <a href={`tel:${detail.tel}`}
                  className="clickable flex-1 flex items-center justify-center gap-1 py-2 bg-ink-50 hover:bg-ink-100 text-ink-700 rounded-lg text-sm">
                  <Phone size={14} /> 电话
                </a>
              ) : null}
              <button onClick={() => { handleBook(detail); setDetail(null) }}
                className={`clickable flex-1 flex items-center justify-center gap-1 py-2 ${colors.dot} text-white rounded-lg text-sm font-semibold`}>
                <Calendar size={14} /> 立即预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}