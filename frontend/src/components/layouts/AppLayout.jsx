import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate, ScrollRestoration } from 'react-router-dom'
import TopNav from '../TopNav.jsx'
import Footer from '../Footer.jsx'
import MobileTabBar from '../MobileTabBar.jsx'
import LoginModal from '../LoginModal.jsx'
import { userEvents, readCurrentUser } from '../../hooks/userEvents.js'

// 顶层布局：TopNav + Outlet + Footer + MobileTabBar + 全局登录弹窗
export default function AppLayout() {
  const [logged, setLogged] = useState(() => !!localStorage.getItem('token'))
  const [loginOpen, setLoginOpen] = useState(false)
  const [authToast, setAuthToast] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  // 从路径推导 TopNav 的 active key（首页以外时高亮第一个 tab）
  const active = location.pathname === '/' ? 'home' : location.pathname.split('/')[1]

  useEffect(() => {
    const onAuth = () => {
      if (logged) setAuthToast('登录已过期，请重新登录')
      setLogged(false)
      setLoginOpen(true)
      setTimeout(() => setAuthToast(''), 3000)
    }
    window.addEventListener('pethome:auth:required', onAuth)
    return () => window.removeEventListener('pethome:auth:required', onAuth)
  }, [logged])

  const navNavigate = (key) => {
    if (key === 'home') return navigate('/')
    const map = {
      pet: '/pet/list',
      service: '/service/bath',
      mall: '/mall/food',
      community: '/community/qa',
      consult: '/consult/ai',
      me: '/me',
    }
    const path = map[key]
    if (!logged && (key === 'me' || key === 'pet')) {
      setLoginOpen(true)
      return
    }
    if (path) navigate(path)
  }

  const onLogin = (user) => {
    setLogged(true)
    setLoginOpen(false)
    if (user) {
      localStorage.setItem('pethomeUser', JSON.stringify(user))
      userEvents.emit()
    }
  }

  const onLogout = () => {
    setLogged(false)
    localStorage.removeItem('pethomeUser')
    localStorage.removeItem('token')
    userEvents.emit()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col bg-ink-50 pb-16 md:pb-0">
      {authToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-hover animate-pulse">
          {authToast}
        </div>
      )}

      <TopNav
        active={active === 'home' ? 'pet' : active}
        setActive={navNavigate}
        logged={logged}
        onLoginClick={() => setLoginOpen(true)}
      />

      <main className="flex-1">
        <Outlet context={{ logged, onLoginClick: () => setLoginOpen(true), onNavigate: navNavigate, onLogout }} />
      </main>

      <Footer />
      <MobileTabBar active={active} onNavigate={navNavigate} />
      <ScrollRestoration />
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={onLogin}
      />
    </div>
  )
}
