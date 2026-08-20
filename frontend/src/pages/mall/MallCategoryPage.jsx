import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ShoppingBag, Search, Flame, SlidersHorizontal, ShoppingCart, Sparkles, Tag, Plus, Heart } from 'lucide-react'
import { api } from '../../api.js'
import { products as mockProducts } from '../../data/mock.js'
import PetImg from '../../components/PetImg.jsx'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 爱宠商城分类页：Claymorphism 风格
// 设计依据：UI/UX Pro Max #9 Claymorphism + #23 Pet Tech
const CATEGORY_META = {
  food:     { label: '主粮', emoji: '🍖', color: '#FF7A59', bg: 'linear-gradient(135deg,#FFB099 0%,#FF7A59 60%,#F2613E 100%)', desc: '精选优质主粮，营养均衡', tags: 'dog,food' },
  treats:   { label: '零食', emoji: '🍗', color: '#F59E0B', bg: 'linear-gradient(135deg,#FCD34D 0%,#F59E0B 60%,#D97706 100%)', desc: '训练奖励 · 美味可口', tags: 'cat,treat' },
  litter:   { label: '猫砂', emoji: '📦', color: '#8B5CF6', bg: 'linear-gradient(135deg,#C4B5FD 0%,#8B5CF6 60%,#7C3AED 100%)', desc: '强效除臭 · 结团迅速', tags: 'cat,litter' },
  deworm:   { label: '驱虫', emoji: '💊', color: '#EF4444', bg: 'linear-gradient(135deg,#FCA5A5 0%,#EF4444 60%,#DC2626 100%)', desc: '内外驱虫 · 健康守护', tags: 'dog,medicine' },
  toys:     { label: '玩具', emoji: '🎾', color: '#06B6D4', bg: 'linear-gradient(135deg,#67E8F9 0%,#06B6D4 60%,#0891B2 100%)', desc: '趣味互动 · 消耗精力', tags: 'dog,toy' },
  supplies: { label: '用品', emoji: '🛍️', color: '#10B981', bg: 'linear-gradient(135deg,#6EE7B7 0%,#10B981 60%,#059669 100%)', desc: '日常用品 · 一站购齐', tags: 'dog,supplies' }
}

// 本地爬取的商品图：分类 → (目录, 前缀, 数量)，按商品索引轮询取图
const LOCAL_PRODUCT_IMG = {
  food:     { dir: 'food',    prefix: 'food',    count: 19 },
  treats:   { dir: 'snack',   prefix: 'snack',   count: 19 },
  litter:   { dir: 'litter',  prefix: 'litter',  count: 9 },
  deworm:   { dir: 'deworm',  prefix: 'deworm',  count: 1 },
  toys:     { dir: 'toy',     prefix: 'toy',     count: 1 },
  supplies: { dir: 'supply',  prefix: 'supply',  count: 1 },
}
function localProductImage(category, index) {
  const cfg = LOCAL_PRODUCT_IMG[category] || LOCAL_PRODUCT_IMG.food
  const n = ((index % cfg.count) + 1)
  return `/assets/mall/products/${cfg.dir}/${cfg.prefix}-${String(n).padStart(3, '0')}.jpg`
}

