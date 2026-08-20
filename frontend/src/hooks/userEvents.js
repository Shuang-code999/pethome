// 用户资料事件总线：用于在多个组件之间同步「当前登录用户」的昵称 / 头像 / 邮箱等
// 解决问题：用户在「个人中心 / 设置」修改昵称或头像后，
// TopNav、LeftSidebar、个人中心首页等其它也持有 user 状态的组件需要立即刷新。
//
// 用法：
//   import { userEvents } from '../hooks/userEvents.js'
//   userEvents.emit()                 // 触发刷新（写入 localStorage 后调用）
//   userEvents.on(() => reloadUser()) // 订阅
//
// 后端字段更新时，前端应在保存成功后：
//   1. localStorage.setItem('pethomeUser', JSON.stringify(res.data))
//   2. userEvents.emit()
//
// 同时兼容 storage 事件（其它 tab 修改也会同步）。
const EVT = 'pethome:user:refresh'

export const userEvents = {
  emit: () => {
    try { window.dispatchEvent(new CustomEvent(EVT)) } catch {}
  },
  on: (handler) => {
    window.addEventListener(EVT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(EVT, handler)
      window.removeEventListener('storage', handler)
    }
  }
}

/** 读取当前登录用户（与 AppLayout / TopNav / LeftSidebar 保持同源） */
export function readCurrentUser() {
  try {
    const raw = localStorage.getItem('pethomeUser')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
