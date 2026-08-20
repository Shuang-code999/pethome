import { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Loader2, Heart, MessageCircle, Send, Share2, MoreHorizontal, User } from 'lucide-react'
import { api } from '../../api.js'
import { communityPosts } from '../../data/mock.js'
import { communityImages, imgById, avatarImg } from '../../data/communityImages.js'
import { recordHistory } from '../../hooks/browsingHistory.js'
import { TOPIC_SEEDS } from './TopicPage.jsx'
import { ADOPT_PETS } from './AdoptPage.jsx'
import PetImg from '../../components/PetImg.jsx'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logged, onLoginClick } = useOutletContext() || {}
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)

  // 浏览记录：进入帖子详情即记录
  useEffect(() => {
    if (!post?.id) return
    recordHistory({
      type: 'post',
      id: post.id,
      title: post.title || '社区帖子',
      image: post._localImg || imgById(post.id),
      path: `/community/post/${post.id}`,
    })
  }, [post])

  useEffect(() => { load() }, [id])

  const load = async () => {
    const idStr = String(id)

    // 1. 优先：按 ID 直接请求后端（现已加入白名单，免登录）
    try {
      const res = await api.getPost(id)
      if (res.code === 200 && res.data) {
        setPost({ ...res.data, _localImg: imgById(res.data.id || id) })
        const cres = await api.postComments(id)
        if (cres.code === 200) setComments(cres.data || [])
        return
      }
    } catch {}

    // 2. 后端未找到 → 从 feed / hot / recommend 搜索
    let found = null
    try {
      const [feedRes, hotRes, recRes] = await Promise.all([
        api.feed('latest', 0, 200, ''),
        api.hotPosts('', 50),
        api.recommendPosts('', 50)
      ])
      found = feedRes.data?.find(p => String(p.id) === idStr) ||
              hotRes.data?.find(p => String(p.id) === idStr) ||
              recRes.data?.find(p => String(p.id) === idStr)
    } catch {}

    // 3. 从本地 mock 数据源查找（话题种子 + 领养宠物 + 社区帖子）
    if (!found) {
      const allSources = [
        ...TOPIC_SEEDS,
        ...ADOPT_PETS,
        ...communityPosts
      ]
      found = allSources.find(p => String(p.id) === idStr)
    }

    // 4. 兜底：按 id hash 取一个 mock，保证不同 id 显示不同内容
    if (!found) {
      const idx = Math.abs(Number(id) || (id ? id.charCodeAt(0) * 7 : 0)) % communityPosts.length
      found = { ...communityPosts[idx], id: idStr }
    }

    if (found) found = { ...found, _localImg: imgById(found.id || id) }
    setPost(found)
    try {
      const cres = await api.postComments(id)
      if (cres.code === 200) setComments(cres.data || [])
    } catch {}
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    if (!logged) { onLoginClick?.(); return }
    const res = await api.commentPost(id, commentText, replyTo?.id)
    if (res.code === 200) {
      setComments([...comments, { ...res.data, parentId: replyTo?.id, replyTo: replyTo?.author }])
      setCommentText('')
      setReplyTo(null)
    } else alert(res.msg || '评论失败')
  }

  const toggleLike = async () => {
    if (!logged) { onLoginClick?.(); return }
    const isLiked = post.liked
    const res = isLiked ? await api.unlikePost(post.id) : await api.likePost(post.id)
    if (res.code === 200) setPost({ ...post, liked: !isLiked, likes: (post.likes || 0) + (isLiked ? -1 : 1) })
  }

  if (!post) return <div className="mx-auto max-w-content px-4 py-16 text-center"><Loader2 size={20} className="animate-spin inline mr-2" />加载中…</div>

  return (
    <section className="mx-auto max-w-content px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* 主内容 */}
        <div className="bg-white rounded-xl2 shadow-card p-6">
          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div onClick={() => post.userId && navigate(`/community/user/${post.userId}`)}
                className="w-11 h-11 rounded-full overflow-hidden bg-ink-100 cursor-pointer">
                {post.avatar ? <PetImg src={avatarImg(post.userId || post.id || id)} className="w-full h-full" /> :
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-brand-600"><User size={18} /></div>}
              </div>
              <div>
                <div onClick={() => post.userId && navigate(`/community/user/${post.userId}`)}
                  className="font-semibold text-sm text-ink-900 cursor-pointer hover:text-brand-600">{post.author || '匿名用户'}</div>
                <div className="text-xs text-ink-500">{post.time || post.createTime?.replace('T', ' ').slice(0, 16) || '刚刚'}</div>
              </div>
            </div>
            <button className="clickable text-ink-400 hover:text-ink-700"><MoreHorizontal size={18} /></button>
          </div>

          {/* 标题 */}
          <h1 className="text-xl font-bold text-ink-900 mb-3">{post.title}</h1>

          {/* 图片 - 优先使用本地图片 */}
          {post._localImg && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img src={post._localImg} alt={post.title} className="w-full object-cover max-h-[400px]" loading="lazy" />
            </div>
          )}

          {/* 正文 */}
          {post.body && <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{post.body}</p>}

          {/* 操作栏 */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-ink-100">
            <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm ${post.liked ? 'text-red-500' : 'text-ink-500 hover:text-red-500'} transition`}>
              <Heart size={16} className={post.liked ? 'fill-red-500' : ''} /> {post.likes || 0}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-ink-500">
              <MessageCircle size={16} /> {comments.length}
            </span>
            <button className="clickable ml-auto flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600">
              <Share2 size={16} /> 分享
            </button>
          </div>

          {/* 评论区 */}
          <div className="mt-5 pt-4 border-t border-ink-100">
            <h3 className="text-sm font-bold text-ink-900 mb-3">评论 ({comments.length})</h3>
            {comments.length === 0 ? (
              <div className="text-center py-8 text-xs text-ink-400">还没有评论，快来抢沙发</div>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-health/20 flex items-center justify-center text-health text-xs font-bold shrink-0">
                      {(c.author || '匿')[0]}
                    </div>
                    <div className="flex-1 bg-ink-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-700">{c.author || '匿名'}</span>
                        {c.replyTo && <span className="text-[10px] text-ink-400">回复 @{c.replyTo}</span>}
                      </div>
                      <div className="text-sm text-ink-700 mt-1">{c.content}</div>
                      <button onClick={() => setReplyTo({ id: c.id, author: c.author })}
                        className="clickable text-[10px] text-ink-400 hover:text-brand-600 mt-1">回复</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧栏：评论输入 + 作者卡 */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white rounded-xl2 shadow-card p-4">
            <h3 className="text-sm font-bold text-ink-900 mb-2">写下你的评论</h3>
            {replyTo && (
              <div className="text-xs text-brand-600 mb-2 flex items-center gap-1">
                回复 @{replyTo.author}
                <button onClick={() => setReplyTo(null)} className="text-ink-400 hover:text-ink-700">×</button>
              </div>
            )}
            <div className="flex gap-2">
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder={logged ? '说点什么…' : '登录后评论'}
                className="flex-1 bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30" />
              <button onClick={submitComment} disabled={!commentText.trim()}
                className="clickable bg-brand-500 hover:bg-brand-600 text-white px-3 rounded-lg disabled:opacity-50">
                <Send size={14} />
              </button>
            </div>
          </div>

          {/* 相关推荐 */}
          <div className="bg-white rounded-xl2 shadow-card p-4">
            <h3 className="text-sm font-bold text-ink-900 mb-3">相关推荐</h3>
            <div className="space-y-2">
              {communityPosts.slice(0, 3).map((p, i) => (
                <div key={i} onClick={() => navigate(`/community/post/${p.id || i}`)}
                  className="clickable p-2 hover:bg-ink-50 rounded-lg cursor-pointer">
                  <div className="text-xs font-semibold text-ink-900 line-clamp-2">{p.title}</div>
                  <div className="text-[10px] text-ink-400 mt-1">❤️ {p.likes || 0} · 💬 {p.comments || 0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
