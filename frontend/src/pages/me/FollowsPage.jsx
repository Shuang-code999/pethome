import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Users, ChevronRight } from 'lucide-react'
import { api } from '../../api.js'
import { avatarImg } from '../../data/communityImages.js'
import PetImg from '../../components/PetImg.jsx'

// 我的关注：展示已关注用户列表，可取消关注
export default function FollowsPage() {
  const navigate = useNavigate()
  const [followees, setFollowees] = useState(null)

  const load = async () => {
    const res = await api.followees()
    setFollowees(res.code === 200 ? res.data || [] : [])
  }
  useEffect(() => { load() }, [])

  const unfollow = async (userId) => {
    if (!confirm('确认取消关注？')) return
    const res = await api.unfollow(userId)
    if (res.code === 200) load()
    else alert(res.msg || '操作失败')
  }

  if (followees === null) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Loader2 size={20} className="animate-spin inline mr-2" />加载中…</div>

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={() => navigate('/me')} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回个人中心
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-500 via-brand-500 to-purple-500 rounded-xl2 p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative flex items-center justify-between">
          <div>
            <span className="inline-block text-[10px] bg-white/25 px-2 py-0.5 rounded font-semibold">社交</span>
            <h1 className="text-xl md:text-2xl font-bold mt-2">我的关注 · {followees.length} 人</h1>
            <p className="text-sm opacity-90 mt-1">查看你关注的宠友动态</p>
          </div>
          <Users size={48} className="opacity-50 hidden md:block" />
        </div>
      </div>

      {followees.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card text-center py-12">
          <Users size={40} className="text-ink-200 mx-auto mb-2" />
          <p className="text-sm text-ink-500">还没有关注任何人</p>
          <button onClick={() => navigate('/community/qa')} className="clickable mt-4 bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            去社区逛逛
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {followees.map(u => (
            <div key={u.id} onClick={() => navigate(`/community/user/${u.id}`)}
              className="clickable bg-white rounded-xl2 shadow-card hover:shadow-hover p-3 flex items-center gap-3 cursor-pointer">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-ink-100 shrink-0">
                <PetImg src={u.avatar || avatarImg(u.id)} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink-900 text-sm truncate">{u.nickname || '宠友'}</div>
                <div className="text-[11px] text-ink-400 truncate">{u.phone || '暂无联系方式'}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); unfollow(u.id) }}
                className="clickable text-xs text-ink-500 hover:text-red-500 border border-ink-200 px-3 py-1 rounded-lg">
                取消关注
              </button>
              <ChevronRight size={14} className="text-ink-300" />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
