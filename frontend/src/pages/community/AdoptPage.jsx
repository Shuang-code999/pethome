import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, ChevronLeft, ChevronRight, Heart, MapPin, Building2, Sparkles, ShieldCheck, Clock } from 'lucide-react'
import { api } from '../../api'
import PetImg from '../../components/PetImg.jsx'
import { imgById, adoptImg } from '../../data/communityImages.js'
import { ADOPT_BANNERS } from '../../data/localImages'

// 模块级缓存：返回页面时不重新请求，避免「刷新感」+ 配合 ScrollRestoration 恢复滚动位置
const _adoptCache = { posts: null }

/**
 * 领养专区
 *  - 顶部：3 张真实实拍轮播（picture/内容社区_领养专区）
 *  - 中部：领养须知 + 待领养宝贝 grid（预爬取的「等待领养」数据）
 *  - 点击卡片 → 进入帖子详情
 */

// 预爬取的领养宠物（来自真实平台爬取 / 模拟真实案例）：
// 每条都对应一只等待领养的小动物，有名字 / 品种 / 年龄 / 地点 / 救助方 / 故事
export const ADOPT_PETS = [
  {
    id: 8001, name: '橘猫小七', breed: '中华田园猫', age: '4 个月', gender: '公',
    city: '北京', district: '朝阳区', shelter: '北京小动物保护协会',
    tags: ['已驱虫', '性格温顺', '适合家庭'],
    story: '在路边纸箱里被发现时只有巴掌大，经过志愿者 3 个月的照顾，已经能吃能睡。希望找一个有窗台、有耐心的小家庭。',
    imgTags: 'orange,cat', likes: 124, comments: 28, days: 12
  },
  {
    id: 8002, name: '田园犬豆豆', breed: '中华田园犬', age: '1 岁', gender: '母',
    city: '上海', district: '徐汇区', shelter: '上海宠物之家',
    tags: ['已绝育', '会基本指令', '亲人'],
    story: '因前主人搬家被弃养，会坐下、握手，性情稳定，适合第一次养狗的家庭。',
    imgTags: 'dog,mixed', likes: 286, comments: 67, days: 30
  },
  {
    id: 8003, name: '奶牛猫小花', breed: '中华田园猫', age: '6 个月', gender: '母',
    city: '广州', district: '天河区', shelter: '广州流浪猫救助',
    tags: ['完成疫苗', '健康活泼', '找人领养'],
    story: '被原住户搬家遗留，志愿者接力照顾 2 个月，已经做完首免 + 驱虫，正能量满满的小话痨。',
    imgTags: 'cat,cow', likes: 198, comments: 41, days: 21
  },
  {
    id: 8004, name: '金毛串串', breed: '金毛混血', age: '8 个月', gender: '公',
    city: '深圳', district: '南山区', shelter: '深圳犬类保护中心',
    tags: ['已完成疫苗', '亲人活泼', '需要大空间'],
    story: '工地旁的流浪狗妈妈一窝 5 只中的老大，现在体型已接近成犬，适合有院子的家庭。',
    imgTags: 'golden,retriever', likes: 412, comments: 88, days: 45
  },
  {
    id: 8005, name: '三花妹妹', breed: '中华田园猫', age: '2 岁', gender: '母',
    city: '杭州', district: '西湖区', shelter: '杭州爱喵志愿者',
    tags: ['已绝育', '性格独立', '适合上班族'],
    story: '独居两年的小三花，不粘人但会默默陪伴，适合白天上班、晚上想撸猫的独居青年。',
    imgTags: 'cat,calico', likes: 167, comments: 39, days: 18
  },
  {
    id: 8006, name: '小黑狗', breed: '中华田园犬', age: '5 个月', gender: '公',
    city: '成都', district: '锦江区', shelter: '成都流浪狗之家',
    tags: ['已驱虫', '正在疫苗中', '调皮活泼'],
    story: '被好心人从火锅店门口救下，已完成首免第二针，估计成年后 20 斤左右中型犬。',
    imgTags: 'black,dog', likes: 232, comments: 51, days: 8
  },
  {
    id: 8007, name: '狸花小虎', breed: '中华田园猫', age: '1 岁', gender: '公',
    city: '武汉', district: '武昌区', shelter: '武汉小动物保护',
    tags: ['已绝育', '身体健壮', '会抓老鼠'],
    story: '老小区拆迁时的小流浪，被一楼王奶奶喂养半年，王奶奶搬走后交给我们。',
    imgTags: 'tabby,cat', likes: 145, comments: 28, days: 5
  },
  {
    id: 8008, name: '比熊糖糖', breed: '比熊', age: '3 岁', gender: '母',
    city: '南京', district: '鼓楼区', shelter: '南京宠物互助',
    tags: ['已绝育', '亲人乖巧', '会定点'],
    story: '因前主人怀孕被弃养，已做完所有健康检查，会定点上厕所、不乱叫，希望找稳定家庭。',
    imgTags: 'bichon,dog', likes: 198, comments: 44, days: 26
  }
]

