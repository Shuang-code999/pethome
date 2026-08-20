import { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Loader2, PawPrint, ShoppingBag, Wallet, Heart, Users, Bell, Settings, LogOut, ChevronRight, Package, Clock, Crown, Sparkles, Pencil, Camera, Shield, MessageSquare, FileText, Activity, MapPin, Stethoscope, MessageCircle } from 'lucide-react'
import { api, clearToken, upload } from '../../api.js'
import PetImg from '../../components/PetImg.jsx'
import DetailModal from '../../components/pages/DetailModal.jsx'
import { petEvents } from '../../hooks/petEvents.js'
import { userEvents, readCurrentUser } from '../../hooks/userEvents.js'

export default function MePage() {
  const navigate = useNavigate()
  const { onLogout } = useOutletContext() || {}
  const [user, setUser] = useState(() => readCurrentUser())  // 立即读取 localStorage，避免首屏空白
  const [pets, setPets] = useState([])
  const [orders, setOrders] = useState([])
  const [appts, setAppts] = useState([])
  const [followees, setFollowees] = useState([])
  const [myPosts, setMyPosts] = useState([])
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ nickname: '', avatar: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { load() }, [])

  // 宠物档案变更时重新拉取（保证其它页面删/新增后这边立即一致）
  useEffect(() => {
    const off = petEvents.on(async () => {
      const ps = await api.myPets(); setPets(ps.code === 200 ? ps.data || [] : [])
    })
    return off
  }, [])

  // 用户资料变更时同步刷新（昵称/头像改了，立即生效）
  useEffect(() => {
    const off = userEvents.on(() => {
      const cached = readCurrentUser()
      if (cached) setUser(cached)
    })
    return off
  }, [])

  const load = async () => {
    const me = await api.me()
    if (me.code === 200) {
      setUser(me.data)
      // 同步 localStorage，触发全局 user:refresh 让 TopNav/LeftSidebar 一起刷新
      try { localStorage.setItem('pethomeUser', JSON.stringify(me.data)) } catch {}
      userEvents.emit()
    }
    const ps = await api.myPets(); setPets(ps.code === 200 ? ps.data || [] : [])
    const os = await api.myOrders(); setOrders(os.code === 200 ? os.data || [] : [])
    const ap = await api.myAppointments(); setAppts(ap.code === 200 ? ap.data || [] : [])
    const fs = await api.followees(); setFollowees(fs.code === 200 ? fs.data || [] : [])
    const fp = await api.feed('latest', 0, 50, '')
    if (fp.code === 200) setMyPosts((fp.data || []).filter(p => p.userId === me.data?.id))
  }

  const logout = () => {
    if (!confirm('确认退出登录？')) return
    clearToken()
    localStorage.removeItem('pethomeUser')
    userEvents.emit()
    onLogout?.()
    navigate('/')
  }

  const openEdit = () => {
    setEditForm({ nickname: user?.nickname || '', avatar: user?.avatar || '' })
    setEditOpen(true)
  }

  const saveProfile = async () => {
    if (!editForm.nickname.trim()) { alert('昵称不能为空'); return }
    setSaving(true)
    try {
      const res = await api.updateMe(editForm)
      if (res.code === 200) {
        setUser(res.data)
        // 关键：把最新 user 同时写入 localStorage + 广播 refresh 事件，
        // 这样 TopNav、LeftSidebar、个人中心的所有展示位都能立即拿到新昵称/头像，
        // 不会出现「个人中心改了名字但页面其它地方还显示宠友XXXXX」的问题。
        try { localStorage.setItem('pethomeUser', JSON.stringify(res.data)) } catch {}
        userEvents.emit()
        setEditOpen(false)
        return
      }
      alert(res.msg || '保存失败')
    } catch (e) {
      alert('网络错误，请稍后重试')
      console.error('[MePage] updateMe failed:', e)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Loader2 size={20} className="animate-spin inline mr-2" />加载中…</div>

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      {/* 用户信息卡 */}
      <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-600 rounded-xl2 p-5 mb-5 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative flex items-center gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 backdrop-blur shrink-0 flex items-center justify-center ring-2 ring-white/40">
            {user.avatar ? <PetImg src={user.avatar} className="w-full h-full" /> :
              <span className="text-2xl font-bold text-white">{(user.nickname || '宠')[0]}</span>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-white truncate">{user.nickname || '宠友'}</span>
              <button onClick={openEdit} className="clickable text-[10px] px-1.5 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded flex items-center gap-0.5">
                <Pencil size={9} /> 编辑
              </button>
            </div>
            <div className="text-xs text-white/80 mt-0.5 truncate">{user.phone || ''}</div>
          </div>
          <button onClick={logout} className="clickable flex items-center gap-1 text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur">
            <LogOut size={13} /> 退出
          </button>
        </div>
        <div className="relative grid grid-cols-4 gap-2 mt-4">
          {[
            { label: '宠物', val: pets.length, path: '/pet/list' },
            { label: '订单', val: orders.length, path: '/me/orders' },
            { label: '预约', val: appts.length, path: '/consult/records' },
            { label: '关注', val: followees.length, path: '/me/follows' },
          ].map((s, i) => (
            <div key={i} onClick={() => navigate(s.path)}
              className="clickable text-center bg-white/10 backdrop-blur rounded-lg py-2 cursor-pointer hover:bg-white/20">
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-[10px] text-white/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 订单 + 预约横排 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div onClick={() => navigate('/me/orders')}
          className="clickable bg-white border border-ink-200 hover:border-brand-500 rounded-xl2 p-3 transition-all cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-700">我的订单</span>
            <ChevronRight size={14} className="text-ink-400" />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span>待支付 {orders.filter(o => o.status === 0).length}</span>
            <span>已付款 {orders.filter(o => o.status === 1).length}</span>
          </div>
        </div>
        <div onClick={() => navigate('/consult/records')}
          className="clickable bg-white border border-ink-200 hover:border-health rounded-xl2 p-3 transition-all cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-700">问诊预约</span>
            <ChevronRight size={14} className="text-ink-400" />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-500">
            <span>进行中 {appts.filter(a => a.status === 'confirmed' || a.status === 'pending').length}</span>
            <span>共 {appts.length}</span>
          </div>
        </div>
      </div>

      {/* 我的宠物 */}
      <div className="bg-white rounded-xl2 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900">我的宠物</h3>
          <button onClick={() => navigate('/pet/list')} className="clickable text-xs text-brand-600 hover:text-brand-700 flex items-center gap-0.5">
            管理 <ChevronRight size={12} />
          </button>
        </div>
        {pets.length === 0 ? (
          <div className="text-center py-4">
            <PawPrint size={28} className="text-ink-200 mx-auto mb-1" />
            <p className="text-xs text-ink-500 mb-2">还没有宠物档案</p>
            <button onClick={() => navigate('/pet/list')} className="clickable text-xs bg-brand-500 text-white px-3 py-1 rounded-lg">立即创建</button>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {pets.slice(0, 5).map(p => (
              <div key={p.id} onClick={() => navigate(`/pet/${p.id}`)}
                className="shrink-0 w-16 text-center cursor-pointer">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-ink-100 mb-1 mx-auto ring-2 ring-brand-100">
                  {p.avatar ? <PetImg src={p.avatar} className="w-full h-full" /> : <PawPrint className="w-full h-full p-3 text-ink-400" />}
                </div>
                <div className="text-xs text-ink-900 truncate">{p.name}</div>
                <div className="text-[10px] text-ink-400">{p.species}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 常用功能：6 项 grid-cols-3 */}
      <div className="bg-white rounded-xl2 p-4 mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3">常用功能</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Stethoscope, label: 'AI问诊', color: '#2EC4B6', path: '/consult/ai' },
            { icon: Activity, label: '健康记录', color: '#F59E0B', path: '/pet/list' },
            { icon: MapPin, label: '同城服务', color: '#EC4899', path: '/service/bath' },
            { icon: ShoppingBag, label: '爱宠商城', color: '#10B981', path: '/mall' },
            { icon: Users, label: '我的关注', color: '#6366F1', path: '/me/follows' },
            { icon: Heart, label: '浏览记录', color: '#64748B', path: '/me/history' },
          ].map((e, i) => (
            <button key={i} onClick={() => navigate(e.path)}
              className="clickable flex flex-col items-center gap-1.5 py-2">
              <span className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: e.color + '1A', color: e.color }}>
                <e.icon size={22} />
              </span>
              <span className="text-xs text-ink-700">{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 设置列表（已删除「消息通知」项） */}
      <div className="bg-white rounded-xl2 overflow-hidden">
        {[
          { icon: Settings, label: '账户设置', color: 'text-ink-500', path: '/me/settings' },
          { icon: Shield, label: '账户安全', color: 'text-rose-500', path: '/me/settings' },
        ].map((e, i) => (
          <div key={i} onClick={() => navigate(e.path)}
            className="clickable flex items-center gap-3 p-3 hover:bg-ink-50 border-b border-ink-100 last:border-b-0 cursor-pointer">
            <e.icon size={18} className={e.color} />
            <span className="flex-1 text-sm text-ink-700">{e.label}</span>
            <ChevronRight size={16} className="text-ink-400" />
          </div>
        ))}
      </div>

      {/* 编辑资料弹窗 */}
      <DetailModal open={editOpen} onClose={() => setEditOpen(false)} title="编辑资料" wide
        footer={<>
          <button onClick={() => setEditOpen(false)} className="text-sm text-ink-500 px-4 py-2">取消</button>
          <button onClick={saveProfile} disabled={saving} className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
            {saving ? '保存中…' : '保存'}
          </button>
        </>}>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-ink-100 ring-2 ring-brand-100">
              {editForm.avatar ? <PetImg src={editForm.avatar} className="w-full h-full" /> : <PawPrint className="w-full h-full p-4 text-ink-400" />}
            </div>
            <label className={`clickable text-xs bg-ink-100 hover:bg-ink-200 text-ink-700 px-3 py-1.5 rounded-lg flex items-center gap-1 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <input type="file" accept="image/*" className="hidden" onChange={async e => {
                const f = e.target.files?.[0]; if (!f) return
                setUploading(true)
                const r = await upload(f)
                if (r.code === 200) setEditForm(p => ({ ...p, avatar: r.data }))
                setUploading(false)
              }} />
              <Camera size={12} /> {uploading ? '上传中…' : '更换头像'}
            </label>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-700 block mb-1">昵称 *</label>
            <input value={editForm.nickname} onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
              maxLength={32} className="bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30 w-full" />
          </div>
        </div>
      </DetailModal>
    </section>
  )
}
