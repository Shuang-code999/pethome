import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Trash2, Plus, Minus, Loader2, Sparkles, Tag, Truck, ShieldCheck, Gift, ChevronRight, Package, X, Zap, Heart, Percent, Coins, ArrowRight } from 'lucide-react'
import { api } from '../../api.js'
import { imgById } from '../../data/communityImages.js'
import PetImg from '../../components/PetImg.jsx'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 购物车页 · Claymorphism 设计
export default function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setItems(cart)
    setSelected(Object.fromEntries(cart.map((_, i) => [i, true])))
    setLoaded(true)
  }, [])

  const updateQty = (idx, delta) => {
    const next = [...items]
    next[idx] = { ...next[idx], qty: Math.max(1, next[idx].qty + delta) }
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next))
  }

  const remove = (idx) => {
    // 用确认卡片替代 confirm
    if (!window.confirm('确定要删除该商品吗？')) return
    const next = items.filter((_, i) => i !== idx)
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next))
  }

  const toggle = (idx) => setSelected({ ...selected, [idx]: !selected[idx] })
  const allSelected = items.length > 0 && items.every((_, i) => selected[i])
  const toggleAll = () => setSelected(Object.fromEntries(items.map((_, i) => [i, !allSelected])))

  const total = items.reduce((sum, it, i) => selected[i] ? sum + it.price * it.qty : sum, 0)
  const totalQty = items.reduce((s, it, i) => selected[i] ? s + it.qty : s, 0)
  const shippingFee = total >= 99 ? 0 : 10
  const finalTotal = total + shippingFee

  const checkout = async () => {
    const selectedItems = items.filter((_, i) => selected[i])
    if (selectedItems.length === 0) { alert('请选择商品'); return }
    const subject = selectedItems.map(i => i.name).join('、')
    const res = await api.createPayOrder(finalTotal, subject)
    if (res.code === 200) {
      const remain = items.filter((_, i) => !selected[i])
      setItems(remain)
      localStorage.setItem('cart', JSON.stringify(remain))
      // 替代 alert
      const tip = document.createElement('div')
      tip.className = 'fixed top-20 left-1/2 -translate-x-1/2 clay bg-white px-5 py-3 z-[100] text-sm font-bold text-health-600 font-display'
      tip.innerHTML = `🎉 订单已创建：${res.data.orderNo}`
      document.body.appendChild(tip)
      setTimeout(() => { tip.remove(); navigate('/me/orders') }, 1800)
    } else alert(res.msg || '下单失败')
  }

  if (!loaded) return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="clay inline-flex items-center gap-2 text-ink-500 text-sm px-5 py-2.5">
        <Loader2 size={16} className="animate-spin" /> 加载购物车…
      </div>
    </div>
  )

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-brand-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* Hero（Clay + 极光橙） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-5 text-white shadow-clay">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,#FFB099 0%,#FF7A59 50%,#F2613E 100%)'
        }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute top-4 right-8 text-6xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.6s' }}>🛒</div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> 我的购物车
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              购物车 <span className="text-3xl">🛍️</span>
              <span className="text-base font-medium text-white/90">· {items.length} 件</span>
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">满 ¥99 包邮 · 7 天无理由退换 · 满 199 减 30</p>
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-md">
              {[
                { num: items.length, label: '商品件数', icon: '📦' },
                { num: totalQty, label: '选中件数', icon: '✅' },
                { num: '¥' + finalTotal.toFixed(0), label: '应付金额', icon: '💰' }
              ].map((s, i) => (
                <div key={i} className="glass text-white rounded-clay px-3 py-2 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-base font-extrabold font-display">{s.num}</div>
                  <div className="text-[10px] opacity-90">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* 优惠提示（Clay 横条） */}
      {items.length > 0 && total < 99 && (
        <Reveal delay={1} className="clay clay-hover p-3.5 mb-4 flex items-center gap-3 relative overflow-hidden">
          <div className="absolute -right-2 -top-2 text-4xl opacity-10" aria-hidden>📦</div>
          <div className="w-10 h-10 rounded-clay bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-glow shrink-0 text-lg">
            🚚
          </div>
          <div className="flex-1 min-w-0 text-xs text-ink-700">
            再买 <strong className="text-brand-600 font-extrabold font-display">¥{(99 - total).toFixed(2)}</strong> 即可享 <strong className="text-brand-600 font-extrabold">免邮</strong>！
            <div className="mt-1.5 h-1.5 bg-ink-100 rounded-full overflow-hidden clay-inset">
              <div className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all"
                   style={{ width: `${Math.min(100, (total / 99) * 100)}%` }} />
            </div>
          </div>
        </Reveal>
      )}

      {items.length === 0 ? (
        <Reveal className="clay text-center py-16 relative overflow-hidden">
          <div className="absolute top-6 left-12 text-5xl opacity-30 animate-bounce-soft" aria-hidden>🐶</div>
          <div className="absolute top-10 right-16 text-4xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.5s' }}>🐱</div>
          <div className="absolute bottom-12 left-20 text-4xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '1s' }}>🦴</div>
          <div className="absolute bottom-6 right-12 text-5xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '1.5s' }}>🛒</div>

          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-clay bg-gradient-to-br from-peach via-brand-100 to-rose flex items-center justify-center mb-4 shadow-glow animate-heartbeat">
              <ShoppingCart size={42} className="text-brand-600" />
            </div>
            <h3 className="text-xl font-bold text-ink-900 font-display mb-2">购物车空空如也</h3>
            <p className="text-sm text-ink-500 mb-1">去看看有什么好货吧</p>
            <p className="text-xs text-ink-400 mb-6">新客立减 10 元 · 满 199 减 30</p>
            <button
              onClick={() => navigate('/mall/food')}
              className="clickable text-sm font-bold px-7 py-2.5 inline-flex items-center gap-1.5 text-white rounded-clay shadow-glow font-display tracking-wide"
              style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
            >
              <ShoppingCart size={16} /> 去逛商城
              <ArrowRight size={14} />
            </button>
          </div>
        </Reveal>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* 左：商品列表 */}
          <div className="space-y-3">
            {items.map((it, i) => (
              <Reveal
                key={i}
                delay={Math.min(i + 1, 5)}
                className={`clay clay-hover p-4 flex items-center gap-3 transition-all relative
                  ${selected[i] ? '' : 'opacity-60'}`}
              >
                {/* 自定义复选框（Clay） */}
                <button
                  onClick={() => toggle(i)}
                  className={`clickable w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition-all
                    ${selected[i]
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow'
                      : 'clay-inset'}`}
                >
                  {selected[i] && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <div
                  onClick={() => navigate(`/mall/product/${it.id}`)}
                  className="w-20 h-20 rounded-clay overflow-hidden bg-ink-100 cursor-pointer shrink-0 clay-inset"
                >
                  <PetImg
                    src={it.image || imgById(it.id || it.name)}
                    className="w-full h-full object-cover"
                    alt={it.name}
                    fallbackText="🛍️"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    onClick={() => navigate(`/mall/product/${it.id}`)}
                    className="text-sm font-bold text-ink-900 truncate cursor-pointer hover:text-brand-600 font-display"
                  >
                    {it.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-brand-600 font-extrabold text-base font-display">¥{it.price}</span>
                    {it.oldPrice && (
                      <span className="text-[10px] text-ink-400 line-through">¥{it.oldPrice}</span>
                    )}
                    <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full font-bold">满199减30</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {/* 数量选择（Clay 圆角） */}
                    <div className="flex items-center clay-inset p-0.5">
                      <button
                        onClick={() => updateQty(i, -1)}
                        className="clickable w-7 h-7 rounded-clay bg-white text-ink-700 hover:text-brand-600 flex items-center justify-center shadow-clay-sm"
                      >
                        <Minus size={11} strokeWidth={3} />
                      </button>
                      <span className="w-9 text-center text-xs font-bold font-display">{it.qty}</span>
                      <button
                        onClick={() => updateQty(i, 1)}
                        className="clickable w-7 h-7 rounded-clay bg-white text-ink-700 hover:text-brand-600 flex items-center justify-center shadow-clay-sm"
                      >
                        <Plus size={11} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="clickable w-7 h-7 rounded-full clay-inset flex items-center justify-center text-ink-400 hover:text-pink-500 transition"
                        title="移到收藏"
                      >
                        <Heart size={12} />
                      </button>
                      <button
                        onClick={() => remove(i)}
                        className="clickable w-7 h-7 rounded-full clay-inset flex items-center justify-center text-ink-400 hover:text-red-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-brand-600 font-extrabold text-lg font-display">¥{(it.price * it.qty).toFixed(2)}</div>
                </div>
              </Reveal>
            ))}

            {/* 推荐凑单（Clay） */}
            <Reveal delay={4} className="clay clay-hover p-4 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 text-4xl opacity-10" aria-hidden>🎁</div>
              <h4 className="text-sm font-bold text-ink-900 font-display mb-3 flex items-center gap-1.5">
                <Gift size={14} className="text-brand-500" /> 加购推荐
                <span className="text-[10px] text-ink-400 font-normal ml-1">凑单更划算</span>
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { name: '🐾 磨牙棒', price: 19, icon: '🦴' },
                  { name: '🛁 宠物湿巾', price: 29, icon: '🧻' },
                  { name: '🎾 弹力球', price: 15, icon: '⚽' }
                ].map((rec, i) => (
                  <button
                    key={i}
                    className="clickable clay-btn p-2 text-left"
                  >
                    <div className="aspect-square rounded-clay bg-gradient-to-br from-peach to-brand-100 flex items-center justify-center text-3xl mb-1.5">
                      {rec.icon}
                    </div>
                    <div className="text-[11px] font-semibold text-ink-700 truncate">{rec.name}</div>
                    <div className="text-brand-600 font-extrabold text-xs font-display">¥{rec.price}</div>
                  </button>
                ))}
              </div>
            </Reveal>
          </div>

          {/* 右：结算栏（Clay 粘性） */}
          <Reveal delay={1} className="clay clay-hover p-5 lg:sticky lg:top-20 lg:self-start relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-6xl opacity-10" aria-hidden>🧾</div>
            <h3 className="text-sm font-bold text-ink-900 mb-3 font-display flex items-center gap-1.5">
              <span className="w-1 h-4 bg-brand-500 rounded-full" /> 订单概要
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500 text-xs">商品总数</span>
                <span className="text-ink-900 font-semibold">{totalQty} 件</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 text-xs">商品金额</span>
                <span className="text-ink-900 font-semibold">¥{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500 text-xs">运费</span>
                <span className={`font-bold ${total >= 99 ? 'text-health-600' : 'text-ink-900'}`}>
                  {total >= 99 ? '✓ 免邮' : `¥${shippingFee}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">优惠</span>
                <span className="text-brand-600 font-bold">-¥0.00</span>
              </div>
              <div className="clay-inset px-3 py-2.5 flex justify-between items-baseline mt-2">
                <span className="text-xs text-ink-600">应付</span>
                <span className="text-2xl font-extrabold text-brand-600 font-display">¥{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* 优惠券（Clay 提示） */}
            <div className="clay-inset mt-4 p-2.5 flex items-center gap-2 text-xs">
              <Percent size={14} className="text-brand-500 shrink-0" />
              <span className="text-ink-600 flex-1">使用优惠券</span>
              <span className="text-brand-600 font-bold">3 张可用</span>
              <ChevronRight size={12} className="text-ink-400" />
            </div>
            <div className="clay-inset mt-2 p-2.5 flex items-center gap-2 text-xs">
              <Coins size={14} className="text-amber-500 shrink-0" />
              <span className="text-ink-600 flex-1">可用积分抵扣</span>
              <span className="text-amber-600 font-bold">128 分</span>
              <ChevronRight size={12} className="text-ink-400" />
            </div>

            {/* 全选 + 结算 */}
            <div className="flex items-center justify-between mt-5">
              <label className="flex items-center gap-2 text-xs text-ink-700 cursor-pointer">
                <button
                  onClick={toggleAll}
                  className={`clickable w-5 h-5 rounded-md flex items-center justify-center transition-all
                    ${allSelected
                      ? 'bg-gradient-to-br from-brand-500 to-brand-600 shadow-glow'
                      : 'clay-inset'}`}
                >
                  {allSelected && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <span className="font-semibold">全选</span>
              </label>
              <span className="text-[10px] text-ink-400">已选 {totalQty} 件</span>
            </div>

            <button
              onClick={checkout}
              className="clickable w-full mt-3 py-3.5 rounded-clay text-sm font-bold text-white shadow-glow font-display tracking-wide flex items-center justify-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#FF7A59,#F2613E)' }}
            >
              <Zap size={14} className="fill-current" /> 立即结算
              <span className="text-xs opacity-90">(¥{finalTotal.toFixed(2)})</span>
            </button>

            {/* 保障 */}
            <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-ink-500">
              <span className="flex items-center gap-0.5"><ShieldCheck size={10} /> 正品保障</span>
              <span className="text-ink-300">·</span>
              <span className="flex items-center gap-0.5"><Truck size={10} /> 次日达</span>
              <span className="text-ink-300">·</span>
              <span>7天退换</span>
            </div>
          </Reveal>
        </div>
      )}
    </section>
  )
}
