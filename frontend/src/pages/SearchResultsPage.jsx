import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Loader2, ShoppingBag, Newspaper } from 'lucide-react'
import { api } from '../api'
import PetImg from '../components/PetImg'
import TextPostCard from '../components/TextPostCard'

export default function SearchResultsPage() {
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const [keyword, setKeyword] = useState(q)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { setKeyword(q) }, [q])

  useEffect(() => {
    if (!q.trim()) return
    setLoading(true)
    api.globalSearch(q.trim())
      .then((r) => {
        if (r.code === 200) setData(r.data)
        else setData({ products: [], posts: [], q })
      })
      .finally(() => setLoading(false))
  }, [q])

  const submit = (e) => {
    e.preventDefault()
    const v = keyword.trim()
    if (!v) return
    navigate(`/search?q=${encodeURIComponent(v)}`)
  }

  return (
    <div className="mx-auto max-w-page px-4 py-6">
      {/* 顶部搜索框 */}
      <form onSubmit={submit} className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-xl px-4 py-3">
          <Search size={18} className="text-ink-500" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索商品 / 服务 / 帖子…"
            autoFocus
            className="bg-transparent text-[15px] outline-none w-full placeholder:text-ink-500"
          />
        </div>
        <button type="submit" className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-6 py-3 rounded-xl">
          搜索
        </button>
      </form>

      {loading && (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> 搜索中…
        </div>
      )}

      {!loading && data && (
        <>
          <div className="text-xs text-ink-500 mb-4">
            关于 <b className="text-brand-600">"{data.q}"</b>：商品 {data.products.length} 条 · 帖子 {data.posts.length} 条
          </div>

          {/* 商品 */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-1.5">
              <ShoppingBag size={15} className="text-brand-500" /> 相关商品
            </h2>
            {data.products.length === 0 ? (
              <div className="text-sm text-ink-400 py-8 text-center">无匹配商品</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {data.products.map((p) => (
                  <div key={p.id} onClick={() => navigate(`/mall/product/${p.id}`)}
                       className="clickable bg-white rounded-xl shadow-card overflow-hidden hover:shadow-hover">
                    <div className="aspect-square bg-ink-100">
                      <PetImg src={p.image} alt={p.name} className="w-full h-full" />
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs text-ink-900 line-clamp-2 leading-snug min-h-[2.4em]">{p.name}</div>
                      <div className="text-brand-600 font-bold text-sm mt-1.5">¥{p.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 帖子 */}
          <section>
            <h2 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-1.5">
              <Newspaper size={15} className="text-brand-500" /> 相关帖子
            </h2>
            {data.posts.length === 0 ? (
              <div className="text-sm text-ink-400 py-8 text-center">无匹配帖子</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {data.posts.map((p) => (
                  <TextPostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {!loading && !q.trim() && (
        <div className="text-sm text-ink-400 py-16 text-center">输入关键词开始搜索</div>
      )}
    </div>
  )
}
