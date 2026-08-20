// 本地社区图片（从 Picsum 下载，分类存放在 public/assets/community/）
// 用于问答、话题、领养等区域的图片展示，避免外部 API 不稳定

// === 话题精选区图片（100张） ===
export const topicImages = Array.from({ length: 100 }, (_, i) =>
  `/assets/community/topic/topic-${String(i + 1).padStart(3, '0')}.jpg`
)

// === 领养专区图片（50张） ===
export const adoptImages = Array.from({ length: 50 }, (_, i) =>
  `/assets/community/adopt/adopt-${String(i + 1).padStart(3, '0')}.jpg`
)

// === 问答区头像图片（50张） ===
export const avatarImages = Array.from({ length: 50 }, (_, i) =>
  `/assets/community/avatar/avatar-${String(i + 1).padStart(3, '0')}.jpg`
)

// === 旧图片（向后兼容） ===
const legacyImages = [
  '/assets/community/pet-1425082661705-1834bfd09dca.jpg',
  '/assets/community/pet-1495360010541-f48722b34f7d.jpg',
  '/assets/community/pet-1514888286974-6c03e2ca1dba.jpg',
  '/assets/community/pet-1518791841217-8f162f1e1131.jpg',
  '/assets/community/pet-1526336024174-e58f5cdd8e13.jpg',
  '/assets/community/pet-1535930749574-1399327ce78f.jpg',
  '/assets/community/pet-1543466835-00a7907e9de1.jpg',
  '/assets/community/pet-1544197150-b99a580bb7a8.jpg',
  '/assets/community/pet-1548199973-03cce0bbc87b.jpg',
  '/assets/community/pet-1558788353-f76d92427f16.jpg',
  '/assets/community/pet-1561037404-61cd46aa615b.jpg',
  '/assets/community/pet-1573865526739-10659fec78a5.jpg',
  '/assets/community/pet-1574158622682-e40e69881006.jpg',
  '/assets/community/pet-1576201836106-db1758fd1c97.jpg',
  '/assets/community/pet-1583511655857-d19b40a7a54e.jpg',
  '/assets/community/pet-1587300003388-59208cc962cb.jpg',
  '/assets/community/pet-1592194996308-7b43878e84a6.jpg',
  '/assets/community/pet-1596854407944-bf87f6fdd49e.jpg',
  '/assets/community/pet-1601758228041-f3b2795255f1.jpg',
]

// === 合并所有图片（向后兼容） ===
export const communityImages = [...topicImages, ...adoptImages, ...avatarImages, ...legacyImages]

// === 确定性取图函数 ===

// 把任意 id 稳定映射到 [0, len)。
// 关键修复：后端 id 是 19 位雪花算法的大整数字符串（如 "2087539000000000110"），
// 直接 Number(id) 会超出 JS 安全整数上限(2^53≈9e15)而丢精度，导致所有不同 id
// 塌缩成同一个 Number（末几位被抹掉）→ 取模后全部命中同一张图，页面图片大面积重复。
// 因此：纯数字字符串走 BigInt 取模；bigint 同样走 BigInt；非数字走字符串哈希。
function toIndex(id, len) {
  if (typeof id === 'bigint') {
    try { return Number(((id % BigInt(len)) + BigInt(len)) % BigInt(len)) } catch { return 0 }
  }
  const s = id == null ? '' : String(id).trim()
  if (/^-?\d+$/.test(s)) {
    try { return Number(((BigInt(s) % BigInt(len)) + BigInt(len)) % BigInt(len)) }
    catch {
      // BigInt 不可用时退化为取末 9 位（仍可区分大部分雪花 id）
      return Math.abs(Number(s.slice(-9)) || 0) % len
    }
  }
  // 非纯数字 id：字符串哈希，分布到 [0, len)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) % len
  return h
}

// 按 id 确定性取图（通用，同一 id 永远返回同一张图）
export function imgById(id) {
  return communityImages[toIndex(id, communityImages.length)]
}

// 话题区专用取图
export function topicImg(id) {
  return topicImages[toIndex(id, topicImages.length)]
}

// 领养区专用取图
export function adoptImg(id) {
  return adoptImages[toIndex(id, adoptImages.length)]
}

// 头像专用取图
export function avatarImg(id) {
  return avatarImages[toIndex(id, avatarImages.length)]
}
