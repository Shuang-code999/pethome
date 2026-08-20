import { useState, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { communityPosts as mocks } from '../data/mock.js'
import { TOPIC_SEEDS } from '../pages/community/TopicPage.jsx'
import TextPostCard from './TextPostCard.jsx'
import { RefreshCw, PawPrint, Shuffle } from 'lucide-react'
import { imgById } from '../data/communityImages.js'

// 统一抽象 post：优先使用已有图片，否则分配本地图片
function normalizePost(p, idx) {
  const id = p.id || (3000 + idx)
  if (p.images && p.images.length) return { ...p, id, kind: 'img' }
  return { ...p, id, images: [imgById(id)], kind: 'img' }
}

const FeedCard = memo(function FeedCard({ p, idx, onCardClick }) {
  const post = normalizePost(p, idx)
  return <TextPostCard post={post} onClick={() => onCardClick?.(post)} />
})

// 模块级缓存：返回首页时不重新洗牌，避免「刷新感」
let _cachedPosts = null

/**
 * 社区精选（瀑布流，小红书风格）
 *  - 点击单张帖 → 直接进入帖子详情（而非话题聚合页）
 *  - 大多数是有图帖，少量文字帖穿插
 *  - 「刷新 / 换一批」可换一组数据
 */
function CommunityFeedInner() {
  const navigate = useNavigate()
  const [seed, setSeed] = useState(1)
  const [spinning, setSpinning] = useState(false)

  const posts = useMemo(() => {
    // 有缓存就直接复用（返回首页不洗牌），seed 变化时才重新洗牌
    if (_cachedPosts && seed === 1) return _cachedPosts
    const shuffled = [...TOPIC_SEEDS, ...mocks]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    _cachedPosts = shuffled
    return shuffled
  }, [seed])

  const refresh = () => {
    setSpinning(true)
    setTimeout(() => setSpinning(false), 500)
    setSeed((s) => s + 1)
  }

  // 直接进入帖子详情（按要求：社区精选 → 帖子详情，而非话题页）
  const openPost = (post) => navigate(`/community/post/${post.id ?? post.title}`)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-ink-900">社区精选</h3>
          <span className="text-xs text-ink-500 flex items-center gap-1">
            <PawPrint size={12} className="text-brand-500" /> {TOPIC_SEEDS.length + mocks.length} 条动态
          </span>
        </div>
        <button
          onClick={refresh}
          className="clickable flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full"
        >
          <RefreshCw size={14} className={spinning ? 'animate-spin' : ''} /> 刷新
        </button>
      </div>

      {/* 小红书风格瀑布流：2~4 列、列数随屏宽变化、卡片高度错落 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {posts.map((p, i) => (
          <FeedCard key={`${seed}-${i}`} p={p} idx={i} onCardClick={openPost} />
        ))}
      </div>

      <div className="text-center mt-4">
        <button
          onClick={refresh}
          className="clickable inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 border border-ink-300 hover:border-brand-500 px-5 py-2 rounded-full"
        >
          <Shuffle size={14} /> 换一批
        </button>
      </div>
    </div>
  )
}

const CommunityFeed = memo(CommunityFeedInner)
export default CommunityFeed