import { useState, useEffect, useCallback } from 'react'
import { Zap, Clock, Loader2, RefreshCw } from 'lucide-react'
import { api } from '../api'

// 秒杀商品对应的本地图片（已替换为爬取的商品图：主粮/零食/猫砂/驱虫/用品/玩具）
const SECKILL_IMGS = [
  '/assets/mall/products/food/food-001.jpg',
  '/assets/mall/products/snack/snack-001.jpg',
  '/assets/mall/products/litter/litter-001.jpg',
  '/assets/mall/products/deworm/deworm-001.jpg',
  '/assets/mall/products/supply/supply-001.jpg',
  '/assets/mall/products/toy/toy-001.jpg',
]

// 模块级共享缓存：首页 ↔ 商城 共用，避免重复请求
const _seckillCache = { items: null }

/**
 * 限时秒杀组件（首页 + 商城共用）
 *  - 自动加载 seckillList（有缓存时跳过）
 *  - 每秒倒计时、库存进度条
 *  - 抢券 → 模拟支付，完整流程
 *  - 登录拦截：未登录时触发登录弹窗
 */
export default function SeckillSection() {
  const [items, setItems] = useState(_seckillCache.items || [])
  const [countdowns, setCountdowns] = useState({})
  const [grabbing, setGrabbing] = useState({})
  const [grabResult, setGrabResult] = useState(null)

  const loadSeckill = useCallback(() => {
    api.seckillList().then(res => {
      if (res.code === 200 && res.data?.length) {
        setItems(res.data)
        _seckillCache.items = res.data
      }
    })
  }, [])

  useEffect(() => {
    if (_seckillCache.items && _seckillCache.items.length) return
    loadSeckill()
  }, [loadSeckill])

  // 倒计时器：统一固定为 3 小时（按运营要求），所有秒杀项共用一个 3h 窗口
  // 用 localStorage 持久化锚点，刷新页面后继续倒计时，到点自动续 3h
  useEffect(() => {
    if (!items.length) return
    const KEY = 'seckill_end_3h'
    const THREE_H = 3 * 60 * 60 * 1000
    const ensureEnd = () => {
      let end = Number(localStorage.getItem(KEY))
      if (!end || end <= Date.now()) {
        end = Date.now() + THREE_H
        localStorage.setItem(KEY, String(end))
      }
      return end
    }
    const tick = () => {
      const now = Date.now()
      let end = ensureEnd()
      if (end <= now) end = ensureEnd() // 已到期则续 3h
      const diff = Math.max(0, end - now)
      const one = {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        ended: diff <= 0,
        started: true,
      }
      const next = {}
      for (const v of items) next[v.id] = one
      setCountdowns(next)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [items])

  const handleSeckill = async (voucherId) => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.dispatchEvent(new CustomEvent('pethome:auth:required'))
      return
    }
    setGrabbing(g => ({ ...g, [voucherId]: true }))
    try {
      const res = await api.seckill(voucherId)
      if (res.code === 200) {
        const voucher = items.find(v => String(v.id) === String(voucherId))
        setGrabResult({ orderId: res.data, voucherId, voucherName: voucher?.name })
        loadSeckill()
      } else {
        alert(res.msg || '抢券失败')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setGrabbing(g => ({ ...g, [voucherId]: false }))
    }
  }

  const handlePay = async () => {
    if (!grabResult) return
    const res = await api.seckillPay(grabResult.orderId)
    if (res.code === 200) {
      alert('🎉 支付成功！优惠券已发放至账户')
      setGrabResult(null)
      loadSeckill()
    } else {
      alert(res.msg || '支付失败')
    }
  }

  if (!items.length) return null

  return (
    <div className="rounded-xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-4 ring-1 ring-red-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="fill-yellow-400 text-yellow-500" />
          <span className="font-bold text-lg tracking-wide text-red-700">限时秒杀</span>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
            <Clock size={10} className="inline mr-0.5" /> 实时抢购
          </span>
        </div>
        <button onClick={loadSeckill} className="clickable text-xs bg-white text-red-600 hover:bg-red-50 px-3 py-1 rounded-full font-semibold flex items-center gap-1 ring-1 ring-red-200">
          <RefreshCw size={11} /> 刷新
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((v, idx) => {
          const cd = countdowns[v.id] || {}
          const isGrabbing = grabbing[v.id]
          const imgSrc = SECKILL_IMGS[idx % SECKILL_IMGS.length]
          const soldPercent = v.total > 0 ? ((v.total - v.remain) / v.total) * 100 : 0
          return (
            <div key={v.id} className="bg-white rounded-xl overflow-hidden text-ink-900 shadow-card hover:shadow-hover transition-shadow">
              <div className="relative aspect-square bg-ink-50">
                <img src={imgSrc} alt={v.name} className="w-full h-full object-cover"
                     onError={(e) => { e.currentTarget.style.display = 'none' }} />
                {cd.ended ? (
                  <span className="absolute top-1.5 left-1.5 text-[10px] bg-gray-500 text-white px-2 py-0.5 rounded-full font-bold">已结束</span>
                ) : !cd.started ? (
                  <span className="absolute top-1.5 left-1.5 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">未开始</span>
                ) : (
                  <span className="absolute top-1.5 left-1.5 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold font-mono tracking-wider">
                    {String(cd.hours).padStart(2, '0')}:{String(cd.minutes).padStart(2, '0')}:{String(cd.seconds).padStart(2, '0')}
                  </span>
                )}
                <span className="absolute top-1.5 right-1.5 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded-full">剩{v.remain}件</span>
              </div>
              <div className="p-2.5">
                <div className="text-[11px] text-ink-900 line-clamp-2 leading-tight min-h-[2em] font-medium">{v.name}</div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-red-600 font-extrabold text-base">¥{v.discount}</span>
                </div>
                <div className="mt-1.5">
                  <div className="flex items-center justify-between text-[9px] text-ink-400 mb-0.5">
                    <span>已抢 {Math.round(soldPercent)}%</span>
                    <span>{v.remain}/{v.total}</span>
                  </div>
                  <div className="w-full h-1.5 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{
                           width: `${Math.max(5, soldPercent)}%`,
                           background: soldPercent > 80 ? '#ef4444' : soldPercent > 50 ? '#f97316' : '#22c55e'
                         }} />
                  </div>
                </div>
                <button
                  onClick={() => handleSeckill(v.id)}
                  disabled={isGrabbing || cd.ended || !cd.started || v.remain <= 0}
                  className="clickable mt-2 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-[11px] font-bold py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
                >
                  {isGrabbing ? (
                    <><Loader2 size={11} className="animate-spin" /> 抢券中…</>
                  ) : cd.ended ? '已结束' : !cd.started ? '未开始' : v.remain <= 0 ? '已抢光' : (
                    <><Zap size={11} /> 立即抢券</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 抢券成功弹窗 */}
      {grabResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setGrabResult(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-hover" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-bold text-ink-900 mb-2">抢券成功！</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <div className="text-sm font-semibold text-red-700">{grabResult.voucherName}</div>
                <div className="text-[11px] text-ink-400 mt-1">订单号：{grabResult.orderId}</div>
              </div>
              <p className="text-xs text-ink-500 mb-4">
                基于 Redis Lua 原子扣减 + RabbitMQ 异步下单<br />
                库存已锁定，请尽快完成支付
              </p>
              <div className="flex gap-2 justify-center">
                <button onClick={() => setGrabResult(null)}
                        className="clickable text-sm text-ink-500 hover:text-ink-900 px-4 py-2.5 border border-ink-200 rounded-lg">稍后支付</button>
                <button onClick={handlePay}
                        className="clickable bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-md flex items-center gap-1.5">
                  <Zap size={14} /> 模拟支付
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
