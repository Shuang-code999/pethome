import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Trash2, Save, X, ChevronLeft, ChevronRight, Smile, Frown, Heart, Zap, Meh, Coffee, Cloud } from 'lucide-react'

const noteKey = (petId) => `petNotes_${petId}`
function loadNotes(petId) {
  try { return JSON.parse(localStorage.getItem(noteKey(petId)) || '[]') } catch { return [] }
}
function saveNotes(petId, notes) { localStorage.setItem(noteKey(petId), JSON.stringify(notes)) }

// ============ 心情选项：图标 + 颜色 ============
// value 是存的 key，icon/color 用于显示
const MOODS = [
  { v: 'happy',   label: '开心', Icon: Smile,    color: 'text-amber-500', bg: 'bg-amber-50',  emoji: '😄' },
  { v: 'love',    label: '幸福', Icon: Heart,    color: 'text-rose-500',  bg: 'bg-rose-50',   emoji: '🥰' },
  { v: 'energetic', label: '活力', Icon: Zap,  color: 'text-orange-500', bg: 'bg-orange-50', emoji: '⚡' },
  { v: 'calm',    label: '平静', Icon: Cloud,    color: 'text-sky-500',   bg: 'bg-sky-50',    emoji: '☁️' },
  { v: 'sleepy',  label: '慵懒', Icon: Coffee,   color: 'text-purple-500', bg: 'bg-purple-50', emoji: '😴' },
  { v: 'meh',     label: '一般', Icon: Meh,      color: 'text-ink-500',   bg: 'bg-ink-100',   emoji: '😐' },
  { v: 'sad',     label: '难过', Icon: Frown,    color: 'text-blue-500',  bg: 'bg-blue-50',   emoji: '😢' }
]
const MOOD_MAP = MOODS.reduce((m, o) => (m[o.v] = o, m), {})
const getMood = (v) => MOOD_MAP[v]

const EMPTY = { id: null, title: '', content: '', tags: '', mood: 'happy', date: new Date().toISOString().slice(0, 10) }

const WEEK = ['一', '二', '三', '四', '五', '六', '日']

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function monthGrid(year, month) {
  // 周一开头
  const first = new Date(year, month, 1)
  const startWeekday = (first.getDay() + 6) % 7 // Mon=0..Sun=6
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(new Date(year, month, d))
  return cells
}

/**
 * 记事本页 · 简洁版
 * - 顶部：月份标题 + 上一月/下一月/今日
 * - 中部：月历，点中日期 → 该日笔记列表 + 新增按钮
 * - 下方：当前选中日期的笔记卡片列表（紧凑）
 * - 弹窗：编辑/新增单条笔记
 */
