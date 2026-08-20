import { useState, useRef } from 'react'
import { chatStream } from '../api.js'
import { PawPrint, X, Send, Loader2, Sparkles } from 'lucide-react'

const SUGGESTIONS = [
  '我家猫最近不吃饭怎么办？',
  '金毛 3 岁正常体重是多少？',
  '狂犬疫苗多久打一次？',
  '猫咪可以吃葡萄吗？'
]

export default function CustomerServiceWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [msgs, setMsgs] = useState([
    { role: 'bot', text: '你好呀～我是萌宠之家智能客服小萌 🐾\n养宠问题、平台功能都可以问我！' }
  ])
  const cancelRef = useRef(null)
  const listRef = useRef(null)

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    }, 20)
  }

  const send = (text) => {
    const msg = (text ?? input).trim()
    if (!msg || busy) return
    setInput('')
    setBusy(true)
    setMsgs((m) => [...m, { role: 'user', text: msg }, { role: 'bot', text: '', streaming: true }])
    scrollToBottom()

    let acc = ''
    cancelRef.current = chatStream(
      msg,
      (chunk) => {
        acc += chunk
        setMsgs((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'bot', text: acc, streaming: true }
          return copy
        })
        scrollToBottom()
      },
      () => {
        setBusy(false)
        setMsgs((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'bot', text: acc || '（无回复）', streaming: false }
          return copy
        })
      },
      () => {
        setBusy(false)
        setMsgs((m) => {
          const copy = [...m]
          copy[copy.length - 1] = { role: 'bot', text: acc || '连接出错了，请稍后重试', streaming: false, error: true }
          return copy
        })
      }
    )
  }

  const close = () => {
    if (cancelRef.current) cancelRef.current()
    setOpen(false)
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="clickable fixed bottom-20 right-4 md:bottom-6 z-50 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-hover flex items-center justify-center bounce-soft"
          aria-label="智能客服"
        >
          <PawPrint size={26} />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-health text-[10px] flex items-center justify-center">
            <Sparkles size={10} />
          </span>
        </button>
      )}

      {/* 对话面板 */}
      {open && (
        <div className="fixed bottom-20 right-4 md:bottom-6 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[560px] bg-white rounded-xl2 shadow-hover flex flex-col overflow-hidden fade-in">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                <PawPrint size={18} />
              </div>
              <div>
                <div className="text-sm font-bold">小萌 · 智能客服</div>
                <div className="text-[10px] opacity-90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" /> 在线 · AI 驱动
                </div>
              </div>
            </div>
            <button onClick={close} className="clickable p-1 rounded hover:bg-white/20">
              <X size={18} />
            </button>
          </div>

          {/* 消息列表 */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-ink-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0 mr-2 mt-auto">
                    <PawPrint size={14} />
                  </div>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words
                  ${m.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : m.error
                      ? 'bg-red-50 text-red-600 rounded-bl-sm'
                      : 'bg-white text-ink-900 shadow-card rounded-bl-sm'}`}>
                  {m.streaming && !m.text ? (
                    <span className="flex items-center gap-1 text-ink-500">
                      <Loader2 size={13} className="animate-spin" /> 思考中…
                    </span>
                  ) : m.text}
                  {m.streaming && m.text && (
                    <span className="inline-block w-1.5 h-4 ml-0.5 bg-brand-500 align-middle animate-pulse" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 建议快捷问 */}
          {msgs.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="clickable text-[11px] bg-brand-50 hover:bg-brand-100 text-brand-600 px-2 py-1 rounded-full">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <div className="p-3 border-t border-ink-100 flex items-center gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="描述你的养宠问题…"
              className="flex-1 bg-ink-100 rounded-full px-4 py-2 text-sm outline-none focus:bg-ink-300/30"
              disabled={busy}
            />
            <button
              onClick={() => send()}
              disabled={busy || !input.trim()}
              className="clickable w-9 h-9 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
