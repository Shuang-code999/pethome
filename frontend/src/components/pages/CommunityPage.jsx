import { useState, useEffect } from 'react'
import { PenSquare, Heart, MessageCircle, Loader2, MapPin, Send, HelpCircle, Hash, Home, MessageSquare } from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import PetImg from '../PetImg'
import ImageUpload from '../ImageUpload'
import { api } from '../../api'
import { communityPosts as mockPosts } from '../../data/mock.js'

const flickr = (tags, w, h) => `https://loremflickr.com/${w}/${h}/${tags}`
const postImg = (p) => (p.images ? (typeof p.images === 'string' ? p.images : p.images[0]) : p.imgTags ? flickr(p.imgTags, 400, 300) : null)
const authorAvatar = (p) => p.avatar ? flickr(p.avatar, 80, 80) : null
const authorName = (p) => p.author || '匿名'

const TABS = [
  { key: '推荐', label: '动态', icon: MessageSquare, type: '' },
  { key: '问答', label: '问答', icon: HelpCircle, type: 'qa' },
  { key: '话题', label: '话题', icon: Hash, type: 'topic' },
  { key: '领养', label: '领养', icon: Home, type: 'adopt' },
]

export default function CommunityPage({ logged, onNavigate, onLoginClick }) {
  const [tab, setTab] = useState('推荐')
  const [posts, setPosts] = useState(null)
  const [writing, setWriting] = useState(null)
  const [detail, setDetail] = useState(null)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setPosts(null)
    if (tab === '关注' && !logged) {
      setPosts(mockPosts)
      return
    }
    const tabInfo = TABS.find(t => t.label === tab)
    const tabKey = tab === '推荐' ? 'recommend' : tab === '关注' ? 'follow' : 'latest'
    const res = await api.feed(tabKey, 0, 20, tabInfo?.type || '')
    if (res.code === 200 && res.data?.length) {
      setPosts(res.data)
    } else {
      setPosts([])
    }
  }
  useEffect(() => { load() }, [tab, logged])

  const submitPost = async () => {
    if (!writing.title?.trim()) { alert('请填写标题'); return }
    setSaving(true)
    try {
      const tabInfo = TABS.find(t => t.label === tab)
      const payload = { title: writing.title, body: writing.body || '', images: writing.images || '', type: tabInfo?.type || 'post' }
      const res = await api.createPost(payload)
      if (res.code === 200) {
        const newPost = res.data
        setPosts(prev => [newPost, ...(prev || [])])
        setWriting(null)
      } else alert(res.msg || '发布失败')
    } catch (err) {
      alert('网络错误，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (p) => {
    setDetail(p)
    setComments([])
    if (p.id) {
      const res = await api.postComments(p.id)
      if (res.code === 200) setComments(res.data || [])
    }
  }

  const toggleLike = async (p, e) => {
    e.stopPropagation()
    if (!logged) { onLoginClick(); return }
    const isLiked = p.liked
    const res = isLiked ? await api.unlikePost(p.id) : await api.likePost(p.id)
    if (res.code === 200) {
      setPosts(prev => prev.map(x => x.id === p.id
        ? { ...x, liked: !isLiked, likes: (x.likes || 0) + (isLiked ? -1 : 1) }
        : x))
      if (detail?.id === p.id) setDetail({ ...detail, liked: !isLiked, likes: (detail.likes || 0) + (isLiked ? -1 : 1) })
    }
  }

  const submitComment = async () => {
    if (!commentText.trim()) return
    const res = await api.commentPost(detail.id, commentText)
    if (res.code === 200) {
      setComments(prev => [...prev, res.data])
      setCommentText('')
      setPosts(prev => prev.map(x => x.id === detail.id ? { ...x, comments: (x.comments || 0) + 1 } : x))
      setDetail({ ...detail, comments: (detail.comments || 0) + 1 })
    } else alert(res.msg || '评论失败')
  }

  return (
    <PageShell title="内容社区" subtitle="铲屎官的真实养宠日常 · 领养代替购买" onBack={() => onNavigate('home')} accent="health">
      {/**/}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`clickable text-sm px-3 py-1.5 rounded-full flex items-center gap-1 ${tab === t.key ? 'bg-health text-white' : 'text-ink-500 hover:bg-ink-100'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
          {tab === '关注' && !logged && <span className="text-xs text-ink-400 self-center ml-2">（登录后查看关注动态）</span>}
        </div>
        <button onClick={() => logged ? setWriting({ title: '', body: '' }) : onLoginClick()}
          className="clickable flex items-center gap-1 bg-health hover:bg-health/90 text-white text-sm font-semibold px-4 py-2 rounded-lg">
          <PenSquare size={14} /> 发帖
        </button>
      </div>

      {posts === null ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 加载中…</div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {posts.map((p, i) => {
            const img = postImg(p)
            return (
              <div key={p.id || i} onClick={() => openDetail(p)}
                className="clickable mb-3 break-inside-avoid bg-white rounded-xl2 shadow-card overflow-hidden hover:shadow-hover group">
                {img && (
                  <div className="aspect-[4/3] bg-ink-100">
                    <PetImg src={img} alt={p.title} className="w-full h-full" />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm text-ink-900 font-medium line-clamp-2 leading-snug">{p.title}</p>
                  {p.body && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{p.body}</p>}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-brand-100 shrink-0">
                        {authorAvatar(p) ? <PetImg src={authorAvatar(p)} className="w-full h-full" /> : <span className="text-[10px] flex items-center justify-center w-full h-full text-brand-600 font-bold">{authorName(p)[0]}</span>}
                      </div>
                      <span className="text-[11px] text-ink-500 truncate">{authorName(p)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-ink-400 shrink-0">
                      <span onClick={(e) => toggleLike(p, e)} className={`flex items-center gap-0.5 ${p.liked ? 'text-red-500' : ''}`}>
                        <Heart size={11} className={p.liked ? 'fill-red-500' : ''} /> {p.likes || 0}
                      </span>
                      <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {p.comments || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/**/}
      <DetailModal open={!!writing} onClose={() => setWriting(null)} title="发布动态" wide
        footer={<>
          <button onClick={() => setWriting(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">取消</button>
          <button onClick={submitPost} disabled={saving} className="clickable bg-health hover:bg-health/90 text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">{saving ? '发布中…' : '发布'}</button>
        </>}>
        {writing && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">标题</label>
              <input value={writing.title} onChange={e => setWriting({ ...writing, title: e.target.value })} className="bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30 w-full" placeholder="如 圆圆第一次洗澡记录" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">正文</label>
              <textarea value={writing.body} onChange={e => setWriting({ ...writing, body: e.target.value })} rows={5} className="bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none focus:bg-ink-300/30 w-full resize-none" placeholder="分享你的养宠日常…" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-700 block mb-1">配图</label>
              <ImageUpload value={writing.images} onChange={url => setWriting({ ...writing, images: url })} />
            </div>
            <p className="text-[11px] text-ink-400">发帖会通过真实后端 POST /community/posts 写库，并推送至粉丝 Feed（Redis ZSet）。</p>
          </div>
        )}
      </DetailModal>

      {/**/}
      <DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.title} wide
        footer={<div className="flex items-center gap-2 w-full">
          <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="写评论…" className="flex-1 bg-ink-100 rounded-lg px-3 py-2 text-sm outline-none" />
          <button onClick={submitComment} disabled={!commentText.trim()} className="clickable bg-health text-white px-3 py-2 rounded-lg disabled:opacity-50"><Send size={16} /></button>
        </div>
        }>
        {detail && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-100 shrink-0">
                {authorAvatar(detail) ? <PetImg src={authorAvatar(detail)} className="w-full h-full" /> : <span className="text-xs flex items-center justify-center w-full h-full text-brand-600 font-bold">{authorName(detail)[0]}</span>}
              </div>
              <span className="text-xs text-ink-500">{authorName(detail)} · {detail.createTime || detail.time || '刚刚'}</span>
            </div>
            {postImg(detail) && <div className="aspect-video bg-ink-100 rounded-lg overflow-hidden mb-3"><PetImg src={postImg(detail)} className="w-full h-full" /></div>}
            <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{detail.body || detail.title}</p>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-ink-100 text-sm text-ink-500">
              <span onClick={(e) => toggleLike(detail, e)} className={`flex items-center gap-1 cursor-pointer ${detail.liked ? 'text-red-500' : ''}`}>
                <Heart size={14} className={detail.liked ? 'fill-red-500' : ''} /> {detail.likes || 0}
              </span>
              <span className="flex items-center gap-1"><MessageCircle size={14} /> {detail.comments || 0}</span>
            </div>

            <div className="mt-4 space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-health/20 flex items-center justify-center text-health text-xs font-bold shrink-0">{(c.author || '匿')[0]}</div>
                  <div className="flex-1 bg-ink-50 rounded-lg p-2">
                    <div className="text-xs font-semibold text-ink-700">{c.author || '匿名'}</div>
                    <div className="text-sm text-ink-600 mt-0.5">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}
