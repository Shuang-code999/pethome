import { Phone, MapPin, ShieldCheck } from 'lucide-react'

export default function Footer() {
  const cols = [
    { title: '关于我们', items: ['平台介绍', '加入我们', '联系方式', '商家入驻'] },
    { title: '帮助中心', items: ['新手指南', '服务保障', '退款政策', '投诉建议'] },
    { title: '专业合作', items: ['医生入驻', '医院合作', '救助机构', '宠物协会'] },
    { title: '法律信息', items: ['用户协议', '隐私政策', '寄养协议', '免责声明'] }
  ]
  return (
    <footer className="bg-ink-900 text-ink-300 mt-10">
      <div className="mx-auto max-w-page px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-white font-semibold text-sm mb-3">{c.title}</div>
              <ul className="space-y-2">
                {c.items.map((it) => (
                  <li key={it}>
                    <a className="clickable hover:text-white text-[13px]" href="#">{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <div className="text-white font-semibold text-sm mb-3">联系我们</div>
            <div className="flex items-center gap-2 text-[13px] mb-2">
              <Phone size={14} /> 400-xxx-xxxx
            </div>
            <div className="text-xs text-ink-500">工作日 9:00 - 21:00</div>
            <div className="flex items-center gap-2 text-[13px] mt-3">
              <ShieldCheck size={14} className="text-health" /> ICP 备案中
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-ink-700/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-ink-500">
            © 2026 萌宠之家 · 一站式养宠平台（模拟 Demo，不涉及真实交易）
          </div>
          <div className="text-xs text-ink-500 flex items-center gap-2">
            <MapPin size={12} /> 友情链接：宠物医院联盟 · 流浪动物救助 · 宠物行业协会
          </div>
        </div>
      </div>
    </footer>
  )
}
