import { useEffect, useState } from 'react'
import { ShieldCheck, Check, Crown, FileText, Loader2 } from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import { api } from '../../api'

const HIGHLIGHT_COLORS = {
  '推荐': 'text-brand-600',
  '热销': 'text-red-500',
  '入门': 'text-ink-500',
}

export default function InsurancePage({ logged, onNavigate }) {
  const [plans, setPlans] = useState(null)
  const [detail, setDetail] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const res = await api.insurancePlans()
    if (res.code === 200) setPlans(res.data || [])
    else setPlans([])
  }

  const parseCoverage = (s) => {
    if (!s) return []
    try { return JSON.parse(s) } catch { return [] }
  }

  return (
    <PageShell title="宠物保险" subtitle="0 免赔 · 快速理赔 · 宠物专属医疗保障" onBack={() => onNavigate('home')} accent="brand">
      {plans === null ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 加载中…</div>
      ) : plans.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-10">暂无保险方案</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {plans.map(p => (
              <div key={p.id} onClick={() => setDetail(p)}
                className={`clickable relative bg-white rounded-xl2 p-4 flex flex-col ${p.tag === '推荐' ? 'ring-2 ring-brand-500 shadow-hover' : 'shadow-card'} hover:shadow-hover`}>
                {p.tag === '推荐' && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Crown size={10} /> 推荐
                  </span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck size={18} className={p.tag === '推荐' ? 'text-brand-600' : 'text-ink-500'} />
                  <span className="font-bold text-ink-900">{p.name}</span>
                  {p.tag && <span className={`text-[10px] px-1.5 py-0.5 rounded bg-ink-100 ${HIGHLIGHT_COLORS[p.tag] || 'text-ink-500'}`}>{p.tag}</span>}
                </div>
                <div className="text-[11px] text-ink-500 mb-1">{p.company}</div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-brand-600">¥{p.price}</span>
                  <span className="text-xs text-ink-400">{p.unit}</span>
                </div>
                <ul className="space-y-1.5 mb-3 flex-1">
                  {parseCoverage(p.coverage).map((c, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-xs text-ink-600">
                      <Check size={12} className="text-health shrink-0" /> {c}
                    </li>
                  ))}
                </ul>
                <div className="text-xs text-ink-500 border-t border-ink-100 pt-2">
                  <div>{p.deduct}</div>
                  <div className="font-semibold text-ink-700 mt-0.5">{p.payout}</div>
                </div>
              </div>
            ))}
          </div>

          {/* 方案对比表 */}
          {plans.length >= 2 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-ink-500 text-xs">
                    <th className="text-left py-2 font-medium">保障项</th>
                    {plans.map(p => <th key={p.id} className="text-center py-2 px-2 font-medium">{p.name}</th>)}
                  </tr>
                </thead>
                <tbody className="text-ink-700">
                  {[
                    ['门诊报销', '含', '含', '含'],
                    ['住院报销', '—', '报销 70%', '报销 80%'],
                    ['意外保障', '—', '—', '含'],
                    ['重大疾病', '—', '含', '含'],
                    ['年累计上限', '¥1万', '¥5万', '¥15万'],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-ink-100">
                      <td className="py-2">{row[0]}</td>
                      {plans.map((p, j) => (
                        <td key={p.id} className={`text-center ${row[j+1] === '—' ? 'text-ink-300' : ''}`}>{row[j+1]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide
        footer={<button onClick={() => { alert('投保流程为模拟，真实需保险资质'); setDetail(null) }} className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2 rounded-lg">立即投保</button>}>
        {detail && (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-600">¥{detail.price}</span>
              <span className="text-sm text-ink-400">{detail.unit}</span>
              <span className="text-xs text-ink-500">{detail.company}</span>
            </div>
            <ul className="space-y-1.5">
              {parseCoverage(detail.coverage).map((c, j) => (
                <li key={j} className="flex items-center gap-1.5 text-sm text-ink-700"><Check size={13} className="text-health" /> {c}</li>
              ))}
            </ul>
            {detail.highlights && parseCoverage(detail.highlights).length > 0 && (
              <div className="border-t border-ink-100 pt-3">
                <div className="text-xs font-semibold text-ink-700 mb-2">方案亮点</div>
                <ul className="space-y-1">
                  {parseCoverage(detail.highlights).map((h, j) => (
                    <li key={j} className="text-sm text-ink-600 flex items-start gap-1.5">
                      <Check size={13} className="text-brand-500 shrink-0 mt-0.5" /> {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-start gap-1.5 text-xs text-ink-400 mt-2 border-t border-ink-100 pt-2">
              <FileText size={12} className="shrink-0 mt-0.5" /> 投保即视为已阅读《保险条款》《健康告知》。本平台仅展示方案，真实投保需保险经纪资质。
            </div>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}