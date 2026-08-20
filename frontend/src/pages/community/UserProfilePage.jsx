import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MessageSquare, Heart, Users, Plus, Check } from 'lucide-react'
import { api } from '../../api.js'
import PetImg from '../../components/PetImg.jsx'
import TextPostCard from '../../components/TextPostCard.jsx'
import { readCurrentUser } from '../../hooks/userEvents.js'

/**
 * 用户公开主页（按用户要求：能看到发布的问答/话题）
 * - 顶部：头像 + 昵称 + 关注按钮
 * - Tabs：问答 / 话题 / 领养（按帖子 type 过滤）
 */
export default function UserProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [tab, setTab] = useState('qa')      // qa / topic / adopt
  const [following, setFollowing] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [id])

  const load = async () => {
    // 拉用户公开资料
    const ur = await api.userProfile(id).catch(() => null)
    if (ur && ur.code === 200) {
      setUser(ur.data)
    } else {
      // 兜底：调用 /me（仅当是自己时）— 优先使用 localStorage 缓存，避免「宠友XXXXX」覆盖真实昵称
      const cached = readCurrentUser()
      if (cached && String(cached.id) === String(id)) {
        setUser(cached)
      } else {
        const me = await api.me().catch(() => null)
        if (me && me.code === 200 && String(me.data?.id) === String(id)) {
          setUser(me.data)
        } else {
          setUser({ id, nickname: `宠友${String(id).slice(-4)}`, avatar: '' })
        }
      }
    }
    // 拉取该用户的帖子
    const pr = await api.userPosts(id, 50).catch(() => null)
    if (pr && pr.code === 200) setPosts(pr.data || [])
    // 关注状态
    const fr = await api.isFollowing(id).catch(() => null)
    if (fr && fr.code === 200) setFollowing(!!fr.data)
  }

  const toggleFollow = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (following) {
        await api.unfollow(id)
        setFollowing(false)
      } else {
        await api.follow(id)
        setFollowing(true)
      }
    } catch { /* 静默 */ }
    finally { setBusy(false) }
  }

  if (!user) return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <Loader2 size={20} className="animate-spin inline mr-2" />加载中…
    </div>
  )

  const qaPosts = posts.filter(p => p.type === 'qa')
  const topicPosts = posts.filter(p => p.type === 'topic')
  const adoptPosts = posts.filter(p => p.type === 'adopt')
  const list = tab === 'qa' ? qaPosts : tab === 'topic' ? topicPosts : adoptPosts

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* 用户信息卡 */}
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-orange-500 rounded-xl2 p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 ring-4 ring-white/30 shrink-0">
            {user.avatar ? <PetImg src={user.avatar} className="w-full h-full" /> :
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold">{(user.nickname || '宠')[0]}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{user.nickname || '宠友'}</h1>
              <button onClick={toggleFollow} disabled={busy}
                className={`clickable text-xs px-3 py-1 rounded-full font-semibold transition
                  ${following ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white text-brand-600 hover:bg-brand-50'}`}>
                {following ? <><Check size={11} className="inline mr-0.5" /> 已关注</> : <><Plus size={11} className="inline mr-0.5" /> 关注</>}
              </button>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span><b>{posts.length}</b> 帖子</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab：问答 / 话题 / 领养 */}
      <div className="flex gap-2 mb-4">
        {[
          { k: 'qa', l: `问答 ${qaPosts.length}` },
          { k: 'topic', l: `话题 ${topicPosts.length}` },
          { k: 'adopt', l: `领养 ${adoptPosts.length}` }
        ].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`clickable text-xs px-3 py-1.5 rounded-full transition
              ${tab === t.k ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 border border-ink-200'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* 帖子内容 */}
      {list.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card text-center py-12">
          <MessageSquare size={40} className="text-ink-200 mx-auto mb-2" />
          <p className="text-sm text-ink-500">暂无{tab === 'qa' ? '问答' : tab === 'topic' ? '话题' : '领养'}内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((p, i) => (
            <TextPostCard key={p.id || i} post={p} onClick={() => navigate(`/community/post/${p.id}`)} />
          ))}
        </div>
      )}
    </section>
  )
}