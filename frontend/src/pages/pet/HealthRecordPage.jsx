import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Plus, Camera, Calendar, X, Save, PawPrint } from 'lucide-react'
import { api, upload } from '../../api.js'
import Reveal from '../../components/common/Reveal.jsx'

const EMPTY = { type: 'vaccine', name: '', recordDate: '', nextDate: '', note: '' }

const TYPE_META = {
  vaccine: { label: '疫苗', color: '#2EC4B6' },
  deworm:  { label: '驱虫', color: '#F59E0B' },
  checkup: { label: '体检', color: '#8B5CF6' }
}

/**
 * 健康记录页 · 简洁版
 * - 顶部 1 个统计条：总记录 + 3 个分类小圆点
 * - 横向 chip 切换类型 + 新增按钮
 * - 列表：标题/日期/下次提醒/备注
 * - 顶部隐藏 OCR 引导卡，OCR 入口直接放在新增弹窗里（不占主屏）
 */
export default function HealthRecordPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [records, setRecords] = useState(null)
  const [pet, setPet] = useState(null)
  const [myPets, setMyPets] = useState([])
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => { load() }, [id])

  const load = async () => {
    const [recRes, petRes, allPetsRes] = await Promise.all([
      api.healthRecords(id).catch(() => ({ code: 0, data: [] })),
      api.petDetail(id).catch(() => ({ code: 0 })),
      api.myPets().catch(() => ({ code: 0, data: [] }))
    ])
    setRecords(recRes.code === 200 ? recRes.data || [] : [])
    if (petRes.code === 200) setPet(petRes.data)
    setMyPets(allPetsRes.code === 200 ? allPetsRes.data || [] : [])
  }

  const submit = async () => {
    // 校验：记录名称 + 记录日期 + 目标宠物 id
    const targetPetId = editing.petId || id
    if (!editing.name || !editing.recordDate) { alert('请填写「记录名称」和「记录日期」'); return }
    if (!targetPetId) {
      alert('请选择此条记录所属的宠物')
      return
    }
    // 后端接口接受 petId，但保留向后兼容：url 路径 id 默认是宠物 id
    const res = await api.createHealthRecord(targetPetId, { ...editing })
    if (res.code === 200) { setEditing(null); load() } else alert(res.msg || '保存失败')
  }

  const handleOcr = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    try {
      const ur = await upload(file)
      if (ur.code !== 200) { alert('图片上传失败'); return }
      const res = await api.ocrHealthRecord(ur.data)
      if (res.code === 200 && res.data?.success && res.data.healthData) {
        const d = res.data.healthData
        setEditing(prev => ({ ...(prev || EMPTY), name: d.name || prev?.name, recordDate: d.recordDate?.slice(0, 10) || prev?.recordDate, nextDate: d.nextDate?.slice(0, 10) || prev?.nextDate, note: d.note || prev?.note, type: d.type || prev?.type || 'vaccine' }))
      } else {
        alert(res.data?.message || '识别失败，请手动填写')
      }
    } catch { alert('识别失败，请手动填写') } finally { setOcrLoading(false); e.target.value = '' }
  }

  if (records === null) return <CenterLoading />

  const counts = {
    vaccine: records.filter(r => r.type === 'vaccine').length,
    deworm: records.filter(r => r.type === 'deworm').length,
    checkup: records.filter(r => r.type === 'checkup').length
  }
  const filtered = filter === 'all' ? records : records.filter(r => r.type === filter)
  const targetPetExists = !!(pet && pet.id)
  // 弹窗默认选中的宠物：URL 指定的 pet 或第一只
  const defaultEditingPetId = id ? Number(id) : (myPets[0]?.id)

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 fade-in min-h-[calc(100vh-160px)]">
      <button onClick={() => navigate(`/pet/${id}`)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回宠物详情
      </button>

      <div className="bg-white rounded-2xl border border-ink-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-ink-900">
              {pet ? `${pet.name}的健康记录` : '健康记录'}
            </h1>
            <p className="text-xs text-ink-500 mt-0.5">
              {pet ? `${pet.species || ''}${pet.breed ? ' · ' + pet.breed : ''} · 疫苗 · 驱虫 · 体检 · 全程留痕` : '疫苗 · 驱虫 · 体检 · 全程留痕'}
            </p>
          </div>
          <button
            onClick={() => setEditing({ ...EMPTY, petId: defaultEditingPetId })}
            disabled={myPets.length === 0}
            className="clickable flex items-center gap-1 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            <Plus size={13} strokeWidth={2.5} /> 新增
          </button>
        </div>

        {/* 提示：当前无宠物档案 */}
        {myPets.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 mb-3 flex items-start gap-2">
            <PawPrint size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              你还没有宠物档案，请先
              <button onClick={() => navigate('/pet/list')} className="text-amber-700 underline font-semibold mx-1">创建一只宠物</button>
              再记录健康信息。
            </div>
          </div>
        )}

        {/* 统计条（紧凑、单行） */}
        <div className="flex items-center gap-3 text-xs text-ink-600 mb-3 px-1">
          <span className="font-bold text-ink-900">共 {records.length} 条</span>
          <Dot color={TYPE_META.vaccine.color} label={`疫苗 ${counts.vaccine}`} onClick={() => setFilter('vaccine')} active={filter === 'vaccine'} />
          <Dot color={TYPE_META.deworm.color}  label={`驱虫 ${counts.deworm}`}  onClick={() => setFilter('deworm')}  active={filter === 'deworm'} />
          <Dot color={TYPE_META.checkup.color} label={`体检 ${counts.checkup}`} onClick={() => setFilter('checkup')} active={filter === 'checkup'} />
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="ml-auto text-ink-400 hover:text-ink-700">清除筛选</button>
          )}
        </div>

        {/* 列表 */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink-400">
            暂无{filter === 'all' ? '' : TYPE_META[filter]?.label}记录
            <div className="text-xs mt-1 text-ink-300">点右上角"新增"开始记录</div>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {filtered
              .sort((a, b) => (b.recordDate || '').localeCompare(a.recordDate || ''))
              .map((r) => {
                const meta = TYPE_META[r.type] || TYPE_META.vaccine
                return (
                  <div key={r.id} className="py-3 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: meta.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-ink-900">{r.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${meta.color}1A`, color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-0.5"><Calendar size={10} /> {r.recordDate}</span>
                        {r.nextDate && <span className="text-brand-600">下次 {r.nextDate}</span>}
                      </div>
                      {r.note && <div className="text-xs text-ink-600 mt-1.5">{r.note}</div>}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      {/* 新增弹窗（简洁，OCR 入口放弹窗里） */}
      {editing && (
        <Modal title="新增健康记录" subtitle={pet ? `为「${pet.name}」记录` : null} onClose={() => setEditing(null)}
          footer={<>
            <button onClick={() => setEditing(null)} className="clickable text-sm text-ink-500 px-3 py-2">取消</button>
            <button onClick={submit} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg flex items-center gap-1">
              <Save size={13} /> 保存
            </button>
          </>}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-ink-600 block mb-1">类型</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setEditing({ ...editing, type: k })}
                    className={`clickable py-2 rounded-lg text-sm font-medium border ${editing.type === k ? 'border-transparent text-white' : 'border-ink-200 text-ink-700 bg-white'}`}
                    style={editing.type === k ? { background: v.color } : {}}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 选择此条记录所属的宠物（多只宠物时可选，否则仅展示当前宠物） */}
            <Field label="所属宠物 *">
              {myPets.length === 1 || (targetPetExists && myPets.length <= 1) ? (
                <div className="px-3 py-2 rounded-lg bg-ink-50 text-sm text-ink-700 flex items-center gap-2">
                  <PawPrint size={13} className="text-brand-500" />
                  <span className="font-semibold">{pet?.name || myPets[0]?.name || '当前宠物'}</span>
                  <span className="text-[10px] text-ink-400 ml-auto">自动关联</span>
                </div>
              ) : (
                <select
                  className={inp}
                  value={editing.petId || defaultEditingPetId || ''}
                  onChange={e => setEditing({ ...editing, petId: Number(e.target.value) })}
                >
                  {myPets.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.breed ? ` · ${p.breed}` : ''}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="记录名称 *">
              <input className={inp} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="如 狂犬疫苗 / 大宠爱体外滴剂" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="记录日期 *">
                <input type="date" className={inp} value={editing.recordDate} onChange={e => setEditing({ ...editing, recordDate: e.target.value })} />
              </Field>
              <Field label="下次日期">
                <input type="date" className={inp} value={editing.nextDate} onChange={e => setEditing({ ...editing, nextDate: e.target.value })} />
              </Field>
            </div>
            <Field label="备注">
              <textarea className={`${inp} resize-none`} rows={3} value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="选填" />
            </Field>
            <label className="clickable flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-ink-300 text-xs text-ink-500 hover:text-brand-600 hover:border-brand-300 cursor-pointer">
              <input type="file" accept="image/*" capture="environment" onChange={handleOcr} className="hidden" />
              {ocrLoading ? <><Loader2 size={13} className="animate-spin" /> 识别中…</> : <><Camera size={13} /> 拍照自动识别</>}
            </label>
          </div>
        </Modal>
      )}
    </section>
  )
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400'

function Dot({ color, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition ${active ? 'bg-ink-100' : 'hover:bg-ink-50'}`}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </button>
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

function Modal({ title, subtitle, onClose, footer, children }) {
  const contentRef = useRef(null)
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [])
  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center sm:p-4 fade-in overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-hover my-auto" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between">
          <div>
            <div className="font-bold text-ink-900">{title}</div>
            {subtitle && <div className="text-[11px] text-ink-500 mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto p-5 overscroll-contain">{children}</div>
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