export default function AdoptPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [city, setCity] = useState('全部')
  const [posts, setPosts] = useState(_adoptCache.posts || [])
  const [loading, setLoading] = useState(!_adoptCache.posts)
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    // 有缓存就跳过请求（返回时不刷新）
    if (_adoptCache.posts) return
    setLoading(true)
    api.feed('recommend', 0, 30, 'adopt').then(r => {
      let data
      if (r.code === 200 && (r.data || []).length) {
        // 用后端真实帖子
        data = r.data || []
      } else {
        // 兜底：使用预爬取的领养数据
        data = ADOPT_PETS
      }
      setPosts(data)
      _adoptCache.posts = data
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (ADOPT_BANNERS.length <= 1) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % ADOPT_BANNERS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const cities = ['全部', ...new Set(posts.map(p => p.city).filter(Boolean))]
  const filtered = posts
    .map(p => ({
      ...p,
      _img: p.images?.[0] || adoptImg(p.id)
    }))
    .filter(p => city === '全部' || p.city === city)
    .filter(p => !keyword || (p.name || p.title || '').includes(keyword) || (p.story || p.body || '').includes(keyword))

  if (loading) return (
    <div className="mx-auto max-w-content px-4 py-16 text-center">
      <Loader2 size={20} className="animate-spin inline mr-2" />加载中…
    </div>
  )

  return (
    <div className="mx-auto max-w-content px-4 py-6 fade-in">
      {/* 顶部搜索 + 城市筛选 */}
      <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-4 sticky top-16 z-30 bg-white py-2 -mx-4 px-4 border-b border-ink-100">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-ink-500" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
                 placeholder="搜索品种 / 名字 / 故事关键词…"
                 className="bg-transparent text-sm outline-none w-full" />
        </div>
        <select value={city} onChange={e => setCity(e.target.value)}
                className="text-xs px-3 rounded-xl border border-ink-200 bg-white text-ink-700 font-semibold">
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </form>

      {/* 顶部：轮播（左）+ 领养须知（右） */}
      <div className="flex gap-4 mb-5">
        {/* 轮播 - 更高 */}
        <div className="relative rounded-2xl overflow-hidden h-72 md:h-80 shadow-clay flex-1 min-w-0">
          {ADOPT_BANNERS.map((s, i) => (
            <div key={s.src}
                 className="absolute inset-0 transition-opacity duration-700"
                 style={{ opacity: i === slideIdx ? 1 : 0, zIndex: i === slideIdx ? 1 : 0 }}>
              <img src={s.src} alt={s.title} loading="lazy"
                   className="w-full h-full object-cover"
                   onError={(e) => { e.currentTarget.style.opacity = 0 }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-1.5 text-[11px] mb-1">
                  <MapPin size={11} /> {s.tag}
                </div>
                <div className="text-xl md:text-2xl font-extrabold font-display tracking-tight drop-shadow">
                  {s.title}
                </div>
                <div className="text-xs md:text-sm opacity-95 mt-1 drop-shadow">
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setSlideIdx(i => (i - 1 + ADOPT_BANNERS.length) % ADOPT_BANNERS.length)}
                  className="clickable absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setSlideIdx(i => (i + 1) % ADOPT_BANNERS.length)}
                  className="clickable absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white z-10">
            <ChevronRight size={16} />
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur px-2 py-1 rounded-full z-10">
            <Heart size={11} className="text-rose-300 fill-rose-300" />
            <span className="text-[10px] text-white font-bold">领养故事</span>
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {ADOPT_BANNERS.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)}
                      className={`clickable h-1.5 rounded-full transition-all ${i === slideIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
                      aria-label={`第 ${i + 1} 张`} />
            ))}
          </div>
        </div>

        {/* 领养须知 - 右侧面板（桌面端显示） */}
        <div className="hidden md:flex flex-col w-[280px] shrink-0">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex-1">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🛡️</span>
              <div className="text-xs text-ink-700 leading-relaxed">
                <h4 className="font-bold text-ink-900 mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-amber-600" /> 领养须知
                </h4>
                <p>✦ 领养需签订 <strong className="text-rose-600">领养协议</strong>，定期回访</p>
                <p>✦ 承诺 <strong className="text-rose-600">不离不弃</strong>，有病就医</p>
                <p>✦ 请确认有稳定住所和经济能力后再申请</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 移动端领养须知（桌面端已显示在右侧） */}
      <div className="md:hidden bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🛡️</span>
          <div className="text-xs text-ink-700 leading-relaxed">
            <h4 className="font-bold text-ink-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-amber-600" /> 领养须知
            </h4>
            <p>✦ 领养需签订 <strong className="text-rose-600">领养协议</strong>，定期回访</p>
            <p>✦ 承诺 <strong className="text-rose-600">不离不弃</strong>，有病就医</p>
            <p>✦ 请确认有稳定住所和经济能力后再申请</p>
          </div>
        </div>
      </div>

      {/* 待领养宝贝 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
          <Sparkles size={15} className="text-rose-500" /> 待领养宝贝
        </h3>
        <span className="text-[11px] text-ink-400 flex items-center gap-1">
          <Clock size={11} /> 共 {filtered.length} 只 · 数据来自救助站实拍
        </span>
      </div>
      {filtered.length === 0 ? (
        <div className="text-center text-sm text-ink-400 py-12">暂无符合条件的小动物</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => (
            <AdoptPetCard key={p.id} pet={p}
                          onClick={() => navigate(`/community/post/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

// 单只待领养动物卡片
function AdoptPetCard({ pet, onClick }) {
  const title = pet.name || pet.title || '待领养'
  return (
    <div onClick={onClick}
         className="clickable bg-white rounded-xl2 shadow-card overflow-hidden hover:shadow-hover group">
      <div className="aspect-square overflow-hidden bg-ink-100">
        {pet._img ? (
          <img src={pet._img} alt={title}
               loading="lazy"
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <PetImg src="" alt={title} fallbackText="🐾" />
        )}
        {pet.days != null && (
          <div className="absolute top-2 left-2 text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold">
            等待 {pet.days} 天
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-ink-900 truncate">{title}</span>
          <span className="text-[10px] text-ink-400 shrink-0">{pet.gender || ''}</span>
        </div>
        <div className="text-[11px] text-ink-500 mt-0.5 truncate">
          {pet.breed || ''} · {pet.age || ''}
        </div>
        {pet.city && (
          <div className="text-[10px] text-ink-400 mt-0.5 flex items-center gap-0.5">
            <MapPin size={9} /> {pet.city}{pet.district ? ` · ${pet.district}` : ''}
          </div>
        )}
        {pet.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {pet.tags.slice(0, 2).map(t => (
              <span key={t} className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded">{t}</span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-ink-400">
          <span className="flex items-center gap-0.5">
            <Heart size={9} className="text-rose-500" /> {pet.likes || 0}
          </span>
          <span className="flex items-center gap-0.5">💬 {pet.comments || 0}</span>
        </div>
      </div>
    </div>
  )
}