export default function MallCategoryPage() {
  const { '*': splat } = useParams()
  const category = window.location.pathname.split('/').pop() || 'food'
  const meta = CATEGORY_META[category] || CATEGORY_META.food
  const navigate = useNavigate()

  const [items, setItems] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [priceRange, setPriceRange] = useState('all')

  useEffect(() => { load() }, [category])

  const load = async () => {
    setItems(null)
    const res = await api.products({ category: meta.label, page: 1, size: 24 })
    if (res.code === 200 && res.data?.length) {
      let list = res.data
      if (sortBy === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
      if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
      setItems(list)
    } else {
      const mock = mockProducts.filter(p => p.category === meta.label || category === 'food').slice(0, 12)
      setItems(mock.length ? mock : mockProducts.slice(0, 12))
    }
  }

  useEffect(() => { if (items) load() }, [sortBy])

  // 价格区间筛选
  const priceRanges = [
    { k: 'all', label: '全部' },
    { k: '0-50', label: '¥0-50' },
    { k: '50-100', label: '¥50-100' },
    { k: '100-200', label: '¥100-200' },
    { k: '200+', label: '¥200+' }
  ]
  const filtered = items?.filter(p => {
    if (!keyword || p.name?.includes(keyword)) {
      const price = p.price || 0
      if (priceRange === 'all') return true
      if (priceRange === '0-50') return price < 50
      if (priceRange === '50-100') return price >= 50 && price < 100
      if (priceRange === '100-200') return price >= 100 && price < 200
      if (priceRange === '200+') return price >= 200
    }
    return false
  })

  // 同品类导航
  const navItems = Object.entries(CATEGORY_META).map(([k, v]) => ({ k, ...v }))

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      {/* 返回（Clay 按钮） */}
      <button onClick={() => navigate(-1)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-brand-600 mb-4 px-3 py-1.5">
        ← 返回商城
      </button>

      {/* Hero（Clay 大卡 + 极光 + 浮动宠物） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-6 text-white shadow-clay">
        <div className="absolute inset-0" style={{ background: meta.bg }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <FloatingPets density="sparse" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> {meta.label}专区
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              <span className="text-3xl md:text-4xl">{meta.emoji}</span> {meta.label}专区
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">{meta.desc}</p>
            <div className="flex gap-2 mt-4 flex-wrap items-center">
              {['满199减30','新客立减','次日达','7天无理由'].map((tag, i) => (
                <span key={i} className="glass text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Tag size={11} /> {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="hidden md:block text-[140px] leading-none animate-bounce-soft" aria-hidden
               style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.18))', animationDelay: '0.5s' }}>
            {meta.emoji}
          </div>
        </div>
      </Reveal>

      {/* 品类切换（Clay chip + 渐变高亮） */}
      <Reveal delay={1} className="clay clay-hover p-3 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {navItems.map(it => (
            <button
              key={it.k}
              onClick={() => navigate(`/mall/${it.k}`)}
              className={`clickable flex items-center gap-1.5 whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all
                ${category === it.k
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-glow font-display'
                  : 'clay-btn text-ink-700 hover:text-brand-600'
                }`}
            >
              <span className="text-base">{it.emoji}</span>
              <span>{it.label}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* 搜索 + 排序 + 价格（Clay） */}
      <Reveal delay={2} className="clay clay-hover p-4 mb-5">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 clay-inset flex items-center px-3 py-2">
            <Search size={15} className="text-ink-400 mr-2" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder={`搜索${meta.label}…`}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="clay-btn px-3 text-xs outline-none font-bold cursor-pointer text-ink-700"
          >
            <option value="default">默认</option>
            <option value="price-asc">价低→高</option>
            <option value="price-desc">价高→低</option>
          </select>
          <button
            onClick={() => navigate('/mall/cart')}
            className="clickable btn-brand px-3 py-2 rounded-clay text-xs font-bold flex items-center gap-1"
          >
            <ShoppingCart size={14} /> 购物车
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          {priceRanges.map(r => (
            <button
              key={r.k}
              onClick={() => setPriceRange(r.k)}
              className={`clickable whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full font-bold transition-all
                ${priceRange === r.k
                  ? 'bg-brand-500 text-white'
                  : 'clay-inset text-ink-600'
                }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* 商品网格 */}
      {items === null ? (
        <Reveal className="clay flex items-center gap-2 text-ink-500 text-sm py-16 justify-center">
          <Loader2 size={18} className="animate-spin" /> 加载中…
        </Reveal>
      ) : !filtered || filtered.length === 0 ? (
        <Reveal className="clay text-center py-16 relative overflow-hidden">
          <div className="text-5xl mb-3 animate-bounce-soft" aria-hidden>🦴</div>
          <ShoppingBag size={32} className="text-ink-300 mx-auto mb-2" />
          <p className="text-sm text-ink-500 mb-3">暂无符合条件的商品</p>
          <button
            onClick={() => { setKeyword(''); setPriceRange('all') }}
            className="clickable btn-brand text-xs font-bold px-5 py-2 rounded-full"
          >
            清除筛选
          </button>
        </Reveal>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((p, i) => (
            <Reveal
              key={p.id || i}
              delay={Math.min(i + 1, 5)}
              onClick={() => navigate(`/mall/product/${p.id || i}`)}
              className="clay clay-hover cursor-pointer overflow-hidden group relative"
            >
              {/* 商品图 */}
              <div className="aspect-square bg-ink-50 relative overflow-hidden">
                <PetImg
                  src={localProductImage(category, i)}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  fallbackText={meta.emoji}
                />
                {/* 标签层 */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                  {p.stock <= 10 && p.stock > 0 && (
                    <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold shadow-glow">
                      ⚡ 仅剩 {p.stock}
                    </span>
                  )}
                  {i % 3 === 0 && (
                    <span className="text-[10px] bg-gradient-to-r from-brand-500 to-brand-600 text-white px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 shadow-glow">
                      <Flame size={10} className="fill-current" /> 热销
                    </span>
                  )}
                </div>
                {/* 收藏按钮 */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-clay-sm"
                >
                  <Heart size={14} className="text-pink-500" />
                </button>
                {/* 快速加购按钮（hover 显示） */}
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/mall/product/${p.id || i}`) }}
                  className="absolute bottom-2 left-2 right-2 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold rounded-clay shadow-glow opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center justify-center gap-1"
                >
                  <Plus size={12} strokeWidth={3} /> 加入购物车
                </button>
              </div>

              {/* 信息 */}
              <div className="p-3">
                <p className="text-xs text-ink-900 font-semibold line-clamp-2 leading-snug min-h-[2.6em]">
                  {p.name}
                </p>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-brand-600 font-extrabold text-lg font-display">¥{p.price}</span>
                  {p.oldPrice && (
                    <span className="text-[10px] text-ink-400 line-through">¥{p.oldPrice}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-ink-400">已售 {p.sales || 0}+</span>
                  {p.rating && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                      ⭐ {p.rating}
                    </span>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  )
}
