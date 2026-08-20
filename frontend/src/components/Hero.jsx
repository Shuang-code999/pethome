import { useState, useEffect } from 'react'
import { petAvatar } from '../data/petImages.js'
import { HOME_BANNERS } from '../data/localImages.js'
import PetImg from './PetImg.jsx'
import FloatingPets from './FloatingPets.jsx'
import {
  ChevronLeft, ChevronRight, Plus, FilePlus2, BellRing, PawPrint,
  Loader2, Heart, Zap
} from 'lucide-react'
import { api } from '../api.js'
import Reveal from './common/Reveal.jsx'
import { petEvents } from '../hooks/petEvents.js'

// 判断字符串是否包含中文字符（OpenWeatherMap 返回的地名是拼音如 "Houjiajiao"，不含中文）
const isChinese = (s) => s && /[一-鿿]/.test(s)

// Banner 设计：固定四张主推图，旋转 5s
// 图片取自 picture/首页 本地资源（按文件名顺序）
// 已精简：去掉"7×24h"等过度营销文案，去掉右侧悬浮跳动标签
const banners = [
  {
    title: '0 门槛建档',
    subtitle: '建档立享新用户专享洗护券',
    cta: '立即建档',
    gradient: 'linear-gradient(135deg, #FFB099 0%, #FF7A59 60%, #F2613E 100%)',
    img: HOME_BANNERS[0],
    accent: 'dog'
  },
  {
    title: 'AI 问诊',
    subtitle: 'AI 宠物医生分诊 · 多轮对话',
    cta: '立即问诊',
    gradient: 'linear-gradient(135deg, #B8F2D8 0%, #2EC4B6 50%, #1FA89C 100%)',
    img: HOME_BANNERS[1],
    accent: 'cat'
  },
  {
    title: '宠物商城',
    subtitle: '主粮 / 零食 / 玩具 · 品质甄选',
    cta: '去逛逛',
    gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)',
    img: HOME_BANNERS[2],
    accent: 'dog'
  },
  {
    title: '同城洗护',
    subtitle: '专业护理师上门，毛孩子更放松',
    cta: '预约洗护',
    gradient: 'linear-gradient(135deg, #BBE3FF 0%, #2563EB 55%, #1D4ED8 100%)',
    img: HOME_BANNERS[3],
    accent: 'dog'
  }
]

