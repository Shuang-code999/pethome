import { Home, MessagesSquare, Stethoscope, ShoppingBag, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const tabs = [
  { key: 'home', label: '首页', icon: Home, to: '/' },
  { key: 'community', label: '社区', icon: MessagesSquare, to: '/community/qa' },
  { key: 'consult', label: '问诊', icon: Stethoscope, to: '/consult/ai', primary: true },
  { key: 'mall', label: '商城', icon: ShoppingBag, to: '/mall/food' },
  { key: 'me', label: '我的', icon: UserRound, to: '/me' }
]

export default function MobileTabBar({ active }) {
  const navigate = useNavigate()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-300/60 flex">
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = active === t.key || (t.key !== 'home' && active === t.to.split('/')[1])
        if (t.primary) {
          return (
            <button key={t.key} onClick={() => navigate(t.to)} className="clickable flex-1 flex flex-col items-center gap-0.5 py-1.5 relative">
              <div className="-mt-6 w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-hover">
                <Icon size={22} />
              </div>
              <span className="text-[10px] text-brand-600 font-semibold">{t.label}</span>
            </button>
          )
        }
        return (
          <button key={t.key} onClick={() => navigate(t.to)} className="clickable flex-1 flex flex-col items-center gap-0.5 py-1.5">
            <Icon size={20} className={isActive ? 'text-brand-600' : 'text-ink-500'} />
            <span className={`text-[10px] ${isActive ? 'text-brand-600 font-semibold' : 'text-ink-500'}`}>{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
