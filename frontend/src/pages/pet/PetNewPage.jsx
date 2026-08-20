import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { api } from '../../api.js'

const EMPTY = {
  name: '', species: '狗', breed: '', gender: '公', birthday: '', weight: '',
  neutered: 0, chipNo: '', avatar: '',
  // v2 扩展
  coatColor: '', pedigreeNo: '', ageText: '',
  arriveDate: '', stapleFood: '',
  allergy: '', chronicDisease: '', temperament: '',
  stress: '', forbiddenDrugs: '', specialCare: ''
}

// 新建宠物档案 · 简洁表单（无引导/无福利/无大色块）
export default function PetNewPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name) { alert('请填写名字'); return }
    setSaving(true)
    try {
      const body = {
        ...form,
        gender: form.gender === '公' ? 1 : 0,
        neutered: form.neutered ? 1 : 0,
        weight: form.weight ? Number(form.weight) : null
      }
      const res = await api.createPet(body)
      if (res.code === 200) {
        localStorage.setItem('selectedPetId', String(res.data.id))
        navigate(`/pet/${res.data.id}`)
        return
      }
      alert(res.msg || '保存失败')
    } catch (e) {
      // 网络异常 / 后端不可达 / 响应解析失败：给出提示，恢复 loading 状态
      alert('网络错误，请稍后重试')
      console.error('[PetNewPage] createPet failed:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      <div className="bg-white rounded-2xl border border-ink-200 p-6">
        <h1 className="text-lg font-bold text-ink-900 mb-1">新建宠物档案</h1>
        <p className="text-xs text-ink-500 mb-5">基础资料用于日常管理，饲养与风险备注用于个性化提醒</p>

        <div className="space-y-5">
          {/* ============ 基础资料 ============ */}
          <Section title="基础资料">
            <div className="grid grid-cols-2 gap-3">
              <Field label="名字 *" required>
                <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="如 圆圆" />
              </Field>
              <Field label="物种">
                <select className={inp} value={form.species} onChange={e => set('species', e.target.value)}>
                  <option>狗</option><option>猫</option><option>兔</option><option>其他</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="品种">
                <input className={inp} value={form.breed} onChange={e => set('breed', e.target.value)} placeholder="如 金毛" />
              </Field>
              <Field label="性别">
                <select className={inp} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option>公</option><option>母</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="生日">
                <input type="date" className={inp} value={form.birthday} onChange={e => set('birthday', e.target.value)} />
              </Field>
              <Field label="年龄">
                <input className={inp} value={form.ageText} onChange={e => set('ageText', e.target.value)} placeholder="如 3 岁 5 个月" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="体重 (kg)">
                <input type="number" step="0.1" className={inp} value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="28" />
              </Field>
              <Field label="毛色">
                <input className={inp} value={form.coatColor} onChange={e => set('coatColor', e.target.value)} placeholder="如 奶油色" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="芯片号">
                <input className={inp} value={form.chipNo} onChange={e => set('chipNo', e.target.value)} placeholder="可选" />
              </Field>
              <Field label="血统编号">
                <input className={inp} value={form.pedigreeNo} onChange={e => set('pedigreeNo', e.target.value)} placeholder="如 CKU-xxxx" />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-700 pt-1">
              <input type="checkbox" checked={!!form.neutered} onChange={e => set('neutered', e.target.checked ? 1 : 0)} className="accent-brand-500" /> 已绝育
            </label>
          </Section>

          {/* ============ 饲养信息 ============ */}
          <Section title="饲养信息">
            <div className="grid grid-cols-2 gap-3">
              <Field label="到家日期">
                <input type="date" className={inp} value={form.arriveDate} onChange={e => set('arriveDate', e.target.value)} />
              </Field>
              <Field label="日常主食">
                <input className={inp} value={form.stapleFood} onChange={e => set('stapleFood', e.target.value)} placeholder="如 皇家 K36 + 鸡胸肉" />
              </Field>
            </div>
          </Section>

          {/* ============ 重要风险备注 ============ */}
          <Section title="重要风险备注" tip="用于问诊与提醒参考，仅你与医生可见">
            <Field label="过敏史">
              <input className={inp} value={form.allergy} onChange={e => set('allergy', e.target.value)} placeholder="如 青霉素、鸡肉蛋白" />
            </Field>
            <Field label="慢性病">
              <input className={inp} value={form.chronicDisease} onChange={e => set('chronicDisease', e.target.value)} placeholder="如 慢性肾病、髋关节发育不良" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="脾气性格">
                <input className={inp} value={form.temperament} onChange={e => set('temperament', e.target.value)} placeholder="如 温顺 / 怕生 / 护食" />
              </Field>
              <Field label="应激情况">
                <input className={inp} value={form.stress} onChange={e => set('stress', e.target.value)} placeholder="如 雷暴、乘车易呕吐" />
              </Field>
            </div>
            <Field label="禁忌药物">
              <input className={inp} value={form.forbiddenDrugs} onChange={e => set('forbiddenDrugs', e.target.value)} placeholder="如 阿莫西林、某些 NSAIDs" />
            </Field>
            <Field label="特殊照料要求">
              <textarea className={`${inp} resize-none`} rows={2} value={form.specialCare} onChange={e => set('specialCare', e.target.value)} placeholder="如 每日喂药、关节按摩" />
            </Field>
          </Section>

          <button
            onClick={submit}
            disabled={saving}
            className="clickable w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> 保存中…</> : <><Save size={14} /> 保存档案</>}
          </button>
        </div>
      </div>
    </section>
  )
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400'

function Section({ title, tip, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="text-sm font-bold text-ink-900">{title}</div>
        {tip && <div className="text-[11px] text-ink-400">{tip}</div>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-600 block mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
