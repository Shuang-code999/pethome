import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Trash2, Check, Calendar, X, Save, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

const remindKey = (petId) => `reminders_${petId}`
function loadReminders(petId) {
  try { return JSON.parse(localStorage.getItem(remindKey(petId)) || '[]') } catch { return [] }
}
function saveReminders(petId, items) { localStorage.setItem(remindKey(petId), JSON.stringify(items)) }

/**
 * 5 种提醒类型（按用户要求）
 *  - vaccine     疫苗到期
 *  - deworm      驱虫时间
 *  - revisit     复诊时间
 *  - medBath     药浴周期
 *  - weightCheck 体重定期监测
 */
const TYPE_META = {
  vaccine:     { label: '疫苗到期',   color: '#2EC4B6', unit: '下次接种' },
  deworm:      { label: '驱虫时间',   color: '#F59E0B', unit: '下次驱虫' },
  revisit:     { label: '复诊时间',   color: '#8B5CF6', unit: '复诊日期' },
  medBath:     { label: '药浴周期',   color: '#0EA5E9', unit: '下次药浴' },
  weightCheck: { label: '体重监测',   color: '#EC4899', unit: '下次称重' }
}
const TYPES = Object.keys(TYPE_META)

const EMPTY = { type: 'vaccine', title: '', remindDate: '', advanceDays: 3, note: '', done: false }

/**
 * 健康提醒页 · 简洁版
 * - 顶部紧凑统计：已逾期 / 待处理 / 已完成 / 总计
 * - 中部：5 种提醒类型的小图标 + 新增按钮（按当前选中类型）
 * - 列表：分桶显示（已逾期 / 待处理 / 已完成）
 * - 弹窗：新增/编辑单条提醒
 */
