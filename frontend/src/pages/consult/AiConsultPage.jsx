/**
 * AI 症状自查 · 全屏分栏布局
 *  - 左：问诊记录（窄栏 + 新建按钮）
 *  - 右：对话框（顶部 6 个常见问题 chip；中间消息流；底部输入）
 *  - 默认 qwen-plus
 */
import { useEffect, useRef, useState } from 'react'
import { Send, Loader2, Plus, Cpu, Check, ShieldCheck, X, FileImage, MessageSquare as MessagesSquare, AlertCircle } from 'lucide-react'
import { api } from '../../api.js'
import DetailModal from '../../components/pages/DetailModal.jsx'

const QUICK_PROMPTS = [
  '我家猫最近不吃东西',
  '狗狗一直打喷嚏流鼻涕',
  '猫咪走路一瘸一拐的',
  '狗狗皮肤发红一直挠',
  '猫咪呕吐黄水怎么办',
  '幼犬拉稀带血丝'
]

export default function AiConsultPage() {
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [models, setModels] = useState([])
  const [knowledgeInfo, setKnowledgeInfo] = useState(null)
  const [selectedModel, setSelectedModel] = useState('qwen-plus')
  const [showModelPicker, setShowModelPicker] = useState(false)
  const bottomRef = useRef(null)
  const streamHandleRef = useRef(null)

  useEffect(() => {
    loadModels()
    loadSessions()
    return () => { streamHandleRef.current?.close?.() }
  }, [])

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
      if (res.data.defaultModel) setSelectedModel(res.data.defaultModel)
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
    let targetId = activeId
    if (!targetId) {
      targetId = await createSession(text.slice(0, 20))
      if (!targetId) return
    }
    setBusy(true)
    setInput('')
    // 立刻把用户消息渲染进去
    setMessages(prev => [...prev,
      { role: 'user', content: text, createTime: new Date().toISOString() }
    ])
    // 占位的 assistant 流式气泡（每 chunk 追加）
    const assistantIdx = (await new Promise(r => {
      setMessages(prev => {
        const next = [...prev, { role: 'assistant', content: '', streaming: true, createTime: new Date().toISOString() }]
        r(next.length - 1)
        return next
      })
    }))
    let buffer = ''
    const handle = await api.streamConsultMessage(targetId, text, selectedModel, {
      onChunk: (chunk) => {
        buffer += chunk
        setMessages(prev => prev.map((m, i) =>
          i === assistantIdx ? { ...m, content: buffer } : m
        ))
      },
      onDone: (full) => {
        setMessages(prev => prev.map((m, i) =>
          i === assistantIdx ? { ...m, content: full || buffer, streaming: false } : m
        ))
        setBusy(false)
        loadSessions()
      },
      onError: (err) => {
        setMessages(prev => prev.map((m, i) =>
          i === assistantIdx
            ? { ...m, content: (m.content || '') + '\n\n⚠️ ' + (err || '连接中断，请重试'), streaming: false }
            : m
        ))
        setBusy(false)
      }
    })
    // 卸载时关闭
    streamHandleRef.current = handle
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

  const activeSession = sessions.find(s => s.id === activeId)
  const currentModelName = models.find(m => m.id === selectedModel)?.name || selectedModel

  return (
    <div className="flex h-[calc(100vh-4rem)] fade-in bg-ink-50">
      {/* 左：问诊记录 w-72 */}
      <aside className="hidden md:flex w-72 shrink-0 bg-white border-r border-ink-200 flex-col">
        <div className="p-4 border-b border-ink-100 flex items-center justify-between">
          <span className="font-bold text-ink-900 font-display">AI 问诊室</span>
          <button
            onClick={() => createSession('新的问诊')}
            className="clickable w-8 h-8 rounded-full bg-health-500 hover:bg-health-600 text-white flex items-center justify-center"
          >
            <Plus size={15} strokeWidth={3} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingSessions && sessions.length === 0 && (
            <div className="text-center text-xs text-ink-400 py-4 flex items-center justify-center gap-1">
              <Loader2 size={12} className="animate-spin" /> 加载中…
            </div>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={`clickable w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-all
                ${activeId === s.id
                  ? 'bg-health-50 text-health-700 font-bold'
                  : 'hover:bg-ink-100 text-ink-700'}`}
            >
              {s.title || '新的问诊'}
            </button>
          ))}
          {sessions.length === 0 && !loadingSessions && (
            <div className="text-center text-xs text-ink-400 py-6">
              <MessagesSquare size={28} className="mx-auto mb-2 text-health-300" />
              暂无问诊记录
              <div className="mt-2 text-[10px]">点击 + 开启新会话</div>
            </div>
          )}
        </div>
      </aside>

      {/* 右：聊天主区 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 顶部：标题 + 模型切换 + 常见问题 chip */}
        <div className="bg-white border-b border-ink-200 px-5 py-3">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-bold text-ink-900 text-sm font-display flex-1 min-w-0 truncate">
              {activeSession?.title || 'AI 宠物医生'}
            </span>
            <button
              onClick={() => setShowModelPicker(true)}
              className="clickable flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full bg-ink-100 text-health-700 font-bold"
            >
              <Cpu size={11} /> {currentModelName}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="clickable shrink-0 text-xs px-3 py-1.5 rounded-full bg-ink-100 hover:bg-brand-50 hover:text-brand-600 text-ink-700 font-medium transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 消息流 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-ink-50/30">
          {!activeId ? (
            <div className="h-full flex flex-col items-center justify-center text-ink-400 text-sm text-center px-6">
              <p className="font-semibold text-ink-600 mb-1">开始你的 AI 问诊</p>
              <p className="text-xs text-ink-500 max-w-xs">
                描述宠物症状或上传皮肤/身体照片，AI 医生会结合知识库分析并给出建议
              </p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-1 rounded-full font-bold">仅给建议</span>
                <span className="text-[10px] bg-trust-50 text-trust-600 px-2 py-1 rounded-full font-bold">不开处方</span>
                <span className="text-[10px] bg-health-50 text-health-600 px-2 py-1 rounded-full font-bold">建议就医</span>
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                    ${m.role === 'user'
                      ? 'bg-health-500 text-white rounded-br-md'
                      : 'bg-white text-ink-800 rounded-bl-md'}`}
                  >
                    {m.imageUrl && (
                      <img
                        src={m.imageUrl.startsWith('http') ? m.imageUrl : '/api' + m.imageUrl}
                        alt="问诊图片"
                        className="mb-2 max-h-40 rounded-clay object-cover"
                      />
                    )}
                    <div className="whitespace-pre-wrap">
                      {m.content}
                      {m.streaming && (
                        <span className="inline-block w-1.5 h-3.5 bg-health-500 ml-0.5 align-middle animate-pulse" />
                      )}
                    </div>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-clay-sm text-sm shrink-0">
                      👤
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex items-end gap-2">
                  <div className="bg-white px-3.5 py-2.5 text-sm text-ink-500 flex items-center gap-2 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-health-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-health-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-health-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    AI 思考中…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* 输入区 */}
        <div className="bg-white border-t border-ink-200 px-5 py-3">
          {imagePreview && (
            <div className="relative inline-block mb-2 bg-ink-100 p-1.5 rounded-xl">
              <img src={imagePreview} alt="preview" className="h-16 rounded-clay object-cover" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-clay-sm"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <label className="clickable flex items-center justify-center w-11 h-11 rounded-xl bg-ink-100 hover:bg-ink-200 text-health-600 shrink-0 cursor-pointer transition">
              <FileImage size={18} />
              <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
            </label>
            <div className="flex-1 bg-ink-100 rounded-xl px-3 py-1">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !imageFile && sendText()}
                placeholder={imageFile ? '补充描述症状（可选）' : '描述症状，如 我家猫最近不吃饭…'}
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400 py-1.5"
                disabled={busy}
              />
            </div>
            {imageFile ? (
              <button
                onClick={sendImage}
                disabled={busy}
                className="clickable px-4 h-11 rounded-xl text-white font-bold text-sm flex items-center gap-1.5 bg-health-500 hover:bg-health-600"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> 发送</>}
              </button>
            ) : (
              <button
                onClick={sendText}
                disabled={busy || !input.trim()}
                className="clickable px-4 h-11 rounded-xl text-white font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 bg-health-500 hover:bg-health-600"
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : <><Send size={14} /> 问诊</>}
              </button>
            )}
          </div>
          <p className="text-[10px] text-ink-400 mt-2 flex items-center gap-1">
            <ShieldCheck size={10} className="text-health-500" /> 基于百炼 qwen-plus + RAG 知识库 · 仅给建议并提醒及时就医，不开处方
          </p>
        </div>
      </main>

      {/* 模型选择器 */}
      <DetailModal open={showModelPicker} onClose={() => setShowModelPicker(false)} title="选择 AI 模型">
        <div className="space-y-2">
          <p className="text-xs text-ink-500 mb-3">不同模型响应速度与理解深度不同，可根据需要切换。</p>
          {models.map(m => (
            <button
              key={m.id}
              onClick={() => { setSelectedModel(m.id); setShowModelPicker(false) }}
              className={`clickable w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all
                ${selectedModel === m.id ? 'bg-health-50 ring-2 ring-health-400' : 'bg-ink-100 hover:bg-ink-200'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${selectedModel === m.id ? 'bg-health-500 text-white' : 'bg-white text-ink-600'}`}>
                <Cpu size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900 text-sm">{m.name}</span>
                  {m.isDefault && <span className="text-[10px] px-2 py-0.5 bg-health-500 text-white rounded-full font-bold">默认</span>}
                  {selectedModel === m.id && <Check size={14} className="text-health-600 ml-auto" />}
                </div>
                <p className="text-xs text-ink-500 mt-0.5">{m.desc}</p>
              </div>
            </button>
          ))}
          <div className="mt-4 pt-3 border-t border-ink-100">
            <p className="text-[11px] text-ink-500 flex items-start gap-1.5 leading-relaxed">
              <AlertCircle size={12} className="mt-0.5 shrink-0 text-amber-500" />
              <span>所有问诊均结合 RAG 知识库检索，提供专业宠物医疗建议。</span>
            </p>
          </div>
        </div>
      </DetailModal>
    </div>
  )
}