export default function Hero({ logged, onLoginClick, onNavigate }) {
  const [idx, setIdx] = useState(0)
  const [reminders, setReminders] = useState([])
  const [myPets, setMyPets] = useState(null)
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (logged) {
      api.reminders().then(res => setReminders(res.code === 200 ? res.data || [] : []))
      api.myPets().then(res => setMyPets(res.code === 200 ? res.data || [] : []))
    } else {
      setReminders([])
      setMyPets(null)
    }
  }, [logged])

  // 监听宠物档案变更（其他页面新增 / 删除 / 更新后同步刷新）
  useEffect(() => {
    if (!logged) return
    const off = petEvents.on(() => {
      api.myPets().then(res => setMyPets(res.code === 200 ? res.data || [] : []))
    })
    return off
  }, [logged])

  // 获取天气（基于浏览器定位）
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.weather(pos.coords.latitude, pos.coords.longitude)
          .then(res => { if (res.code === 200) setWeather(res.data) })
          .catch(() => {})
      },
      () => {
        // 定位失败时不强行用上海坐标，保持静默即可
      }
    )
  }, [])

  const b = banners[idx]
  const nextReminder = reminders.length > 0 ? reminders[0] : null

  return (
    <>
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
      {/* ============ Banner：clay 双卡 + 背景图 + 跳动悬浮框 ============ */}
      <Reveal className="relative rounded-claylg overflow-hidden h-[360px] clay">
        {/* 背景图 + 渐变叠层 */}
        <div className="absolute inset-0" key={`img-${idx}`}>
          <PetImg src={b.img} alt={b.title} className="w-full h-full object-cover" fallbackText={b.accent} />
        </div>
        <div
          className="absolute inset-0 mix-blend-multiply"
          key={`bg-${idx}`}
          style={{ background: b.gradient, opacity: 0.75 }}
        />

        {/* 浮动宠物装饰（稀疏） */}
        <FloatingPets density="sparse" />

        {/* 右下小实拍宠物照（保留主视觉装饰，但去掉了弹跳动效） */}
        <div
          className="absolute bottom-4 right-4 w-28 h-28 rounded-claylg overflow-hidden shadow-hover ring-4 ring-white/40 hidden md:block"
          aria-hidden
        >
          <PetImg
            src={b.img}
            alt=""
            className="w-full h-full object-cover"
            fallbackText=""
          />
        </div>

        {/* 主文案：胖乎乎入场 */}
        <div className="fade-in absolute inset-0 flex flex-col justify-center px-10 text-white" key={`text-${idx}`}>
          <div className="text-3xl md:text-5xl font-extrabold font-display tracking-tight drop-shadow-lg">
            {b.title}
          </div>
          <div className="text-base md:text-lg opacity-95 mt-2 drop-shadow max-w-md">
            {b.subtitle}
          </div>
          <button className="clickable mt-5 bg-white text-brand-600 font-bold px-7 py-2.5 rounded-clay w-fit text-sm shadow-hover font-display tracking-wide">
            {b.cta} →
          </button>
        </div>

        {/* 左右切换 */}
        <button
          onClick={() => setIdx((i) => (i - 1 + banners.length) % banners.length)}
          className="clickable absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white"
          aria-label="上一张"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % banners.length)}
          className="clickable absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/30 hover:bg-white/60 backdrop-blur flex items-center justify-center text-white"
          aria-label="下一张"
        >
          <ChevronRight size={20} />
        </button>
        {/* 指示器：Claymorphism 风格圆点 */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`clickable h-2.5 rounded-full transition-all ${i === idx
                ? 'w-8 bg-white shadow-hover'
                : 'w-2.5 bg-white/50 hover:bg-white/80'}`}
              aria-label={`第 ${i + 1} 张`}
            />
          ))}
        </div>
      </Reveal>

      {/* ============ 我的宠物卡 / 未登录引导卡：clay 软糯风格 ============ */}
      <Reveal delay={1} className="clay clay-hover p-5 flex flex-col relative overflow-hidden">
        {/* 装饰性小实拍照（替代原 🐾 emoji） */}
        <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full overflow-hidden ring-2 ring-white shadow-clay-sm animate-bounce-soft opacity-90" aria-hidden>
          <PetImg src={petAvatar('dog,cute', 80)} alt="" className="w-full h-full object-cover" />
        </div>

        {logged ? (
          <PetMyCard onNavigate={onNavigate} nextReminder={nextReminder} pets={myPets} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-peach to-brand-100 text-brand-600 flex items-center justify-center animate-heartbeat shadow-glow">
              <FilePlus2 size={26} />
            </div>
            <div>
              <div className="text-base font-bold text-ink-900 font-display">还没有宠物档案</div>
              <div className="text-xs text-ink-500 mt-1">0 门槛建档 · 送 ¥20 洗护券</div>
            </div>
            <button
              onClick={() => onNavigate('pet')}
              className="clickable btn-brand w-full text-sm py-2.5"
            >
              立即建档
            </button>
            <button
              onClick={onLoginClick}
              className="clickable text-xs text-ink-500 hover:text-brand-600 font-semibold"
            >
              登录后建档 →
            </button>
          </div>
        )}
      </Reveal>
    </section>

      {/* ============ 天气宠物出行建议卡：Clay 风 ============ */}
      {weather && (
        <Reveal delay={2} className="mt-5 clay clay-hover p-4 flex items-center gap-4 relative overflow-hidden">
          {/* 装饰 blob */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky rounded-full mesh-dot opacity-50" aria-hidden />
          <div className="w-14 h-14 rounded-clay bg-white flex items-center justify-center text-3xl shrink-0 shadow-clay-sm relative">
            {weather.adviceIcon || '🌤️'}
          </div>
          <div className="flex-1 min-w-0 relative">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink-900 font-display">{isChinese(weather.city) ? weather.city : '当地'}天气</span>
              <span className="text-xs text-ink-400">{weather.description}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-ink-600">
              <span>🌡️ {weather.temp?.toFixed(0)}°C</span>
              {weather.humidity && <span>💧 湿度 {weather.humidity}%</span>}
              {weather.wind && <span>🌬️ {weather.wind.toFixed(1)}m/s</span>}
            </div>
            <div className={`text-xs mt-1.5 font-semibold ${
              weather.adviceLevel === 'danger' ? 'text-red-600' :
              weather.adviceLevel === 'warn' ? 'text-amber-600' : 'text-health-600'
            }`}>
              🐾 {weather.advice}
            </div>
          </div>
        </Reveal>
      )}
    </>
  )
}

