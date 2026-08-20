import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Star, MapPin, Phone, Clock, Navigation, X, ChevronLeft, ChevronRight, Calendar, ImageOff, Tag, AlertTriangle, Loader2 } from 'lucide-react'
import { api } from '../../api.js'
import PetImg from '../../components/PetImg.jsx'
import { petImg } from '../../data/petImages.js'
import { SERVICE_BANNERS } from '../../data/localImages.js'

/**
 * 同城服务页 · 简洁版（统一模板）
 *
 * 视觉（按用户要求）：
 *  - 顶部：首页 Hero 风格的「标题/副标题/CTA + 实拍图 + 渐变背景 + 圆点指示器」轮播
 *  - 筛选条：关键词 + 排序（距离/评分）
 *  - 商家列表：高德实拍图（或本地 fallback）+ 名称 + 评分 + 距离 + tag
 *  - 详情弹窗：实拍图轮播 + POI 全字段（含电话拨号）
 *  - 预约弹窗：商家头 + bookingFields + 备注
 *  （限时秒杀券已迁到商城，本页不放）
 *
 * 数据流：
 *  - 商家：api.amapSearch(slug, city, limit=18) — 高德真实 POI；空时后端 fallback 到 pet_store
 *  - 顶部轮播图：api.amapPhotos(slug, city, 3)；空时用 bannerImg 本地实拍兜底
 */

// ===== 每个服务类型顶部 banner 文案（图片取自 picture/同城服务 本地资源） =====
// 7 大服务 × 3 张图 = 正好 21 张（SLUG_INDEX 对应每个服务在 SERVICE_BANNERS 中的起始索引）
const SLUG_INDEX = { bath: 0, grooming: 3, feeding: 6, walking: 9, boarding: 12, photography: 15, funeral: 18 }

// 取某个服务轮播要的 3 张图（7 大服务 × 3 张共 21 张，按 slug 顺序分配）
const pickImgs = (slug) => {
  const start = SLUG_INDEX[slug] ?? 0
  const pool = SERVICE_BANNERS
  const len = pool.length
  return [pool[start % len], pool[(start + 1) % len], pool[(start + 2) % len]]
}