export default function RemindPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => { setItems(loadReminders(id)) }, [id])

  const refresh = () => setItems(loadReminders(id))

  const openNew = (type) => setEditing({ ...EMPTY, type: type || filterType || 'vaccine', remindDate: today() })

  const submit = () => {
    if (!editing.title || !editing.remindDate) { alert('请填写标题和提醒日期'); return }
    const list = [...loadReminders(id), { ...editing, id: Date.now() }]
    saveReminders(id, list)
    setEditing(null)
    refresh()
  }

  const toggleDone = (rid) => {
    const list = loadReminders(id).map(r => r.id === rid ? { ...r, done: !r.done } : r)
    saveReminders(id, list)
    refresh()
  }

  const remove = (rid) => {
    if (!confirm('确认删除？')) return
    const list = loadReminders(id).filter(r => r.id !== rid)
    saveReminders(id, list)
    refresh()
  }

  if (items === null) return <CenterLoading />

  const td = today()
  const baseList = filterType === 'all' ? items : items.filter(r => r.type === filterType)
  const overdue = baseList.filter(r => !r.done && r.remindDate < td)
  const upcoming = baseList.filter(r => !r.done && r.remindDate >= td)
  const done = baseList.filter(r => r.done)

  const typeCount = (t) => items.filter(r => r.type === t).length

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 fade-in min-h-[calc(100vh-160px)]">
      <button onClick={() => navigate(`/pet/${id}`)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回宠物详情
      </button>

      <div className="bg-white rounded-2xl border border-ink-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-ink-900">健康提醒</h1>
            <p className="text-xs text-ink-500 mt-0.5">疫苗 · 驱虫 · 复诊 · 药浴 · 体重监测</p>
          </div>
          <button
            onClick={() => openNew('vaccine')}
            className="clickable flex items-center gap-1 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg"
          >
            <Plus size={13} strokeWidth={2.5} /> 新增
          </button>
        </div>

        {/* 5 种类型 chip + 计数 */}
        <div className="flex gap-1.5 overflow-x-auto mb-4 -mx-1 px-1">
          <Chip color="#6B7280" label={`全部 ${items.length}`} active={filterType === 'all'} onClick={() => setFilterType('all')} />
          {TYPES.map(t => (
            <Chip key={t} color={TYPE_META[t].color} label={`${TYPE_META[t].label} ${typeCount(t)}`} active={filterType === t} onClick={() => setFilterType(t)} />
          ))}
        </div>

        {/* 紧凑统计条 */}
        <div className="flex items-center gap-4 text-xs text-ink-600 mb-1 px-1">
          <Stat color="#EF4444" icon={AlertTriangle} label="已逾期" value={overdue.length} />
          <Stat color="#F59E0B" icon={Clock}        label="待处理" value={upcoming.length} />
          <Stat color="#10B981" icon={CheckCircle2} label="已完成" value={done.length} />
        </div>
      </div>

      {/* 列表 */}
      <div className="space-y-3 mt-4">
        {[
          { key: 'overdue',  list: overdue,  label: '已逾期', color: '#EF4444' },
          { key: 'upcoming', list: upcoming, label: '待处理', color: '#F59E0B' },
          { key: 'done',     list: done,     label: '已完成', color: '#10B981' }
        ].filter(g => g.list.length > 0).map(group => (
          <div key={group.key} className="bg-white rounded-2xl border border-ink-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full" style={{ background: group.color }} />
              <span className="text-sm font-bold text-ink-900">{group.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${group.color}1A`, color: group.color }}>
                {group.list.length}
              </span>
            </div>
            <div className="divide-y divide-ink-100">
              {group.list.sort((a, b) => a.remindDate.localeCompare(b.remindDate)).map(r => {
                const meta = TYPE_META[r.type] || TYPE_META.vaccine
                return (
                  <div key={r.id} className={`py-3 flex items-start gap-3 ${r.done ? 'opacity-60' : ''}`}>
                    <div className="w-1 self-stretch rounded-full" style={{ background: meta.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-semibold text-sm text-ink-900 ${r.done ? 'line-through' : ''}`}>{r.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${meta.color}1A`, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> {r.remindDate}</span>
                        <span>提前 {r.advanceDays} 天</span>
                      </div>
                      {r.note && <div className="text-xs text-ink-600 mt-1.5">{r.note}</div>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => toggleDone(r.id)}
                        className={`clickable w-7 h-7 rounded-full flex items-center justify-center transition
                          ${r.done ? 'bg-ink-100 text-ink-500' : 'text-white'}`}
                        style={!r.done ? { background: meta.color } : {}}
                        title={r.done ? '撤销完成' : '标记完成'}
                      >
                        <Check size={13} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => remove(r.id)}
                        className="clickable w-7 h-7 rounded-full border border-ink-200 flex items-center justify-center text-ink-400 hover:text-red-500 hover:border-red-300"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-ink-200 py-12 text-center">
            <div className="text-sm text-ink-500 mb-1">暂无健康提醒</div>
            <div className="text-xs text-ink-400 mb-4">添加提醒，让爱宠健康不漏项</div>
            <button
              onClick={() => openNew('vaccine')}
              className="clickable inline-flex items-center gap-1 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg"
            >
              <Plus size={13} /> 新建提醒
            </button>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      {editing && (
        <Modal title={editing.id ? '编辑提醒' : '新建健康提醒'} onClose={() => setEditing(null)}
          footer={<>
            <button onClick={() => setEditing(null)} className="clickable text-sm text-ink-500 px-3 py-2">取消</button>
            <button onClick={submit} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg flex items-center gap-1">
              <Save size={13} /> 保存
            </button>
          </>}>
          <div className="space-y-3">
            <Field label="类型">
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditing({ ...editing, type: t })}
                    className={`clickable py-2 rounded-lg text-xs font-medium border ${editing.type === t ? 'border-transparent text-white' : 'border-ink-200 text-ink-700 bg-white'}`}
                    style={editing.type === t ? { background: TYPE_META[t].color } : {}}
                  >
                    {TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`${TYPE_META[editing.type].unit} · 标题 *`}>
              <input className={inp} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder={
                editing.type === 'vaccine' ? '如 狂犬疫苗加强' :
                editing.type === 'deworm' ? '如 体内驱虫' :
                editing.type === 'revisit' ? '如 皮肤复查' :
                editing.type === 'medBath' ? '如 药浴 #5' :
                '如 月度体重'
              } />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="提醒日期 *">
                <input type="date" className={inp} value={editing.remindDate} onChange={e => setEditing({ ...editing, remindDate: e.target.value })} />
              </Field>
              <Field label="提前提醒 (天)">
                <input type="number" min="0" className={inp} value={editing.advanceDays} onChange={e => setEditing({ ...editing, advanceDays: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="备注">
              <textarea className={`${inp} resize-none`} rows={3} value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="选填" />
            </Field>
          </div>
        </Modal>
      )}
    </section>
  )
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400'

function today() { return new Date().toISOString().slice(0, 10) }

function Chip({ color, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`clickable shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition
        ${active ? 'border-transparent text-white' : 'border-ink-200 text-ink-700 bg-white hover:bg-ink-50'}`}
      style={active ? { background: color } : {}}
    >
      {label}
    </button>
  )
}

function Stat({ color, icon: Icon, label, value }) {
  return (
    <span className="flex items-center gap-1">
      <Icon size={11} style={{ color }} />
      <span className="font-bold text-ink-900">{value}</span>
      <span>{label}</span>
    </span>
  )
}

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
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center sm:p-4 fade-in overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[92vh] md:max-h-[88vh] flex flex-col my-auto shadow-hover" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between">
          <div className="font-bold text-ink-900">{title}</div>
          <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-5 overscroll-contain">{children}</div>
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