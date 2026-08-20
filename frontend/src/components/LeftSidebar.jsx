import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FilePlus2, BellRing, NotebookPen, Heart, History, Settings, PawPrint, Bell, Inbox, User as UserIcon
} from 'lucide-react'
import { api } from '../api.js'
import { userEvents, readCurrentUser } from '../hooks/userEvents.js'

/**
 * 首页"左中"侧悬浮框（居中固定：left-1/2 -translate-x-1/2）
 * - 顶部用户卡：头像 + 昵称（与个人中心同步，未登录显示引导）
 * - 快捷动作列表
 * - 消息入口（带未读小红点，已从 TopNav 迁移过来）
 */
export default function LeftSidebar({ active, logged, onLoginClick }) {
  const navigate = useNavigate()
  const [me, setMe] = useState(() => readCurrentUser())
  const [unread, setUnread] = useState(0)

  // 与 TopNav 同步用户信息
  useEffect(() => {
    setMe(readCurrentUser())
    const off = userEvents.on(() => setMe(readCurrentUser()))
    return off
  }, [logged])

  // 拉取未读消息数
  useEffect(() => {
    let timer = null
    const fetchUnread = async () => {
      try {
        const r = await api.unreadCount()
        if (r && r.code === 200) setUnread(r.data?.count || 0)
      } catch { /* 静默 */ }
    }
    if (logged) {
      fetchUnread()
      timer = setInterval(() => {
        if (!document.hidden) fetchUnread()
      }, 30000)
      const refresh = () => fetchUnread()
      window.addEventListener('pethome:notification:refresh', refresh)
      return () => {
        clearInterval(timer)
        window.removeEventListener('pethome:notification:refresh', refresh)
      }
    } else {
      setUnread(0)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [logged])

  const resolvePath = (p) => {
    if (!p) return null
    if (p.includes('_petId_')) {
      const id = localStorage.getItem('selectedPetId') || ''
      return id ? p.replace('_petId_', id) : '/pet/list'
    }
    return p
  }

  const handle = (it) => {
    if (it.needLogin && !logged) { onLoginClick?.(); return }
    const path = resolvePath(it.path)
    if (path) navigate(path)
  }

  const items = [
    { key: 'msg', label: unread > 0 ? `消息 · ${unread > 99 ? '99+' : unread}` : '消息', icon: Bell, color: '#FF7A59', path: '/notification', needLogin: true, badge: unread > 0 },
    { key: 'myPet', label: '我的档案', icon: FilePlus2, color: '#FF7A59', path: '/pet/list', needLogin: true },
    { key: 'remind', label: '健康提醒', icon: BellRing, color: '#F59E0B', path: '/pet/_petId_/remind', needLogin: true },
    { key: 'note', label: '记事本', icon: NotebookPen, color: '#8B5CF6', path: '/pet/_petId_/note', needLogin: true },
    { key: 'follow', label: '我的关注', icon: Heart, color: '#EC4899', path: '/me/follows', needLogin: true },
    { key: 'history', label: '浏览历史', icon: History, color: '#64748B', path: '/me/history', needLogin: true },
    { key: 'setting', label: '设置', icon: Settings, color: '#94A3B8', path: '/me/settings', needLogin: true }
  ]

  return (
    <aside
      className="hidden lg:block fixed left-3 top-1/2 -translate-y-1/2 z-30"
      style={{ width: 220 }}
    >
      <div className="bg-white/90 backdrop-blur rounded-2xl border border-ink-200 shadow-card p-3 max-h-[80vh] overflow-y-auto hide-scrollbar">
        {/* 顶部用户卡（与个人中心同步） */}
        <div className="flex items-center gap-2 px-2 py-2 mb-2 border-b border-ink-100">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 overflow-hidden flex items-center justify-center shrink-0">
            {me?.avatar ? (
              <img src={me.avatar} alt={me.nickname} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-ink-900 truncate">{me?.nickname || '铲屎官'}</div>
            <div className="text-[10px] text-ink-500 truncate">{logged ? '已登录' : '未登录'}</div>
          </div>
        </div>

        <div className="text-xs font-bold text-ink-900 px-2 mb-1.5 flex items-center gap-1.5">
          <PawPrint size={13} className="text-brand-500" /> 快捷动作
        </div>
        <nav className="space-y-1">
          {items.map((it) => {
            const Icon = it.icon
            const isActive = active === it.key
            return (
              <button
                key={it.key}
                onClick={() => handle(it)}
                className={`clickable w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all
                  ${isActive ? 'bg-brand-500 text-white shadow-card' : 'hover:bg-brand-50 text-ink-700'}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative
                    ${isActive ? 'bg-white/25 text-white' : ''}`}
                  style={!isActive ? { background: `${it.color}1A`, color: it.color } : {}}
                >
                  <Icon size={14} />
                  {it.badge && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </span>
                <span className="text-xs font-medium flex-1 truncate">{it.label}</span>
              </button>
            )
          })}
        </nav>

        {/* 底部小卡：未登录引导 */}
        {!logged && (
          <div className="mt-3 rounded-xl p-3 text-white"
               style={{ background: 'linear-gradient(135deg, #FF7A59 0%, #F2613E 100%)' }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <PawPrint size={12} /> 登录解锁
            </div>
            <div className="text-[11px] opacity-90 mt-1">建档、订单、健康提醒</div>
            <button
              onClick={onLoginClick}
              className="clickable mt-2 w-full text-xs bg-white text-brand-600 font-bold py-1 rounded"
            >
              立即登录
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}