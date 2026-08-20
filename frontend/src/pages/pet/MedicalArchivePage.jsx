import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, FolderArchive, FileText, Image as ImageIcon, Calendar, Trash2, ZoomIn, Plus, Sparkles, Upload, ScanText, X, Eye } from 'lucide-react'
import { api, upload } from '../../api.js'
import DetailModal from '../../components/pages/DetailModal.jsx'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

const TYPE_LABELS = {
  vaccine: { label: '疫苗本', emoji: '💉', color: '#2EC4B6', bg: 'bg-health-50', text: 'text-health-600' },
  checkup: { label: '体检报告', emoji: '🩺', color: '#8B5CF6', bg: 'bg-purple-50', text: 'text-purple-600' },
  prescription: { label: '处方', emoji: '💊', color: '#EF4444', bg: 'bg-rose-50', text: 'text-rose-600' },
  test: { label: '化验单', emoji: '🧪', color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-600' }
}

const archiveKey = (petId) => `medicalArchive_${petId}`

function loadArchive(petId) {
  try { return JSON.parse(localStorage.getItem(archiveKey(petId)) || '[]') } catch { return [] }
}
function saveArchive(petId, items) { localStorage.setItem(archiveKey(petId), JSON.stringify(items)) }

// 病历归档页 · Claymorphism
export default function MedicalArchivePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [records, setRecords] = useState([])
  const [filter, setFilter] = useState('all')
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setItems(loadArchive(id))
    api.healthRecords(id).then(r => { if (r.code === 200) setRecords(r.data || []) })
  }, [id])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const list = loadArchive(id)
      for (const f of files) {
        const ur = await upload(f)
        if (ur.code === 200) {
          list.unshift({ id: Date.now() + Math.random(), url: ur.data, type: 'checkup', uploadDate: new Date().toISOString().slice(0, 10), name: f.name, ocrText: '' })
        }
      }
      saveArchive(id, list)
      setItems(list)
    } finally { setUploading(false); e.target.value = '' }
  }

  const remove = (mid) => {
    if (!confirm('确认删除？')) return
    const list = items.filter(i => i.id !== mid)
    saveArchive(id, list)
    setItems(list)
  }

  if (items === null) return <CenterLoading />

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(`/pet/${id}`)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-purple-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回宠物详情
      </button>

      {/* Hero（Clay + 极光紫） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-5 text-white shadow-clay">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,#C4B5FD 0%,#8B5CF6 50%,#7C3AED 100%)'
        }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute top-4 right-8 text-6xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.6s' }}>📁</div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> 病历归档
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              病历档案 <span className="text-3xl">📁</span>
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">拍照上传，OCR 自动识别分类</p>
          </div>
        </div>
      </Reveal>

      {/* 统计（Clay 4宫） */}
      <Reveal delay={1} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { value: items.length, label: '病历总数', emoji: '📁', color: 'from-purple-400 to-purple-600' },
          { value: records.length, label: '健康记录', emoji: '📋', color: 'from-health-400 to-health-600' },
          { value: items.filter(i => i.type === 'vaccine').length, label: '疫苗本', emoji: '💉', color: 'from-mint to-teal-500' },
          { value: items.filter(i => i.type === 'checkup').length, label: '体检报告', emoji: '🩺', color: 'from-rose-400 to-pink-600' }
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

      {/* 上传区（Clay 大块） */}
      <Reveal delay={2} className="clay clay-hover p-5 mb-4 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 text-7xl opacity-10" aria-hidden>📷</div>
        <div className="flex items-start gap-3 relative">
          <div className="w-12 h-12 rounded-clay bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-glow text-xl">
            🪄
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-ink-900 font-display mb-1">AI 智能 OCR 识别</h4>
            <p className="text-xs text-ink-600 leading-relaxed mb-3">
              上传病历图片，自动识别关键信息并归类 ✨
            </p>
            <label className="clickable inline-flex items-center gap-1.5 text-xs text-purple-600 font-bold bg-purple-50 px-4 py-2 rounded-full cursor-pointer hover:bg-purple-100 transition shadow-clay-sm">
              <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
              {uploading ? <><Loader2 size={13} className="animate-spin" /> 上传中…</> : <><Upload size={13} /> 上传病历（可多张）</>}
            </label>
          </div>
        </div>
      </Reveal>

      {/* 类型筛选 */}
      <Reveal delay={3} className="clay clay-hover p-3 mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {[{ k: 'all', l: '全部', emoji: '📋' }, ...Object.entries(TYPE_LABELS).map(([k, v]) => ({ k, l: v.label, emoji: v.emoji }))].map(t => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`clickable flex items-center gap-1 whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-bold transition-all shrink-0
              ${filter === t.k
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-glow font-display'
                : 'clay-inset text-ink-700'
              }`}
          >
            <span>{t.emoji}</span>
            <span>{t.l}</span>
          </button>
        ))}
      </Reveal>

      {/* 病历卡片网格 */}
      <Reveal delay={4} className="clay clay-hover p-5 mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-1.5">
          <span className="w-1 h-4 bg-purple-500 rounded-full" />
          归档列表
          <span className="text-xs text-ink-500 font-normal ml-1">({filtered.length})</span>
        </h3>
        {filtered.length === 0 ? (
          <div className="clay-inset text-center py-10">
            <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>📁</div>
            <FolderArchive size={36} className="text-ink-300 mx-auto mb-2" />
            <p className="text-sm text-ink-500">暂无病历归档</p>
            <p className="text-xs text-ink-400 mt-1">上传病历图片开始归档</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((item, i) => {
              const meta = TYPE_LABELS[item.type] || TYPE_LABELS.checkup
              return (
                <div
                  key={item.id}
                  onClick={() => setPreview(item)}
                  className="clay clay-btn overflow-hidden cursor-pointer group"
                >
                  <div className="aspect-square relative overflow-hidden rounded-clay">
                    {item.url ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-400 clay-inset">
                        <ImageIcon size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden />
                    <span className={`absolute top-1.5 left-1.5 text-[10px] px-2 py-0.5 rounded-full font-bold backdrop-blur bg-white/90 ${meta.text}`}>
                      {meta.emoji} {meta.label}
                    </span>
                    <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition">
                      <div className="w-7 h-7 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-clay-sm">
                        <Eye size={13} className="text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <div className="text-xs font-bold text-ink-900 truncate font-display">{item.name}</div>
                    <div className="text-[10px] text-ink-500 mt-0.5 flex items-center gap-1">
                      <Calendar size={9} /> {item.uploadDate}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Reveal>

      {/* 预览弹窗 */}
      <DetailModal open={!!preview} onClose={() => setPreview(null)} title={preview?.name} wide
        footer={<>
          <button
            onClick={() => { remove(preview.id); setPreview(null) }}
            className="clickable clay-btn text-red-500 text-sm px-4 py-2 flex items-center gap-1.5"
          >
            <Trash2 size={14} /> 删除
          </button>
          <button onClick={() => setPreview(null)} className="clickable text-white text-sm font-bold px-5 py-2 rounded-clay shadow-glow font-display"
                  style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
            关闭
          </button>
        </>}>
        {preview && (
          <div>
            {preview.url && (
              <div className="clay-inset p-2 mb-3 rounded-clay">
                <img src={preview.url} alt={preview.name} className="w-full rounded-clay object-contain max-h-[500px]" />
              </div>
            )}
            <div className="clay-inset p-3 text-xs text-ink-600 flex items-center gap-2 flex-wrap">
              <span className="font-bold">类型：</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${TYPE_LABELS[preview.type]?.bg} ${TYPE_LABELS[preview.type]?.text}`}>
                {TYPE_LABELS[preview.type]?.emoji} {TYPE_LABELS[preview.type]?.label}
              </span>
              <span className="text-ink-300">·</span>
              <span>上传日期：{preview.uploadDate}</span>
            </div>
            {preview.ocrText && (
              <div className="mt-3 clay-inset p-3.5">
                <div className="text-xs font-bold text-ink-700 mb-2 flex items-center gap-1.5">
                  <ScanText size={13} className="text-purple-500" /> OCR 识别结果
                </div>
                <div className="text-xs text-ink-600 whitespace-pre-wrap">{preview.ocrText}</div>
              </div>
            )}
          </div>
        )}
      </DetailModal>
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
function CenterLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="clay inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    </div>
  )
}
