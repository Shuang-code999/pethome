import { useEffect, useRef, useState } from 'react'
import { Stethoscope, HeartPulse, Bone, Eye, Smile, HeartHandshake, AlertCircle, Send, Loader2, Star, MessagesSquare, Plus, ImagePlus, ChevronLeft, Cpu, BookOpen, X, Check } from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import PetImg from '../PetImg'
import { api } from '../../api'
import { departments, doctors } from '../../data/mock.js'

const ICONS = { Stethoscope, HeartPulse, Bone, Eye, Smile, HeartHandshake, AlertCircle }

export default function ConsultPage({ logged, onNavigate, onLoginClick }) {
  const [dept, setDept] = useState(null)
  const [doc, setDoc] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  // 模型选择
  const [models, setModels] = useState([])
  const [defaultModel, setDefaultModel] = useState('qwen-plus')
  const [knowledgeInfo, setKnowledgeInfo] = useState(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [showModelPicker, setShowModelPicker] = useState(false)
  // 知识库管理
  const [showKbPanel, setShowKbPanel] = useState(false)
  const [kbEntries, setKbEntries] = useState([])
  const [kbCategory, setKbCategory] = useState('')
  const [editingKb, setEditingKb] = useState(null)
  // 真实在线医生
  const [realDoctors, setRealDoctors] = useState([])
  const [doctorDepts, setDoctorDepts] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingSlot, setBookingSlot] = useState('')
  const [bookedSlots, setBookedSlots] = useState([])
  const [bookingPetName, setBookingPetName] = useState('')
  const [bookingPetType, setBookingPetType] = useState('猫')
  const [bookingSymptoms, setBookingSymptoms] = useState('')
  const [myAppts, setMyAppts] = useState([])
  const [showMyAppts, setShowMyAppts] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadModels()
    loadDoctors()
  }, [])

  useEffect(() => {
    if (logged) loadSessions()
  }, [logged])

  useEffect(() => {
    if (selectedDept !== undefined) loadDoctors(selectedDept)
  }, [selectedDept])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadModels = async () => {
    const res = await api.consultModels()
    if (res.code === 200) {
      setModels(res.data.models || [])
      setDefaultModel(res.data.defaultModel)
      setSelectedModel(res.data.defaultModel)
      setKnowledgeInfo(res.data.knowledgeBase)
    }
  }

  const loadSessions = async () => {
    setLoadingSessions(true)
    const res = await api.consultSessions()
    setLoadingSessions(false)
    if (res.code === 200) setSessions(res.data || [])
  }

  const loadMessages = async (id) => {
    setMessages([])
    const res = await api.consultMessages(id)
    if (res.code === 200) setMessages(res.data || [])
  }

  const loadKb = async (cat) => {
    const res = await api.knowledgeList(cat)
    if (res.code === 200) setKbEntries(res.data || [])
  }

  const loadDoctors = async (dept) => {
    const [dRes, deptRes] = await Promise.all([
      api.doctorList(dept || ''),
      api.doctorDepartments()
    ])
    if (dRes.code === 200) setRealDoctors(dRes.data || [])
    if (deptRes.code === 200) setDoctorDepts(deptRes.data || [])
  }

  const loadBookedSlots = async (doctorId, date) => {
    if (!doctorId || !date) { setBookedSlots([]); return }
    const res = await api.bookedSlots(doctorId, date)
    if (res.code === 200) setBookedSlots(res.data || [])
  }

  const loadMyAppts = async () => {
    const res = await api.myAppointments()
    if (res.code === 200) setMyAppts(res.data || [])
  }

  useEffect(() => {
    if (showKbPanel) loadKb(kbCategory)
  }, [showKbPanel, kbCategory])

  useEffect(() => {
    if (showMyAppts && logged) loadMyAppts()
  }, [showMyAppts, logged])

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

  const sendText = async () => {
    const text = input.trim()
    if (!text || busy) return
    if (!activeId) {
      const id = await createSession(text.slice(0, 20))
      if (!id) return
    }
    setBusy(true)
    setInput('')
    const targetId = activeId
    const res = await api.sendConsultMessage(targetId, text, selectedModel)
    setBusy(false)
    if (res.code === 200) {
      setMessages(prev => [...prev,
        { role: 'user', content: text, createTime: new Date().toISOString() },
        res.data
      ])
      loadSessions()
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: '发送失败：' + (res.msg || '请重试'), createTime: new Date().toISOString() }])
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

  const sendImage = async () => {
    if (!imageFile || busy) return
    setBusy(true)
    const res = await api.imageConsult(imageFile, input.trim() || undefined, selectedModel)
    setBusy(false)
    setImageFile(null)
    setImagePreview(null)
    setInput('')
    if (res.code === 200) {
      await loadSessions()
      setActiveId(res.data.sessionId)
    } else {
      alert('图片问诊失败：' + (res.msg || '请重试'))
    }
  }

  const saveKb = async () => {
    if (!editingKb?.title?.trim() || !editingKb?.content?.trim()) {
      alert('标题和内容不能为空')
      return
    }
    if (editingKb.id) {
      await api.knowledgeUpdate(editingKb.id, editingKb)
    } else {
      await api.knowledgeCreate(editingKb)
    }
    setEditingKb(null)
    loadKb(kbCategory)
  }

  const submitBooking = async () => {
    if (!bookingDoctor || !bookingDate || !bookingSlot) {
      alert('请选择日期和时段')
      return
    }
    const res = await api.createAppointment({
      doctorId: bookingDoctor.id,
      apptDate: bookingDate,
      apptSlot: bookingSlot,
      userPetName: bookingPetName,
      petType: bookingPetType,
      symptoms: bookingSymptoms
    })
    if (res.code === 200) {
      setBookingDoctor(null)
      setBookingDate('')
      setBookingSlot('')
      setBookingPetName('')
      setBookingSymptoms('')
      loadMyAppts()
      alert('预约成功！请在「我的预约」中完成支付')
      setShowMyAppts(true)
    } else {
      alert('预约失败：' + (res.msg || '请重试'))
    }
  }

  const payAppt = async (id) => {
    const res = await api.payAppointment(id)
    if (res.code === 200) {
      alert('支付成功！医生将在预约时段联系您')
      loadMyAppts()
    } else alert('支付失败：' + (res.msg || ''))
  }

  const cancelAppt = async (id) => {
    if (!confirm('确认取消预约？')) return
    const res = await api.cancelAppointment(id)
    if (res.code === 200) loadMyAppts()
    else alert('取消失败：' + (res.msg || ''))
  }

  const completeAppt = async (id) => {
    const res = await api.completeAppointment(id)
    if (res.code === 200) loadMyAppts()
    else alert('操作失败：' + (res.msg || ''))
  }

  const activeSession = sessions.find(s => s.id === activeId)
  const currentModelName = models.find(m => m.id === selectedModel)?.name || selectedModel

  return (
    <PageShell title="在线问诊" subtitle="AI 医生多轮问诊 · 上传照片初步分诊" onBack={() => onNavigate('home')} accent="health">
      {!logged ? (
        <div className="rounded-xl2 bg-ink-50 p-6 text-center">
          <MessagesSquare size={40} className="mx-auto text-health mb-3" />
          <h2 className="font-bold text-ink-900 mb-1">登录后使用 AI 问诊</h2>
          <p className="text-sm text-ink-500 mb-4">多轮对话记录将保存在你的账户中</p>
          <button onClick={onLoginClick} className="clickable bg-health text-white text-sm font-semibold px-5 py-2 rounded-lg">去登录</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 h-[520px]">
          {/* 会话列表 */}
          <div className={`md:col-span-1 bg-white rounded-xl2 border border-ink-200 flex flex-col overflow-hidden ${activeId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-3 border-b border-ink-100 flex items-center justify-between">
              <span className="font-bold text-ink-900 text-sm">问诊记录</span>
              <button onClick={() => createSession('新的问诊')} className="clickable text-health hover:bg-health/10 p-1.5 rounded">
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingSessions && sessions.length === 0 && (
                <div className="text-center text-xs text-ink-400 py-4">加载中…</div>
              )}
              {sessions.map(s => (
                <button key={s.id} onClick={() => setActiveId(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${activeId === s.id ? 'bg-health/10 text-health font-semibold' : 'hover:bg-ink-50 text-ink-700'}`}>
                  {s.title || '新的问诊'}
                </button>
              ))}
              {sessions.length === 0 && !loadingSessions && (
                <div className="text-center text-xs text-ink-400 py-4">暂无问诊记录</div>
              )}
            </div>
          </div>

          {/* 聊天区 */}
          <div className={`md:col-span-2 bg-white rounded-xl2 border border-ink-200 flex flex-col overflow-hidden ${activeId ? 'flex' : 'hidden md:flex'}`}>
            <div className="p-3 border-b border-ink-100 flex items-center gap-2 flex-wrap">
              {activeId && (
                <button onClick={() => setActiveId(null)} className="md:hidden text-ink-500 hover:text-ink-900">
                  <ChevronLeft size={18} />
                </button>
              )}
              <span className="font-bold text-ink-900 text-sm truncate flex-1">
                {activeSession?.title || '新建问诊'}
              </span>
              {/* 模型选择 */}
              <button onClick={() => setShowModelPicker(true)}
                className="clickable flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-health/10 text-health hover:bg-health/20">
                <Cpu size={11} /> {currentModelName}
              </button>
              {/* 知识库入口 */}
              <button onClick={() => setShowKbPanel(true)}
                className="clickable flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-ink-100 text-ink-600 hover:bg-ink-200">
                <BookOpen size={11} /> 知识库 {knowledgeInfo ? `· ${knowledgeInfo.docCount}篇` : ''}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-ink-50/50">
              {!activeId ? (
                <div className="h-full flex flex-col items-center justify-center text-ink-400 text-sm text-center px-6">
                  <MessagesSquare size={36} className="mb-2 text-health/60" />
                  <p>选择左侧记录继续问诊，或新建会话</p>
                  <p className="text-xs mt-1">也可以上传宠物皮肤/身体照片做图片分诊</p>
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
                    <Loader2 size={14} className="animate-spin" /> AI 思考中…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-ink-100 bg-white">
              {imagePreview && (
                <div className="relative inline-block mb-2">
                  <img src={imagePreview} alt="preview" className="h-16 rounded-lg border border-ink-200" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute -top-1.5 -right-1.5 bg-ink-700 text-white rounded-full p-0.5">
                    <Plus size={10} className="rotate-45" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <label className="clickable flex items-center justify-center w-10 h-10 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 shrink-0 cursor-pointer">
                  <ImagePlus size={18} />
                  <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
                </label>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !imageFile && sendText()}
                  placeholder={imageFile ? '补充描述症状（可选）' : '描述症状，如 我家猫最近不吃饭…'}
                  className="flex-1 bg-ink-50 rounded-lg px-3 py-2 text-sm outline-none border border-ink-200" disabled={busy} />
                {imageFile ? (
                  <button onClick={sendImage} disabled={busy}
                    className="clickable bg-health hover:bg-health text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm font-semibold disabled:opacity-50">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> 发送</>}
                  </button>
                ) : (
                  <button onClick={sendText} disabled={busy || !input.trim()}
                    className="clickable bg-health hover:bg-health text-white px-4 py-2 rounded-lg flex items-center gap-1 text-sm font-semibold disabled:opacity-50">
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> 问诊</>}
                  </button>
                )}
              </div>
              <p className="text-[10px] text-ink-400 mt-2">基于百炼 qwen-plus + RAG 知识库，仅给建议并提醒及时就医，不开处方。</p>
            </div>
          </div>
        </div>
      )}

      {/* 科室网格 */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-ink-900 mb-3">按科室问诊</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {departments.map(d => {
            const Icon = ICONS[d.icon] || Stethoscope
            return (
              <button key={d.name} onClick={() => setDept(d)}
                className="clickable flex items-center gap-2.5 bg-ink-50 hover:bg-ink-100 rounded-xl p-3 text-left">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: d.color + '1a', color: d.color }}>
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink-900">{d.name}</div>
                  <div className="text-[11px] text-ink-500 truncate">{d.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 真实在线医生 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-ink-900">在线医生（可预约）</h2>
          {logged && (
            <button onClick={() => setShowMyAppts(true)}
              className="clickable text-xs px-3 py-1 rounded-full bg-health/10 text-health hover:bg-health/20">
              我的预约 {myAppts.length > 0 && `(${myAppts.length})`}
            </button>
          )}
        </div>
        {/* 科室筛选 */}
        <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1">
          <button onClick={() => setSelectedDept('')}
            className={`clickable text-xs px-3 py-1 rounded-full whitespace-nowrap ${!selectedDept ? 'bg-health text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
            全部科室
          </button>
          {doctorDepts.map(d => (
            <button key={d} onClick={() => setSelectedDept(d)}
              className={`clickable text-xs px-3 py-1 rounded-full whitespace-nowrap ${selectedDept === d ? 'bg-health text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
              {d}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {realDoctors.length === 0 ? (
            <div className="col-span-full text-center text-sm text-ink-400 py-6">暂无医生</div>
          ) : realDoctors.map(d => (
            <div key={d.id} onClick={() => setBookingDoctor(d)}
              className="clickable bg-white border border-ink-200 hover:border-health hover:shadow-card rounded-xl p-3 flex gap-3 transition-all">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-health/20 shrink-0">
                <PetImg src={d.avatar} alt={d.name} className="w-full h-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-900 truncate">{d.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.online ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-500'}`}>
                    {d.online ? '在线' : '离线'}
                  </span>
                </div>
                <div className="text-[11px] text-ink-500 truncate">{d.title} · {d.dept} · {d.hospital}</div>
                <div className="text-[11px] text-ink-400 truncate mt-0.5">{d.tags}</div>
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-2 text-[11px] text-ink-400">
                    <span className="flex items-center gap-0.5 text-amber-500"><Star size={10} className="fill-amber-500" /> {d.rating}</span>
                    <span>{d.yearsExp}年经验</span>
                    <span>问诊 {d.consultCount}</span>
                  </div>
                  <span className="text-sm font-bold text-health">¥{d.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DetailModal open={!!dept} onClose={() => setDept(null)} title={`${dept?.name} · ${dept?.desc}`}>
        {dept && (
          <div className="space-y-2 text-sm">
            <p className="text-ink-700">{dept.desc} 常见问题可由 AI 医生初步分诊，复杂情况建议线下就医。</p>
            <p className="text-ink-500 text-xs">点击上方「AI 智能问诊」描述症状，或选择推荐医生（mock 预约）。</p>
          </div>
        )}
      </DetailModal>

      <DetailModal open={!!doc} onClose={() => setDoc(null)} title={doc?.name} wide
        footer={<button onClick={() => { alert('预约请求已发送（模拟）'); setDoc(null) }} className="clickable bg-health hover:bg-health text-white text-sm font-semibold px-4 py-2 rounded-lg">预约问诊</button>}>
        {doc && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-health/20"><PetImg src={doc.avatar} className="w-full h-full" /></div>
              <div>
                <div className="font-bold text-ink-900">{doc.name}</div>
                <div className="text-xs text-ink-500">{doc.title}</div>
                <div className="text-xs text-amber-500 flex items-center gap-0.5 mt-1"><Star size={11} className="fill-amber-500" /> {doc.rating} · 问诊 {doc.consults}</div>
              </div>
            </div>
            <div className="text-sm text-ink-700">擅长：{doc.tags}</div>
            <p className="text-xs text-ink-400 mt-2">预约后由医生在线回复（mock，真实问诊需医疗资质）。</p>
          </div>
        )}
      </DetailModal>

      {/* 预约医生 */}
      <DetailModal open={!!bookingDoctor} onClose={() => setBookingDoctor(null)} title={`预约 ${bookingDoctor?.name}`} wide
        footer={<>
          <button onClick={() => setBookingDoctor(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={submitBooking} disabled={!bookingDate || !bookingSlot} className="clickable bg-health hover:bg-health/90 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-50">提交预约</button>
        </>}>
        {bookingDoctor && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-ink-100">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-health/20 shrink-0"><PetImg src={bookingDoctor.avatar} className="w-full h-full" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900 text-sm">{bookingDoctor.name} · {bookingDoctor.title}</div>
                <div className="text-xs text-ink-500">{bookingDoctor.dept} · {bookingDoctor.hospital}</div>
                <div className="text-xs text-ink-400 mt-0.5">擅长：{bookingDoctor.tags}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-500 text-xs flex items-center gap-0.5"><Star size={11} className="fill-amber-500" />{bookingDoctor.rating}</span>
                  <span className="text-xs text-ink-400">{bookingDoctor.yearsExp}年经验</span>
                  <span className="ml-auto text-base font-bold text-health">¥{bookingDoctor.price}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">宠物名称</label>
                <input value={bookingPetName} onChange={e => setBookingPetName(e.target.value)} className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="如 圆圆" />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">宠物类型</label>
                <select value={bookingPetType} onChange={e => setBookingPetType(e.target.value)} className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none">
                  <option>猫</option><option>狗</option><option>兔子</option><option>仓鼠</option><option>鹦鹉</option><option>其他</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">症状描述</label>
              <textarea value={bookingSymptoms} onChange={e => setBookingSymptoms(e.target.value)} rows={3} className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none resize-none" placeholder="详细描述宠物的症状、持续时间、用药情况等" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">预约日期</label>
              <input type="date" value={bookingDate} onChange={e => { setBookingDate(e.target.value); setBookingSlot(''); loadBookedSlots(bookingDoctor.id, e.target.value) }}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">选择时段（{bookedSlots.length > 0 ? `${bookedSlots.length} 个时段已被预约` : '全部可选'}）</label>
              <div className="grid grid-cols-4 gap-2">
                {['09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00', '15:00-16:00', '16:00-17:00', '17:00-18:00', '19:00-20:00'].map(slot => {
                  const booked = bookedSlots.includes(slot)
                  return (
                    <button key={slot} disabled={booked || !bookingDate}
                      onClick={() => setBookingSlot(slot)}
                      className={`clickable text-xs px-2 py-2 rounded-lg border transition-colors ${
                        bookingSlot === slot ? 'border-health bg-health text-white' :
                        booked ? 'border-ink-100 bg-ink-50 text-ink-300 cursor-not-allowed line-through' :
                        'border-ink-200 bg-white text-ink-700 hover:border-health'
                      }`}>
                      {slot}
                    </button>
                  )
                })}
              </div>
              {!bookingDate && <p className="text-[11px] text-ink-400 mt-1">请先选择日期</p>}
            </div>
            <div className="bg-health/5 border border-health/20 rounded-lg p-3">
              <p className="text-xs text-ink-600">📋 预约说明：</p>
              <ul className="text-[11px] text-ink-500 mt-1 space-y-0.5">
                <li>• 预约成功后请在 30 分钟内完成支付</li>
                <li>• 医生将在预约时段通过平台回复您</li>
                <li>• 提前 2 小时可取消并全额退款</li>
                <li>• 同一医生同一时段仅可预约一次</li>
              </ul>
            </div>
          </div>
        )}
      </DetailModal>

      {/* 我的预约 */}
      <DetailModal open={showMyAppts} onClose={() => setShowMyAppts(false)} title="我的问诊预约" wide>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {myAppts.length === 0 ? (
            <div className="text-center text-ink-400 text-sm py-8">暂无预约记录</div>
          ) : myAppts.map(a => (
            <div key={a.id} className="bg-ink-50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink-900 text-sm">{a.doctorName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      a.status === 'completed' ? 'bg-green-100 text-green-700' :
                      a.status === 'cancelled' ? 'bg-ink-200 text-ink-500' :
                      a.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {a.status === 'pending' && '待支付'}
                      {a.status === 'confirmed' && '已预约'}
                      {a.status === 'completed' && '已完成'}
                      {a.status === 'cancelled' && '已取消'}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500 mt-1">📅 {a.apptDate} {a.apptSlot}</div>
                  <div className="text-xs text-ink-500">🐾 {a.userPetName || '未命名'} ({a.petType || '未指定'})</div>
                  {a.symptoms && <div className="text-xs text-ink-400 mt-1 line-clamp-2">症状：{a.symptoms}</div>}
                  <div className="text-xs text-health font-bold mt-1">¥{a.amount}</div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {a.status === 'pending' && (
                    <>
                      <button onClick={() => payAppt(a.id)} className="clickable text-xs px-2 py-1 bg-health text-white rounded">支付</button>
                      <button onClick={() => cancelAppt(a.id)} className="clickable text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded">取消</button>
                    </>
                  )}
                  {a.status === 'confirmed' && (
                    <button onClick={() => completeAppt(a.id)} className="clickable text-xs px-2 py-1 bg-ink-700 text-white rounded">确认完成</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DetailModal>

      {/* 模型选择器 */}
      <DetailModal open={showModelPicker} onClose={() => setShowModelPicker(false)} title="选择 AI 模型">
        <div className="space-y-2">
          <p className="text-xs text-ink-500 mb-3">不同模型响应速度与理解深度不同，可根据需要切换。</p>
          {models.map(m => (
            <button key={m.id} onClick={() => { setSelectedModel(m.id); setShowModelPicker(false) }}
              className={`clickable w-full flex items-start gap-3 p-3 rounded-xl text-left border ${selectedModel === m.id ? 'border-health bg-health/5' : 'border-ink-200 hover:bg-ink-50'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selectedModel === m.id ? 'bg-health text-white' : 'bg-ink-100 text-ink-600'}`}>
                <Cpu size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900 text-sm">{m.name}</span>
                  {m.isDefault && <span className="text-[10px] px-1.5 py-0.5 bg-health/10 text-health rounded">默认</span>}
                  {selectedModel === m.id && <Check size={14} className="text-health ml-auto" />}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{m.desc}</p>
                <p className="text-[10px] text-ink-400 mt-0.5 font-mono">{m.id}</p>
              </div>
            </button>
          ))}
          <div className="mt-4 pt-3 border-t border-ink-100">
            <p className="text-[11px] text-ink-400 flex items-start gap-1">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              <span>当前使用百炼 DashScope 兼容模式，无需切换 API Key。所有问诊均结合 RAG 知识库检索，提供专业宠物医疗建议。</span>
            </p>
          </div>
        </div>
      </DetailModal>

      {/* 知识库管理面板 */}
      <DetailModal open={showKbPanel} onClose={() => setShowKbPanel(false)} title="问诊知识库" wide
        footer={
          <button onClick={() => setEditingKb({ category: '养护', title: '', content: '', tags: '' })}
            className="clickable bg-health hover:bg-health/90 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1">
            <Plus size={14} /> 新增条目
          </button>
        }>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {['', '疾病', '养护', '行为', '营养'].map(c => (
              <button key={c || 'all'} onClick={() => setKbCategory(c)}
                className={`clickable text-xs px-3 py-1 rounded-full ${kbCategory === c ? 'bg-health text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {c || '全部'}
              </button>
            ))}
            <span className="text-xs text-ink-400 ml-auto">共 {kbEntries.length} 条</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {kbEntries.length === 0 ? (
              <div className="text-center text-ink-400 text-sm py-8">暂无知识库条目，点击右上角"新增条目"开始</div>
            ) : kbEntries.map(e => (
              <div key={e.id} className="bg-ink-50 rounded-lg p-3 hover:bg-ink-100 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 bg-health/10 text-health rounded">{e.category || '养护'}</span>
                      <span className="font-semibold text-ink-900 text-sm">{e.title}</span>
                    </div>
                    <p className="text-xs text-ink-600 mt-1 line-clamp-2">{e.content}</p>
                    {e.tags && <p className="text-[10px] text-ink-400 mt-1">标签：{e.tags}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingKb(e)}
                      className="clickable text-health hover:bg-health/10 p-1 rounded">
                      编辑
                    </button>
                    <button onClick={async () => { if (confirm('确认删除？')) { await api.knowledgeDelete(e.id); loadKb(kbCategory) } }}
                      className="clickable text-red-500 hover:bg-red-50 p-1 rounded">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {knowledgeInfo && (
            <div className="text-[11px] text-ink-400 pt-2 border-t border-ink-100">
              RAG 已加载 {knowledgeInfo.docCount} 个文档切片，问诊时自动检索 top-{knowledgeInfo.topK} 相关条目。
            </div>
          )}
        </div>
      </DetailModal>

      {/* 编辑条目 */}
      <DetailModal open={!!editingKb} onClose={() => setEditingKb(null)} title={editingKb?.id ? '编辑知识' : '新增知识'} wide
        footer={<>
          <button onClick={() => setEditingKb(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={saveKb} className="clickable bg-health hover:bg-health/90 text-white text-sm font-semibold px-5 py-2 rounded-lg">保存</button>
        </>}>
        {editingKb && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">分类</label>
                <select value={editingKb.category} onChange={e => setEditingKb({ ...editingKb, category: e.target.value })}
                  className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none">
                  <option>疾病</option>
                  <option>养护</option>
                  <option>行为</option>
                  <option>营养</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">标签（逗号分隔）</label>
                <input value={editingKb.tags || ''} onChange={e => setEditingKb({ ...editingKb, tags: e.target.value })}
                  className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="皮肤,过敏,瘙痒" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">标题</label>
              <input value={editingKb.title} onChange={e => setEditingKb({ ...editingKb, title: e.target.value })}
                className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none" placeholder="如 狗狗皮肤过敏的处理方法" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">知识内容</label>
              <textarea value={editingKb.content} onChange={e => setEditingKb({ ...editingKb, content: e.target.value })}
                rows={10} className="w-full bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none resize-none"
                placeholder="详细描述症状、原因、处理方案、就医建议等…" />
            </div>
            <p className="text-[11px] text-ink-400">保存后自动加入向量库，问诊时由 RAG 检索相关条目辅助 AI 回答。</p>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}
