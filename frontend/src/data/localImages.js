// 本地轮播/卡片图片（按目录分组，从 picture/ 复制到 public/assets/）。
// 所有路径以 /assets 开头，可被浏览器直接请求（Vite 原样拷贝到构建产物）。
// 维护方式：删/改文件名后，只需更新下面数组即可。

// 已替换为爬取的 Unsplash 宠物图（取自社区话题图，避免再依赖旧 VCG 图）
export const HOME_BANNERS = [
  '/assets/community/topic/topic-005.jpg',
  '/assets/community/topic/topic-012.jpg',
  '/assets/community/topic/topic-021.jpg',
  '/assets/community/topic/topic-033.jpg'
]

// 已替换为爬取的商品图（主粮 / 零食 / 猫砂）
export const MALL_BANNERS = [
  '/assets/mall/products/food/food-001.jpg',
  '/assets/mall/products/snack/snack-001.jpg',
  '/assets/mall/products/litter/litter-001.jpg'
]

export const SERVICE_BANNERS = [
  '/assets/service/VCG211374167921.jpg',
  '/assets/service/VCG211478039492.jpg',
  '/assets/service/VCG211509415688.jpg',
  '/assets/service/VCG41N2181024224.jpg',
  '/assets/service/fill_w526_h394_g0_mark_134c1ae8abd0f29120b734a5eaefcc41.webp',
  '/assets/service/fill_w526_h394_g0_mark_16.webp',
  '/assets/service/fill_w526_h394_g0_mark_1b99796a763efdb8dc24149a02202777.webp',
  '/assets/service/fill_w526_h394_g0_mark_21.webp',
  '/assets/service/fill_w526_h394_g0_mark_28.webp',
  '/assets/service/fill_w526_h394_g0_mark_32.webp',
  '/assets/service/fill_w526_h394_g0_mark_32ed0eec18d49b26cba83ca69906b983.webp',
  '/assets/service/fill_w526_h394_g0_mark_3a7f41644804bcb425cb58174446b9c4.webp',
  '/assets/service/fill_w526_h394_g0_mark_47156cd3957e73ff41c448e0da502177.webp',
  '/assets/service/fill_w526_h394_g0_mark_4785719ab33db4faf5380bab4c72e403.webp',
  '/assets/service/fill_w526_h394_g0_mark_6ff53564e05fb68826c126e578c0b966.webp',
  '/assets/service/fill_w526_h394_g0_mark_7cd376273fed9bb13f18f45b20c132b2.webp',
  '/assets/service/fill_w526_h394_g0_mark_92fa0c711522406f20e94e62fcdd9a2e.webp',
  '/assets/service/fill_w526_h394_g0_mark_9b7356a273d5f30894d4a24136f9401d.webp',
  '/assets/service/fill_w526_h394_g0_mark_b72a9031ad3fe8a5c09fa37e3f7e6801.webp',
  '/assets/service/fill_w526_h394_g0_mark_c8b34ebcc816b0052ad5fa715ad0f738.webp',
  '/assets/service/fill_w526_h394_g0_mark_ee1dfe53f226a1f8ab88c623e5fede9d.webp'
]

// 领养专区顶部轮播（picture/内容社区_领养专区，4 张新 PNG）
export const ADOPT_BANNERS = [
  { src: '/assets/adopt/Snipaste_2026-08-14_10-31-01.png', tag: '北京 · 朝阳区', title: '橘猫小七 · 4 个月', desc: '已驱虫 · 性格温顺 · 适合家庭' },
  { src: '/assets/adopt/Snipaste_2026-08-14_10-32-02.png', tag: '上海 · 徐汇区', title: '田园犬豆豆 · 1 岁', desc: '已绝育 · 会基本指令 · 亲人' },
  { src: '/assets/adopt/Snipaste_2026-08-14_10-33-03.png', tag: '广州 · 天河区', title: '奶牛猫小花 · 6 个月', desc: '已完成疫苗 · 健康活泼 · 找人领养' },
  { src: '/assets/adopt/Snipaste_2026-08-14_10-34-04.png', tag: '深圳 · 南山区', title: '英短小灰 · 8 个月', desc: '已驱虫 · 安静亲人 · 适合上班族' }
]

// 工具：按 slug 给每个服务分一组（轮询 3 张，含环绕）
export function pickServiceImages(startIdx) {
  const start = ((startIdx % SERVICE_BANNERS.length) + SERVICE_BANNERS.length) % SERVICE_BANNERS.length
  const out = []
  for (let i = 0; i < 3; i++) {
    out.push(SERVICE_BANNERS[(start + i) % SERVICE_BANNERS.length])
  }
  return out
}