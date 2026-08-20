import { useOutletContext } from 'react-router-dom'
import Hero from '../Hero.jsx'
import ContentSections from '../ContentSections.jsx'
import LeftSidebar from '../LeftSidebar.jsx'
import LoginModal from '../LoginModal.jsx'

// 首页：复用现有 Hero + ContentSections + LeftSidebar
// 悬浮框（LeftSidebar）由组件内部 fixed 渲染在「最左中侧」：left-3 top-1/2
export default function HomePage() {
  const { logged, onLoginClick, onNavigate } = useOutletContext() || {}
  return (
    <div className="relative">
      <div className="relative mx-auto max-w-page px-4 py-4">
        <div className="space-y-10">
          {/* 在大屏下，给内容留出左侧悬浮框的空间 */}
          <div className="lg:pl-[240px]">
            <Hero logged={logged} onLoginClick={onLoginClick} onNavigate={onNavigate} />
          </div>
          <div className="lg:pl-[240px]">
            <ContentSections logged={logged} onNavigate={onNavigate} />
          </div>
        </div>
      </div>

      {/* 悬浮框：最左中侧（fixed） */}
      <LeftSidebar active="home" logged={logged} onLoginClick={onLoginClick} />

      <LoginModal />
    </div>
  )
}