function PetMyCard({ onNavigate, nextReminder, pets }) {
  if (pets === null) {
    return (
      <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> 加载中…
      </div>
    )
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-peach to-brand-100 text-brand-600 flex items-center justify-center animate-heartbeat shadow-glow">
          <FilePlus2 size={26} />
        </div>
        <div>
          <div className="text-base font-bold text-ink-900 font-display">还没有宠物档案</div>
          <div className="text-xs text-ink-500 mt-1">0 门槛建档</div>
        </div>
        <button
          onClick={() => onNavigate('pet')}
          className="clickable btn-brand w-full text-sm py-2.5"
        >
          立即建档
        </button>
      </div>
    )
  }

  const p = pets[0]
  let ageLabel = ''
  if (p.birthday) {
    const bday = new Date(p.birthday)
    const now = new Date()
    const years = (now - bday) / (1000 * 60 * 60 * 24 * 365.25)
    if (years >= 1) ageLabel = `${years.toFixed(1)}岁`
    else ageLabel = `${Math.max(0, Math.round(years * 12))}月龄`
  } else ageLabel = p.gender === 1 ? '小公举' : '小公主'

  return (
    <div className="flex flex-col h-full">
      <div className="text-sm font-bold text-ink-900 mb-3 flex items-center justify-between font-display">
        <span className="flex items-center gap-1.5">
          <PawPrint size={15} className="text-brand-500 fill-brand-500" /> 我的宠物
        </span>
        <button onClick={() => onNavigate('pet')} className="clickable w-7 h-7 rounded-full bg-brand-50 hover:bg-brand-100 text-brand-600 flex items-center justify-center">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex flex-col items-center text-center">
        {/* 头像胖乎乎边框 + 弹出感 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white animate-bounce-soft bg-ink-100 shadow-clay-sm">
            <PetImg
              src={p.avatar || petAvatar('dog,cute', 200)}
              alt={p.name}
              className="w-full h-full object-cover"
              fallbackText={p.name?.[0] || '🐶'}
            />
          </div>
          {/* 小爱心角标 */}
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-clay-sm flex items-center justify-center animate-heartbeat">
            <Heart size={14} className="text-rose-500 fill-rose-500" />
          </div>
        </div>

        <div className="mt-3 text-lg font-bold text-ink-900 font-display">{p.name}</div>
        <div className="text-xs text-ink-500">{p.breed || p.species} · {ageLabel}</div>
        <div className="mt-1 text-xs text-ink-700 flex items-center gap-1">
          <PawPrint size={12} className="text-brand-500" /> {p.weight ? `${p.weight} kg` : '体重待补充'}
        </div>
        {pets.length > 1 && (
          <div className="mt-1 text-[10px] text-ink-400">共 {pets.length} 只 · 第 1 只</div>
        )}
      </div>

      {/* 提醒条 */}
      <div className="mt-auto clay-inset p-3 flex items-start gap-2">
        <BellRing size={15} className="text-health-600 mt-0.5 shrink-0 animate-bounce-soft" />
        <div className="text-xs">
          <div className="font-bold text-ink-900">
            {nextReminder ? nextReminder.title : '暂无提醒'}
          </div>
          <div className="text-ink-500 mt-0.5">
            {nextReminder ? nextReminder.remindDate + ' 到期' : '点击下方查看更多'}
          </div>
        </div>
      </div>
      <button
        onClick={() => onNavigate('pet')}
        className="clickable mt-3 text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-end"
      >
        查看档案 <Zap size={12} className="fill-current" />
      </button>
    </div>
  )
}
