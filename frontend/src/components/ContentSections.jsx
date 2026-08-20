import CommunityFeed from './CommunityFeed.jsx'
import Reveal from './common/Reveal.jsx'
import SeckillSection from './SeckillSection.jsx'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function ContentSections({ logged, onNavigate }) {
  const navigate = useNavigate()
  const goMall = () => navigate('/mall')
  return (
    <section className="space-y-12">
      {/* ============ 限时秒杀（首页可直接抢券，与商城共用） ============ */}
      <div>
        <Reveal className="flex items-center justify-end mb-2">
          <button
            onClick={goMall}
            className="clickable text-sm text-ink-500 hover:text-brand-600 flex items-center gap-1 font-semibold clay-btn px-3 py-1.5"
          >
            进商城 <ChevronRight size={14} />
          </button>
        </Reveal>
        <Reveal>
          <SeckillSection />
        </Reveal>
      </div>

      {/* ============ 社区精选（瀑布流 + 刷新） ============ */}
      <CommunityFeed onNavigate={onNavigate} />
    </section>
  )
}
