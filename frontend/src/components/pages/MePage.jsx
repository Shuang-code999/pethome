import { useState, useEffect } from 'react'
import {
  PawPrint, ShoppingBag, Wallet, Heart, Users, Bell, Settings, LogOut, ChevronRight, Loader2,
  Package, Clock, Calendar, FileText, MessageSquare, Award, MapPin,
  Activity, Sparkles, Crown,
  Pencil, Camera, Shield
} from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import PetImg from '../PetImg'
import { api, clearToken, upload } from '../../api'

const ORDER_STATUS = {
  0: { text: '待支付', color: 'text-amber-600 bg-amber-50' },
  1: { text: '已支付', color: 'text-health bg-health-50' },
  2: { text: '已取消', color: 'text-ink-400 bg-ink-100' },
}

const APPT_STATUS = {
  pending: { text: '待支付', color: 'bg-amber-50 text-amber-700' },
  confirmed: { text: '已预约', color: 'bg-blue-50 text-blue-700' },
  completed: { text: '已完成', color: 'bg-green-50 text-green-700' },
  cancelled: { text: '已取消', color: 'bg-ink-100 text-ink-500' },
}

export default function MePage({ logged, onNavigate, onLoginClick, onLogout }) {
  const [user, setUser] = useState(null)
  const [pets, setPets] = useState(null)
  const [orders, setOrders] = useState(null)
  const [appts, setAppts] = useState([])
  const [followees, setFollowees] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [showOrders, setShowOrders] = useState(false)
  const [showAppts, setShowAppts] = useState(false)
  const [showFollowees, setShowFollowees] = useState(false)
  const [showMyPosts, setShowMyPosts] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [orderFilter, setOrderFilter] = useState('all')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nickname: '', avatar: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  useEffect(() => {
    if (!logged) return
    loadMe()
    loadPets()
    loadOrders()
    loadAppts()
    loadFollowees()
  }, [logged])

  useEffect(() => {
    if (user) loadMyPosts()
  }, [user])

  const loadMe = async () => {
    const res = await api.me()
    if (res.code === 200) {
      setUser(res.data)
      try { localStorage.setItem('pethomeUser', JSON.stringify(res.data)) } catch {}
    }
  }

  const loadPets = async () => {
    const res = await api.myPets()
    setPets(res.code === 200 ? res.data || [] : [])
  }

  const loadOrders = async () => {
    const res = await api.myOrders()
    setOrders(res.code === 200 ? res.data || [] : [])
  }

  const loadAppts = async () => {
    const res = await api.myAppointments()
    if (res.code === 200) setAppts(res.data || [])
  }

  const loadFollowees = async () => {
    const res = await api.followees()
    if (res.code === 200) setFollowees(res.data || [])
  }

  const loadMyPosts = async () => {
    if (!user) return
    const res = await api.feed('latest', 0, 50, '')
    if (res.code === 200) {
      const mine = (res.data || []).filter(p => p.userId === user.id)
      setMyPosts(mine)
    }
  }

  if (!logged) {
    return (
      <PageShell title="个人中心" onBack={() => onNavigate('home')}>
        <div className="text-center py-12">
          <PawPrint size={48} className="text-brand-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500 mb-4">登录后查看个人中心</p>
          <button onClick={onLoginClick} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-2.5 rounded-lg">登录 / 注册</button>
        </div>
      </PageShell>
    )
  }

  const logout = () => {
    clearToken()
    localStorage.removeItem('pethomeUser')
    onLogout && onLogout()
    onNavigate('home')
  }

  const cancelOrder = async (orderNo) => {
    if (!confirm('确认取消该订单？')) return
    const res = await api.cancelOrder(orderNo)
    if (res.code === 200) loadOrders()
    else alert(res.msg || '取消失败')
  }

  const cancelAppt = async (id) => {
    if (!confirm('确认取消预约？')) return
    const res = await api.cancelAppointment(id)
    if (res.code === 200) loadAppts()
    else alert(res.msg || '取消失败')
  }

  const openEdit = () => {
    setEditForm({ nickname: user?.nickname || '', avatar: user?.avatar || '' })
    setEditOpen(true)
  }

  const onAvatarChange = async (file) => {
    if (!file) return
    setAvatarUploading(true)
    try {
      const r = await upload(file)
      if (r.code === 200) setEditForm(f => ({ ...f, avatar: r.data }))
      else alert('头像上传失败')
    } finally {
      setAvatarUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!editForm.nickname.trim()) { alert('昵称不能为空'); return }
    if (editForm.nickname.trim().length > 32) { alert('昵称不能超过 32 字符'); return }
    setSavingProfile(true)
    const res = await api.updateMe(editForm)
    setSavingProfile(false)
    if (res.code === 200) {
      setUser(res.data)
      try { localStorage.setItem('pethomeUser', JSON.stringify(res.data)) } catch {}
      setEditOpen(false)
    } else alert(res.msg || '保存失败')
  }

  // 统计
  const orderPending = orders?.filter(o => o.status === 0).length || 0
  const orderPaid = orders?.filter(o => o.status === 1).length || 0
  const petCount = pets?.length || 0
  const apptUpcoming = appts.filter(a => a.status === 'confirmed' || a.status === 'pending').length

  // 订单二级页
  if (showOrders) {
    const filtered = orderFilter === 'all' ? (orders || [])
      : orderFilter === 'pending' ? (orders || []).filter(o => o.status === 0)
      : orderFilter === 'paid' ? (orders || []).filter(o => o.status === 1)
      : (orders || []).filter(o => o.status === 2)
    return (
      <PageShell title="我的订单" onBack={() => setShowOrders(false)} accent="brand">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { k: 'all', l: '全部' }, { k: 'pending', l: '待支付' },
            { k: 'paid', l: '已支付' }, { k: 'cancelled', l: '已取消' }
          ].map(t => (
            <button key={t.k} onClick={() => setOrderFilter(t.k)}
              className={`clickable text-xs px-3 py-1.5 rounded-full whitespace-nowrap ${
                orderFilter === t.k ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600'
              }`}>{t.l}</button>
          ))}
        </div>
        {orders === null ? (
          <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10">
            <Package size={36} className="text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-500">暂无订单</p>
            <button onClick={() => onNavigate('mall')} className="clickable mt-4 bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">去商城逛逛</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(o => (
              <div key={o.id} className="bg-white rounded-xl2 shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-ink-400 font-mono">{o.orderNo}</span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${ORDER_STATUS[o.status]?.color}`}>{ORDER_STATUS[o.status]?.text}</span>
                </div>
                <div className="text-sm font-semibold text-ink-900">{o.subject}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-brand-600 font-bold">¥{o.amount}</span>
                  <span className="text-[11px] text-ink-400 flex items-center gap-0.5"><Clock size={10} /> {o.createTime?.replace('T', ' ').slice(0, 16)}</span>
                </div>
                {o.status === 0 && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => cancelOrder(o.orderNo)} className="clickable text-xs text-ink-500 hover:text-red-500 border border-ink-200 px-3 py-1 rounded-lg">取消订单</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageShell>
    )
  }

  // 预约二级页
  if (showAppts) {
    return (
      <PageShell title="我的问诊预约" onBack={() => setShowAppts(false)} accent="health">
        {appts.length === 0 ? (
          <div className="text-center py-10">
            <Calendar size={36} className="text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-500">暂无预约</p>
            <button onClick={() => onNavigate('consult')} className="clickable mt-4 bg-health text-white text-sm font-semibold px-5 py-2 rounded-lg">去预约</button>
          </div>
        ) : (
          <div className="space-y-3">
            {appts.map(a => (
              <div key={a.id} className="bg-white rounded-xl2 shadow-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-ink-900">{a.doctorName}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${APPT_STATUS[a.status]?.color || 'bg-ink-100'}`}>
                    {APPT_STATUS[a.status]?.text || a.status}
                  </span>
                </div>
                <div className="text-xs text-ink-600">📅 {a.apptDate} {a.apptSlot}</div>
                <div className="text-xs text-ink-600 mt-1">🐾 {a.userPetName || '未命名'} ({a.petType || '未指定'})</div>
                {a.symptoms && <div className="text-xs text-ink-500 mt-1 line-clamp-2">症状：{a.symptoms}</div>}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink-100">
                  <span className="text-health font-bold">¥{a.amount}</span>
                  <div className="flex gap-2">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={async () => { const r = await api.payAppointment(a.id); if (r.code === 200) loadAppts() }} className="clickable text-xs bg-health text-white px-3 py-1 rounded">支付</button>
                        <button onClick={() => cancelAppt(a.id)} className="clickable text-xs text-red-500 border border-red-200 px-3 py-1 rounded">取消</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    )
  }

  // 我的关注二级页
  if (showFollowees) {
    return (
      <PageShell title="我的关注" onBack={() => setShowFollowees(false)} accent="indigo">
        {followees.length === 0 ? (
          <div className="text-center py-10">
            <Users size={36} className="text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-500 mb-3">还没有关注任何人</p>
            <button onClick={() => { setShowFollowees(false); onNavigate('community') }} className="clickable bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">去社区逛逛</button>
          </div>
        ) : (
          <div className="space-y-2">
            {followees.map(u => (
              <div key={u.id} className="bg-white rounded-xl shadow-card p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-ink-100 shrink-0">
                  {u.avatar ? <PetImg src={u.avatar} className="w-full h-full" /> : <span className="w-full h-full flex items-center justify-center text-ink-400 text-sm font-bold">{u.nickname?.[0] || '宠'}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-900 text-sm truncate">{u.nickname}</div>
                  <div className="text-[11px] text-ink-400 truncate">{u.phone}</div>
                </div>
                <button onClick={async () => { await api.unfollow(u.id); loadFollowees() }}
                  className="clickable text-xs text-ink-500 hover:text-brand-600 border border-ink-200 px-3 py-1 rounded-lg">取消关注</button>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    )
  }

  // 我的帖子二级页
  if (showMyPosts) {
    return (
      <PageShell title="我的帖子" onBack={() => setShowMyPosts(false)} accent="purple">
        {myPosts.length === 0 ? (
          <div className="text-center py-10">
            <FileText size={36} className="text-ink-200 mx-auto mb-3" />
            <p className="text-sm text-ink-500 mb-3">还没有发过帖子</p>
            <button onClick={() => { setShowMyPosts(false); onNavigate('community') }} className="clickable bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">去社区发帖</button>
          </div>
        ) : (
          <div className="space-y-2">
            {myPosts.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-card p-3">
                <div className="font-semibold text-ink-900 text-sm line-clamp-1">{p.title}</div>
                <div className="text-xs text-ink-500 line-clamp-2 mt-1">{p.body}</div>
                <div className="flex items-center gap-3 text-[11px] text-ink-400 mt-2">
                  <span>❤️ {p.likes}</span>
                  <span>💬 {p.comments}</span>
                  <span className="ml-auto">{p.createTime?.replace('T', ' ').slice(0, 16)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    )
  }

  return (
    <PageShell title="个人中心" onBack={() => onNavigate('home')} accent="brand">
      {/* 用户信息卡 */}
      <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 rounded-xl2 p-5 mb-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        <div className="relative flex items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 backdrop-blur shrink-0 flex items-center justify-center ring-2 ring-white/40">
            {user?.avatar ? <PetImg src={user.avatar} className="w-full h-full" /> : <span className="text-2xl font-bold text-white">{(user?.nickname || '宠')[0]}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-white truncate">{user?.nickname || '宠友'}</span>
              <button onClick={openEdit} className="clickable text-[10px] px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded flex items-center gap-0.5">
                <Pencil size={9} /> 编辑
              </button>
              <span className="text-[10px] px-1.5 py-0.5 bg-amber-400 text-white rounded flex items-center gap-0.5 font-bold">
                <Crown size={10} /> VIP
              </span>
            </div>
            <div className="text-xs text-white/80 mt-0.5 truncate">{user?.phone || ''}</div>
          </div>
          <button onClick={logout} className="clickable flex items-center gap-1 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur">
            <LogOut size={13} /> 退出
          </button>
        </div>
        <div className="relative grid grid-cols-4 gap-2 mt-4">
          {[
            { label: '宠物', val: petCount },
            { label: '订单', val: orders?.length || 0 },
            { label: '预约', val: appts.length },
            { label: '关注', val: followees.length }
          ].map((s, i) => (
            <div key={i} className="text-center bg-white/10 backdrop-blur rounded-lg py-2">
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 首次登录改名提示 */}
      {user?.nickname && /^宠友\d+$/.test(user.nickname) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl2 p-3 mb-4 flex items-center gap-3">
          <Sparkles size={18} className="text-amber-500 shrink-0" />
          <div className="flex-1 text-xs text-ink-700">欢迎来到萌宠之家，给自己起个好听的名字吧～</div>
          <button onClick={openEdit} className="clickable bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-1 rounded-lg">去改名</button>
        </div>
      )}

      {/* 我的订单 + 我的预约（横排卡片） */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div onClick={() => setShowOrders(true)}
          className="clickable bg-white border border-ink-200 hover:border-brand-500 rounded-xl2 p-3 transition-all cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-700">我的订单</span>
            <ChevronRight size={14} className="text-ink-400" />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              待支付 {orderPending}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-health rounded-full"></span>
              已付款 {orderPaid}
            </span>
          </div>
        </div>
        <div onClick={() => setShowAppts(true)}
          className="clickable bg-white border border-ink-200 hover:border-health rounded-xl2 p-3 transition-all cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-700">问诊预约</span>
            <ChevronRight size={14} className="text-ink-400" />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              进行中 {apptUpcoming}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-ink-300 rounded-full"></span>
              共 {appts.length}
            </span>
          </div>
        </div>
      </div>

      {/* 我的宠物 */}
      <div className="bg-white rounded-xl2 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900">我的宠物</h3>
          <button onClick={() => onNavigate('pet')} className="clickable text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
            管理 <ChevronRight size={12} />
          </button>
        </div>
        {pets === null ? (
          <div className="flex items-center gap-2 text-ink-500 text-xs py-4 justify-center"><Loader2 size={12} className="animate-spin" /> 加载中…</div>
        ) : pets.length === 0 ? (
          <div className="text-center py-4">
            <PawPrint size={28} className="text-ink-200 mx-auto mb-1" />
            <p className="text-xs text-ink-500 mb-2">还没有宠物档案</p>
            <button onClick={() => onNavigate('pet')} className="clickable text-xs bg-brand-500 text-white px-3 py-1 rounded-lg">立即创建</button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pets.slice(0, 5).map(p => (
              <div key={p.id} className="shrink-0 w-16 text-center">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-ink-100 mb-1 mx-auto">
                  {p.avatar ? <PetImg src={p.avatar} className="w-full h-full" /> : <PawPrint className="w-full h-full p-3 text-ink-400" />}
                </div>
                <div className="text-xs text-ink-900 truncate">{p.name}</div>
                <div className="text-[10px] text-ink-400">{p.species}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 功能九宫格（去掉保险；改为账户相关） */}
      <div className="bg-white rounded-xl2 p-4 mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3">常用功能</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { icon: MessageSquare, label: 'AI问诊', color: '#2EC4B6', nav: 'consult' },
            { icon: Activity, label: '健康记录', color: '#F59E0B', nav: 'pet' },
            { icon: MapPin, label: '同城服务', color: '#EC4899', nav: 'service' },
            { icon: ShoppingBag, label: '爱宠商城', color: '#10B981', nav: 'mall' },
            { icon: Users, label: '我的关注', color: '#6366F1', action: () => setShowFollowees(true) },
            { icon: Heart, label: '我的收藏', color: '#EC4899', action: () => alert('「我的收藏」开发中') },
            { icon: Wallet, label: '我的钱包', color: '#2EC4B6', action: () => alert('「我的钱包」开发中') },
            { icon: FileText, label: '我的帖子', color: '#8B5CF6', action: () => setShowMyPosts(true) },
            { icon: Shield, label: '账户安全', color: '#EF4444', action: () => setShowSettings(true) },
            { icon: Settings, label: '账户设置', color: '#6B7280', action: () => setShowSettings(true) },
          ].map((e, i) => (
            <button key={i} onClick={() => e.nav ? onNavigate(e.nav) : e.action()}
              className="clickable flex flex-col items-center gap-1.5 py-1">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform hover:scale-110" style={{ background: e.color + '1a', color: e.color }}>
                <e.icon size={20} />
              </span>
              <span className="text-[11px] text-ink-700">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VIP 权益 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl2 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-amber-500" />
          <span className="text-sm font-bold text-amber-700">VIP 专属权益</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded-lg p-2">
            <div className="text-amber-600 font-bold text-sm">8 折</div>
            <div className="text-[10px] text-ink-500">问诊优惠</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="text-amber-600 font-bold text-sm">免邮</div>
            <div className="text-[10px] text-ink-500">商城配送</div>
          </div>
          <div className="bg-white rounded-lg p-2">
            <div className="text-amber-600 font-bold text-sm">5 次</div>
            <div className="text-[10px] text-ink-500">免费 AI 问诊</div>
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="bg-white rounded-xl2 overflow-hidden">
        {[
          { icon: Bell, label: '消息通知', color: 'text-amber-500', action: () => alert('「消息通知」开发中') },
          { icon: Award, label: '邀请好友', color: 'text-brand-500', action: () => alert('「邀请好友」开发中') },
          { icon: Settings, label: '账户设置', color: 'text-ink-500', action: () => setShowSettings(true) },
          { icon: FileText, label: '隐私与协议', color: 'text-ink-500', action: () => setShowSettings(true) },
        ].map((e, i) => (
          <div key={i} onClick={e.action}
            className="clickable flex items-center gap-3 p-3 hover:bg-ink-50 border-b border-ink-100 last:border-b-0 cursor-pointer">
            <e.icon size={18} className={e.color} />
            <span className="flex-1 text-sm text-ink-700">{e.label}</span>
            <ChevronRight size={16} className="text-ink-400" />
          </div>
        ))}
      </div>

      {/* 编辑资料 */}
      <DetailModal open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料" wide
        footer={<>
          <button onClick={() => setEditOpen(false)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={saveProfile} disabled={savingProfile} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
            {savingProfile ? '保存中…' : '保存'}
          </button>
        </>}>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-ink-100 ring-2 ring-brand-100">
              {editForm.avatar ? <PetImg src={editForm.avatar} className="w-full h-full" /> : <PawPrint className="w-full h-full p-4 text-ink-400" />}
            </div>
            <label className={`clickable text-xs bg-ink-100 hover:bg-ink-200 text-ink-700 px-3 py-1.5 rounded-lg flex items-center gap-1 ${avatarUploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={e => onAvatarChange(e.target.files?.[0])} />
              <Camera size={12} /> {avatarUploading ? '上传中…' : '更换头像'}
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">昵称 *</label>
            <input value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
              maxLength={32} className="bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30 w-full" placeholder="给自己起个名字" />
          </div>
        </div>
      </DetailModal>

      {/* 设置 */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} user={user} onLogout={logout} />
    </PageShell>
  )
}

function SettingsModal({ open, onClose, user, onLogout }) {
  const [showAbout, setShowAbout] = useState(false)
  const [showAgreement, setShowAgreement] = useState(false)

  return (
    <>
      <DetailModal open={open} onClose={onClose} title="账户设置" wide
        footer={<button onClick={onClose} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">完成</button>}>
        <div className="space-y-1">
          <Row icon={<Bell size={18} />} k="消息通知" v="已开启" />
          <Row icon={<Shield size={18} />} k="账户安全" v="已登录" />
          <Row icon={<Crown size={18} />} k="我的会员" v="VIP" />
          <Row icon={<FileText size={18} />} k="用户协议" onClick={() => setShowAgreement(true)} />
          <Row icon={<FileText size={18} />} k="隐私政策" onClick={() => setShowAgreement(true)} />
          <Row icon={<FileText size={18} />} k="关于萌宠之家" v="v1.0.0" onClick={() => setShowAbout(true)} />
        </div>
        <button onClick={onLogout}
          className="clickable mt-4 w-full bg-red-50 hover:bg-red-100 text-red-500 text-sm font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2">
          <LogOut size={14} /> 退出登录
        </button>
      </DetailModal>

      <DetailModal open={showAbout} onClose={() => setShowAbout(false)} title="关于萌宠之家">
        <div className="space-y-2 text-sm text-ink-700">
          <p>萌宠之家是一站式养宠平台，提供宠物档案、健康记录、AI 问诊、同城服务、商城、社区等全场景服务。</p>
          <p className="text-xs text-ink-500">版本：v1.0.0 · 个人 vibe coding 全栈模拟项目</p>
          <p className="text-xs text-ink-500">技术栈：Spring Boot 3 + Spring AI · React 18 + Vite</p>
        </div>
      </DetailModal>

      <DetailModal open={showAgreement} onClose={() => setShowAgreement(false)} title="用户协议 / 隐私政策">
        <div className="space-y-2 text-xs text-ink-700 leading-relaxed">
          <p>本项目为个人学习 / 作品集展示用途，所有支付、短信、保险、物流等环节均为模拟实现，未对接真实商户资质。</p>
          <p>· 验证码固定为 1234，请勿用于真实账号。</p>
          <p>· 商城订单为模拟下单，不会真实扣款或发货。</p>
          <p>· 用户数据仅存储于本机 Docker 数据库中。</p>
          <p>· 宠物保险模块已下线。</p>
        </div>
      </DetailModal>
    </>
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