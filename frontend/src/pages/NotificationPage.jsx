import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, BellOff, ArrowLeft, Loader2, Check, CheckCheck, Heart, MessageCircle, Activity } from 'lucide-react'
import { api } from '../api.js'

/**
 * 消息中心（3 分组）
 * - 健康预警（health）：宠物提醒、疫苗、体检、驱虫等
 * - 私信（private）：来自其他用户的私信
 * - 关注（follow）：其他用户关注你 / 你关注的人发了新内容
 * - 每条卡：actor 头像（无则对应 emoji）+ 标题 + 内容 + 时间
 * - 点单条 markRead；顶部「全部已读」
 */
export default function NotificationPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)   // { health, private, follow, unreadCount }
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const res = await api.messageGrouped()
    if (res.code === 200) setData(res.data || {})
  }, [])

  useEffect(() => { load() }, [load])

  // 监听全局事件：别处标记已读后自动刷新
  useEffect(() => {
    const refresh = () => load()
    window.addEventListener('pethome:notification:refresh', refresh)
    return () => window.removeEventListener('pethome:notification:refresh', refresh)
  }, [load])

  const markRead = async (n) => {
    if (!n || n.isRead === 1 || n.id == null || n.id < 0) return
    await api.markNotificationRead(n.id)
    load()
  }

  const markAll = async () => {
    if (busy) return
    setBusy(true)
    await api.markAllNotificationsRead()
    await load()
    setBusy(false)
  }

  if (!data) return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-ink-500">
      <Loader2 size={16} className="animate-spin inline mr-1" /> 加载中…
    </section>
  )

  const health = data.health || []
  const privates = data.private || []
  const follows = data.follow || []
  const unread = data.unreadCount || 0
  const total = health.length + privates.length + follows.length

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600">
          <ArrowLeft size={15} /> 返回
        </button>
        {unread > 0 && (
          <button onClick={markAll} disabled={busy}
                  className="clickable flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold disabled:opacity-60">
            {busy ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={13} />}
            全部已读
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <Bell size={18} className="text-brand-500" /> 消息中心
          </h1>
          <p className="text-xs text-ink-500 mt-1">
            {unread > 0 ? `${unread} 条未读 · 共 ${total} 条` : `共 ${total} 条`}
          </p>
        </div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-200 p-12 text-center">
          <BellOff size={36} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">暂无消息</p>
          <p className="text-xs text-ink-400 mt-1">健康提醒到期 / 私信 / 新关注会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 健康预警 */}
          <Section
            title="健康预警"
            icon={<Activity size={14} className="text-rose-500" />}
            count={health.length}
            emptyText="最近没有健康预警"
          >
            {health.map(n => (
              <NotifCard key={`h-${n.id}`} n={n} kind="health" onClick={() => markRead(n)} />
            ))}
          </Section>

          {/* 私信 */}
          <Section
            title="私信"
            icon={<MessageCircle size={14} className="text-trust-600" />}
            count={privates.length}
            emptyText="还没有私信"
          >
            {privates.map(n => (
              <NotifCard key={`p-${n.id}`} n={n} kind="private" onClick={() => markRead(n)} />
            ))}
          </Section>

          {/* 关注 */}
          <Section
            title="关注动态"
            icon={<Heart size={14} className="text-pink-500 fill-pink-500" />}
            count={follows.length}
            emptyText="还没有新的关注"
          >
            {follows.map(n => (
              <NotifCard key={`f-${n.id}`} n={n} kind="follow" onClick={() => markRead(n)} />
            ))}
          </Section>
        </div>
      )}
    </section>
  )
}

// ===== 分组壳 =====
function Section({ title, icon, count, emptyText, children }) {
  const hasKids = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        {icon}
        <h2 className="text-sm font-bold text-ink-900 font-display">{title}</h2>
        <span className="text-[10px] text-ink-400 font-semibold">{count}</span>
      </div>
      {hasKids ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-xs text-ink-400">
          {emptyText}
        </div>
      )}
    </div>
  )
}

// ===== 单条通知卡 =====
const KIND_STYLE = {
  health: {
    barUnread:  'bg-rose-500',
    borderUr:   'border-rose-300',
    bgUr:       'bg-rose-50/40',
    avatarBgUr: 'bg-rose-100',
    avatarTxUr: 'text-rose-600',
    badge:      'bg-rose-500 text-white',
    emoji:      '🩺'
  },
  private: {
    barUnread:  'bg-trust-500',
    borderUr:   'border-trust-300',
    bgUr:       'bg-trust-50/40',
    avatarBgUr: 'bg-trust-100',
    avatarTxUr: 'text-trust-600',
    badge:      'bg-trust-500 text-white',
    emoji:      '💬'
  },
  follow: {
    barUnread:  'bg-pink-500',
    borderUr:   'border-pink-300',
    bgUr:       'bg-pink-50/40',
    avatarBgUr: 'bg-pink-100',
    avatarTxUr: 'text-pink-600',
    badge:      'bg-pink-500 text-white',
    emoji:      '💗'
  }
}

function NotifCard({ n, kind, onClick }) {
  const unread = n.isRead !== 1
  const s = KIND_STYLE[kind] || KIND_STYLE.health
  // 头像：有 actor_avatar 显示，否则用 actor_nickname 首字，否则 emoji 兜底
  const hasAvatar = !!n.actorAvatar
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border p-3.5 cursor-pointer transition
        ${unread ? `${s.borderUr} ${s.bgUr}` : 'border-ink-200 hover:border-ink-300'}`}
    >
      {unread && <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${s.barUnread}`} />}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden
          ${unread ? `${s.avatarBgUr} ${s.avatarTxUr}` : 'bg-ink-100 text-ink-400'}`}>
          {hasAvatar
            ? <img src={n.actorAvatar} alt={n.actorNickname || ''} className="w-full h-full object-cover"
                   onError={(e) => { e.currentTarget.style.display = 'none' }} />
            : <span className="text-base">{n.actorNickname ? n.actorNickname.charAt(0).toUpperCase() : s.emoji}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm truncate ${unread ? 'font-bold text-ink-900' : 'font-medium text-ink-700'}`}>
              {n.actorNickname ? n.actorNickname : n.title}
            </span>
            {kind === 'private' && n.actorNickname && (
              <span className="text-[10px] text-ink-400 shrink-0">私信</span>
            )}
          </div>
          <div className={`text-xs mt-0.5 line-clamp-2 ${unread ? 'text-ink-700' : 'text-ink-500'}`}>
            {n.content || n.title}
          </div>
          <div className="text-[10px] text-ink-400 mt-1.5">{fmtTime(n.createTime)}</div>
        </div>
        {unread && (
          <span className={`shrink-0 mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${s.badge}`}>新</span>
        )}
      </div>
    </div>
  )
}

function fmtTime(s) {
  if (!s) return ''
  try {
    const d = new Date(s)
    const now = new Date()
    const diff = (now - d) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
    if (diff < 86400 && d.toDateString() === now.toDateString()) {
      return `今天 ${d.toTimeString().slice(0, 5)}`
    }
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return `昨天 ${d.toTimeString().slice(0, 5)}`
    return `${d.getMonth() + 1}/${d.getDate()} ${d.toTimeString().slice(0, 5)}`
  } catch { return s }
}
