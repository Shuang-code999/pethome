import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, PawPrint, Pencil, HeartPulse, TrendingUp, FolderArchive, BellRing, NotebookPen, Trash2, Sparkles, Calendar, Weight, Scissors, IdCard, Cake, ChevronRight, Edit, Heart } from 'lucide-react'
import { api } from '../../api.js'
import { recordHistory } from '../../hooks/browsingHistory.js'
import PetImg from '../../components/PetImg.jsx'
import DetailModal from '../../components/pages/DetailModal.jsx'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 宠物详情页 · Claymorphism + 大头贴卡
export default function PetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pet, setPet] = useState(null)
  const [records, setRecords] = useState([])
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // 浏览记录：进入宠物详情即记录
  useEffect(() => {
    if (!pet || !pet.id) return
    recordHistory({
      type: 'pet',
      id: pet.id,
      title: pet.name || '宠物档案',
      image: pet.avatar,
      path: `/pet/${pet.id}`,
    })
  }, [pet])

  useEffect(() => { load() }, [id])

  const load = async () => {
    // 先拉宠物档案（这一项成功才能渲染页面）
    try {
      const res = await api.petDetail(id)
      if (res && res.code === 200) {
        setPet(res.data)
      } else if (res && res.code === 404) {
        setPet(false)  // 标记不存在 → 渲染"宠物不存在"提示
      } else {
        setPet(false)
        console.warn('[PetDetailPage] petDetail 异常:', res)
      }
    } catch (e) {
      console.error('[PetDetailPage] petDetail 失败:', e)
      setPet(false)  // 不卡在 null → 显示"加载失败/宠物不存在"
    }
    // 健康记录独立加载，失败不影响宠物档案显示
    try {
      const hr = await api.healthRecords(id)
      if (hr && hr.code === 200) setRecords(hr.data || [])
    } catch (e) {
      console.warn('[PetDetailPage] healthRecords 失败:', e)
    }
  }

  const doRemove = async () => {
    setConfirmDelete(false)
    try {
      const res = await api.deletePet(id)
      if (res && res.code === 200) {
        navigate('/pet/list')
      } else {
        alert((res && res.msg) || '删除失败')
      }
    } catch (e) {
      console.error('[PetDetailPage] deletePet 失败:', e)
      alert('网络错误，请稍后重试')
    }
  }

  if (pet === null) return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="clay inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    </div>
  )

  if (!pet) return (
    <Reveal className="clay text-center py-16 relative overflow-hidden mx-auto max-w-page mt-6">
      <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>🐾</div>
      <p className="text-sm text-ink-500 mb-3">宠物不存在或已删除</p>
      <button onClick={() => navigate('/pet/list')} className="clickable btn-brand text-xs font-bold px-5 py-2 rounded-full">
        返回列表
      </button>
    </Reveal>
  )

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate('/pet/list')} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-brand-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回宠物列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* 左侧大头像卡（Clay） */}
        <Reveal className="clay clay-hover p-5 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 text-7xl opacity-10" aria-hidden>{pet.species?.includes('猫') ? '🐱' : '🐶'}</div>

          {/* 头像 */}
          <div className="relative aspect-square rounded-claylg overflow-hidden bg-gradient-to-br from-brand-100 via-peach to-rose">
            <PetImg src={pet.avatar} alt={pet.name} className="w-full h-full" fallbackText={pet.name?.[0] || '🐾'} />
            <div className="absolute top-3 right-3 glass rounded-full px-2.5 py-1 flex items-center gap-1 text-xs text-ink-900 font-bold">
              <Sparkles size={11} className="text-brand-500" /> 我的毛孩子
            </div>
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shadow-clay-sm
                ${pet.gender === 1 ? 'bg-sky text-trust-600' : 'bg-rose text-pink-600'}`}>
                {pet.gender === 1 ? '♂ 公' : '♀ 母'}
              </span>
              {pet.neutered && (
                <span className="text-xs bg-gradient-to-r from-health-400 to-health-600 text-white font-bold px-2.5 py-1 rounded-full shadow-clay-sm">
                  ✂️ 已绝育
                </span>
              )}
            </div>
          </div>

          {/* 名字 + 品种 */}
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-extrabold text-ink-900 font-display">{pet.name}</h1>
            <p className="text-sm text-ink-500 mt-1">{pet.species} · {pet.breed}</p>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">{pet.age || '— 岁'}</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">🎂 {pet.birthday?.slice(0, 10) || '生日未记录'}</span>
            </div>
          </div>

          {/* 信息卡（Clay inset） */}
          <div className="mt-4 clay-inset p-3 space-y-2 text-sm">
            {[
              { icon: '⚖️', k: '体重', v: pet.weight ? `${pet.weight} kg` : '未记录', color: 'text-amber-600' },
              { icon: '🎂', k: '生日', v: pet.birthday || '未记录', color: 'text-pink-600' },
              { icon: '✂️', k: '绝育', v: pet.neutered ? '已绝育' : '未绝育', color: 'text-health-600' },
              { icon: '🆔', k: '芯片号', v: pet.chipNo || '无', color: 'text-trust-600' }
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-ink-500 text-xs flex items-center gap-1.5">
                  <span>{row.icon}</span> {row.k}
                </span>
                <span className={`text-xs font-bold ${row.color}`}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setEditing(pet)}
              className="clickable flex-1 py-2.5 rounded-clay text-xs font-bold text-white shadow-glow font-display flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
            >
              <Pencil size={12} /> 编辑档案
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="clickable flex-1 clay clay-hover py-2.5 rounded-clay text-xs font-bold text-red-500 font-display flex items-center justify-center gap-1.5"
            >
              <Trash2 size={12} /> 删除
            </button>
          </div>
        </Reveal>

        {/* 右侧功能区 */}
        <div className="space-y-4">
          {/* 快捷入口（Clay 九宫） */}
          <Reveal delay={1} className="clay clay-hover p-5">
            <h3 className="text-base font-bold text-ink-900 mb-4 font-display flex items-center gap-2">
              <span className="w-1 h-5 bg-brand-500 rounded-full" /> 快捷功能
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[
                { icon: HeartPulse, label: '健康记录', emoji: '💗', color: '#2EC4B6', bg: '#E6FAF8', path: `/pet/${id}/health`, count: records.length },
                { icon: TrendingUp, label: '体重曲线', emoji: '📈', color: '#F59E0B', bg: '#FEF3C7', path: `/pet/${id}/weight` },
                { icon: FolderArchive, label: '病历归档', emoji: '📁', color: '#8B5CF6', bg: '#EDE9FE', path: `/pet/${id}/medical` },
                { icon: BellRing, label: '健康提醒', emoji: '🔔', color: '#EF4444', bg: '#FEE2E2', path: `/pet/${id}/remind` },
                { icon: NotebookPen, label: '记事本', emoji: '📓', color: '#06B6D4', bg: '#CFFAFE', path: `/pet/${id}/note` }
              ].map((f, i) => (
                <button
                  key={i}
                  onClick={() => navigate(f.path)}
                  className="clickable flex flex-col items-center gap-1.5 p-3.5 clay-btn group relative"
                >
                  <div className="w-14 h-14 rounded-clay flex items-center justify-center text-2xl shadow-clay-sm transition-transform group-hover:animate-bounce-soft"
                       style={{ background: f.bg }}>
                    {f.emoji}
                  </div>
                  <span className="text-xs text-ink-700 font-bold">{f.label}</span>
                  {f.count > 0 && (
                    <span className="absolute top-1 right-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-glow">
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </Reveal>

          {/* 健康摘要（Clay 三宫卡片） */}
          <Reveal delay={2} className="grid grid-cols-3 gap-3">
            {[
              { value: records.filter(r => r.type === 'vaccine').length, label: '疫苗', emoji: '💉', color: 'from-health-400 to-health-600' },
              { value: records.filter(r => r.type === 'deworm').length, label: '驱虫', emoji: '🐛', color: 'from-amber-400 to-orange-500' },
              { value: records.filter(r => r.type === 'checkup').length, label: '体检', emoji: '🩺', color: 'from-purple-400 to-purple-600' }
            ].map((s, i) => (
              <div key={i} className="clay clay-hover p-4 flex flex-col items-center">
                <div className={`w-12 h-12 rounded-clay bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-clay-sm`}>
                  {s.emoji}
                </div>
                <div className="text-2xl font-extrabold text-ink-900 font-display mt-2">{s.value}</div>
                <div className="text-[10px] text-ink-500 font-semibold">{s.label}次数</div>
              </div>
            ))}
          </Reveal>

          {/* 最近健康记录 */}
          <Reveal delay={3} className="clay clay-hover p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-ink-900 font-display flex items-center gap-2">
                <span className="w-1 h-5 bg-health-500 rounded-full" /> 最近健康记录
              </h3>
              <button
                onClick={() => navigate(`/pet/${id}/health`)}
                className="clickable text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5"
              >
                查看全部 <ChevronRight size={12} />
              </button>
            </div>
            {records.length === 0 ? (
              <div className="clay-inset text-center py-8">
                <PawPrint size={28} className="text-ink-300 mx-auto mb-2" />
                <p className="text-xs text-ink-500 mb-3">还没有健康记录</p>
                <button
                  onClick={() => navigate(`/pet/${id}/health`)}
                  className="clickable text-xs text-health-600 font-bold flex items-center gap-1 mx-auto"
                >
                  <Plus size={12} /> 添加第一条
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {records.slice(0, 3).map(r => {
                  const typeMeta = {
                    vaccine: { emoji: '💉', color: 'bg-health-100 text-health-600', label: '疫苗' },
                    deworm: { emoji: '🐛', color: 'bg-amber-100 text-amber-600', label: '驱虫' },
                    checkup: { emoji: '🩺', color: 'bg-purple-100 text-purple-600', label: '体检' }
                  }[r.type] || { emoji: '📋', color: 'bg-ink-100 text-ink-600', label: '其他' }
                  return (
                    <div key={r.id} className="clay-inset p-3 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-clay ${typeMeta.color} flex items-center justify-center text-xl shadow-clay-sm`}>
                        {typeMeta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-ink-900 truncate">{r.name}</div>
                        <div className="text-[10px] text-ink-500 mt-0.5">
                          {typeMeta.label} · {r.recordDate}
                        </div>
                      </div>
                      {r.nextDate && (
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-ink-400">下次</div>
                          <div className="text-xs text-health-600 font-bold">{r.nextDate}</div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </Reveal>
        </div>
      </div>

      {/* 编辑弹窗 */}
      <DetailModal open={!!editing} onClose={() => setEditing(null)} title="编辑档案" wide
        footer={<>
          <button onClick={() => setEditing(null)} className="clickable clay-btn text-sm text-ink-700 px-4 py-2">取消</button>
          <button
            onClick={async () => {
              const body = { ...editing, gender: editing.gender === 1 || editing.gender === '公' ? 1 : 0, neutered: editing.neutered ? 1 : 0, weight: editing.weight ? Number(editing.weight) : null }
              const res = await api.updatePet(id, body)
              if (res.code === 200) { setEditing(null); load() } else alert(res.msg)
            }}
            className="clickable text-white text-sm font-bold px-5 py-2 rounded-clay shadow-glow font-display"
            style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
          >保存</button>
        </>}>
        {editing && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="名字"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className={inp} /></Field>
              <Field label="品种"><input value={editing.breed} onChange={e => setEditing({ ...editing, breed: e.target.value })} className={inp} /></Field>
              <Field label="体重 (kg)"><input type="number" step="0.1" value={editing.weight || ''} onChange={e => setEditing({ ...editing, weight: e.target.value })} className={inp} /></Field>
              <Field label="芯片号"><input value={editing.chipNo || ''} onChange={e => setEditing({ ...editing, chipNo: e.target.value })} className={inp} /></Field>
            </div>
          </div>
        )}
      </DetailModal>

      {/* 确认删除弹窗 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4 fade-in" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-base font-bold text-ink-900 mb-1">确认删除</div>
            <div className="text-sm text-ink-600 mb-5">
              确认删除「{pet.name}」的档案？此操作不可恢复
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="clickable flex-1 py-2.5 rounded-xl border border-ink-200 text-sm font-semibold text-ink-700">
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

const inp = 'clay-inset w-full px-3 py-2.5 text-sm outline-none focus:bg-ink-50/30 font-semibold text-ink-900 placeholder:text-ink-400 rounded-clay'
function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-bold text-ink-700 block mb-1.5 font-display">{label}</label>
      {children}
    </div>
  )
}
