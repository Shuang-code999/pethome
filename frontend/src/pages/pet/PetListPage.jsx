import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, PawPrint, Loader2, Stethoscope, Pencil, Trash2, X, Cake, Weight, Syringe, HeartPulse, Apple, AlertTriangle, ShieldAlert, Bone, Egg, Calendar, ChevronRight } from 'lucide-react'
import { api } from '../../api.js'
import PetImg from '../../components/PetImg.jsx'
import Reveal from '../../components/common/Reveal.jsx'
import { petAvatar } from '../../data/petImages.js'
import { petEvents } from '../../hooks/petEvents.js'

/**
 * 我的宠物 · 合并版
 *
 * - 列表卡片直接展示丰富信息（体重/绝育/毛色/过敏史/慢性病等），无需进入详情
 * - 每张卡片右侧带删除入口
 * - 新建档案以内嵌抽屉形式呈现（不再跳独立页）
 * - 点击卡片头部/查看详情打开完整编辑抽屉
 */
export default function PetListPage() {
  const navigate = useNavigate()
  const [pets, setPets] = useState(null)
  const [activePetId, setActivePetId] = useState(localStorage.getItem('selectedPetId') || null)
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(null)  // { id, name } | null
  const [creating, setCreating] = useState(null)   // null | { ...EMPTY }
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState(null)  // 当前正在删除的宠物 id

  useEffect(() => { load() }, [])

  const load = async (silent = false) => {
    try {
      const res = await api.myPets()
      const list = (res && res.code === 200) ? (res.data || []) : []
      setPets(list)
      // 校验当前 activePetId 是否还存在于列表中
      if (activePetId && !list.some(p => String(p.id) === String(activePetId))) {
        setActivePetId(null)
        localStorage.removeItem('selectedPetId')
      }
      if (!activePetId && list[0]) {
        setActivePetId(list[0].id)
        localStorage.setItem('selectedPetId', String(list[0].id))
      }
    } catch (e) {
      if (!silent) console.warn('[PetListPage] load 失败:', e)
      // 出错时给出空态而非一直 loading，避免「页面卡住」
      setPets([])
    }
  }

  const pick = (id) => {
    setActivePetId(id)
    localStorage.setItem('selectedPetId', String(id))
  }

  const openDetail = async (p) => {
    // 拉取完整 pet 实体（接口已返回所有字段）
    try {
      const r = await api.petDetail(p.id)
      if (r && r.code === 200) setDetail(r.data)
      else setDetail(p)
    } catch (e) {
      console.warn('[PetListPage] petDetail 失败，使用本地数据：', e)
      setDetail(p)
    }
  }

  const askRemove = (id, name) => {
    if (removingId) return  // 防止并发删除
    setConfirming({ id, name })
  }

  const doRemove = async () => {
    if (!confirming) return
    const { id, name } = confirming
    setConfirming(null)
    setRemovingId(id)
    // 清理详情 & 选中态（不可逆操作，先清掉避免 UI 残留）
    if (detail?.id === id) setDetail(null)
    try {
      const r = await api.deletePet(id)
      console.log('[PetListPage] deletePet 响应:', r)
      if (r && r.code === 200) {
        // 删除成功：清选中态 → 重拉列表 → 广播
        if (String(id) === String(activePetId)) {
          localStorage.removeItem('selectedPetId')
          setActivePetId(null)
        }
        await load(true)
        petEvents.emit()
      } else if (r && r.code === 404) {
        // 后端已不存在（可能已被其他端删除），同步本地
        if (String(id) === String(activePetId)) {
          localStorage.removeItem('selectedPetId')
          setActivePetId(null)
        }
        await load(true)
        petEvents.emit()
      } else if (r && (r.code === 401 || r.code === 403)) {
        alert(r.msg || '无权操作，请重新登录后再试')
        // 不做任何列表操作，等 load(true) 统一处理
      } else {
        // 其他错误码（500 等）：提示用户
        console.warn('[PetListPage] 删除未成功:', r)
        alert(r?.msg || `删除「${name}」失败，请稍后重试`)
      }
    } catch (e) {
      console.error('[PetListPage] deletePet 异常:', e)
      alert('网络错误，删除失败，请稍后重试')
    }
    // 无论成功与否，都重拉一次以确保前端与服务端一致
    try { await load(true) } catch {}
    setRemovingId(null)
  }

  const removeFromDetail = async () => {
    if (!detail) return
    askRemove(detail.id, detail.name)
  }

  const save = async () => {
    const body = {
      ...detail,
      gender: detail.gender === 1 || detail.gender === '公' ? 1 : 0,
      neutered: detail.neutered ? 1 : 0,
      weight: detail.weight ? Number(detail.weight) : null
    }
    const r = await api.updatePet(detail.id, body)
    if (r.code === 200) {
      setDetail(r.data)
      setEditing(false)
      load()
    } else alert(r.msg || '保存失败')
  }

  const startCreate = () => setCreating({
    name: '', species: '狗', breed: '', gender: '公', birthday: '', weight: '',
    neutered: 0, chipNo: '', avatar: '',
    coatColor: '', pedigreeNo: '', ageText: '',
    arriveDate: '', stapleFood: '',
    allergy: '', chronicDisease: '', temperament: '', stress: '',
    forbiddenDrugs: '', specialCare: ''
  })

  const submitCreate = async () => {
    if (!creating.name) { alert('请填写名字'); return }
    setSaving(true)
    try {
      const body = {
        ...creating,
        gender: creating.gender === '公' ? 1 : 0,
        neutered: creating.neutered ? 1 : 0,
        weight: creating.weight ? Number(creating.weight) : null
      }
      const r = await api.createPet(body)
      if (r.code === 200) {
        setCreating(null)
        // 新建后自动设为当前宠物
        const id = r.data?.id
        if (id) {
          setActivePetId(id)
          localStorage.setItem('selectedPetId', String(id))
        }
        await load()
        petEvents.emit()
      } else alert(r.msg || '保存失败')
    } catch (e) {
      alert('网络错误，请稍后重试')
      console.error('[PetListPage] createPet failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 fade-in min-h-[calc(100vh-160px)]">
      {/* 简洁头部（去掉图片轮播） */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-ink-900">爱宠档案</h1>
          <p className="text-xs text-ink-500 mt-1">{pets ? `已建档 ${pets.length} 只` : '加载中…'}</p>
        </div>
        <button
          onClick={startCreate}
          className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1 shrink-0"
        >
          <Plus size={14} strokeWidth={2.5} /> 新建档案
        </button>
      </div>

      {/* 列表 / 加载 / 空态 */}
      {pets === null ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> 加载中…
        </div>
      ) : pets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-200 p-10 text-center">
          <PawPrint size={32} className="text-brand-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-ink-900 mb-1">还没有宠物档案</h3>
          <p className="text-xs text-ink-500 mb-4">先为爱宠建立档案，管理体重、疫苗、提醒</p>
          <button onClick={startCreate} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            立即建档
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {pets.map((p, i) => (
            <Reveal
              key={p.id}
              delay={i + 1}
              className="bg-white rounded-2xl border border-ink-200 hover:border-brand-300 hover:shadow-sm transition relative"
            >
              <PetCard
                p={p}
                onOpen={() => openDetail(p)}
                onDelete={() => askRemove(p.id, p.name)}
                removing={removingId === p.id}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* 详情面板（覆盖层，简洁风） */}
      {detail && (
        <PetDetailDrawer
          detail={detail}
          editing={editing}
          setDetail={setDetail}
          setEditing={setEditing}
          onClose={() => { setDetail(null); setEditing(false) }}
          onSave={save}
          onDelete={removeFromDetail}
        />
      )}

      {/* 新建档案抽屉（合并自 /pet/new） */}
      {creating && (
        <CreatePetDrawer
          data={creating}
          setData={setCreating}
          onClose={() => setCreating(null)}
          onSubmit={submitCreate}
          saving={saving}
        />
      )}

      {/* 确认删除弹窗（替代原生 confirm，避免移动端白屏） */}
      {confirming && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4 fade-in" onClick={() => setConfirming(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-base font-bold text-ink-900 mb-1">确认删除</div>
            <div className="text-sm text-ink-600 mb-5">
              确认删除「{confirming.name || confirming.id}」的档案？此操作不可恢复
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(null)} className="clickable flex-1 py-2.5 rounded-xl border border-ink-200 text-sm font-semibold text-ink-700">
                取消
              </button>
              <button onClick={doRemove} className="clickable flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold">
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

// ============ 详情抽屉 ============
function PetDetailDrawer({ detail, editing, setDetail, setEditing, onClose, onSave, onDelete }) {
  const set = (k, v) => setDetail(d => ({ ...d, [k]: v }))

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4 fade-in" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] md:max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="shrink-0 sticky top-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-ink-100 shrink-0">
              <PetImg
                src={detail.avatar || petAvatar(detail.species?.includes('猫') ? 'cat,cute' : 'dog,cute', 200)}
                alt={detail.name}
                className="w-full h-full object-cover"
                fallbackText={detail.name?.[0]}
              />
            </div>
            <div>
              <div className="font-bold text-ink-900 text-base">{detail.name}</div>
              <div className="text-[11px] text-ink-500">{detail.breed || detail.species}</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="clickable flex items-center gap-1 text-xs text-brand-600 font-medium px-2 py-1">
                  <Pencil size={13} /> 编辑
                </button>
                <button onClick={onDelete} className="clickable flex items-center gap-1 text-xs text-red-500 font-medium px-2 py-1">
                  <Trash2 size={13} /> 删除
                </button>
              </>
            ) : null}
            <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700" aria-label="关闭">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          {/* ===== 基础资料 ===== */}
          <Group title="基础资料">
            <Row k="名称" v={editing ? <Input value={detail.name} onChange={v => set('name', v)} /> : detail.name} />
            <Row k="品种" v={editing ? <Input value={detail.breed} onChange={v => set('breed', v)} placeholder="如 金毛" /> : (detail.breed || '—')} />
            <Row k="性别" v={editing ? (
                <Select value={detail.gender === 1 || detail.gender === '公' ? '公' : '母'} onChange={v => set('gender', v === '公' ? 1 : 0)} options={['公', '母']} />
              ) : (detail.gender === 1 ? '公' : detail.gender === 0 ? '母' : '—')} />
            <Row k="年龄" v={editing ? <Input value={detail.ageText} onChange={v => set('ageText', v)} placeholder="如 3 岁 5 个月" /> : (detail.ageText || (detail.birthday ? calcAge(detail.birthday) : '—'))} />
            <Row k="生日" v={editing ? <Input type="date" value={detail.birthday || ''} onChange={v => set('birthday', v)} /> : (detail.birthday || '—')} />
            <Row k="体重" v={editing ? <Input type="number" step="0.1" value={detail.weight || ''} onChange={v => set('weight', v)} placeholder="kg" /> : (detail.weight ? `${detail.weight} kg` : '—')} />
            <Row k="毛色" v={editing ? <Input value={detail.coatColor || ''} onChange={v => set('coatColor', v)} placeholder="如 奶油色" /> : (detail.coatColor || '—')} />
            <Row k="芯片号" v={editing ? <Input value={detail.chipNo || ''} onChange={v => set('chipNo', v)} /> : (detail.chipNo || '—')} />
            <Row k="血统编号" v={editing ? <Input value={detail.pedigreeNo || ''} onChange={v => set('pedigreeNo', v)} placeholder="如 CKU-xxxx" /> : (detail.pedigreeNo || '—')} />
          </Group>

          {/* ===== 饲养信息 ===== */}
          <Group title="饲养信息">
            <Row k="到家日期" v={editing ? <Input type="date" value={detail.arriveDate || ''} onChange={v => set('arriveDate', v)} /> : (detail.arriveDate || '—')} />
            <Row k="绝育" v={editing ? (
                <Toggle checked={!!detail.neutered} onChange={v => set('neutered', v ? 1 : 0)} />
              ) : (detail.neutered ? '已绝育' : '未绝育')} />
            <Row k="日常主食" v={editing ? <Input value={detail.stapleFood || ''} onChange={v => set('stapleFood', v)} placeholder="如 皇家 K36 + 鸡胸肉" /> : (detail.stapleFood || '—')} />
          </Group>

          {/* ===== 重要风险备注 ===== */}
          <Group title="重要风险备注" tip="仅你与医生可见">
            <Row k="过敏史" v={editing ? <Input value={detail.allergy || ''} onChange={v => set('allergy', v)} placeholder="如 青霉素、鸡肉蛋白" /> : (detail.allergy || '—')} />
            <Row k="慢性病" v={editing ? <Input value={detail.chronicDisease || ''} onChange={v => set('chronicDisease', v)} /> : (detail.chronicDisease || '—')} />
            <Row k="脾气性格" v={editing ? <Input value={detail.temperament || ''} onChange={v => set('temperament', v)} /> : (detail.temperament || '—')} />
            <Row k="应激情况" v={editing ? <Input value={detail.stress || ''} onChange={v => set('stress', v)} /> : (detail.stress || '—')} />
            <Row k="禁忌药物" v={editing ? <Input value={detail.forbiddenDrugs || ''} onChange={v => set('forbiddenDrugs', v)} /> : (detail.forbiddenDrugs || '—')} />
            <Row k="特殊照料" v={editing ? <Textarea value={detail.specialCare || ''} onChange={v => set('specialCare', v)} rows={2} /> : (detail.specialCare || '—')} />
          </Group>
        </div>

        {/* 底部按钮 */}
        {editing && (
          <div className="shrink-0 sticky bottom-0 bg-white border-t border-ink-100 p-4 flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="clickable text-sm text-ink-600 px-4 py-2">取消</button>
            <button onClick={onSave} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2 rounded-lg">保存修改</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Group({ title, tip, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-bold text-ink-900 flex items-center gap-2">
          <span className="w-1 h-4 bg-brand-500 rounded-sm" /> {title}
        </div>
        {tip && <div className="text-[10px] text-ink-400">{tip}</div>}
      </div>
      <div className="bg-ink-50/50 rounded-lg divide-y divide-ink-100">{children}</div>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="w-24 shrink-0 text-xs text-ink-500 pt-0.5">{k}</div>
      <div className="flex-1 min-w-0 text-sm text-ink-900 break-words">{v || '—'}</div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', step }) {
  return (
    <input
      type={type}
      step={step}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2.5 py-1.5 text-sm rounded-md border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400"
    />
  )
}

function Textarea({ value, onChange, rows = 3 }) {
  return (
    <textarea
      rows={rows}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm rounded-md border border-ink-200 bg-white outline-none focus:border-brand-400 resize-none placeholder:text-ink-400"
    />
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm rounded-md border border-ink-200 bg-white outline-none focus:border-brand-400"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`clickable w-10 h-6 rounded-full transition relative ${checked ? 'bg-brand-500' : 'bg-ink-200'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

function calcAge(birthday) {
  try {
    const b = new Date(birthday)
    const now = new Date()
    const years = (now - b) / (1000 * 60 * 60 * 24 * 365.25)
    if (years >= 1) return `${years.toFixed(1)} 岁`
    return `${Math.max(0, Math.round(years * 12))} 月龄`
  } catch { return '' }
}

// ============ 列表卡片（信息丰富） ============
function PetCard({ p, onOpen, onDelete, removing }) {
  const tags = []
  if (p.weight) tags.push({ icon: Weight, label: `${p.weight}kg` })
  if (p.neutered) tags.push({ icon: ShieldAlert, label: '已绝育' })
  if (p.coatColor) tags.push({ icon: Apple, label: p.coatColor })
  if (p.ageText || p.birthday) tags.push({ icon: Cake, label: p.ageText || calcAge(p.birthday) })

  const risks = []
  if (p.allergy) risks.push({ icon: AlertTriangle, label: '过敏', value: p.allergy, color: 'bg-amber-50 text-amber-700' })
  if (p.chronicDisease) risks.push({ icon: HeartPulse, label: '慢性病', value: p.chronicDisease, color: 'bg-rose-50 text-rose-700' })
  if (p.forbiddenDrugs) risks.push({ icon: ShieldAlert, label: '禁药', value: p.forbiddenDrugs, color: 'bg-red-50 text-red-700' })
  if (p.specialCare) risks.push({ icon: Stethoscope, label: '特殊照料', value: p.specialCare, color: 'bg-trust-50 text-trust-700' })

  return (
    <div className="p-4">
      {/* 头部：头像 + 名字 + 操作 */}
      <div className="flex items-center gap-3 mb-3">
        <div onClick={onOpen} className="w-14 h-14 rounded-full overflow-hidden bg-ink-100 shrink-0 ring-2 ring-white cursor-pointer">
          <PetImg
            src={p.avatar || petAvatar(p.species?.includes('猫') ? 'cat,cute' : 'dog,cute', 200, p.id)}
            alt={p.name}
            className="w-full h-full object-cover"
            fallbackText={p.name?.[0] || ''}
          />
        </div>
        <div onClick={onOpen} className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-ink-900 text-base truncate">{p.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0
              ${p.gender === 1 ? 'bg-sky-100 text-trust-600' : 'bg-rose-100 text-pink-600'}`}>
              {p.gender === 1 ? '♂ 公' : '♀ 母'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-ink-100 text-ink-600 font-semibold shrink-0">
              {p.species || '未知'}
            </span>
          </div>
          <div className="text-xs text-ink-500 mt-0.5 truncate">
            {p.breed || '品种未填'}{p.pedigreeNo ? ` · ${p.pedigreeNo}` : ''}
          </div>
        </div>
        <button
          onClick={onDelete}
          disabled={!!removing}
          className="clickable shrink-0 p-2 text-ink-400 hover:text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="删除"
        >
          {removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
        </button>
      </div>

      {/* 标签条：体重 / 绝育 / 毛色 / 年龄 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-semibold">
              <t.icon size={10} /> {t.label}
            </span>
          ))}
        </div>
      )}

      {/* 健康风险卡（重要信息高亮） */}
      {risks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {risks.map((r, i) => (
            <div key={i} className={`flex items-start gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md ${r.color}`}>
              <r.icon size={11} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold mr-1">{r.label}</span>
                <span className="truncate">{r.value}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* 饲养简记 */}
      {p.stapleFood && (
        <div className="mt-2 text-[11px] text-ink-500 flex items-center gap-1">
          <Egg size={11} /> 主食：<span className="truncate">{p.stapleFood}</span>
        </div>
      )}

      {/* 底部：详情/快捷功能入口 */}
      <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {p.chipNo && <span className="text-ink-500">芯片 {p.chipNo}</span>}
          {p.arriveDate && <span className="text-ink-500 flex items-center gap-0.5"><Calendar size={10} />到家 {p.arriveDate}</span>}
        </div>
        <button onClick={onOpen} className="clickable text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5">
          详情 / 编辑 <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ============ 新建档案抽屉 ============
function CreatePetDrawer({ data, setData, onClose, onSubmit, saving }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }))
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4 fade-in" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-2xl md:rounded-2xl rounded-t-2xl max-h-[90vh] md:max-h-[calc(100vh-2rem)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="shrink-0 sticky top-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between z-10">
          <div className="font-bold text-ink-900 text-base">新建档案</div>
          <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
          {/* ===== 基础资料 ===== */}
          <Group title="基础资料">
            <Row k="名称 *" v={<Input value={data.name} onChange={v => set('name', v)} placeholder="如 圆圆" />} />
            <div className="grid grid-cols-2 gap-3 px-3 py-2.5">
              <div>
                <label className="text-[10px] text-ink-500 block mb-1">物种</label>
                <Select value={data.species} onChange={v => set('species', v)} options={['狗', '猫', '兔', '其他']} />
              </div>
              <div>
                <label className="text-[10px] text-ink-500 block mb-1">性别</label>
                <Select value={data.gender} onChange={v => set('gender', v)} options={['公', '母']} />
              </div>
            </div>
            <Row k="品种" v={<Input value={data.breed} onChange={v => set('breed', v)} placeholder="如 金毛" />} />
            <div className="grid grid-cols-2 gap-3 px-3 py-2.5">
              <div>
                <label className="text-[10px] text-ink-500 block mb-1">生日</label>
                <Input type="date" value={data.birthday || ''} onChange={v => set('birthday', v)} />
              </div>
              <div>
                <label className="text-[10px] text-ink-500 block mb-1">体重 (kg)</label>
                <Input type="number" step="0.1" value={data.weight} onChange={v => set('weight', v)} placeholder="28" />
              </div>
            </div>
            <Row k="毛色" v={<Input value={data.coatColor} onChange={v => set('coatColor', v)} placeholder="如 奶油色" />} />
            <Row k="芯片号" v={<Input value={data.chipNo} onChange={v => set('chipNo', v)} placeholder="可选" />} />
            <Row k="血统编号" v={<Input value={data.pedigreeNo} onChange={v => set('pedigreeNo', v)} placeholder="如 CKU-xxxx" />} />
            <Row k="年龄文本" v={<Input value={data.ageText} onChange={v => set('ageText', v)} placeholder="如 3 岁 5 个月" />} />
          </Group>

          {/* ===== 饲养信息 ===== */}
          <Group title="饲养信息">
            <Row k="到家日期" v={<Input type="date" value={data.arriveDate || ''} onChange={v => set('arriveDate', v)} />} />
            <Row k="绝育" v={<Toggle checked={!!data.neutered} onChange={v => set('neutered', v ? 1 : 0)} />} />
            <Row k="日常主食" v={<Input value={data.stapleFood} onChange={v => set('stapleFood', v)} placeholder="如 皇家 K36 + 鸡胸肉" />} />
          </Group>

          {/* ===== 健康风险 ===== */}
          <Group title="健康风险" tip="仅你与医生可见">
            <Row k="过敏史" v={<Input value={data.allergy} onChange={v => set('allergy', v)} placeholder="如 青霉素、鸡肉蛋白" />} />
            <Row k="慢性病" v={<Input value={data.chronicDisease} onChange={v => set('chronicDisease', v)} />} />
            <Row k="禁忌药物" v={<Input value={data.forbiddenDrugs} onChange={v => set('forbiddenDrugs', v)} />} />
            <Row k="脾气性格" v={<Input value={data.temperament} onChange={v => set('temperament', v)} />} />
            <Row k="应激情况" v={<Input value={data.stress} onChange={v => set('stress', v)} />} />
            <Row k="特殊照料" v={<Textarea value={data.specialCare} onChange={v => set('specialCare', v)} rows={2} />} />
          </Group>
        </div>

        <div className="shrink-0 sticky bottom-0 bg-white border-t border-ink-100 p-4 flex gap-2 justify-end">
          <button onClick={onClose} className="clickable text-sm text-ink-600 px-4 py-2">取消</button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-5 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? '保存中…' : '保存档案'}
          </button>
        </div>
      </div>
    </div>
  )
}