export default function NotePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState(null)
  const [cursor, setCursor] = useState({ y: new Date().getFullYear(), m: new Date().getMonth() })
  const [selected, setSelected] = useState(ymd(new Date()))
  const [editing, setEditing] = useState(null) // null | { ...EMPTY }

  useEffect(() => {
    const raw = loadNotes(id)
    // 兼容旧数据：旧笔记没有 mood 字段，默认 happy
    const list = raw.map(n => ({ ...n, mood: n.mood || 'happy' }))
    setNotes(list)
    // 回写一次（仅在需要补字段时），避免重复 IO
    if (raw.some(n => !n.mood)) saveNotes(id, list)
  }, [id])

  const refresh = (newList) => {
    saveNotes(id, newList)
    setNotes(newList)
  }

  const openNew = (date) => setEditing({ ...EMPTY, id: Date.now(), date: date || ymd(new Date()) })
  const openEdit = (n) => setEditing({ ...n })
  const close = () => setEditing(null)

  const save = () => {
    if (!editing.title?.trim()) { alert('请填写标题'); return }
    const list = loadNotes(id)
    const idx = list.findIndex(n => n.id === editing.id)
    if (idx >= 0) list[idx] = editing
    else list.unshift(editing)
    refresh(list)
    close()
  }

  const remove = (nid) => {
    if (!confirm('确认删除该笔记？')) return
    const list = loadNotes(id).filter(n => n.id !== nid)
    refresh(list)
    if (editing?.id === nid) close()
  }

  // 注意：useMemo 必须在早期 return 之前调用（hooks 顺序规则）
  const noteMap = useMemo(() => {
    const m = {}
    for (const n of (notes || [])) (m[n.date] ||= []).push(n)
    return m
  }, [notes])

  if (notes === null) return <CenterLoading />

  const cells = monthGrid(cursor.y, cursor.m)
  const today = ymd(new Date())
  const dayNotes = noteMap[selected] || []

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 fade-in">
      <button onClick={() => navigate(`/pet/${id}`)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回宠物详情
      </button>

      <div className="bg-white rounded-2xl border border-ink-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-ink-900">记事本</h1>
            <p className="text-xs text-ink-500 mt-0.5">点击日期添加与查看当日记录</p>
          </div>
          <button
            onClick={() => openNew(selected)}
            className="clickable flex items-center gap-1 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg"
          >
            <Plus size={13} strokeWidth={2.5} /> 新增
          </button>
        </div>

        {/* 日历头 */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => setCursor(c => c.m === 0 ? { y: c.y - 1, m: 11 } : { ...c, m: c.m - 1 })}
            className="clickable p-1.5 rounded-full hover:bg-ink-100 text-ink-600"
          ><ChevronLeft size={16} /></button>
          <div className="text-sm font-bold text-ink-900">
            {cursor.y} 年 {cursor.m + 1} 月
          </div>
          <button
            onClick={() => setCursor(c => c.m === 11 ? { y: c.y + 1, m: 0 } : { ...c, m: c.m + 1 })}
            className="clickable p-1.5 rounded-full hover:bg-ink-100 text-ink-600"
          ><ChevronRight size={16} /></button>
        </div>

        {/* 月历 */}
        <div className="grid grid-cols-7 text-center text-[11px] text-ink-400 mb-1">
          {WEEK.map(w => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const key = ymd(d)
            const list = noteMap[key] || []
            const has = list.length > 0
            const isToday = key === today
            const isSel = key === selected
            // 取当日第一条笔记的心情（多条时优先显示最新写的）
            const dayMood = has ? getMood(list[0].mood) || getMood('happy') : null
            const Icon = dayMood?.Icon
            return (
              <button
                key={i}
                onClick={() => setSelected(key)}
                title={dayMood ? dayMood.label : ''}
                className={`relative aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition
                  ${isSel ? 'bg-brand-500 text-white' : isToday ? 'bg-ink-100 text-ink-900 font-bold' : 'hover:bg-ink-50 text-ink-700'}`}
              >
                {d.getDate()}
                {has && Icon && (
                  <span className={`absolute bottom-0.5 w-4 h-4 rounded-full flex items-center justify-center
                    ${isSel ? 'bg-white/95' : dayMood.bg}`}>
                    <Icon size={9} className={isSel ? 'text-brand-600' : dayMood.color} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => { setCursor({ y: new Date().getFullYear(), m: new Date().getMonth() }); setSelected(today) }}
          className="clickable text-[11px] text-brand-600 hover:underline mt-2"
        >回到今天</button>
      </div>

      {/* 选中日期的笔记 */}
      <div className="bg-white rounded-2xl border border-ink-200 p-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-ink-900">{selected}</div>
            <div className="text-[11px] text-ink-500 mt-0.5">{dayNotes.length} 条记录</div>
          </div>
          <button
            onClick={() => openNew(selected)}
            className="clickable flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
          >
            <Plus size={12} /> 在此日新增
          </button>
        </div>

        {dayNotes.length === 0 ? (
          <div className="py-8 text-center text-sm text-ink-400">当日还没有记录</div>
        ) : (
          <div className="divide-y divide-ink-100">
            {dayNotes.map(n => {
              const m = getMood(n.mood) || getMood('happy')
              const Icon = m.Icon
              return (
                <div key={n.id} className="py-3 flex items-start gap-3 group">
                  {/* 心情图标（大圆角显示） */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.bg}`}>
                    <Icon size={20} className={m.color} strokeWidth={2.2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-ink-900 truncate">{n.title || '(无标题)'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${m.bg} ${m.color}`}>
                        {m.emoji} {m.label}
                      </span>
                      {n.tags && <span className="text-[10px] text-ink-500 truncate">#{n.tags.split(/[,，]/)[0]}</span>}
                    </div>
                    {n.content && <div className="text-xs text-ink-600 mt-1 line-clamp-2">{n.content}</div>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => openEdit(n)} className="clickable text-[11px] text-brand-600 hover:underline">编辑</button>
                    <button onClick={() => remove(n.id)} className="clickable text-[11px] text-red-500 hover:underline">删除</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <Modal title={editing.id && notes.find(n => n.id === editing.id) ? '编辑笔记' : '新增笔记'} onClose={close}
          footer={<>
            <button onClick={close} className="clickable text-sm text-ink-500 px-3 py-2">取消</button>
            <button onClick={save} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg flex items-center gap-1">
              <Save size={13} /> 保存
            </button>
          </>}>
          <div className="space-y-3">
            <Field label="日期">
              <input type="date" className={inp} value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
            </Field>
            <Field label="心情 *">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {MOODS.map(m => {
                  const Icon = m.Icon
                  const active = editing.mood === m.v
                  return (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => setEditing({ ...editing, mood: m.v })}
                      className={`clickable flex flex-col items-center gap-0.5 py-2 rounded-lg border-2 transition
                        ${active
                          ? `${m.bg} border-current ${m.color} shadow-sm`
                          : 'bg-white border-ink-100 text-ink-500 hover:border-ink-300'}`}
                    >
                      <Icon size={18} className={active ? m.color : ''} strokeWidth={2.2} />
                      <span className={`text-[10px] font-semibold ${active ? m.color : 'text-ink-500'}`}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </Field>
            <Field label="标题 *">
              <input className={inp} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="一句话小标题" />
            </Field>
            <Field label="标签">
              <input className={inp} value={editing.tags} onChange={e => setEditing({ ...editing, tags: e.target.value })} placeholder="逗号分隔，如 洗澡, 出门" />
            </Field>
            <Field label="内容">
              <textarea className={`${inp} resize-none`} rows={6} value={editing.content} onChange={e => setEditing({ ...editing, content: e.target.value })} placeholder="记录当天的小事…" />
            </Field>
          </div>
        </Modal>
      )}
    </section>
  )
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400'

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs text-ink-600 block mb-1">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, footer, children }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end md:items-center justify-center fade-in" onClick={onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[85vh] md:max-h-[calc(100vh-2rem)] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between">
          <div className="font-bold text-ink-900">{title}</div>
          <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-5">{children}</div>
        {footer && <div className="shrink-0 bg-white border-t border-ink-100 p-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

function CenterLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-ink-500">
      <Loader2 size={16} className="animate-spin inline mr-1" /> 加载中…
    </div>
  )
}