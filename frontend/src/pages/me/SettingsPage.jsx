import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Bell, Shield, Crown, FileText, LogOut, ChevronRight, Info } from 'lucide-react'
import { clearToken } from '../../api.js'
import DetailModal from '../../components/pages/DetailModal.jsx'
import { userEvents } from '../../hooks/userEvents.js'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { onLogout } = useOutletContext() || {}
  const [showAbout, setShowAbout] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleLogout = () => {
    clearToken()
    localStorage.removeItem('pethomeUser')
    userEvents.emit()
    onLogout?.()
    navigate('/')
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={() => navigate('/me')} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回个人中心
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-xl2 p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative">
          <span className="inline-block text-[10px] bg-white/25 px-2 py-0.5 rounded font-semibold">账户设置</span>
          <h1 className="text-xl md:text-2xl font-bold mt-2">设置中心</h1>
          <p className="text-sm opacity-90 mt-1">管理账户、通知、隐私</p>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl2 overflow-hidden mb-4">
        {[
          { icon: Bell, k: '消息通知', v: '已开启', color: 'text-amber-500' },
          { icon: Shield, k: '账户安全', v: '已登录', color: 'text-green-500' },
          { icon: Crown, k: '我的会员', v: 'VIP', color: 'text-amber-500' },
        ].map((r, i) => (
          <Row key={i} icon={<r.icon size={18} className={r.color} />} k={r.k} v={r.v} />
        ))}
      </div>

      <div className="bg-white rounded-xl2 overflow-hidden mb-4">
        <Row icon={<FileText size={18} className="text-ink-500" />} k="用户协议" onClick={() => setShowAgreement(true)} />
        <Row icon={<FileText size={18} className="text-ink-500" />} k="隐私政策" onClick={() => setShowAgreement(true)} />
        <Row icon={<Info size={18} className="text-ink-500" />} k="关于萌宠之家" v="v1.0.0" onClick={() => setShowAbout(true)} />
      </div>

      <button onClick={() => setShowConfirm(true)}
        className="clickable w-full bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
        <LogOut size={14} /> 退出登录
      </button>

      {/* 关于 */}
      <DetailModal open={showAbout} onClose={() => setShowAbout(false)} title="关于萌宠之家">
        <div className="space-y-2 text-sm text-ink-700">
          <p>萌宠之家是一站式养宠平台，提供宠物档案、健康记录、AI 问诊、同城服务、商城、社区等全场景服务。</p>
          <p className="text-xs text-ink-500">版本：v1.0.0 · 个人 vibe coding 全栈模拟项目</p>
          <p className="text-xs text-ink-500">技术栈：Spring Boot 3 + Spring AI · React 18 + Vite + React Router</p>
        </div>
      </DetailModal>

      {/* 协议 */}
      <DetailModal open={showAgreement} onClose={() => setShowAgreement(false)} title="用户协议 / 隐私政策">
        <div className="space-y-2 text-xs text-ink-700 leading-relaxed">
          <p>本项目为个人学习 / 作品集展示用途，所有支付、短信、保险、物流等环节均为模拟实现，未对接真实商户资质。</p>
          <p>· 验证码固定为 1234，请勿用于真实账号。</p>
          <p>· 商城订单为模拟下单，不会真实扣款或发货。</p>
          <p>· 用户数据仅存储于本机 Docker 数据库中。</p>
        </div>
      </DetailModal>

      {/* 退出确认 */}
      <DetailModal open={showConfirm} onClose={() => setShowConfirm(false)} title="确认退出"
        footer={<>
          <button onClick={() => setShowConfirm(false)} className="text-sm text-ink-500 px-4 py-2">取消</button>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">退出</button>
        </>}>
        <p className="text-sm text-ink-700">确认退出当前账号吗？</p>
      </DetailModal>
    </section>
  )
}

function Row({ icon, k, v, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 ${onClick ? 'cursor-pointer hover:bg-ink-50' : ''} border-b border-ink-100 last:border-0`}>
      <span className="text-ink-500">{icon}</span>
      <span className="flex-1 text-sm text-ink-700">{k}</span>
      {v && <span className="text-xs text-ink-400">{v}</span>}
      {onClick && <ChevronRight size={14} className="text-ink-300" />}
    </div>
  )
}
