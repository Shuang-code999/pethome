import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Send, Loader2, Plus, ImagePlus, Stethoscope, Phone, Video, MessageSquare, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api.js'
import PetImg from '../../components/PetImg.jsx'
import DetailModal from '../../components/pages/DetailModal.jsx'

const QUICK_REPLIES = ['我家宠物最近精神不好', '呕吐/拉稀', '皮肤问题', '行为异常']

// 图文问诊 — 与 AI 自查复用同一对话能力，但强调"图文消息"形态 + 医生在线选择
export default function ChatConsultPage() {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadDoctors()
    loadSessions()
  }, [])

  useEffect(() => {
    loadDoctors(selectedDept)
  }, [selectedDept])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadDoctors = async (dept) => {
    const [dRes, deptRes] = await Promise.all([
      api.doctorList(dept || ''),
      api.doctorDepartments()
    ])
    if (dRes.code === 200) setDoctors(dRes.data || [])
    if (deptRes.code === 200) setDepartments(deptRes.data || [])
  }

  const loadSessions = async () => {
    const res = await api.consultSessions()
    if (res.code === 200) setSessions(res.data || [])
  }

  const loadMessages = async (id) => {
    setMessages([])
    const res = await api.consultMessages(id)
    if (res.code === 200) setMessages(res.data || [])
  }

  const createSession = async (title) => {
    const res = await api.createConsultSession(title)
    if (res.code === 200) {
      const id = res.data
      await loadSessions()
      setActiveId(id)
      return id
    }
    return null
  }

  const send = async () => {
    const text = input.trim()
    if (busy || (!text && !imageFile)) return
    if (!activeId) {
      const id = await createSession((text || '图文问诊').slice(0, 20))
      if (!id) return
    }
    setBusy(true)
    setInput('')
    const targetId = activeId
    const res = imageFile
      ? await api.imageConsult(imageFile, text || undefined, '')
      : await api.sendConsultMessage(targetId, text, '')
    setBusy(false)
    setImageFile(null); setImagePreview(null)
    if (res.code === 200) {
      if (imageFile) { await loadSessions(); setActiveId(res.data.sessionId) }
      else {
        setMessages(prev => [...prev,
          { role: 'user', content: text, createTime: new Date().toISOString() },
          res.data
        ])
        loadSessions()
      }
    } else {
      alert('发送失败：' + (res.msg || ''))
    }
  }

  const pickImage = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(f)
  }

  const activeSession = sessions.find(s => s.id === activeId)

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-health mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-xl2 p-6 md:p-8 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="relative flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[10px] bg-white/25 backdrop-blur px-2 py-0.5 rounded font-semibold flex items-center gap-1 w-fit">
              <MessageSquare size={10} /> 图文问诊
            </span>
            <h1 className="text-xl md:text-3xl font-bold mt-2 flex items-center gap-2">
              <Stethoscope size={26} /> 在线医师 · 文字图片交流
            </h1>
            <p className="text-sm opacity-90 mt-1.5">认证执业兽医 · 多轮问诊 · 文字 + 图片描述症状</p>
            <div className="grid grid-cols-3 gap-3 mt-4 max-w-md">
              {[
                { num: doctors.length || '50+', label: '认证医师' },
                { num: '30min', label: '平均响应' },
                { num: '4.9★', label: '用户好评' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-2 text-center">
                  <div className="text-lg font-bold">{s.num}</div>
                  <div className="text-[10px] opacity-80">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 科室筛选 */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
        <button onClick={() => setSelectedDept('')}
          className={`clickable text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${!selectedDept ? 'bg-health text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
          全部科室
        </button>
        {departments.map(d => (
          <button key={d} onClick={() => setSelectedDept(d)}
            className={`clickable text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${selectedDept === d ? 'bg-health text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
            {d}
          </button>
        ))}
      </div>

      {/* 医生列表 */}
      <div className="bg-white rounded-xl2 shadow-card p-4 mb-5">
        <h3 className="text-sm font-bold text-ink-900 mb-3">在线医师</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doctors.length === 0 ? (
            <div className="col-span-full text-center text-sm text-ink-400 py-6">暂无医师</div>
          ) : doctors.map(d => (
            <div key={d.id} className="bg-ink-50 hover:bg-health/5 rounded-lg p-3 flex gap-3 transition-colors">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-health/20 shrink-0">
                <PetImg src={d.avatar} alt={d.name} className="w-full h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-900 truncate">{d.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.online ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                    {d.online ? '在线' : '离线'}
                  </span>
                </div>
                <div className="text-[11px] text-ink-500 truncate">{d.title} · {d.dept}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[11px] text-ink-400">{d.yearsExp}年经验</span>
                  <span className="text-sm font-bold text-health">¥{d.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 对话区 */}
      <div className="bg-white rounded-xl2 shadow-card overflow-hidden">
        <div className="p-3 border-b border-ink-100 flex items-center gap-2">
          {activeId && (
            <button onClick={() => setActiveId(null)} className="md:hidden text-ink-500">
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="font-bold text-ink-900 text-sm flex-1 truncate">
            {activeSession?.title || '新建图文问诊'}
          </span>
          <button onClick={() => createSession('新的问诊')} className="clickable text-health hover:bg-health/10 p-1.5 rounded">
            <Plus size={16} />
          </button>
        </div>

        <div className="p-3 space-y-3 bg-ink-50/50 min-h-[260px] max-h-[420px] overflow-y-auto">
          {!activeId ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-400 text-sm text-center py-8">
              <MessageSquare size={36} className="mb-2 text-health/60" />
              <p>点击上方 + 新建图文问诊</p>
              <p className="text-xs mt-1">支持文字 + 图片描述症状，认证医师 30 分钟内回复</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-health text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
                  {m.imageUrl && (
                    <img src={m.imageUrl.startsWith('http') ? m.imageUrl : '/api' + m.imageUrl} alt="问诊图片" className="mb-2 max-h-40 rounded-lg object-cover" />
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))
          )}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-white border border-ink-200 rounded-xl px-3 py-2 text-sm text-ink-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> 医师回复中…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {!activeId && sessions.length > 0 && (
          <div className="p-3 border-t border-ink-100">
            <p className="text-[11px] text-ink-400 mb-2">历史会话：</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {sessions.map(s => (
                <button key={s.id} onClick={() => setActiveId(s.id)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs truncate hover:bg-ink-50 text-ink-700">
                  {s.title || '新的问诊'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-ink-100">
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <img src={imagePreview} alt="preview" className="h-16 rounded-lg border border-ink-200" />
              <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute -top-1.5 -right-1.5 bg-ink-700 text-white rounded-full p-0.5">
                <Plus size={10} className="rotate-45" />
              </button>
            </div>
          )}
          {/* 快捷回复 */}
          <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
            {QUICK_REPLIES.map((q, i) => (
              <button key={i} onClick={() => setInput(q)}
                className="clickable text-[11px] px-2.5 py-1 bg-ink-100 text-ink-600 hover:bg-health/10 hover:text-health rounded-full whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <label className="clickable flex items-center justify-center w-10 h-10 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 shrink-0 cursor-pointer">
              <ImagePlus size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
            </label>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="描述症状，添加图片更准确…"
              className="flex-1 bg-ink-50 rounded-lg px-3 py-2 text-sm outline-none border border-ink-200" disabled={busy} />
            <button onClick={send} disabled={busy || (!input.trim() && !imageFile)}
              className="clickable bg-health hover:bg-health/90 text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm font-semibold disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> 发送</>}
            </button>
          </div>
          <p className="text-[10px] text-ink-400 mt-2">认证医师 30 分钟内响应 · 仅给建议并提醒及时就医，不开处方。</p>
        </div>
      </div>
    </section>
  )
}