const BANNERS_BY_SLUG = {
  bath: [
    { title: '专业洗护 · 上门到家', subtitle: '认证洗护师自带设备 · 让毛孩子在熟悉的环境放松', cta: '立即预约', gradient: 'linear-gradient(135deg, #BBE3FF 0%, #2563EB 55%, #1D4ED8 100%)', accent: 'dog' },
    { title: '药浴 SPA · 缓解皮肤问题', subtitle: '专业配方 · 皮肤兽医推荐', cta: '查看详情', gradient: 'linear-gradient(135deg, #B8F2D8 0%, #2EC4B6 50%, #1FA89C 100%)', accent: 'dog' },
    { title: '深层清洁 · 全身护理', subtitle: '专业洗护师 · 一站式服务', cta: '立即预约', gradient: 'linear-gradient(135deg, #FFB099 0%, #FF7A59 60%, #F2613E 100%)', accent: 'dog' }
  ],
  grooming: [
    { title: '造型师驻店 · 出门回头率 100%', subtitle: '剪毛 / 染色 / SPA · 一站搞定', cta: '立即预约', gradient: 'linear-gradient(135deg, #FFB099 0%, #FF7A59 60%, #F2613E 100%)', accent: 'dog' },
    { title: '夏季清凉造型 · 限时 8 折', subtitle: '比熊 / 泰迪 / 雪纳瑞专享套餐', cta: '查看详情', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'dog' },
    { title: '上门美容 · 不折腾毛孩子', subtitle: '专业造型师 1v1 上门服务', cta: '立即预约', gradient: 'linear-gradient(135deg, #BBE3FF 0%, #2563EB 55%, #1D4ED8 100%)', accent: 'dog' }
  ],
  feeding: [
    { title: '上门喂养 · 视频回传', subtitle: '节假日不再担心 · 每次喂食都拍照反馈', cta: '立即预约', gradient: 'linear-gradient(135deg, #B8F2D8 0%, #2EC4B6 50%, #1FA89C 100%)', accent: 'cat' },
    { title: '包月套餐 · 立省 30%', subtitle: '工作日每天上门 · 让猫主子不再孤独', cta: '查看套餐', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'cat' }
  ],
  walking: [
    { title: '认证遛狗师 · 实时路线', subtitle: '30/60/90 分钟 · 出门即领', cta: '立即预约', gradient: 'linear-gradient(135deg, #FFE4B5 0%, #F59E0B 55%, #D97706 100%)', accent: 'dog' },
    { title: '夏日遛狗 · 错峰特惠', subtitle: '早上 7-9 点 · 晚上 7-9 点 5 折', cta: '查看详情', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'dog' }
  ],
  boarding: [
    { title: '家庭寄养 · 像在家一样', subtitle: '认证家庭 · 全程视频 · 24h 陪伴', cta: '立即预约', gradient: 'linear-gradient(135deg, #FFD3B6 0%, #FB923C 55%, #EA580C 100%)', accent: 'cat' },
    { title: '春节寄养 · 早鸟 7 折', subtitle: '提前 30 天预订 · 锁定靠谱家庭', cta: '查看详情', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'cat' }
  ],
  photography: [
    { title: '爱宠写真 · 留住每个瞬间', subtitle: '专业宠物摄影师 · 室内/户外主题', cta: '立即预约', gradient: 'linear-gradient(135deg, #FBC2EB 0%, #EC4899 55%, #BE185D 100%)', accent: 'cat' },
    { title: '生日套餐 · 限时 6 折', subtitle: '主题布景 + 蛋糕 + 8 张精修', cta: '查看详情', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'dog' }
  ],
  funeral: [
    { title: '温柔送别 · 一程一礼', subtitle: '单宠火化 / 树葬 / 纪念品定制', cta: '了解流程', gradient: 'linear-gradient(135deg, #C7D2FE 0%, #818CF8 55%, #4F46E5 100%)', accent: 'cat' },
    { title: '告别仪式 · 限时立减', subtitle: '骨灰盒 + 毛发钻石 · 专人对接', cta: '去咨询', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'dog' }
  ],
  training: [
    { title: '认证训犬师 · 1v1 私教', subtitle: '正向激励 · 行为矫正 · 无惩罚', cta: '立即报名', gradient: 'linear-gradient(135deg, #C7D2FE 0%, #818CF8 55%, #4F46E5 100%)', accent: 'dog' },
    { title: '幼犬基础服从课', subtitle: '坐 / 等 / 来 / 随行 · 10 节连上', cta: '查看课程', gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)', accent: 'dog' },
    { title: '恶习矫正 · 分离焦虑', subtitle: '专业训犬师上门评估 · 不满意退款', cta: '去咨询', gradient: 'linear-gradient(135deg, #B8F2D8 0%, #2EC4B6 50%, #1FA89C 100%)', accent: 'dog' }
  ]
}

// 给每个 banner 注入图片（按 slug 顺序轮询 3 张）
for (const slug of Object.keys(BANNERS_BY_SLUG)) {
  const imgs = pickImgs(slug)
  BANNERS_BY_SLUG[slug].forEach((b, i) => { b.img = imgs[i] })
}

// ===== 限时秒杀已迁到商城，这里不再维护 DEALS =====

