import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { ArrowLeft, Loader2, ShoppingCart, Heart, Share2, Star, Truck, ShieldCheck, Plus, Minus, Sparkles, Tag, CheckCircle2, RotateCcw, RefreshCw } from 'lucide-react'
import { api } from '../../api.js'
import { products as mockProducts } from '../../data/mock.js'
import PetImg from '../../components/PetImg.jsx'
import { imgById } from '../../data/communityImages.js'
import { recordHistory } from '../../hooks/browsingHistory.js'
import DetailModal from '../../components/pages/DetailModal.jsx'

// 商品详情页 · Claymorphism 设计
export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { onLoginClick } = useOutletContext() || {}
  const [product, setProduct] = useState(null)
  const [qty, setQty] = useState(1)
  const [payModal, setPayModal] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [favorited, setFavorited] = useState(false)
  // 规格选择：每个 spec 组当前选中
  const [specSelect, setSpecSelect] = useState({})

  useEffect(() => { load() }, [id])

  const load = async () => {
    setProduct(null)
    setSpecSelect({})
    const res = await api.productDetail(id)
    if (res.code === 200 && res.data) {
      setProduct(res.data)
      // 初始化 default 选中
      try {
        const opts = res.data.specOptions ? JSON.parse(res.data.specOptions) : []
        const init = {}
        opts.forEach(s => { if (s.options?.length) init[s.name] = s.options[0] })
        setSpecSelect(init)
      } catch {}
    } else {
      const idx = Number(id) % mockProducts.length
      setProduct({ ...mockProducts[idx], id, image: `https://loremflickr.com/600/600/${mockProducts[idx].category || 'pet'}`, sales: 234, rating: 4.8 })
    }
  }

  // 浏览记录：进入商品详情即记录
  useEffect(() => {
    if (!product?.id) return
    recordHistory({
      type: 'product',
      id: product.id,
      title: product.name,
      image: imgById(product.id),
      path: `/mall/product/${product.id}`,
    })
  }, [product])

  // 解析后的规格列表
  const specs = useMemo(() => {
    if (!product?.specOptions) return []
    try { return JSON.parse(product.specOptions) } catch { return [] }
  }, [product])

  const specLabel = useMemo(() => {
    return Object.values(specSelect).filter(Boolean).join(' / ')
  }, [specSelect])

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find(i => i.id === product.id && i.specLabel === specLabel)
    if (existing) existing.qty += qty
    else cart.push({ ...product, qty, specLabel })
    localStorage.setItem('cart', JSON.stringify(cart))
    const tip = document.createElement('div')
    tip.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-white shadow-hover rounded-xl px-4 py-2.5 z-[100] text-sm font-bold text-health-600 font-display flex items-center gap-2'
    tip.innerHTML = '✅ 已加入购物车'
    document.body.appendChild(tip)
    setTimeout(() => tip.remove(), 1600)
  }

  const buyNow = async () => {
    const res = await api.createPayOrder(product.price * qty, product.name, {
      productId: product.id,
      specLabel,
      quantity: qty
    })
    if (res.code === 200) setPayModal(res.data)
    else alert(res.msg || '下单失败')
  }

  if (!product) return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <div className="bg-white rounded-xl2 shadow-card inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    </div>
  )

  // 商品图集（使用本地图片，4 张不同视角）
  // 注意：product.id 是雪花算法大整数字符串，不能 Number()（会丢精度导致所有商品图集相同），
  // 直接把字符串交给 imgById（内部用 BigInt 取模），4 个变体用后缀区分。
  const pid = product.id
  const images = [
    imgById(pid),
    imgById(String(pid) + '-b'),
    imgById(String(pid) + '-c'),
    imgById(String(pid) + '-d'),
  ]

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左：商品图（Clay 大图 + 缩略图） */}
        <div className="bg-white rounded-xl2 shadow-card p-4 overflow-hidden relative">
          <div className="aspect-square rounded-xl overflow-hidden bg-ink-50 relative">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500"
              onError={(e) => { e.currentTarget.src = imgById(String(product.id) + '-fb') }}
            />
            {/* 角标 */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] bg-brand-500 text-white px-2.5 py-1 rounded-full font-bold shadow-md">
                <Sparkles size={10} /> 精选
              </span>
              {product.stock <= 10 && product.stock > 0 && (
                <span className="text-[10px] bg-red-500 text-white px-2.5 py-1 rounded-full font-bold shadow-md">
                  ⚡ 仅剩 {product.stock} 件
                </span>
              )}
            </div>
          </div>
          {/* 缩略图 */}
          <div className="flex gap-2 mt-3">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`clickable w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                  ${activeImage === i ? 'border-brand-500 shadow-md scale-105' : 'border-transparent bg-ink-50'}`}
              >
                <PetImg src={src} className="w-full h-full object-cover" alt={`图${i + 1}`} />
              </button>
            ))}
            <button onClick={load}
                    className="clickable w-16 h-16 rounded-xl bg-ink-50 flex flex-col items-center justify-center text-ink-500 hover:text-brand-600 transition"
                    title="刷新详情">
              <RefreshCw size={18} />
              <span className="text-[10px] mt-1">刷新</span>
            </button>
          </div>
        </div>

        {/* 右：详情 */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl2 shadow-card p-5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold">
                    <Tag size={9} /> {product.category || '通用'}
                  </span>
                  {product.sales > 100 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                      🔥 热销
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                      ⭐ 好评
                    </span>
                </div>
                <h1 className="text-xl font-bold text-ink-900 font-display leading-snug">{product.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-500 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star size={12} className="fill-current" /> {product.rating || 4.8}
                  </span>
                  <span className="text-ink-300">|</span>
                  <span>{product.sales || 0}+ 已售</span>
                  <span className="text-ink-300">|</span>
                  <span>库存 {product.stock || 99}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setFavorited(!favorited)}
                  className="clickable w-10 h-10 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition"
                >
                  <Heart size={16} className={favorited ? 'fill-pink-500 text-pink-500' : 'text-ink-500'} />
                </button>
                <button className="clickable w-10 h-10 rounded-xl bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition">
                  <Share2 size={16} className="text-ink-500" />
                </button>
              </div>
            </div>

            {/* 价格 */}
            <div className="bg-ink-50 rounded-lg p-4 mt-4 relative overflow-hidden">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-extrabold text-brand-600 font-display">¥{product.price}</span>
                {product.oldPrice && (
                  <span className="text-sm text-ink-400 line-through">¥{product.oldPrice}</span>
                )}
                <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold shadow-md">
                  🔥 限时
                </span>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-bold">🎁 满199减30</span>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">🎫 新客立减</span>
                <span className="text-[10px] bg-trust-50 text-trust-600 px-2 py-0.5 rounded-full font-bold">📦 次日达</span>
              </div>
            </div>

            {/* 服务保障（Clay 三宫） */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { icon: Truck, l: '次日达', emoji: '🚚' },
                { icon: ShieldCheck, l: '正品保障', emoji: '🛡️' },
                { icon: RotateCcw, l: '7天退换', emoji: '🔄' }
              ].map((s, i) => (
                <div key={i} className="bg-ink-50 rounded-lg flex items-center gap-1.5 text-xs text-ink-600 justify-center py-2.5 font-semibold">
                  <span className="text-base">{s.emoji}</span>
                  {s.l}
                </div>
              ))}
            </div>

            {/* 规格选择 */}
            {specs.length > 0 && (
              <div className="mt-4 py-3 border-t border-ink-100 space-y-3">
                {specs.map((s) => (
                  <div key={s.name}>
                    <div className="text-xs text-ink-500 mb-1.5 font-semibold">{s.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.options.map((opt) => (
                        <button key={opt}
                                onClick={() => setSpecSelect(p => ({ ...p, [s.name]: opt }))}
                                className={`clickable text-xs px-3 py-1.5 rounded-full border transition-all
                                  ${specSelect[s.name] === opt
                                    ? 'bg-brand-500 text-white border-brand-500'
                                    : 'bg-white text-ink-700 border-ink-200 hover:border-brand-500'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 数量选择 */}
            <div className="flex items-center justify-between mt-4 py-3 border-t border-ink-100">
              <span className="text-sm text-ink-700 font-bold font-display">数量</span>
              <div className="flex items-center gap-1.5 bg-ink-50 rounded-lg p-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="clickable w-8 h-8 rounded-xl bg-white text-ink-700 hover:text-brand-600 flex items-center justify-center shadow-sm"
                >
                  <Minus size={12} strokeWidth={3} />
                </button>
                <span className="w-10 text-center text-sm font-bold font-display">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="clickable w-8 h-8 rounded-xl bg-white text-ink-700 hover:text-brand-600 flex items-center justify-center shadow-sm"
                >
                  <Plus size={12} strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* 操作按钮（Clay 主次） */}
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={addToCart}
                className="clickable flex-1 bg-white border border-brand-500 text-brand-600 py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5"
              >
                <ShoppingCart size={16} /> 加入购物车
              </button>
              <button
                onClick={buyNow}
                className="clickable flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-md font-display tracking-wide"
                style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
              >
                ⚡ 立即购买
              </button>
            </div>
          </div>

          {/* 商品参数 */}
          <div className="bg-white rounded-xl2 shadow-card p-5">
            <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-1.5">
              <span className="w-1 h-4 bg-brand-500 rounded-full" /> 商品参数
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { k: '品牌', v: '萌宠优选', icon: '🏷️' },
                { k: '适用对象', v: '全犬/全猫', icon: '🐾' },
                { k: '产地', v: '中国', icon: '🇨🇳' },
                { k: '保质期', v: '12 个月', icon: '📅' }
              ].map((row, i) => (
                <div key={i} className="bg-ink-50 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-base">{row.icon}</span>
                  <div>
                    <div className="text-[10px] text-ink-400">{row.k}</div>
                    <div className="text-ink-900 font-bold">{row.v}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 看了又看 */}
          <div className="bg-white rounded-xl2 shadow-card p-5 relative overflow-hidden">
            <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-1.5">
              <span className="w-1 h-4 bg-brand-500 rounded-full" /> 看了又看
            </h3>
            <div className="grid grid-cols-4 gap-2.5">
              {mockProducts.slice(0, 4).map((p, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/mall/product/${i}`)}
                  className="clickable bg-ink-50 hover:bg-ink-100 rounded-lg p-2 cursor-pointer transition"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-ink-100 relative">
                    <img src={imgById(i + 50)} alt={p.name} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 right-1 text-[8px] bg-rose-500 text-white px-1 py-0.5 rounded font-bold">HOT</div>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-700 mt-1 line-clamp-2 leading-tight min-h-[2em] font-semibold">{p.name}</div>
                  <div className="text-brand-600 font-extrabold text-xs mt-0.5 font-display">¥{p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 支付弹窗（Clay 模态） */}
      <DetailModal open={!!payModal} onClose={() => { setPayModal(null); navigate('/me/orders') }} title="下单成功" wide
        footer={<>
          <button onClick={() => setPayModal(null)} className="clickable bg-ink-50 hover:bg-ink-100 text-sm text-ink-700 px-4 py-2 rounded-xl">继续购物</button>
          <button
            onClick={() => navigate('/me/orders')}
            className="clickable text-white text-sm font-bold px-5 py-2 rounded-xl shadow-md font-display"
            style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
          >
            查看订单 →
          </button>
        </>}>
        {payModal && (
          <div className="text-center py-4">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-health-400 to-health-600 text-white flex items-center justify-center shadow-md animate-bounce-soft">
              <CheckCircle2 size={36} strokeWidth={3} />
            </div>
            <h3 className="text-base font-bold text-ink-900 font-display mb-1">订单已创建，请尽快支付</h3>
            <p className="text-xs text-ink-500 mb-4">请在 30 分钟内完成支付，超时订单将自动取消</p>
            <div className="bg-ink-50 rounded-lg p-3.5 text-left space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">订单号</span>
                <span className="font-mono text-ink-900 font-bold">{payModal.orderNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">商品</span>
                <span className="text-ink-900 font-semibold truncate max-w-[200px]">{product.name}</span>
              </div>
              <div className="flex justify-between text-base pt-1.5 border-t border-ink-200/50">
                <span className="text-ink-500">应付金额</span>
                <span className="text-brand-600 font-extrabold font-display">¥{payModal.amount}</span>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </section>
  )
}
