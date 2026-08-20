// 浏览记录：基于 localStorage 的轻量浏览历史，记录商品 / 帖子 / 宠物 / 领养 的访问。
// 用法：
//   import { recordHistory, readHistory, clearHistory } from '../hooks/browsingHistory.js'
//   recordHistory({ type: 'product', id, title: p.name, image: imgById(id), path: `/mall/product/${id}` })
//   readHistory()          // 返回 [{type,id,title,image,path,ts}]，按时间倒序
//   clearHistory()         // 清空
//
// 同一条（type+id）再次访问会被提到最前，不会重复；最多保留 50 条。

const KEY = 'pethome:browsing:history'
const MAX = 50

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch {}
}

export function recordHistory(entry) {
  if (!entry || !entry.id || !entry.type) return
  const list = load()
  const key = `${entry.type}:${entry.id}`
  const filtered = list.filter(it => `${it.type}:${it.id}` !== key)
  filtered.unshift({ ...entry, ts: Date.now() })
  save(filtered.slice(0, MAX))
  try { window.dispatchEvent(new CustomEvent('pethome:history:change')) } catch {}
}

export function readHistory() {
  return load()
}

export function clearHistory() {
  save([])
  try { window.dispatchEvent(new CustomEvent('pethome:history:change')) } catch {}
}

export function removeHistory(type, id) {
  const list = load().filter(it => `${it.type}:${it.id}` !== `${type}:${id}`)
  save(list)
  try { window.dispatchEvent(new CustomEvent('pethome:history:change')) } catch {}
}

// 订阅变更（HistoryPage 实时刷新）
export function onHistoryChange(handler) {
  window.addEventListener('pethome:history:change', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('pethome:history:change', handler)
    window.removeEventListener('storage', handler)
  }
}
