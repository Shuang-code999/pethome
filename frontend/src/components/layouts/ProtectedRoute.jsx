import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

// 路由守卫：未登录 → 触发登录弹窗 + 重定向到首页
export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const [shouldRender, setShouldRender] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.dispatchEvent(new CustomEvent('pethome:auth:required'))
    } else {
      setShouldRender(true)
    }
  }, [])

  if (!shouldRender) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />
  }
  return children
}
