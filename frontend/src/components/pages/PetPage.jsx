import { useState, useEffect } from 'react'
import { Plus, PawPrint, Trash2, Pencil, Loader2, HeartPulse, X, Camera } from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import PetImg from '../PetImg'
import ImageUpload from '../ImageUpload'
import { api, upload } from '../../api'

const EMPTY = { name: '', species: '狗', breed: '', gender: '公', birthday: '', weight: '', neutered: false, chipNo: '', avatar: '' }
const EMPTY_HEALTH = { type: 'vaccine', name: '', recordDate: '', nextDate: '', note: '' }

export default function PetPage({ logged, onNavigate, onLoginClick }) {
  const [pets, setPets] = useState(null)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [saving, setSaving] = useState(false)
  const [healthRecords, setHealthRecords] = useState([])
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthEditing, setHealthEditing] = useState(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  // OCR 拍照识别健康记录
  const handleOcr = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setOcrLoading(true)
    try {
      const uploadRes = await upload(file)
      if (uploadRes.code !== 200) { alert('图片上传失败'); return }
      const imageUrl = uploadRes.data
      const res = await api.ocrHealthRecord(imageUrl)
      if (res.code === 200 && res.data?.success && res.data.healthData) {
        const d = res.data.healthData
        setHealthEditing(h => ({
          ...h,
          name: d.name || h.name,
          recordDate: d.recordDate?.slice(0, 10) || h.recordDate,
          nextDate: d.nextDate?.slice(0, 10) || h.nextDate,
          note: d.note || h.note,
          type: d.type || h.type,
        }))
        alert('识别成功！请核对并补充信息')
      } else {
        alert(res.data?.message || '识别失败，请手动填写')
      }
    } catch {
      alert('识别失败，请手动填写')
    } finally {
      setOcrLoading(false)
      e.target.value = ''
    }
  }

  const load = async () => {
    setPets(null)
    const res = await api.myPets()
    setPets(res.code === 200 ? res.data || [] : [])
  }
  useEffect(() => { if (logged) load() }, [logged])

  const loadHealth = async (petId) => {
    setHealthLoading(true)
    const res = await api.healthRecords(petId)
    setHealthRecords(res.code === 200 ? res.data || [] : [])
    setHealthLoading(false)
  }

  if (!logged) return (
    <PageShell title="宠物档案" subtitle="建档立享新用户专享洗护券 ¥20" onBack={() => onNavigate('home')}>
      <div className="text-center py-10">
        <PawPrint size={40} className="text-brand-300 mx-auto mb-3" />
        <p className="text-sm text-ink-500 mb-4">登录后为你的爱宠建立专属档案</p>
        <button onClick={onLoginClick} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">登录 / 注册</button>
      </div>
    </PageShell>
  )

  if (pets === null) return (
    <PageShell title="宠物档案" onBack={() => onNavigate('home')}>
      <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 加载中…</div>
    </PageShell>
  )

  const submit = async () => {
    if (!editing.name || !editing.breed) { alert('请填写名字和品种'); return }
    setSaving(true)
    try {
      const body = {
        ...editing,
        gender: editing.gender === '公' ? 1 : 0,
        neutered: editing.neutered ? 1 : 0,
        weight: editing.weight ? Number(editing.weight) : null
      }
      const res = editing.id ? await api.updatePet(editing.id, body) : await api.createPet(body)
      if (res.code === 200) { setEditing(null); load(); return }
      alert(res.msg || '保存失败')
    } catch (e) {
      alert('网络错误，请稍后重试')
      console.error('[PetPage] save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('确认删除该档案？')) return
    const res = await api.deletePet(id)
    if (res.code === 200) { setDetail(null); load() }
    else alert(res.msg || '删除失败')
  }

  const openDetail = (p) => {
    setDetail(p)
    loadHealth(p.id)
  }

  const submitHealth = async () => {
    if (!healthEditing.name || !healthEditing.recordDate) { alert('请填写名称和记录日期'); return }
    const res = await api.createHealthRecord(detail.id, healthEditing)
    if (res.code === 200) {
      setHealthEditing(null)
      loadHealth(detail.id)
    } else alert(res.msg || '保存失败')
  }

  return (
    <PageShell title="宠物档案" subtitle={`已建档 ${pets.length} 只 · 一档一宠，健康全记录`} onBack={() => onNavigate('home')}
      accent="brand">
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing({ ...EMPTY })} className="clickable flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <Plus size={15} /> 新建档案
        </button>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-12">
          <PawPrint size={36} className="text-brand-200 mx-auto mb-3" />
          <p className="text-sm text-ink-500 mb-1">还没有宠物档案</p>
          <p className="text-xs text-ink-400">点上方「新建档案」开始记录爱宠信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map(p => (
            <div key={p.id} onClick={() => openDetail(p)} className="clickable flex items-center gap-3 bg-ink-50 hover:bg-ink-100 rounded-xl p-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-100 shrink-0">
                <PetImg src={p.avatar} alt={p.name} className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-ink-900 truncate">{p.name}</div>
                <div className="text-xs text-ink-500 truncate">{p.breed} · {p.gender === 1 ? '公' : p.gender === 0 ? '母' : p.gender}</div>
                <div className="text-[11px] text-ink-400">{p.weight ? `${p.weight}kg` : '未记录体重'}{p.neutered ? ' · 已绝育' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/**/}
      <DetailModal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? '编辑档案' : '新建档案'} wide
        footer={<>
          <button onClick={() => setEditing(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={submit} disabled={saving} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
            {saving ? '保存中…' : '保存'}
          </button>
        </>}>
        {editing && (
          <div className="space-y-3">
            <Field label="头像"><ImageUpload value={editing.avatar} onChange={url => setEditing({ ...editing, avatar: url })} /></Field>
            <Field label="名字 *"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inp} placeholder="如 圆圆" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="物种"><select value={editing.species} onChange={e => setEditing({ ...editing, species: e.target.value })} className={inp}><option>狗</option><option>猫</option><option>兔</option><option>其他</option></select></Field>
              <Field label="性别"><select value={editing.gender} onChange={e => setEditing({ ...editing, gender: e.target.value })} className={inp}><option>公</option><option>母</option></select></Field>
            </div>
            <Field label="品种 *"><input value={editing.breed} onChange={e => setEditing({ ...editing, breed: e.target.value })} className={inp} placeholder="如 金毛巡回犬" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="生日"><input type="date" value={editing.birthday} onChange={e => setEditing({ ...editing, birthday: e.target.value })} className={inp} /></Field>
              <Field label="体重(kg)"><input type="number" value={editing.weight} onChange={e => setEditing({ ...editing, weight: e.target.value })} className={inp} placeholder="28" /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={!!editing.neutered} onChange={e => setEditing({ ...editing, neutered: e.target.checked })} className="accent-brand-500" /> 已绝育
            </label>
            <Field label="芯片号"><input value={editing.chipNo} onChange={e => setEditing({ ...editing, chipNo: e.target.value })} className={inp} placeholder="可选" /></Field>
          </div>
        )}
      </DetailModal>

      {/**/}
      <DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide
        footer={<>
          <button onClick={() => remove(detail.id)} className="clickable flex items-center gap-1 text-red-500 hover:text-red-600 text-sm px-3 py-2"><Trash2 size={14} /> 删除</button>
          <button onClick={() => { setEditing(detail); setDetail(null) }} className="clickable flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"><Pencil size={14} /> 编辑</button>
        </>}>
        {detail && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Row k="物种/品种" v={`${detail.species} · ${detail.breed}`} />
              <Row k="性别" v={detail.gender === 1 ? '公' : detail.gender === 0 ? '母' : '未知'} />
              <Row k="生日" v={detail.birthday || '未记录'} />
              <Row k="体重" v={detail.weight ? `${detail.weight}kg` : '未记录'} />
              <Row k="绝育" v={detail.neutered ? '已绝育' : '未绝育'} />
              <Row k="芯片号" v={detail.chipNo || '无'} />
            </div>

            <div className="border-t border-ink-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-sm font-bold text-ink-900"><HeartPulse size={16} className="text-health" /> 健康记录</div>
                <button onClick={() => setHealthEditing({ ...EMPTY_HEALTH })} className="clickable text-xs bg-health text-white px-2 py-1 rounded-lg flex items-center gap-0.5"><Plus size={12} /> 新增</button>
              </div>
              {healthLoading ? (
                <div className="text-xs text-ink-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 加载中…</div>
              ) : healthRecords.length === 0 ? (
                <div className="text-xs text-ink-400">暂无健康记录</div>
              ) : (
                <div className="space-y-2">
                  {healthRecords.map(h => (
                    <div key={h.id} className="bg-ink-50 rounded-lg p-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink-900">{h.name}</span>
                        <span className="text-[10px] text-ink-400">{h.recordDate}</span>
                      </div>
                      <div className="text-xs text-ink-500 mt-0.5">类型：{h.type === 'vaccine' ? '疫苗' : h.type === 'deworm' ? '驱虫' : '体检'}</div>
                      {h.nextDate && <div className="text-xs text-health">下次：{h.nextDate}</div>}
                      {h.note && <div className="text-xs text-ink-400 mt-0.5">{h.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailModal>

      {/**/}
      <DetailModal open={!!healthEditing} onClose={() => setHealthEditing(null)} title="新增健康记录" wide
        footer={<>
          <button onClick={() => setHealthEditing(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={submitHealth} className="clickable bg-health hover:bg-health/90 text-white text-sm font-semibold px-5 py-2 rounded-lg">保存</button>
        </>}>
        {healthEditing && (
          <div className="space-y-3">
            {/* OCR 拍照识别 */}
            <div className="relative">
              <label className={`clickable flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-health/30 bg-health/5 text-sm font-semibold text-health hover:bg-health/10 transition ${ocrLoading ? 'opacity-60 pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" capture="environment" onChange={handleOcr} className="absolute inset-0 opacity-0 cursor-pointer" />
                {ocrLoading ? <><Loader2 size={16} className="animate-spin" /> 识别中…</> : <><Camera size={16} /> 拍照识别疫苗本 / 体检报告</>}
              </label>
              <p className="text-[10px] text-ink-400 text-center mt-1">拍照后自动填充，可手动修改</p>
            </div>

            <Field label="类型">
              <select value={healthEditing.type} onChange={e => setHealthEditing({ ...healthEditing, type: e.target.value })} className={inp}>
                <option value="vaccine">疫苗</option>
                <option value="deworm">驱虫</option>
                <option value="checkup">体检</option>
              </select>
            </Field>
            <Field label="名称 *"><input value={healthEditing.name} onChange={e => setHealthEditing({ ...healthEditing, name: e.target.value })} className={inp} placeholder="如 狂犬疫苗" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="记录日期 *"><input type="date" value={healthEditing.recordDate} onChange={e => setHealthEditing({ ...healthEditing, recordDate: e.target.value })} className={inp} /></Field>
              <Field label="下次日期"><input type="date" value={healthEditing.nextDate} onChange={e => setHealthEditing({ ...healthEditing, nextDate: e.target.value })} className={inp} /></Field>
            </div>
            <Field label="备注"><textarea value={healthEditing.note} onChange={e => setHealthEditing({ ...healthEditing, note: e.target.value })} rows={3} className={`${inp} resize-none`} placeholder="可选" /></Field>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}

const inp = 'bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30 w-full'
function Field({ label, children }) { return <div><label className="text-xs font-semibold text-ink-700 block mb-1">{label}</label>{children}</div> }
function Row({ k, v }) { return <div className="flex justify-between py-1.5 border-b border-ink-100 last:border-0"><span className="text-ink-500">{k}</span><span className="text-ink-900 font-medium">{v}</span></div> }
