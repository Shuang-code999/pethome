import { ArrowLeft, Sparkles, Hospital, Stethoscope, MapPin, Calendar, Phone, ChevronRight, Heart, Building2, Activity, Award, Clock, Search, Bed, Ambulance } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import FloatingPets from '../../components/FloatingPets.jsx'
import Reveal from '../../components/common/Reveal.jsx'

// 模拟附近医院数据
const MOCK_HOSPITALS = [
  { id: 1, name: '上海宠物总医院', type: '24h急诊', distance: '1.2km', rating: 4.9, tags: ['24h急诊', '专科', 'CT'], address: '徐汇区虹漕路 88 号', phone: '021-12345678', beds: 12, doctors: 8, emoji: '🏥' },
  { id: 2, name: '和睦家宠物医院', type: '综合医院', distance: '2.5km', rating: 4.8, tags: ['体检', '疫苗', '美容'], address: '静安区南京西路 999 号', phone: '021-87654321', beds: 8, doctors: 6, emoji: '🏨' },
  { id: 3, name: '安安宠医', type: '社区医院', distance: '0.8km', rating: 4.7, tags: ['社区', '便利'], address: '浦东新区世纪大道 100 号', phone: '021-66889900', beds: 5, doctors: 3, emoji: '🩺' },
  { id: 4, name: '爱诺动物医院', type: '专科医院', distance: '3.6km', rating: 4.9, tags: ['骨科', '神经科', '手术'], address: '长宁区天山路 200 号', phone: '021-66554433', beds: 15, doctors: 10, emoji: '⚕️' }
]

