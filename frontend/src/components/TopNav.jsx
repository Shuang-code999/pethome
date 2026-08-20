import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { nav } from '../data/nav.js'
import PetLogo from './PetLogo.jsx'
import { api } from '../api.js'
import { Search, PawPrint, ChevronRight, ChevronDown } from 'lucide-react'
import { userEvents, readCurrentUser } from '../hooks/userEvents.js'

export default function TopNav({ active, setActive, logged, onLoginClick }) {
  const [openMenu, setOpenMenu] = useState(null)
  const [query, setQuery] = useState('')
  const [me, setMe] = useState(() => readCurrentUser())
  const closeTimer = useRef(null)
  const navigate = useNavigate()

  // 读取 localStorage 中的当前用户（与 /me 同源）
  useEffect(() => {
    setMe(readCurrentUser())
    const off = userEvents.on(() => setMe(readCurrentUser()))
    return off
  }, [logged])

  const submitSearch = (e) => {
    e.preventDefault()
    const v = query.trim()
    if (!v) return
    navigate(`/search?q=${encodeURIComponent(v)}`)
  }

  const openMenuFor = (key) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpenMenu(key)
  }
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenMenu(null), 150)
  }

  // 路由化点击：把 path 中的 _petId_ 占位符替换为真实 id（从 localStorage 读取 selectedPetId）
  const resolvePath = (p) => {
    if (!p) return p
    if (p.includes('_petId_')) {
      const selectedId = localStorage.getItem('selectedPetId') || ''
      if (selectedId) return p.replace('_petId_', selectedId)
      return '/pet/list' // 未选中宠物时先去选
    }
    return p
  }

  const handlePick = (sub) => {
    setOpenMenu(null)
    navigate(resolvePath(sub.path))
  }

  const handleTabClick = (item) => {
    // 可展开的 Tab：点击切换展开/收起
    if (item.expandable) {
      setOpenMenu(openMenu === item.key ? null : item.key)
      return
    }
    setOpenMenu(null)
    navigate(resolvePath(item.path))
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-ink-300/60">
      <div className="mx-auto max-w-page h-16 px-4 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 clickable" onClick={() => navigate('/')}>
          <PetLogo />
          <span className="text-lg font-bold text-ink-900">萌宠之家</span>
        </div>

        {/* 一级 Tab（桌面） */}
        <nav
          className="hidden md:flex items-center gap-1 flex-1"
          onMouseLeave={scheduleClose}
        >
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            const isOpen = openMenu === item.key
            // 只有同时具备 expandable + groups[0] 时才渲染 MegaPanel
            const showMega = item.expandable && Array.isArray(item.groups) && item.groups[0]?.length
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => showMega && openMenuFor(item.key)}
              >
                <button
                  onClick={() => handleTabClick(item)}
                  className={`clickable flex items-center gap-1.5 px-3 py-2 rounded-lg text-[15px] font-semibold
                    ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {showMega && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
                {isActive && (
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 h-[3px] w-7 rounded-full bg-brand-500" />
                )}
                {/* Mega Menu */}
                {showMega && isOpen && (
                  <MegaPanel item={item} onPick={handlePick} />
                )}
              </div>
            )
          })}
        </nav>

        {/* 右侧操作 */}
        <div className="flex items-center gap-2 shrink-0">
          <form onSubmit={submitSearch} className="hidden lg:flex items-center gap-2 bg-ink-100 rounded-lg px-3 py-1.5 w-60">
            <Search size={16} className="text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索商品 / 服务 / 文章"
              className="bg-transparent text-sm outline-none w-full placeholder:text-ink-500"
            />
          </form>
          {/* 消息按钮已迁移到首页左中侧悬浮框（LeftSidebar） */}
          {logged ? (
            <div onClick={() => navigate('/me')} className="clickable flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-ink-100">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 overflow-hidden flex items-center justify-center">
                {me?.avatar ? (
                  <img src={me.avatar} alt={me.nickname} className="w-full h-full object-cover" />
                ) : (
                  <PawPrint size={16} />
                )}
              </div>
              <span className="text-sm font-medium text-ink-900 max-w-[5rem] truncate">{me?.nickname || '铲屎官'}</span>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="clickable bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
            >
              登录 / 注册
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// Mega Menu 下拉面板
// expandable 模式：垂直单列窄面板（用于宠物档案 / 同城服务 / 内容社区）
function MegaPanel({ item, onPick }) {
  const groups = Array.isArray(item.groups) ? item.groups : []

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50"
      onMouseEnter={() => {}}
    >
      <div
        className={`fade-in bg-white rounded-xl2 shadow-hover border border-ink-300/60 p-3 w-56`}
      >
        <div className="flex flex-col gap-0.5">
          {groups[0]?.map((sub) => {
            const Icon = sub.icon
            return (
              <button
                key={sub.label}
                onClick={() => onPick(sub)}
                className="clickable w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-brand-50 text-left group transition-colors"
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: `${item.color}1A`, color: item.color }}
                >
                  <Icon size={15} />
                </span>
                <span className="text-sm text-ink-800 group-hover:text-brand-600 font-medium flex-1">{sub.label}</span>
                <ChevronRight size={13} className="text-ink-300 group-hover:text-brand-500" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}