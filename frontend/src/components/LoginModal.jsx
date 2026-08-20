import { useState, useEffect, useRef } from 'react'
import { X, Phone, ArrowRight, Loader2 } from 'lucide-react'
import { api, setToken } from '../api.js'

export default function LoginModal({ open, onClose, onLogin }) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000)
    }
    return () => clearTimeout(timerRef.current)
  }, [countdown])

  if (!open) return null

  const isPhone = (v) => /^1[3-9]\d{9}$/.test(v)

  const sendCode = async () => {
    if (!isPhone(phone)) return
    setLoading(true)
    const res = await api.sendSmsCode(phone)
    setLoading(false)
    if (res.code === 200) {
      setSent(true)
      setCountdown(60)
    } else {
      alert(res.msg || '验证码发送失败')
    }
  }

  const submit = async () => {
    if (!code || code.length < 4) { alert('请输入验证码'); return }
    if (!sent) { alert('请先获取验证码'); return }
    setLoading(true)
    const res = await api.loginByPhone(phone, code)
    setLoading(false)
    if (res.code === 200 && res.data?.token) {
      setToken(res.data.token)
      onLogin(res.data.user)
      setSent(false); setPhone(''); setCode(''); setCountdown(0)
    } else {
      alert(res.msg || '登录失败')
    }
  }

  const canSend = isPhone(phone)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl2 shadow-hover w-full max-w-sm p-6 fade-in">
        <button onClick={onClose} className="clickable absolute top-3 right-3 text-ink-500 hover:text-ink-900">
          <X size={18} />
        </button>
        <div className="text-xl font-bold text-ink-900 mb-1">欢迎来萌宠之家</div>
        <div className="text-sm text-ink-500 mb-4">登录后体验完整功能</div>

        {/* 手机号输入 */}
        <label className="text-xs font-semibold text-ink-700">手机号</label>
        <div className="flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-2.5 mt-1 mb-3">
          <Phone size={16} className="text-ink-500" />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号"
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>

        {/* 验证码输入 */}
        <label className="text-xs font-semibold text-ink-700">验证码</label>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入验证码"
            className="bg-ink-100 rounded-lg px-3 py-2.5 text-sm outline-none flex-1"
          />
          <button
            onClick={sendCode}
            disabled={!canSend || countdown > 0 || loading}
            className="clickable shrink-0 text-xs font-semibold px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '...' : countdown > 0 ? `${countdown}s` : sent ? '重新发送' : '获取验证码'}
          </button>
        </div>

        {sent && (
          <div className="text-xs text-health bg-health-50 rounded px-2 py-1 mb-3">
            短信验证码已发送，请查收手机
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="clickable w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1 mt-2 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>登录 / 注册 <ArrowRight size={16} /></>}
        </button>

        <div className="text-[11px] text-ink-500 text-center mt-3">
          登录即同意《用户协议》《隐私政策》
        </div>
      </div>
    </div>
  )
}
