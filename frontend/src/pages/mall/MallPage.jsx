import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, ChevronUp, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../../api'
import PetImg from '../../components/PetImg'
import SeckillSection from '../../components/SeckillSection'
import { MALL_SLIDES, MALL_FLOORS } from '../../data/mallContent.js'
import { imgById } from '../../data/communityImages.js'

const CATS = [
  { key: '全部', color: '#FF7A59' },
  { key: '主粮', color: '#FFB088' },
  { key: '零食', color: '#95D5B2' },
  { key: '猫砂', color: '#A5B4FC' },
  { key: '驱虫', color: '#FBBF24' },
  { key: '玩具', color: '#F9A8D4' },
  { key: '用品', color: '#67E8F9' },
  { key: '洗护', color: '#C084FC' },
  { key: '保健', color: '#34D399' }
]

// ===== 模块级缓存：返回页面时不重新请求，避免「刷新感」 =====
const _cache = { items: null, total: 0, cat: '全部', keyword: '' }

export default function MallPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState(_cache.keyword || '')
  const [activeCat, setActiveCat] = useState(_cache.cat || '全部')
  const [items, setItems] = useState(_cache.items || [])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(_cache.total || 0)
  const [loading, setLoading] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const firstMount = useRef(true)
  const size = 25

  // 加载商品
  const load = async (p = 1, append = false) => {
    setLoading(true)
    const params = { page: p, size }
    if (activeCat !== '全部') params.category = activeCat
    if (keyword.trim()) params.keyword = keyword.trim()
    try {
      const res = await api.products(params)
      if (res.code === 200 && res.data?.records) {
        const records = p === 1 && !append
          ? [...res.data.records].sort(() => Math.random() - 0.5)
          : res.data.records
        const next = append ? [...items, ...res.data.records] : records
        setItems(next)
        setTotal(res.data.total || 0)
        setPage(p)
        setRefreshKey(k => k + 1)
        // 写入缓存
        _cache.items = next
        _cache.total = res.data.total || 0
        _cache.cat = activeCat
        _cache.keyword = keyword.trim()
      } else if (!append) {
        setItems([])
        setTotal(0)
      }
    } catch (e) {
      console.warn('[MallPage] products 加载失败：', e)
      if (!append) setItems([])
    } finally {
      setLoading(false)
    }
  }

  // 首次挂载：有缓存就跳过请求，无缓存才加载；切换分类始终加载
  useEffect(() => {
    if (firstMount.current && _cache.items && _cache.items.length) {
      firstMount.current = false
      return
    }
    firstMount.current = false
    load(1, false)
  }, [activeCat])

  // 轮播自动播放
  useEffect(() => {
    if (MALL_SLIDES.length <= 1) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % MALL_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  // 滚动监听
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const submit = (e) => { e.preventDefault(); load(1, false) }
  const backTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <div className="mx-auto max-w-5xl px-4 py-4">
      {/* 顶部固定搜索框 */}
      <form onSubmit={submit} className="flex gap-2 mb-4 sticky top-16 z-30 bg-white py-2 -mx-4 px-4 border-b border-ink-200">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-2">
          <Search size={16} className="text-ink-500" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
                 placeholder="搜索主粮 / 零食 / 玩具 …"
                 className="bg-transparent text-sm outline-none w-full" />
        </div>
        <button type="submit" className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">搜索</button>
      </form>

      {/* ===== 顶部：轮播（左 ~65%）+ 楼层卡片（右 ~35%）===== */}
      <div className="flex gap-3 mb-5">
        {/* 轮播 */}
        <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 shadow-card flex-1 min-w-0">
          {MALL_SLIDES.map((s, i) => (
            <div key={s.id}
                 className="absolute inset-0 transition-opacity duration-700"
                 style={{ opacity: i === slideIdx ? 1 : 0, zIndex: i === slideIdx ? 1 : 0 }}>
              <PetImg src={s.src} alt={s.title} className="w-full h-full object-cover" fallbackText="🛍️" />
              <div className="absolute inset-0 mix-blend-multiply" style={{ background: s.gradient, opacity: 0.78 }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-black/15" />

              <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 sm:px-8 text-white max-w-[70%]">
                {s.badge && (
                  <span className="inline-block w-fit text-[10px] font-bold bg-white/25 backdrop-blur px-2.5 py-1 rounded-full mb-2 tracking-wider">
                    🔥 {s.badge}
                  </span>
                )}
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight drop-shadow-lg leading-tight">
                  {s.title}
                </div>
                <div className="text-xs sm:text-sm opacity-95 mt-2 drop-shadow leading-relaxed">
                  {s.subtitle}
                </div>
                <button className="clickable mt-3 w-fit bg-white text-brand-600 font-bold px-4 py-1.5 rounded-full text-sm shadow-hover tracking-wide flex items-center gap-1">
                  {s.cta} →
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => setSlideIdx(i => (i - 1 + MALL_SLIDES.length) % MALL_SLIDES.length)}
                  className="clickable absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setSlideIdx(i => (i + 1) % MALL_SLIDES.length)}
                  className="clickable absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10">
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {MALL_SLIDES.map((s, i) => (
              <button key={s.id} onClick={() => setSlideIdx(i)}
                      className={`clickable h-1.5 rounded-full transition-all ${i === slideIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />
            ))}
          </div>
        </div>

        {/* 右侧：楼层卡片 */}
        <div className="hidden sm:flex flex-col gap-2 w-[200px] shrink-0">
          {MALL_FLOORS.map(f => (
            <button key={f.id} className="clickable flex-1 bg-white border border-ink-200 hover:border-brand-300 rounded-xl p-3 text-left transition-all">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{f.icon}</span>
                <span className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-bold">{f.tag}</span>
              </div>
              <div className="text-xs font-bold text-ink-900 truncate">{f.title}</div>
              <div className="text-[10px] text-ink-500 truncate mt-0.5">{f.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 移动端楼层卡片 */}
      <div className="grid grid-cols-3 gap-2 mb-4 sm:hidden">
        {MALL_FLOORS.map(f => (
          <button key={f.id} className="clickable bg-white border border-ink-200 hover:border-brand-300 rounded-xl p-2 text-left transition-all">
            <div className="flex items-center gap-1">
              <span className="text-base">{f.icon}</span>
              <span className="text-[9px] bg-brand-50 text-brand-600 px-1 py-0.5 rounded font-bold">{f.tag}</span>
            </div>
            <div className="text-[11px] font-bold text-ink-900 mt-1 truncate">{f.title}</div>
          </button>
        ))}
      </div>

      {/* ===== 限时秒杀（与首页共用 SeckillSection 组件） ===== */}
      <div className="mb-5">
        <SeckillSection />
      </div>

      {/* 产品网格 */}
      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center">
          <Loader2 size={16} className="animate-spin" /> 加载中…
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 -mx-1 px-1">
            {CATS.map(c => (
              <button key={c.key} onClick={() => setActiveCat(c.key)}
                      className={`clickable shrink-0 text-sm px-3 py-1.5 rounded-full border whitespace-nowrap transition-all
                        ${activeCat === c.key ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-700 border-ink-200 hover:border-brand-500'}`}>
                {c.key}
              </button>
            ))}
          </div>

          <div key={refreshKey} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 fade-in">
            {items.map(p => (
              <div key={p.id} onClick={() => navigate(`/mall/product/${p.id}`)}
                   className="clickable bg-white rounded-xl shadow-card overflow-hidden hover:shadow-hover">
                <div className="aspect-square bg-ink-100">
                  <img src={imgById(p.id)} alt={p.name} className="w-full h-full object-cover"
                       onError={(e) => { e.currentTarget.src = imgById(String(p.id) + '-fb') }} />
                </div>
                <div className="p-2.5">
                  <div className="text-xs text-ink-900 line-clamp-2 leading-tight min-h-[2.4em]">{p.name}</div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-brand-600 font-bold text-sm">¥{p.price}</span>
                    {p.oldPrice && <span className="text-[10px] text-ink-400 line-through">¥{p.oldPrice}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-ink-400">
                    <span>{p.sales || 0} 人付款</span>
                    {p.category && <span className="bg-brand-50 text-brand-600 px-1.5 rounded">{p.category}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center my-6">
            <button onClick={() => { load(1, false); window.scrollTo({ top: 400, behavior: 'smooth' }) }} disabled={loading}
                    className="clickable inline-flex items-center gap-1.5 text-sm text-ink-700 hover:text-brand-600 border border-ink-300 hover:border-brand-500 px-6 py-2 rounded-full disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {loading ? '加载中…' : '刷新商品'}
            </button>
          </div>
        </>
      )}

      {/* 右下悬浮：购物车 + 回顶 */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-2 z-40">
        <button onClick={() => navigate('/mall/cart')}
                className="clickable w-12 h-12 rounded-full bg-white shadow-hover text-brand-600 flex items-center justify-center border border-ink-200">
          <ShoppingCart size={18} />
        </button>
        {showTop && (
          <button onClick={backTop}
                  className="clickable w-12 h-12 rounded-full bg-white shadow-hover text-ink-600 flex items-center justify-center border border-ink-200 fade-in">
            <ChevronUp size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
