import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Package, ChevronRight, Clock } from 'lucide-react'
import { api } from '../../api.js'

const STATUS = {
  0: { text: '待支付', color: 'text-amber-600 bg-amber-50' },
  1: { text: '已支付', color: 'text-health bg-health-50' },
  2: { text: '已取消', color: 'text-ink-400 bg-ink-100' },
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await api.myOrders()
    setOrders(res.code === 200 ? res.data || [] : [])
  }

  const cancel = async (orderNo) => {
    if (!confirm('确认取消？')) return
    const res = await api.cancelOrder(orderNo)
    if (res.code === 200) load()
    else alert(res.msg)
  }

  if (orders === null) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Loader2 size={20} className="animate-spin inline mr-2" />加载中…</div>

  const filtered = filter === 'all' ? orders :
    orders.filter(o => filter === 'pending' ? o.status === 0 :
    filter === 'paid' ? o.status === 1 : o.status === 2)

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={() => navigate('/me')} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回个人中心
      </button>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl2 p-6 mb-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative flex items-center justify-between">
          <div>
            <span className="inline-block text-[10px] bg-white/25 px-2 py-0.5 rounded font-semibold">订单中心</span>
            <h1 className="text-xl md:text-2xl font-bold mt-2">我的订单 · {orders.length} 单</h1>
            <p className="text-sm opacity-90 mt-1">查看订单详情、物流、申请售后</p>
          </div>
          <Package size={48} className="opacity-50 hidden md:block" />
        </div>
      </div>

      {/* 状态筛选 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { k: 'all', l: '全部' }, { k: 'pending', l: '待支付' },
          { k: 'paid', l: '已支付' }, { k: 'cancelled', l: '已取消' }
        ].map(t => (
          <button key={t.k} onClick={() => setFilter(t.k)}
            className={`clickable text-xs px-3 py-1.5 rounded-full whitespace-nowrap
              ${filter === t.k ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 border border-ink-200'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl2 shadow-card text-center py-12">
          <Package size={40} className="text-ink-200 mx-auto mb-2" />
          <p className="text-sm text-ink-500">暂无订单</p>
          <button onClick={() => navigate('/mall/food')} className="clickable mt-4 bg-brand-500 text-white text-sm font-semibold px-5 py-2 rounded-lg">
            去商城逛逛
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => (
            <div key={o.id} onClick={() => navigate(`/me/order/${o.orderNo}`)}
              className="clickable bg-white rounded-xl2 shadow-card hover:shadow-hover p-4 cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-ink-400 font-mono">{o.orderNo}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${STATUS[o.status]?.color}`}>
                  {STATUS[o.status]?.text}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-ink-900">{o.subject || '订单详情'}</div>
                  <div className="text-[11px] text-ink-400 flex items-center gap-1 mt-1">
                    <Clock size={10} /> {o.createTime?.replace('T', ' ').slice(0, 16)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-brand-600 font-bold">¥{o.amount}</span>
                  <ChevronRight size={14} className="text-ink-400" />
                </div>
              </div>
              {o.status === 0 && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
                  <button onClick={(e) => { e.stopPropagation(); cancel(o.orderNo) }}
                    className="clickable text-xs text-ink-500 hover:text-red-500 border border-ink-200 px-3 py-1 rounded-lg">
                    取消订单
                  </button>
                  <button onClick={(e) => e.stopPropagation()} className="clickable text-xs bg-brand-500 text-white px-3 py-1 rounded-lg">
                    去支付
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
