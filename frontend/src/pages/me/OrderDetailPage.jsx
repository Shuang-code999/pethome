import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Package, Clock, CheckCircle2, Truck, MapPin, CreditCard } from 'lucide-react'
import { api } from '../../api.js'

const STATUS_META = {
  0: { text: '待支付', color: 'text-amber-600', bg: 'bg-amber-50', step: 1, icon: CreditCard },
  1: { text: '已支付', color: 'text-health', bg: 'bg-health-50', step: 2, icon: CheckCircle2 },
  2: { text: '已取消', color: 'text-ink-400', bg: 'bg-ink-100', step: 0, icon: Clock },
}

export default function OrderDetailPage() {
  const { orderNo } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)

  useEffect(() => { load() }, [orderNo])

  const load = async () => {
    const res = await api.queryOrder(orderNo)
    if (res.code === 200) setOrder(res.data)
  }

  if (!order) return <div className="mx-auto max-w-2xl px-4 py-16 text-center"><Loader2 size={20} className="animate-spin inline mr-2" />加载中…</div>

  const meta = STATUS_META[order.status] || STATUS_META[0]
  const StepIcon = meta.icon

  return (
    <section className="mx-auto max-w-2xl px-4 py-6 fade-in">
      <button onClick={() => navigate('/me/orders')} className="clickable flex items-center gap-1 text-sm text-ink-500 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回订单列表
      </button>

      {/* 状态卡 */}
      <div className={`${meta.bg} rounded-xl2 p-6 mb-4 relative overflow-hidden`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-xs font-semibold ${meta.color}`}>订单状态</div>
            <div className={`text-2xl font-bold ${meta.color} mt-1`}>{meta.text}</div>
            <div className="text-xs text-ink-500 mt-2">订单号：{order.orderNo}</div>
          </div>
          <StepIcon size={48} className={meta.color} />
        </div>

        {/* 进度条 */}
        {order.status !== 2 && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-ink-500 mb-2">
              <span>下单</span><span>支付</span><span>完成</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${(meta.step / 2) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="bg-white rounded-xl2 shadow-card p-5 mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-1.5">
          <Package size={14} className="text-brand-500" /> 商品信息
        </h3>
        <div className="flex items-start gap-3 p-3 bg-ink-50 rounded-lg">
          <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center">
            <Package size={24} className="text-ink-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-900">{order.subject || '订单商品'}</div>
            <div className="text-xs text-ink-500 mt-1">数量 1 · 模拟订单详情</div>
          </div>
          <div className="text-brand-600 font-bold">¥{order.amount}</div>
        </div>
      </div>

      {/* 金额明细 */}
      <div className="bg-white rounded-xl2 shadow-card p-5 mb-4">
        <h3 className="text-sm font-bold text-ink-900 mb-3">金额明细</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-500">商品金额</span><span>¥{order.amount}</span></div>
          <div className="flex justify-between"><span className="text-ink-500">运费</span><span>¥0.00</span></div>
          <div className="flex justify-between pt-2 border-t border-ink-100 text-base">
            <span className="font-semibold">实付</span>
            <span className="text-brand-600 font-bold">¥{order.amount}</span>
          </div>
        </div>
      </div>

      {/* 订单信息 */}
      <div className="bg-white rounded-xl2 shadow-card p-5">
        <h3 className="text-sm font-bold text-ink-900 mb-3">订单信息</h3>
        <div className="space-y-2 text-sm">
          {[
            ['订单号', order.orderNo],
            ['创建时间', order.createTime?.replace('T', ' ').slice(0, 19)],
            ['支付方式', '支付宝沙箱'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-1.5 border-b border-ink-100 last:border-0">
              <span className="text-ink-500">{k}</span><span className="text-ink-900 font-mono text-xs">{v || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {order.status === 0 && (
        <button onClick={() => alert('支付功能开发中（模拟支付）')}
          className="clickable w-full mt-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3 rounded-lg">
          立即支付 ¥{order.amount}
        </button>
      )}
    </section>
  )
}
