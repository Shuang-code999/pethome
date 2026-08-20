import { useState, useEffect } from 'react'
import { ShoppingCart, Zap, Loader2, Tag, CheckCircle2, Search } from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import PetImg from '../PetImg'
import { api } from '../../api'
import { categories, products as mockProducts } from '../../data/mock.js'

export default function MallPage({ logged, onNavigate, onLoginClick }) {
  const [cats, setCats] = useState(categories)
  const [activeCat, setActiveCat] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [seckill, setSeckill] = useState(null)
  const [items, setItems] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [grabbing, setGrabbing] = useState({})
  const [grabResult, setGrabResult] = useState(null)

  const loadProducts = async () => {
    setItems(null)
    const params = { page: 1, size: 50 }
    if (activeCat !== '全部') params.category = activeCat
    if (keyword.trim()) params.keyword = keyword.trim()
    const res = await api.products(params)
    let list = res.code === 200 && res.data?.records?.length ? res.data.records : mockProducts
    setItems(list)
  }
  const loadSeckill = async () => {
    const res = await api.seckillList()
    setSeckill(res.code === 200 ? res.data || [] : [])
  }
  useEffect(() => { loadProducts(); loadSeckill() }, [activeCat])

  const search = (e) => {
    e.preventDefault()
    loadProducts()
  }

  const grab = async (voucherId) => {
    if (!logged) { onLoginClick(); return }
    setGrabbing(g => ({ ...g, [voucherId]: true }))
    const res = await api.seckill(voucherId)
    setGrabbing(g => ({ ...g, [voucherId]: false }))
    if (res.code === 200) setGrabResult({ orderId: res.data, voucherId })
    else alert(res.msg || '抢券失败')
  }

  const pay = async () => {
    const res = await api.seckillPay(grabResult.orderId)
    if (res.code === 200) { alert('支付成功（模拟）'); setGrabResult(null) }
    else alert(res.msg || '支付失败')
  }

  const openDetail = async (p) => {
    setDetail(p); setDetailData(null)
    if (p.id) {
      const res = await api.productDetail(p.id)
      if (res.code === 200) setDetailData(res.data)
    }
  }

  const img = (p) => p.image || p.img
  const oldP = (p) => p.oldPrice || p.old
  const tags = (p) => p.tags || (p.tag ? [p.tag] : [])

  return (
    <PageShell title="爱宠商城" subtitle="智能推荐 · 限时秒杀 · 品质保证" onBack={() => onNavigate('home')} accent="brand">
      {/**/}
      <form onSubmit={search} className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-2">
          <Search size={16} className="text-ink-400" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜索商品" className="bg-transparent text-sm outline-none flex-1" />
        </div>
        <button type="submit" className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">搜索</button>
      </form>

      {/**/}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-5 -mt-1">
        {['全部', ...cats.map(c => c.name)].map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`clickable shrink-0 text-sm px-3 py-1.5 rounded-full ${activeCat === c ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-300/40'}`}>
            {c}
          </button>
        ))}
      </div>

      {/**/}
      {seckill && seckill.length > 0 && (
        <div className="mb-6 rounded-xl2 bg-gradient-to-r from-brand-50 to-brand-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-brand-600" />
            <span className="font-bold text-ink-900">限时秒杀</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {seckill.map(v => (
              <div key={v.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-card">
                <div className="min-w-0">
                  <div className="font-semibold text-ink-900 text-sm truncate">{v.name}</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-brand-600 font-bold">¥{v.discount}</span>
                    <span className="text-xs text-ink-400">剩余 {v.remain}/{v.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${(v.remain / v.total) * 100}%` }} />
                  </div>
                </div>
                <button onClick={() => grab(v.id)} disabled={grabbing[v.id]}
                  className="clickable shrink-0 ml-3 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
                  {grabbing[v.id] ? '...' : '抢券'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/**/}
      {items === null ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 加载中…</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((p, i) => (
            <div key={p.id || i} onClick={() => openDetail(p)}
              className="clickable bg-white rounded-xl shadow-card overflow-hidden flex flex-col hover:shadow-hover">
              <div className="aspect-square bg-ink-100">
                <PetImg src={img(p)} alt={p.name} className="w-full h-full" />
              </div>
              <div className="p-2.5">
                <div className="text-xs text-ink-900 line-clamp-2 leading-tight min-h-[2.2em]">{p.name}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-brand-600 font-bold text-sm">¥{p.price}</span>
                  {oldP(p) && <span className="text-[11px] text-ink-400 line-through">¥{oldP(p)}</span>}
                </div>
                {tags(p)?.length > 0 && (
                  <span className="inline-block mt-1 text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{tags(p)[0]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/**/}
      <DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide
        footer={<button onClick={async () => {
          if (!logged) { onLoginClick(); return }
          const price = detail.price || 0
          const res = await api.createPayOrder(price, detail.name)
          if (res.code === 200 && res.data?.payForm) {
            const gateway = 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
            window.open(gateway + '?' + res.data.payForm, '_blank')
            setDetail(null)
          } else {
            alert(res.msg || '创建支付失败')
          }
        }} className="clickable flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"><ShoppingCart size={14} /> 立即购买</button>
        }>
        {detail && (
          <div>
            <div className="aspect-video bg-ink-100 rounded-lg overflow-hidden mb-3">
              <PetImg src={img(detail)} alt={detail.name} className="w-full h-full" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-bold text-brand-600">¥{detail.price}</span>
              {oldP(detail) && <span className="text-sm text-ink-400 line-through">¥{oldP(detail)}</span>}
            </div>
            {tags(detail)?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">{tags(detail).map((t, i) => <span key={i} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded">{t}</span>)}</div>
            )}
            <p className="text-xs text-ink-500">库存 {detailData?.stock ?? detail?.stock ?? '充足'} 件 · 品质保证 · 7 天无理由</p>
            <p className="text-xs text-ink-400 mt-2">商品描述由真实后端 /product 接口提供，点击「加入购物车」体验完整选购流程（模拟）。</p>
          </div>
        )}
      </DetailModal>

      {/**/}
      <DetailModal open={!!grabResult} onClose={() => setGrabResult(null)} title="抢券成功！" wide
        footer={<>
          <button onClick={() => setGrabResult(null)} className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2">稍后支付</button>
          <button onClick={pay} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">模拟支付</button>
        </>}>
        {grabResult && (
          <div className="text-center py-2">
            <CheckCircle2 size={40} className="text-health mx-auto mb-3" />
            <p className="text-sm text-ink-700">订单号：<b className="text-ink-900">{grabResult.orderId}</b></p>
            <p className="text-xs text-ink-400 mt-1">点「模拟支付」完成下单（真实支付需商户资质，此处 mock）</p>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}
