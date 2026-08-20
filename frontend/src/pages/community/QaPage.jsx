import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, Flame, Sparkles, ChevronRight, MessageCircle, ThumbsUp, RefreshCw } from 'lucide-react'
import { api } from '../../api'
import { communityImages, imgById } from '../../data/communityImages.js'

// 模块级缓存：返回页面时不重新请求，避免「刷新感」+ 配合 ScrollRestoration 恢复滚动位置
const _qaCache = { hot: null, rec: null }

/**
 * 问答首页（按用户要求精简）
 *  - 顶部：搜索条
 *  - 中部：热门问答 Top 10（带排名数字）
 *  - 下部：精选推荐
 */
export default function QaPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [hot, setHot] = useState(_qaCache.hot || [])
  const [rec, setRec] = useState(_qaCache.rec || [])
  const [loading, setLoading] = useState(!(_qaCache.hot && _qaCache.rec))
  const [recLoading, setRecLoading] = useState(false)

  useEffect(() => {
    // 有缓存就跳过请求（返回时不刷新）
    if (_qaCache.hot && _qaCache.rec) return
    setLoading(true)
    Promise.all([
      api.hotPosts('qa', 10),          // 热门 10
      api.recommendPosts('', 12)        // 推荐 12
    ]).then(([r1, r2]) => {
      if (r1.code === 200) { setHot(r1.data || []); _qaCache.hot = r1.data || [] }
      if (r2.code === 200) { setRec(r2.data || []); _qaCache.rec = r2.data || [] }
    }).finally(() => setLoading(false))
  }, [])

  const refreshRec = async () => {
    setRecLoading(true)
    try {
      const r = await api.recommendPosts('', 30)
      if (r.code === 200 && (r.data || []).length) {
        // 前端打乱顺序实现真正的"换一批"
        const shuffled = [...r.data].sort(() => Math.random() - 0.5)
        const next = shuffled.slice(0, 12)
        setRec(next)
        _qaCache.rec = next
      } else {
        // 后端无数据时，打乱现有数据
        setRec(prev => [...prev].sort(() => Math.random() - 0.5))
      }
    } finally {
      setRecLoading(false)
    }
  }

  const matches = (p) =>
    !keyword || (p.title || '').includes(keyword) || (p.body || '').includes(keyword)

  const hotList = hot.filter(matches).slice(0, 10)
  const recList = rec.filter(matches)

  if (loading) return (
    <div className="mx-auto max-w-content px-4 py-16 text-center">
      <Loader2 size={20} className="animate-spin inline mr-2" />加载中…
    </div>
  )

  return (
    <div className="mx-auto max-w-content px-4 py-6 fade-in">
      {/* 顶部搜索条 */}
      <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-5 sticky top-16 z-30 bg-white py-2 -mx-4 px-4 border-b border-ink-100">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-ink-500" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
                 placeholder="搜索问题关键词，如「疫苗」「拉肚子」"
                 className="bg-transparent text-sm outline-none w-full" />
        </div>
      </form>

      {/* 热门 Top 10（列表式） */}
      <section className="mb-6 bg-white rounded-xl2 p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <Flame size={15} className="text-rose-500 fill-rose-500" /> 热门问答 · TOP 10
          </h3>
          <span className="text-[10px] text-ink-400">实时热度</span>
        </div>
        {hotList.length === 0 ? (
          <div className="text-center text-xs text-ink-400 py-6">暂无热门问答</div>
        ) : (
          <ol className="divide-y divide-ink-100">
            {hotList.map((p, i) => (
              <li key={p.id} onClick={() => navigate(`/community/post/${p.id}`)}
                  className="clickable flex items-center gap-3 py-2.5 px-1 hover:bg-ink-50 -mx-1 px-2 rounded-lg transition">
                {/* 缩略图 */}
                <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-ink-100">
                  <img src={imgById(p.id || i)} alt=""
                       className="w-full h-full object-cover" loading="lazy"
                       onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                {/* 排名数字：前 3 名红色字体，后 7 名灰色 */}
                <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black
                  ${i < 3
                    ? 'text-red-500 bg-red-50'
                    : 'bg-ink-100 text-ink-500'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-900 truncate">
                    {(p.title || (p.body || '').slice(0, 30)).replace(/^\[问答\]\s*/, '')}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-ink-400">
                    <span className="truncate max-w-[120px]">{p.author || ''}</span>
                    <span className="flex items-center gap-0.5">
                      <ThumbsUp size={9} /> {p.likes || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle size={9} /> {p.comments || 0}
                    </span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-ink-300 shrink-0" />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 精选推荐 */}
      <section className="mb-6 bg-white rounded-xl2 p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <Sparkles size={15} className="text-amber-500" /> 精选推荐
          </h3>
          <button onClick={refreshRec} disabled={recLoading}
                  className="clickable text-[11px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-semibold disabled:opacity-50">
            <RefreshCw size={12} className={recLoading ? 'animate-spin' : ''} /> 换一批
          </button>
        </div>
        {recList.length === 0 ? (
          <div className="text-center text-xs text-ink-400 py-6">暂无推荐</div>
        ) : (
          <ul className="space-y-2.5">
            {recList.map(p => (
              <li key={p.id} onClick={() => navigate(`/community/post/${p.id}`)}
                  className="clickable flex items-start gap-3 p-2.5 rounded-lg hover:bg-ink-50 transition">
                <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-ink-100">
                  <img src={imgById(p.id || p.title?.length)} alt=""
                       className="w-full h-full object-cover" loading="lazy"
                       onError={(e) => { e.currentTarget.style.display = 'none' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink-900 truncate">
                    {(p.title || (p.body || '').slice(0, 40)).replace(/^\[问答\]\s*/, '')}
                  </div>
                  <div className="text-[11px] text-ink-500 line-clamp-1 mt-0.5">
                    {(p.body || '').slice(0, 60)}
                  </div>
                  <div className="flex items-center gap-2.5 mt-1 text-[10px] text-ink-400">
                    <span>{p.author || ''}</span>
                    <span className="flex items-center gap-0.5"><ThumbsUp size={9} /> {p.likes || 0}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle size={9} /> {p.comments || 0}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}