export default function ServicePageTemplate({ config }) {
  const { slug, title, subtitle, filterOptions = [], bookingFields = [], bookingSubmitNote } = config

  const navigate = useNavigate()
  const [pois, setPois] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('distance')
  const [detail, setDetail] = useState(null)
  const [booking, setBooking] = useState(null)
  const [bannerIdx, setBannerIdx] = useState(0)
  const [userLocation, setUserLocation] = useState(null)
  const [locationCity, setLocationCity] = useState('')
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(null)

  // 当前服务的 banner 列表
  const banners = BANNERS_BY_SLUG[slug] || BANNERS_BY_SLUG.bath

  // ===== 定位核心函数（可被 useEffect 和按钮复用） =====
  const doLocate = async () => {
    setLocating(true)
    setLocError(null)
    if (!navigator.geolocation && typeof AMap === 'undefined') {
      setLocError('浏览器不支持定位')
      setLocating(false)
      return
    }

    // 1) 先检查 localStorage 缓存：10 分钟内的良好定位（accuracy < 5km）直接复用
    try {
      const cached = localStorage.getItem('pethome_location')
      if (cached) {
        const c = JSON.parse(cached)
        const age = Date.now() - (c.ts || 0)
        if (age < 10 * 60 * 1000 && c.accuracy && c.accuracy < 5000) {
          console.log('[ServicePage] 使用缓存的定位（', Math.round(age / 1000), '秒前，精度', Math.round(c.accuracy), '米）')
          setUserLocation({ lat: c.lat, lng: c.lng })
          if (c.city) setLocationCity(c.city)
          setLocating(false)
          return
        }
      }
    } catch { /* 静默 */ }

    // 统一的 IP 降级函数
    const fallbackToIp = async (reason) => {
      console.warn('[ServicePage] 降级为 IP 定位，原因:', reason)
      const tryApi = async (url, parser) => {
        try {
          const resp = await fetch(url, { cache: 'no-store' })
          if (!resp.ok) throw new Error('HTTP ' + resp.status)
          const data = await resp.json()
          const parsed = parser(data)
          if (parsed && parsed.city) {
            setLocationCity(parsed.city)
            setLocError(null)
            console.log('[ServicePage] IP 定位成功:', parsed.city, parsed.region || '')
            if (parsed.lat && parsed.lng) {
              setUserLocation({ lat: parsed.lat, lng: parsed.lng })
              // IP 定位结果也缓存（10 分钟）
              try {
                localStorage.setItem('pethome_location', JSON.stringify({
                  lat: parsed.lat, lng: parsed.lng, city: parsed.city, accuracy: 50000, ts: Date.now()
                }))
              } catch { /* 静默 */ }
            }
            return true
          }
        } catch (e) {
          console.warn('[ServicePage] IP API 失败 (' + url + '):', e.message)
        }
        return false
      }
      if (await tryApi('https://ipwho.is/', d => ({
        city: d.city, region: d.region, lat: d.latitude, lng: d.longitude
      }))) return
      if (await tryApi('https://ipinfo.io/json', d => ({
        city: d.city, region: d.region,
        lat: d.loc ? parseFloat(d.loc.split(',')[0]) : null,
        lng: d.loc ? parseFloat(d.loc.split(',')[1]) : null
      }))) return
      setLocError('IP 定位失败，将使用默认城市')
    }

    const isInChina = (lat, lng) =>
      lat >= 18 && lat <= 54 && lng >= 73 && lng <= 135

    // 定位成功后的统一处理
    const handlePosition = async (latitude, longitude, accuracy, source) => {
      setLocating(false)
      console.log(`[ServicePage] ${source} 返回:`, latitude.toFixed(4), longitude.toFixed(4),
        '| 精度:', accuracy ? Math.round(accuracy) + '米' : '未知')

      if (!isInChina(latitude, longitude)) {
        await fallbackToIp('坐标不在中国')
        return
      }

      // 精度校验：accuracy > 5km 说明是 IP 猜测，不可靠
      if (accuracy && accuracy > 5000) {
        console.warn(`[ServicePage] ${source} 精度过低(>${Math.round(accuracy)}m)，降级 IP 定位`)
        await fallbackToIp('精度过低(' + Math.round(accuracy) + 'm)')
        return
      }

      // 精度合格，使用坐标
      console.log(`[ServicePage] 使用${source}坐标:`, latitude.toFixed(6), longitude.toFixed(6))
      setUserLocation({ lat: latitude, lng: longitude })

      // 缓存定位结果（10 分钟内复用，避免重复定位不稳定）
      try {
        localStorage.setItem('pethome_location', JSON.stringify({
          lat: latitude, lng: longitude, accuracy: accuracy || 0, ts: Date.now()
        }))
      } catch { /* 静默 */ }

      // 异步获取中文城市名（仅 UI 显示）
      ;(async () => {
        try {
          const r = await api.regeo(latitude, longitude)
          if (r && r.code === 200 && r.data?.city) {
            const city = r.data.city
            if (/[\u4e00-\u9fa5]/.test(city)) {
              console.log('[ServicePage] 高德 regeo:', city, r.data.district || '')
              setLocationCity(city)
              try {
                const c = JSON.parse(localStorage.getItem('pethome_location') || '{}')
                c.city = city
                localStorage.setItem('pethome_location', JSON.stringify(c))
              } catch { /* 静默 */ }
              return
            }
          }
        } catch (e) {
          console.warn('[ServicePage] 高德 regeo 失败:', e.message)
        }
        try {
          const ipResp = await fetch('https://ipwho.is/', { cache: 'no-store' })
          const ipData = await ipResp.json()
          if (ipData?.city) setLocationCity(ipData.city)
        } catch { /* 静默 */ }
      })()
    }

    // 2) 优先使用高德 JS SDK 定位（在中国有更完善的 WiFi/基站数据库，精度更高）
    if (typeof AMap !== 'undefined') {
      console.log('[ServicePage] 使用高德 SDK 定位（WiFi/基站/GPS 综合定位）')
      AMap.plugin('AMap.Geolocation', () => {
        const geo = new AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 12000,
          GeoLocationFirst: true,
          noIpLocate: 0,
          getCityWhenFail: false,
          needAddress: false
        })
        geo.getCurrentPosition((status, result) => {
          if (status === 'complete' && result.position) {
            const { lat, lng } = result.position
            const accuracy = result.accuracy || 0
            handlePosition(lat, lng, accuracy, '高德 SDK')
          } else {
            console.warn('[ServicePage] 高德 SDK 定位失败:', status, result?.message || '')
            // 降级到浏览器原生 geolocation
            browserLocate()
          }
        })
      })
    } else {
      browserLocate()
    }

    // 3) 浏览器原生 geolocation 作为备选
    function browserLocate() {
      if (!navigator.geolocation) {
        fallbackToIp('浏览器不支持定位')
        return
      }
      console.log('[ServicePage] 使用浏览器原生 geolocation')
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords
          await handlePosition(latitude, longitude, accuracy, '浏览器')
        },
        async (err) => {
          setLocating(false)
          await fallbackToIp(err?.message || err?.code || '定位权限被拒/超时')
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    }
  }

  // 页面加载时自动定位
  useEffect(() => {
    doLocate()
  }, [slug])

  // 拉高德 POI 列表：按 slug 传服务类型，每个子模块搜不同关键词 → 不同商家
  useEffect(() => {
    let alive = true
    // 切换子模块时先重置为加载态，避免老数据短暂停留造成「切换不刷新」错觉
    setPois(null)
    setBannerIdx(0)
    const load = async () => {
      try {
        let r
        if (userLocation) {
          // 传 slug（bath/grooming/boarding…），后端按 TYPE_TO_AMAP_KW 搜不同关键词
          r = await api.amapAround(slug, userLocation.lng, userLocation.lat, 5000, 18)
        } else {
          // 没有定位时：传 slug + 空 city，让后端按类型搜索
          r = await api.amapSearch(slug, '', 18)
        }
        const list = r && r.code === 200 && Array.isArray(r.data) ? r.data : []
        // 如果按定位搜到 0 条，再试文本搜索兜底
        if (alive && list.length === 0 && userLocation) {
          r = await api.amapSearch(slug, locationCity || '', 18)
          if (r && r.code === 200) {
            const fallback = Array.isArray(r.data) ? r.data : []
            // 给 fallback 补一个距离字段（直线距离，单位米）
            fallback.forEach(p => {
              if (p.lat != null && p.lng != null) {
                p.distance = calcDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
              }
            })
            if (alive) setPois(fallback)
            return
          }
        }
        if (alive) setPois(list)
      } catch (e) {
        console.warn('[ServicePage] 拉取商家失败:', e)
        if (alive) setPois([])
      }
    }
    load()
    return () => { alive = false }
  }, [slug, userLocation, locationCity])

  // 顶部轮播图：始终使用 picture/同城服务 目录的本地图片（由 pickImgs(slug) 分配）
  // 不再从高德拉取 API 照片，确保展示的是提供的实拍图

  // Banner 轮播（5s 切换）
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (pois === null) return <CenterLoading />

  const filtered = pois
    .filter(p => !keyword || p.name?.includes(keyword) || (p.address || '').includes(keyword))
    .filter(p => filter === 'all' || matchFilter(p, filter))
    .sort((a, b) => {
      if (sort === 'rating') return ((b.rating || 0) - (a.rating || 0))
      return ((a.distance || 9999) - (b.distance || 9999))
    })

  const b = banners[bannerIdx]
  const heroImg = b.img

  return (
    <section className="mx-auto max-w-5xl px-4 py-6 fade-in">
      {/* 返回 */}
      <button onClick={() => navigate(-1)} className="clickable flex items-center gap-1 text-sm text-ink-600 hover:text-brand-600 mb-4">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* ===== 顶部 Hero 风格轮播（加高：h-72，左文案 + 右数据） ===== */}
      <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 mb-4 shadow-card">
        {/* 背景实拍图 */}
        <div className="absolute inset-0">
          <PetImg src={heroImg} alt={b.title} className="w-full h-full object-cover" fallbackText={b.accent} />
        </div>
        {/* 渐变叠层 */}
        <div className="absolute inset-0 mix-blend-multiply" style={{ background: b.gradient, opacity: 0.78 }} />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/15" />

        {/* 左侧：标题 + 副标题 + CTA */}
        <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-6 sm:px-10 text-white max-w-[55%]" key={`text-${bannerIdx}`}>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight drop-shadow-lg leading-tight">
            {b.title}
          </div>
          <div className="text-sm sm:text-base opacity-95 mt-2 drop-shadow leading-relaxed max-w-sm">
            {b.subtitle}
          </div>
          <button
            onClick={() => setBooking({ _placeholder: true })}
            className="clickable mt-4 bg-white text-brand-600 font-bold px-5 py-2 rounded-full text-sm shadow-hover tracking-wide w-fit"
          >
            {b.cta} →
          </button>
        </div>

        {/* 右侧：辅助信息卡片 */}
        <div className="absolute inset-y-0 right-0 hidden sm:flex flex-col justify-center items-end pr-5 sm:pr-8 text-white gap-3">
          {/* 服务亮点卡 */}
          <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20 shadow-card min-w-[160px]">
            <div className="text-[10px] opacity-90 tracking-wider mb-1.5">✨ 服务亮点</div>
            <div className="text-lg font-extrabold">{title}</div>
            <div className="text-[11px] mt-1 opacity-80 leading-relaxed">{subtitle}</div>
          </div>
          {/* 商家数量 */}
          <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 border border-white/20 shadow-card min-w-[140px]">
            <div className="text-[10px] opacity-90 tracking-wider flex items-center gap-1">
              <MapPin size={10} /> 附近商家
            </div>
            <div className="text-2xl font-extrabold mt-0.5">{pois ? pois.length : '—'}</div>
            <div className="text-[10px] mt-1 opacity-80">
              {locationCity ? `📍 ${locationCity.replace(/市.*/, '市').replace(/区.*/, '')}` : '定位中…'}
            </div>
          </div>
        </div>

        {/* 左右切换 */}
        <button
          onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)}
          className="clickable absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => setBannerIdx(i => (i + 1) % banners.length)}
          className="clickable absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10"
        >
          <ChevronRight size={18} />
        </button>
        {/* 圆点指示器 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`clickable h-2 rounded-full transition-all ${i === bannerIdx ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      </div>

      {/* ===== 筛选条 ===== */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 flex items-center px-3 py-2 rounded-lg border border-ink-200 bg-white">
            <Search size={14} className="text-ink-400 mr-2" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索商家 / 地址"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
            />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 text-xs rounded-lg border border-ink-200 bg-white outline-none font-semibold text-ink-700 cursor-pointer">
            <option value="distance">距离最近</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
        {filterOptions.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
            <Chip label="全部" active={filter === 'all'} onClick={() => setFilter('all')} />
            {filterOptions.map(o => (
              <Chip key={o.k} label={o.l} active={filter === o.k} onClick={() => setFilter(o.k)} />
            ))}
          </div>
        )}
      </div>

      {/* ===== 附近商家 ===== */}
      <div className="bg-white rounded-2xl border border-ink-200 p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-500" /> 附近商家
          </div>
          <div className="text-[11px] text-ink-500 flex items-center gap-1.5">
            {locating ? (
              <><Loader2 size={11} className="animate-spin" /> 定位中…</>
            ) : locationCity ? (
              <>📍 <span className="font-semibold text-brand-600">{locationCity.replace(/市.*/, '市').replace(/区.*/, '')}</span></>
            ) : userLocation ? (
              <>已定位到你附近</>
            ) : locError ? (
              <><span className="text-amber-600">{locError}</span></>
            ) : null}
            <span>· 共 {filtered.length} 家</span>
          </div>
        </div>
        {filtered.length > 0 && filtered[0]._fallback && (
          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5">
            <AlertTriangle size={12} /> 高德 API Key 未配置或类型不匹配（后端需要「Web服务」类型的 Key），以下为示例商家（电话/距离仅供参考）
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-400">
            暂无符合条件的商家
            <div className="mt-2">
              <button onClick={() => { setFilter('all'); setKeyword('') }} className="clickable text-xs text-brand-600 hover:underline">
                清除筛选
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            {filtered.map((p, i) => (
              <StoreRow key={p.id || i} poi={p} onOpen={() => setDetail(p)} />
            ))}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {detail && (
        <DetailModal poi={detail} onClose={() => setDetail(null)} onBook={() => { setBooking(detail); setDetail(null) }} />
      )}

      {/* 预约弹窗（点击 banner CTA / 秒杀卡片 → 暂时直接给 toast，后续可跳到首条商家） */}
      {booking && (
        booking._placeholder ? (
          <BannerCtaModal banner={b} onClose={() => setBooking(null)} filterEl={document.querySelector('[data-anchor="store-list"]')} />
        ) : (
          <BookingModal poi={booking} fields={bookingFields} submitNote={bookingSubmitNote} onClose={() => setBooking(null)} />
        )
      )}
    </section>
  )
}