// 转诊预约页 · Claymorphism（替代 UnderDev 占位）
export default function ReferralPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  return (
    <section className="mx-auto max-w-page px-4 py-6 fade-in">
      <button onClick={() => navigate(-1)} className="clickable clay-btn flex items-center gap-1 text-sm text-ink-700 hover:text-brand-600 mb-4 px-3 py-1.5">
        <ArrowLeft size={15} /> 返回
      </button>

      {/* Hero（Clay + 极光紫粉） */}
      <Reveal className="relative overflow-hidden rounded-claylg p-6 md:p-8 mb-6 text-white shadow-clay">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg,#C4B5FD 0%,#8B5CF6 50%,#7C3AED 100%)'
        }} />
        <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute top-4 right-8 text-6xl opacity-30 animate-bounce-soft" aria-hidden style={{ animationDelay: '0.6s' }}>🏥</div>

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white/25 backdrop-blur px-2.5 py-1 rounded-full font-bold font-display">
              <Sparkles size={11} /> 转诊预约
            </span>
            <h1 className="text-2xl md:text-4xl font-bold font-display mt-3 flex items-center gap-2 leading-tight">
              <Hospital size={32} /> 转线下医院 <span className="text-3xl">🏨</span>
            </h1>
            <p className="text-sm md:text-base opacity-95 mt-2">智能推荐最近宠物医院 · 在线挂号 · 一键导航</p>
            <div className="grid grid-cols-3 gap-2 mt-4 max-w-md">
              {[
                { num: '320+', label: '合作医院', icon: '🏥' },
                { num: '24h', label: '急诊服务', icon: '🚑' },
                { num: '860+', label: '认证医生', icon: '👨‍⚕️' }
              ].map((s, i) => (
                <div key={i} className="glass text-white rounded-clay px-3 py-2 text-center">
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-base font-extrabold font-display">{s.num}</div>
                  <div className="text-[10px] opacity-90">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* 搜索（Clay） */}
      <Reveal delay={1} className="clay clay-hover p-3 mb-4">
        <div className="clay-inset flex items-center px-3 py-2.5">
          <Search size={15} className="text-ink-400 mr-2" />
          <input
            placeholder="搜索医院名 / 地址 / 专科…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-400"
          />
          <button className="clickable text-xs text-purple-600 font-bold">搜索</button>
        </div>
      </Reveal>

      {/* 筛选 */}
      <Reveal delay={2} className="clay clay-hover p-3 mb-5 flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { k: 'all', l: '全部', emoji: '🏥' },
          { k: '24h', l: '24h急诊', emoji: '🚑' },
          { k: 'general', l: '综合医院', emoji: '🏨' },
          { k: 'community', l: '社区医院', emoji: '🩺' },
          { k: 'specialty', l: '专科医院', emoji: '⚕️' }
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setFilter(t.k)}
            className={`clickable flex items-center gap-1 whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-bold transition-all shrink-0
              ${filter === t.k
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-glow font-display'
                : 'clay-inset text-ink-700'
              }`}
          >
            <span>{t.emoji}</span>
            <span>{t.l}</span>
          </button>
        ))}
      </Reveal>

      {/* 医院列表（Clay 卡） */}
      <div className="space-y-3 mb-5">
        {MOCK_HOSPITALS.map((h, i) => (
          <Reveal
            key={h.id}
            delay={Math.min(i + 3, 5)}
            className="clay clay-hover p-4 relative overflow-hidden group"
          >
            <div className="absolute -top-4 -right-4 text-7xl opacity-10" aria-hidden>{h.emoji}</div>

            <div className="flex items-start gap-3 relative">
              {/* 医院图标 */}
              <div className="w-14 h-14 rounded-clay bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-3xl shadow-clay-sm shrink-0 group-hover:animate-bounce-soft">
                {h.emoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <h3 className="font-bold text-ink-900 font-display text-base">{h.name}</h3>
                  {h.type === '24h急诊' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold shadow-glow">
                      🚑 24h
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-ink-500 mb-2 flex-wrap">
                  <span className="flex items-center gap-0.5 font-bold text-amber-500">
                    ⭐ {h.rating}
                  </span>
                  <span className="text-ink-300">|</span>
                  <span className="flex items-center gap-0.5 font-semibold text-purple-600">
                    <MapPin size={10} /> {h.distance}
                  </span>
                  <span className="text-ink-300">|</span>
                  <span className="text-ink-500">{h.type}</span>
                </div>

                <div className="text-xs text-ink-500 mb-2 flex items-center gap-1.5">
                  <Building2 size={11} /> {h.address}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {h.tags.map((t, j) => (
                    <span key={j} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 clay-inset p-2 mb-3">
                  <div className="text-center">
                    <div className="text-base font-extrabold text-ink-900 font-display flex items-center justify-center gap-0.5">
                      <Bed size={12} className="text-purple-500" /> {h.beds}
                    </div>
                    <div className="text-[9px] text-ink-500">住院床位</div>
                  </div>
                  <div className="text-center border-x border-ink-200/50">
                    <div className="text-base font-extrabold text-ink-900 font-display flex items-center justify-center gap-0.5">
                      <Stethoscope size={12} className="text-purple-500" /> {h.doctors}
                    </div>
                    <div className="text-[9px] text-ink-500">坐诊医生</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-extrabold text-ink-900 font-display flex items-center justify-center gap-0.5">
                      <Ambulance size={12} className="text-purple-500" /> 24h
                    </div>
                    <div className="text-[9px] text-ink-500">急诊服务</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="clickable flex-1 clay clay-hover py-2.5 rounded-clay text-xs font-bold text-purple-600 font-display flex items-center justify-center gap-1.5">
                    <Phone size={12} /> 电话
                  </button>
                  <button className="clickable flex-1 clay clay-hover py-2.5 rounded-clay text-xs font-bold text-trust-600 font-display flex items-center justify-center gap-1.5">
                    <MapPin size={12} /> 导航
                  </button>
                  <button
                    onClick={() => alert('跳转预约 (开发中)')}
                    className="clickable flex-1 py-2.5 rounded-clay text-xs font-bold text-white shadow-glow font-display flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}
                  >
                    <Calendar size={12} /> 预约
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* 底部温馨引导（Clay） */}
      <Reveal delay={5} className="clay clay-hover p-5 relative overflow-hidden">
        <div className="absolute -top-4 -right-4 text-7xl opacity-15" aria-hidden>🚑</div>
        <div className="absolute -bottom-4 -left-4 text-5xl opacity-20" aria-hidden>💗</div>
        <div className="flex items-start gap-3 relative">
          <div className="w-12 h-12 rounded-clay bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-2xl shrink-0 shadow-glow">
            🚑
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base text-ink-900 font-display mb-1">紧急情况？一键呼叫</h4>
            <p className="text-xs text-ink-600 leading-relaxed mb-3">
              宠物突发严重症状（昏迷、抽搐、大出血）请立即拨打宠物急救电话。
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold">
                <Phone size={10} /> 24h 急救
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 text-purple-600 px-2 py-1 rounded-full font-bold">
                <Award size={10} /> 名医推荐
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-trust-50 text-trust-600 px-2 py-1 rounded-full font-bold">
                <Clock size={10} /> 平均 15min 响应
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
