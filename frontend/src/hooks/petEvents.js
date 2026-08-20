// 宠物档案事件总线：用于在多个组件之间同步宠物数据
// 解决问题：Hero / MePage / PetListPage 各自拉取我的宠物列表，
// 在一个地方新增 / 删除 / 更新后，其他页面状态不刷新。
// 用法：
//   import { petEvents } from '../hooks/petEvents.js'
//   petEvents.emit('changed')  // 触发
//   petEvents.on('changed', () => reload())  // 订阅
const EVT = 'pethome:pet:changed'

export const petEvents = {
  emit: () => {
    try { window.dispatchEvent(new CustomEvent(EVT)) } catch {}
  },
  on: (handler) => {
    window.addEventListener(EVT, handler)
    return () => window.removeEventListener(EVT, handler)
  }
}
