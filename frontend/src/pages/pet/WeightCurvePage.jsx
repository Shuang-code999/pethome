import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Minus, Plus, Trash2, Calendar, Weight, Sparkles, Activity, Target, Award } from 'lucide-react'
import DetailModal from '../../components/pages/DetailModal.jsx'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 体重曲线页 · Claymorphism
const storageKey = (petId) => `weightRecords_${petId}`

function loadRecords(petId) {
  try { return JSON.parse(localStorage.getItem(storageKey(petId)) || '[]') } catch { return [] }
}
function saveRecords(petId, records) {
  localStorage.setItem(storageKey(petId), JSON.stringify(records))
}

export default function WeightCurvePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState(null)
  const [adding, setAdding] = useState(null)

  useEffect(() => {
    setTimeout(() => setRecords(loadRecords(id)), 0)
  }, [id])

  const refresh = () => setRecords(loadRecords(id))

  const submit = () => {
    if (!adding.weight || !adding.recordDate) { alert('请填写体重和日期'); return }
    const newRecord = { id: Date.now(), weight: Number(adding.weight), recordDate: adding.recordDate, note: adding.note || '' }
    const list = [...loadRecords(id), newRecord].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
    const dedup = list.filter((r, i) => i === 0 || r.recordDate !== list[i-1].recordDate)
    saveRecords(id, dedup)
    setAdding(null)
    refresh()
  }

  const remove = (rid) => {
    if (!confirm('确认删除？')) return
    const list = loadRecords(id).filter(r => r.id !== rid)
    saveRecords(id, list)
    refresh()
  }

  if (records === null) return <CenterLoading />

  const sorted = [...records].sort((a, b) => a.recordDate.localeCompare(b.recordDate))
  const current = sorted.length ? sorted[sorted.length - 1].weight : 0
  const avg = sorted.length ? (sorted.reduce((s, r) => s + r.weight, 0) / sorted.length).toFixed(1) : 0
  const max = sorted.length ? Math.max(...sorted.map(r => r.weight)) : 0
  const min = sorted.length ? Math.min(...sorted.map(r => r.weight)) : 0
  const trend = sorted.length >= 2 ? (sorted[sorted.length-1].weight - sorted[sorted.length-2].weight) : 0

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(`/pet/${id}`)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-brand-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回宠物详情
      </button>

      {/* Hero（Clay + 极光橙） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-5 text-white shadow-clay">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,#FCD34D 0%,#F59E0B 50%,#D97706 100%)'
        }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute top-4 right-8 text-6xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.6s' }}>⚖️</div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> 体重追踪
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              体重曲线 <span className="text-3xl">📈</span>
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">定期记录，掌握爱宠健康变化</p>
          </div>
        </div>
      </Reveal>

      {/* 统计（Clay 4宫） */}
      <Reveal delay={1} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { value: current ? current + 'kg' : '—', label: '当前体重', emoji: '⚖️', color: 'from-amber-400 to-orange-500' },
          { value: avg + 'kg', label: '平均体重', emoji: '📊', color: 'from-brand-400 to-brand-600' },
          { value: max + 'kg', label: '最高', emoji: '⬆️', color: 'from-purple-400 to-purple-600' },
          { value: min + 'kg', label: '最低', emoji: '⬇️', color: 'from-trust-400 to-trust-600' }
        ].map((s, i) => (
          <div key={i} className="clay clay-hover p-4 flex items-center gap-3">
            <div className={`w-12 h-12 rounded-clay bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shrink-0 shadow-clay-sm`}>
              {s.emoji}
            </div>
            <div>
              <div className="text-xl font-extrabold text-ink-900 font-display">{s.value}</div>
              <div className="text-xs text-ink-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </Reveal>

      {/* 趋势条（Clay 横条） */}
      {sorted.length >= 2 && (
        <Reveal delay={2} className="clay clay-hover p-4 mb-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-2 -top-2 text-5xl opacity-10" aria-hidden>
            {trend > 0 ? '📈' : trend < 0 ? '📉' : '➖'}
          </div>
          <div className="flex items-center gap-2.5">
            <div className={`w-12 h-12 rounded-clay flex items-center justify-center text-xl shadow-clay-sm
              ${trend > 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                trend < 0 ? 'bg-gradient-to-br from-health-400 to-health-600 text-white' :
                'clay-inset text-ink-600'}`}>
              {trend > 0 ? <TrendingUp size={20} /> : trend < 0 ? <TrendingDown size={20} /> : <Minus size={20} />}
            </div>
            <div>
              <div className={`text-lg font-extrabold font-display ${trend > 0 ? 'text-amber-600' : trend < 0 ? 'text-health-600' : 'text-ink-600'}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg
              </div>
              <div className="text-[10px] text-ink-500 mt-0.5">较上次记录</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ink-500">总记录</div>
            <div className="text-lg font-extrabold text-ink-900 font-display">{sorted.length}</div>
          </div>
        </Reveal>
      )}

      {/* 折线图（Clay） */}
      <Reveal delay={3} className="clay clay-hover p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900 font-display flex items-center gap-1.5">
            <span className="w-1 h-4 bg-amber-500 rounded-full" />
            <Activity size={14} className="text-amber-500" /> 体重趋势图
          </h3>
          <button
            onClick={() => setAdding({ weight: '', recordDate: new Date().toISOString().slice(0, 10), note: '' })}
            className="clickable text-xs font-bold text-white px-3 py-1.5 rounded-clay shadow-glow font-display flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}
          >
            <Plus size={12} strokeWidth={3} /> 记录
          </button>
        </div>
        {sorted.length === 0 ? (
          <div className="clay-inset text-center py-10 relative overflow-hidden">
            <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>⚖️</div>
            <Weight size={36} className="text-ink-300 mx-auto mb-2" />
            <p className="text-sm text-ink-500">暂无体重记录</p>
            <p className="text-xs text-ink-400 mt-1">点击右上角记录第一次体重</p>
          </div>
        ) : (
          <div className="clay-inset p-3 rounded-clay">
            <WeightChart records={sorted} />
          </div>
        )}
      </Reveal>

      {/* 历史记录（Clay 卡） */}
      <Reveal delay={4} className="clay clay-hover p-5">
        <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-1.5">
          <span className="w-1 h-4 bg-amber-500 rounded-full" />
          <Calendar size={14} className="text-amber-500" /> 历史记录
          <span className="text-xs text-ink-500 font-normal ml-1">({sorted.length})</span>
        </h3>
        {sorted.length === 0 ? (
          <div className="clay-inset text-center py-8 text-xs text-ink-400">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {[...sorted].reverse().map((r, i) => (
              <div key={r.id} className="clay-inset p-3 flex items-center gap-3 hover:scale-[1.01] transition group">
                <div className="w-10 h-10 rounded-clay bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 flex items-center justify-center text-lg shadow-clay-sm shrink-0">
                  ⚖️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-ink-500 flex items-center gap-1">
                      <Calendar size={11} /> {r.recordDate}
                    </span>
                    <span className="text-base font-extrabold text-ink-900 font-display">{r.weight}kg</span>
                    {i === 0 && (
                      <span className="text-[10px] bg-gradient-to-r from-brand-500 to-brand-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Award size={9} /> 最新
                      </span>
                    )}
                  </div>
                  {r.note && <span className="text-xs text-ink-500 mt-0.5">💬 {r.note}</span>}
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="clickable w-8 h-8 rounded-full clay-inset flex items-center justify-center text-ink-400 hover:text-red-500 transition shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      {/* 录入弹窗 */}
      <DetailModal open={!!adding} onClose={() => setAdding(null)} title="记录体重" wide
        footer={<>
          <button onClick={() => setAdding(null)} className="clickable clay-btn text-sm text-ink-700 px-4 py-2">取消</button>
          <button
            onClick={submit}
            className="clickable text-white text-sm font-bold px-5 py-2 rounded-clay shadow-glow font-display"
            style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}
          >保存</button>
        </>}>
        {adding && (
          <div className="space-y-3">
            <Field label="体重 (kg) *">
              <input type="number" step="0.1" value={adding.weight} onChange={e => setAdding({ ...adding, weight: e.target.value })} className={inp} placeholder="28.5" />
            </Field>
            <Field label="记录日期 *">
              <input type="date" value={adding.recordDate} onChange={e => setAdding({ ...adding, recordDate: e.target.value })} className={inp} />
            </Field>
            <Field label="备注">
              <input value={adding.note} onChange={e => setAdding({ ...adding, note: e.target.value })} className={inp} placeholder="可选" />
            </Field>
          </div>
        )}
      </DetailModal>
    </section>
  )
}

// 纯 SVG 折线图（不引入 recharts 减包体）
function WeightChart({ records }) {
  if (records.length === 0) return null
  const W = 600, H = 200, P = 30
  const weights = records.map(r => r.weight)
  const minW = Math.min(...weights) - 0.5
  const maxW = Math.max(...weights) + 0.5
  const xStep = (W - 2 * P) / Math.max(1, records.length - 1)
  const points = records.map((r, i) => ({
    x: P + i * xStep,
    y: H - P - ((r.weight - minW) / (maxW - minW || 1)) * (H - 2 * P),
    w: r.weight,
    d: r.recordDate
  }))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48">
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1={P} y1={P + i * (H - 2 * P) / 4} x2={W - P} y2={P + i * (H - 2 * P) / 4} stroke="#E5E7EB" strokeDasharray="2 4" />
        ))}
        <path d={`${pathD} L ${points[points.length - 1].x} ${H - P} L ${points[0].x} ${H - P} Z`} fill="url(#wgrad)" />
        <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="white" stroke="#F59E0B" strokeWidth="3" />
            <circle cx={p.x} cy={p.y} r="3" fill="#F59E0B" />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="11" fill="#1F2937" fontWeight="bold">{p.w}kg</text>
          </g>
        ))}
        {records.length <= 7 ? points.map((p, i) => (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="9" fill="#9CA3AF">{p.d.slice(5)}</text>
        )) : points.filter((_, i) => i % Math.ceil(points.length / 6) === 0).map((p, i) => (
          <text key={i} x={p.x} y={H - 8} textAnchor="middle" fontSize="9" fill="#9CA3AF">{p.d.slice(5)}</text>
        ))}
      </svg>
    </div>
  )
}

const inp = 'clay-inset w-full px-3 py-2.5 text-sm outline-none focus:bg-ink-50/30 font-semibold text-ink-900 placeholder:text-ink-400 rounded-clay'
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-ink-700 block mb-1.5 font-display">{label}</label>
      {children}
    </div>
  )
}
function CenterLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="clay inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    </div>
  )
}
