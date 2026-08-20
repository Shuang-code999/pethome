import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, PawPrint } from 'lucide-react'
import { imgById } from '../data/communityImages.js'

// 小红书风格文字贴：post 无图时渲染标题大字居中于按 id 取模的渐变色块
// 有图则正常图卡
const PALETTES = [
  ['#FFE4D6', '#FFB088'], // 桃
  ['#D8F3DC', '#95D5B2'], // 薄荷
  ['#FFF3B0', '#FFB703'], // 暖黄
  ['#E0E7FF', '#A5B4FC'], // 紫蓝
  ['#FCE7F3', '#F9A8D4'], // 粉
  ['#CFFAFE', '#67E8F9'], // 青
  ['#FEF3C7', '#FBBF24'], // 麦
  ['#E0F2FE', '#7DD3FC'], // 天蓝
  ['#F1F5F9', '#94A3B8'], // 雾
  ['#FFE4E6', '#FDA4AF'], // 玫
  ['#DCFCE7', '#86EFAC'], // 嫩绿
  ['#EDE9FE', '#C4B5FD'], // 薰衣草
]

function pickGradient(id) {
  const n = typeof id === 'bigint' ? Number(id % 12n) : (Number(id) % 12)
  const [from, to] = PALETTES[n]
  return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`
}

// 提取首句/前 30 字做正面文字
function pickQuote(post) {
  const text = post.body || post.title || ''
  // 简单去除 markdown 符号
  const clean = text.replace(/[#>*`]/g, '').trim()
  return clean.length > 30 ? clean.slice(0, 30) + '…' : clean
}

const TextPostCard = memo(function TextPostCard({ post, onClick }) {
  const navigate = useNavigate()
  // 优先使用已有图片，否则用本地图片，确保所有卡片都有图
  const imgSrc = (post.images && post.images.length && post.images[0]) || imgById(post.id || post.title?.length || 0)
  const hasImg = !!imgSrc
  const gradient = pickGradient(post.id || 0)
  const click = (e) => {
    // 点到作者头像/名字：进用户主页
    if (e?.target?.dataset?.authorChip === '1' && post.userId) {
      e.stopPropagation()
      navigate(`/community/user/${post.userId}`)
      return
    }
    if (onClick) onClick(post)
    else navigate(`/community/post/${post.id}`)
  }

  const authorChip = post.userId ? (
    <span data-author-chip="1" onClick={(e) => click(e)}
      className="hover:text-brand-600 cursor-pointer truncate max-w-[5rem]">
      {post.author}
    </span>
  ) : <span className="truncate max-w-[5rem]">{post.author}</span>

  if (hasImg) {
    // 有图：常规图卡
    return (
      <div
        onClick={click}
        className="clickable block bg-white rounded-xl2 shadow-card overflow-hidden hover:shadow-hover group"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img src={imgSrc} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
               onError={(e) => { e.currentTarget.src = imgById(post.id || 0) }} />
        </div>
        <div className="p-2">
          <div className="text-sm font-semibold text-ink-900 line-clamp-2 leading-snug">{post.title}</div>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-ink-500">
            <span className="flex items-center gap-0.5"><Heart size={11} className="text-rose-500" /> {post.likes || 0}</span>
            <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {post.comments || 0}</span>
            {authorChip}
          </div>
        </div>
      </div>
    )
  }

  // 无图：渐变文字贴
  return (
    <div
      onClick={click}
      className="clickable relative rounded-xl2 shadow-card overflow-hidden hover:shadow-hover aspect-square p-4 flex flex-col justify-between text-ink-900"
      style={{ background: gradient }}
    >
      <div className="absolute top-2 left-2 text-[10px] inline-flex items-center gap-1 bg-white/70 backdrop-blur text-ink-700 px-1.5 py-0.5 rounded">
        <PawPrint size={10} /> 文字帖
      </div>
      <div className="flex-1 flex items-center mt-3">
        <div className="text-base font-bold leading-tight line-clamp-4">{post.title || pickQuote(post)}</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px]">
        {authorChip}
        <span className="flex items-center gap-2 text-ink-700">
          <span className="flex items-center gap-0.5"><Heart size={11} /> {post.likes || 0}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={11} /> {post.comments || 0}</span>
        </span>
      </div>
    </div>
  )
})

export default TextPostCard