// ===== 商家列表行 =====
function StoreRow({ poi, onOpen }) {
  const photo = poi.photos?.[0]
  const tags = poi.type ? String(poi.type).split(/[;,]/).filter(Boolean).slice(0, 2) : []
  const isFallback = poi._fallback   // 后端标记的 fallback 数据（本地 seed，非高德真实 POI）
  return (
    <div onClick={onOpen} className="clickable py-3 flex items-start gap-3 group">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-ink-100 shrink-0 relative">
        {photo ? (
          <img src={photo} alt={poi.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <PetImg src={petImg(poi.serviceMode === '上门' ? 'walking,dog' : 'happy,puppy', 33)} alt={poi.name} className="w-full h-full object-cover" fallbackText="🏪" />
        )}
        {isFallback && (
          <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] text-center py-0.5">示例商家</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm text-ink-900 truncate flex-1">{poi.name || '(未命名)'}</span>
          {!isFallback && poi.rating ? (
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-amber-600 shrink-0">
              <Star size={11} className="fill-amber-500 text-amber-500" /> {poi.rating}
            </span>
          ) : null}
        </div>
        <div className="text-[11px] text-ink-500 mt-1 flex items-center gap-1">
          <MapPin size={10} className="text-brand-500 shrink-0" />
          <span className="truncate">{poi.address || '地址待补充'}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {poi.priceRange && <span className="text-[11px] text-brand-600 font-semibold">{poi.priceRange}</span>}
          {!isFallback && poi.distance != null && <span className="text-[10px] text-ink-400">{poi.distance >= 1000 ? `${(poi.distance / 1000).toFixed(1)}km` : `${poi.distance}m`}</span>}
          {tags.length > 0 && tags.map(t => (
            <span key={t} className="text-[10px] bg-ink-100 text-ink-500 px-1.5 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
      <ChevronRight size={16} className="text-ink-300 self-center shrink-0 group-hover:text-brand-500" />
    </div>
  )
}

// ===== 详情弹窗（高德 POI / 本地 fallback 共用） =====
function DetailModal({ poi, onClose, onBook }) {
  const photos = poi.photos || []
  const [idx, setIdx] = useState(0)
  const isFallback = poi._fallback   // 后端标记的 fallback 数据
  useEffect(() => {
    if (photos.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % photos.length), 4500)
    return () => clearInterval(t)
  }, [photos.length])

  return (
    <Modal title={poi.name || '商家详情'} onClose={onClose} wide
      footer={<>
        <button onClick={onClose} className="text-sm text-ink-500 px-3 py-2">关闭</button>
        {!isFallback && <button onClick={onBook} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg flex items-center gap-1">
          <Calendar size={13} /> 立即预约
        </button>}
      </>}>
      <div className="space-y-4">
        {isFallback && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
            <AlertTriangle size={13} /> 此为示例商家，电话/距离等信息仅供参考。需要在高德控制台创建「Web服务」类型的 API Key 并配置到后端环境变量 AMAP_API_KEY 中，即可展示真实商家。
          </div>
        )}

        {photos.length > 0 ? (
          <div className="relative h-56 rounded-xl overflow-hidden bg-ink-100">
            {photos.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`${poi.name} 实拍 ${i + 1}`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{ opacity: i === idx ? 1 : 0 }}
                onError={(e) => { e.currentTarget.style.opacity = 0 }}
              />
            ))}
            {photos.length > 1 && (
              <>
                <button onClick={() => setIdx(i => (i - 1 + photos.length) % photos.length)} className="clickable absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setIdx(i => (i + 1) % photos.length)} className="clickable absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 flex items-center justify-center">
                  <ChevronRight size={14} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`} />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-2 right-2 text-[10px] text-white bg-black/40 px-1.5 py-0.5 rounded">
              {idx + 1} / {photos.length}
            </div>
          </div>
        ) : (
          <div className="h-32 rounded-xl bg-ink-100 flex items-center justify-center text-xs text-ink-400">
            <ImageOff size={14} className="mr-1" /> 暂无实拍图
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Info icon={MapPin} label="地址" value={poi.address || '—'} />
          {!isFallback && poi.tel ? <Info icon={Phone} label="电话" value={poi.tel} link={`tel:${poi.tel}`} /> : <Info icon={Phone} label="电话" value={isFallback ? '暂无' : '—'} />}
          {!isFallback && poi.rating ? <Info icon={Star} label="评分" value={poi.rating} highlight /> : <Info icon={Star} label="评分" value="—" />}
          {!isFallback && poi.location ? <Info icon={Navigation} label="坐标" value={poi.location} small /> : null}
          {poi.priceRange ? <Info icon={Tag} label="价格" value={poi.priceRange} highlight /> : <Info icon={Tag} label="价格" value="—" />}
          {poi.openTime ? <Info icon={Clock} label="营业时间" value={poi.openTime} small /> : <Info icon={Clock} label="营业时间" value="—" />}
        </div>

        {(poi.tags || poi.description) && (
          <div className="border-t border-ink-100 pt-3">
            {poi.tags && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {String(poi.tags).split(/[,，;]/).filter(Boolean).map(t => (
                  <span key={t} className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded">{t}</span>
                ))}
              </div>
            )}
            {poi.description && <div className="text-xs text-ink-600 leading-relaxed">{poi.description}</div>}
          </div>
        )}
      </div>
    </Modal>
  )
}

function Info({ icon: Icon, label, value, highlight, link, small }) {
  const Inner = (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border border-ink-100 bg-white ${link ? 'clickable hover:bg-ink-50' : ''}`}>
      <Icon size={13} className="text-brand-500 mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-ink-400 mb-0.5">{label}</div>
        <div className={`${small ? 'text-[11px]' : 'text-sm'} font-semibold ${highlight ? 'text-amber-600' : 'text-ink-900'} truncate`}>{value}</div>
      </div>
    </div>
  )
  return link ? <a href={link} onClick={e => e.stopPropagation()}>{Inner}</a> : Inner
}

// ===== 预约弹窗 =====
function BookingModal({ poi, fields, submitNote, onClose }) {
  const initial = {}
  for (const f of fields) initial[f.key] = f.defaultVal || ''
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const submit = () => {
    for (const f of fields) {
      if (f.required && !form[f.key]) { alert(`请填写 ${f.label}`); return }
    }
    alert(submitNote || '预约已提交，商家将尽快与您联系')
    onClose()
  }
  return (
    <Modal title="预约服务" onClose={onClose}
      footer={<>
        <button onClick={onClose} className="text-sm text-ink-500 px-3 py-2">取消</button>
        <button onClick={submit} className="clickable text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-lg flex items-center gap-1">
          <Calendar size={13} /> 确认预约
        </button>
      </>}>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-ink-50 mb-4">
        {poi.photos?.[0] && <img src={poi.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-ink-900 truncate">{poi.name}</div>
          <div className="text-[11px] text-ink-500 mt-0.5 truncate">{poi.address || '—'}</div>
        </div>
      </div>
      <div className="space-y-3">
        {fields.map(f => (
          <Field key={f.key} label={f.label} required={f.required}>
            {f.type === 'select' ? (
              <select className={inp} value={form[f.key]} onChange={e => set(f.key, e.target.value)}>
                <option value="">请选择</option>
                {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className={`${inp} resize-none`} rows={3} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
            ) : (
              <input className={inp} type={f.type || 'text'} value={form[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  )
}

// ===== 顶部 banner / 秒杀卡的 CTA 弹窗（暂时引导回顶部"附近商家"）=====
function BannerCtaModal({ banner, onClose }) {
  return (
    <Modal title={banner.title} onClose={onClose}
      footer={<button onClick={onClose} className="text-sm text-ink-500 px-3 py-2">关闭</button>}>
      <div className="space-y-3">
        <div className="text-sm text-ink-700 leading-relaxed">{banner.subtitle}</div>
        <div className="bg-ink-50 rounded-lg p-3 text-xs text-ink-500">
          请在下方"附近商家"列表中选择一家 → 进入详情 → 点击"立即预约"
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-xs text-ink-600 block mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

const inp = 'w-full px-3 py-2 text-sm rounded-lg border border-ink-200 bg-white outline-none focus:border-brand-400 placeholder:text-ink-400'

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`clickable shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border transition
        ${active ? 'border-transparent text-white bg-brand-500' : 'border-ink-200 text-ink-700 bg-white hover:bg-ink-50'}`}
    >
      {label}
    </button>
  )
}

function Modal({ title, onClose, footer, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center fade-in" onClick={onClose}>
      <div
        className={`bg-white w-full ${wide ? 'md:max-w-2xl' : 'md:max-w-md'} md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 p-4 flex items-center justify-between z-10">
          <div className="font-bold text-ink-900">{title}</div>
          <button onClick={onClose} className="clickable p-1 text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="sticky bottom-0 bg-white border-t border-ink-100 p-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

function CenterLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-ink-500">
      <div className="inline-flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-brand-400 animate-pulse" /> 正在拉取附近商家…
      </div>
    </div>
  )
}

function matchFilter(poi, key) {
  const t = (poi.type || '').toLowerCase()
  const name = (poi.name || '').toLowerCase()
  if (key === 'dog') return /犬|狗/.test(t) || /犬|狗/.test(name)
  if (key === 'cat') return /猫/.test(t) || /猫/.test(name)
  if (key === 'other') return /兔|鼠|宠/.test(t) && !/犬|狗|猫/.test(t)
  if (key === '上门') return /上门/.test(name) || /到家/.test(name) || poi.serviceMode === '上门'
  if (key === '到店') return poi.serviceMode === '到店'
  return true
}

// 经纬度直线距离（米）
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = d => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}