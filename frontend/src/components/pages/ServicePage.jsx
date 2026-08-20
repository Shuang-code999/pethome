import { useEffect, useState, useMemo } from 'react'
import {
  MapPin, Star, Calendar, Loader2, Navigation, Phone, Clock, ChevronDown, X, MessageCircle,
  UtensilsCrossed, Sparkles, Home as HomeIcon, Bus, GraduationCap, Flower2, Tag, ChevronRight
} from 'lucide-react'
import PageShell from './PageShell'
import DetailModal from './DetailModal'
import ServiceTypeModal from '../ServiceTypeModal'
import { api } from '../../api'

const ICON_MAP = {
  UtensilsCrossed, Sparkles, Home: HomeIcon, Bus, GraduationCap, Flower2,
}
const COLOR_MAP = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500', hover: 'hover:bg-amber-50' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', dot: 'bg-pink-500', hover: 'hover:bg-pink-50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500', hover: 'hover:bg-blue-50' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200', dot: 'bg-teal-500', hover: 'hover:bg-teal-50' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', dot: 'bg-indigo-500', hover: 'hover:bg-indigo-50' },
  gray: { bg: 'bg-ink-100', text: 'text-ink-700', border: 'border-ink-200', dot: 'bg-ink-500', hover: 'hover:bg-ink-200/40' },
}
const DEFAULT_LOC = { lat: 31.2304, lng: 121.4737, city: '上海', district: '浦东新区' }

function formatDistance(m) {
  if (m == null) return '—'
  if (m < 1000) return Math.round(m) + 'm'
  return (m / 1000).toFixed(1) + 'km'
}

export default function ServicePage({ logged, onNavigate, onLoginClick, onLoginRequired }) {
  const [loc, setLoc] = useState(null)
  const [locating, setLocating] = useState(true)
  const [types, setTypes] = useState([])
  const [petTypes, setPetTypes] = useState([])
  const [counts, setCounts] = useState({})  // { feeding: 10, grooming: 12, ... }
  const [pet, setPet] = useState('全部')
  const [sort, setSort] = useState('distance')
  const [showTypeModal, setShowTypeModal] = useState(null)  // typeInfo | null
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [bookingSvc, setBookingSvc] = useState(null)
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingForm, setBookingForm] = useState({ petName: '', petType: '猫猫', address: '', apptDate: '', apptSlot: '', remark: '' })

  // 加载服务类型 + 宠物类型
  useEffect(() => {
    Promise.all([api.serviceTypes(), api.servicePetTypes()]).then(([t, p]) => {
      setTypes(t.data || [])
      setPetTypes(p.data || ['全部'])
    })
  }, [])

  // 获取定位
  useEffect(() => {
    setLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, source: 'GPS' }); setLocating(false) },
        () => { setLoc(DEFAULT_LOC); setLocating(false) },
        { timeout: 5000 }
      )
    } else { setLoc(DEFAULT_LOC); setLocating(false) }
  }, [])

  // 通用列表（"全部"模式）
  useEffect(() => {
    setLoading(true)
    api.serviceServices({ pet, sort }).then(res => {
      const list = (res.data || []).map(s => ({
        ...s,
        distance: s.distance || 1000 + Math.floor(Math.random() * 5000),
      }))
      // 客户端排序
      if (sort === 'rating') {
        list.sort((a, b) => (b.rating - a.rating) || (a.distance - b.distance))
      } else {
        list.sort((a, b) => (a.distance - b.distance) || (b.rating - a.rating))
      }
      setServices(list)
      setLoading(false)
      // 统计各类型数量
      const c = {}
      list.forEach(s => { if (s.serviceType) c[s.serviceType] = (c[s.serviceType] || 0) + 1 })
      setCounts(c)
    })
  }, [pet, sort])

  const handleTypeClick = (typeInfo) => {
    setShowTypeModal(typeInfo)
  }

  const handleBook = (typeInfo, svc) => {
    if (!logged) { onLoginClick && onLoginClick(); return }
    setBookingSvc({ typeInfo, svc })
    setBookingForm({
      petName: '',
      petType: '猫猫',
      address: svc.address || '',
      apptDate: '',
      apptSlot: '',
      remark: '',
    })
  }

  const submitBooking = async () => {
    if (!bookingSvc) return
    setBookingSubmitting(true)
    const { typeInfo, svc } = bookingSvc
    const res = await api.serviceBook(typeInfo.code, svc.id, bookingForm)
    setBookingSubmitting(false)
    if (res.code === 200) {
      alert(`✅ 预约成功！\n\n订单号: ${res.data?.id}\n服务方: ${svc.name}\n请等待服务方确认`)
      setBookingSvc(null)
    } else {
      alert('预约失败：' + (res.msg || '未知错误'))
    }
  }

  return (
    <PageShell title="同城服务" subtitle="6 大类同城生活服务 · 按宠物类型筛选 · 立即预约" onBack={() => onNavigate('home')} accent="health">
      {/* 定位 */}
      <div className="flex items-center gap-1.5 text-xs text-ink-500 mb-3 bg-ink-50 rounded-lg px-3 py-2">
        <MapPin size={13} className="text-brand-500" />
        {locating ? (
          <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> 定位中…</span>
        ) : (
          <span>当前定位：{loc?.city ? loc.city.replace(/市.*/, '市').replace(/区.*/, '') : ''}（{loc?.source || '默认'}）</span>
        )}
        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-ink-200 text-ink-500 rounded">{services.length} 家</span>
      </div>

      {/* 6 大服务类型网格 */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {types.map(t => {
          const Icon = ICON_MAP[t.icon] || HomeIcon
          const colors = COLOR_MAP[t.color] || COLOR_MAP.blue
          const count = counts[t.code] || 0
          return (
            <button key={t.code} onClick={() => handleTypeClick(t)}
              className={`clickable relative flex flex-col items-start gap-1 p-3 bg-white border border-ink-200 ${colors.hover} hover:shadow-card rounded-xl text-left transition-all`}>
              <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}>
                <Icon size={18} />
              </div>
              <div className="text-sm font-semibold text-ink-900 mt-1">{t.name}</div>
              <div className="text-[10px] text-ink-400 leading-tight">{t.desc.split(/[，。]/)[0]}</div>
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <span className={`text-[9px] px-1.5 py-0.5 ${colors.bg} ${colors.text} rounded-full`}>{t.mode}</span>
              </div>
              {count > 0 && (
                <div className="text-[10px] text-ink-400 mt-0.5">{count} 家</div>
              )}
              <ChevronRight size={12} className="absolute bottom-2 right-2 text-ink-300" />
            </button>
          )
        })}
      </div>

      {/* 宠物类型 chip 筛选 */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2 mb-3">
        <span className="text-[11px] text-ink-400 shrink-0">🐾 按宠物类型</span>
        {petTypes.map(p => (
          <button key={p} onClick={() => setPet(p)}
            className={`clickable shrink-0 text-xs px-3 py-1.5 rounded-full ${pet === p ? 'bg-health text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-300/40'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-ink-400">排序：</span>
        <div className="flex gap-1">
          {[{ v: 'distance', l: '距离优先', icon: Navigation }, { v: 'rating', l: '评分优先', icon: Star }].map(o => (
            <button key={o.v} onClick={() => setSort(o.v)}
              className={`clickable flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${sort === o.v ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-700'}`}>
              <o.icon size={11} /> {o.l}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-ink-400">数据来自平台商户库</span>
      </div>

      {/* 列表 */}
      {loading ? (
        <div className="flex items-center gap-2 text-ink-500 text-sm py-10 justify-center"><Loader2 size={16} className="animate-spin" /> 搜索附近服务方…</div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 text-ink-400 text-sm">
          暂无「{pet}」相关服务方，试试其他宠物类型或点击上方服务类型卡片
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map(s => {
            const typeInfo = types.find(t => t.code === s.serviceType)
            const colors = typeInfo ? COLOR_MAP[typeInfo.color] : COLOR_MAP.blue
            return (
              <div key={s.id} onClick={() => setDetail(s)}
                className="clickable relative flex gap-3 bg-white border border-ink-200 hover:border-health hover:shadow-card rounded-xl p-3 transition-all">
                <div className={`w-20 h-20 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 font-bold text-2xl`}>
                  {s.name?.[0] || '服'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-ink-900 text-sm truncate">{s.name}</span>
                    <span className={`shrink-0 text-[9px] px-1.5 py-0.5 ${colors.bg} ${colors.text} rounded`}>
                      {s.serviceMode}
                    </span>
                    {typeInfo && (
                      <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-ink-50 text-ink-600 rounded">
                        {typeInfo.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                    <Star size={11} className="fill-amber-500" /> {(s.rating || 0).toFixed(1)}
                    <span className="text-ink-400 ml-1 flex items-center gap-0.5"><Navigation size={10} /> {formatDistance(s.distance)}</span>
                    <span className="ml-auto text-brand-600 font-semibold">{s.priceRange}</span>
                  </div>
                  <div className="text-[11px] text-ink-400 mt-0.5 truncate">{s.address}</div>
                  {s.petTypes && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.petTypes.split(',').filter(Boolean).slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-ink-50 text-ink-600 rounded">{t.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 服务类型专页 modal（覆盖整屏） */}
      <ServiceTypeModal
        open={!!showTypeModal}
        typeInfo={showTypeModal}
        petTypes={petTypes}
        onClose={() => setShowTypeModal(null)}
        onBook={handleBook}
        onLoginRequired={onLoginClick}
        logged={logged}
      />

      {/* 通用详情弹窗 */}
      <DetailModal open={!!detail} onClose={() => setDetail(null)} title={detail?.name} wide
        footer={(
          <div className="flex gap-2 w-full">
            {detail?.tel && (
              <a href={`tel:${detail.tel}`} className="clickable flex items-center gap-1 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-semibold px-4 py-2 rounded-lg">
                <Phone size={14} /> 拨打电话
              </a>
            )}
            <button onClick={() => { const ti = types.find(t => t.code === detail?.serviceType); if (detail) { handleBook(ti, detail); setDetail(null) } }}
              className="clickable flex items-center gap-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg ml-auto">
              <Calendar size={14} /> 立即预约
            </button>
          </div>
        )}>
        {detail && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {types.find(t => t.code === detail.serviceType) && (
                <span className="text-[10px] px-2 py-0.5 bg-health/10 text-health rounded-full">
                  {types.find(t => t.code === detail.serviceType).name}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 bg-ink-100 text-ink-600 rounded-full">{detail.serviceMode}</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-medium">{detail.priceRange}</span>
            </div>

            {/* 评分 + 距离 */}
            <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-amber-500 fill-amber-500" />
                <span className="text-xl font-bold text-ink-900">{(detail.rating || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-ink-600 text-sm">
                <Navigation size={14} className="text-brand-500" />
                距您 {formatDistance(detail.distance)}
              </div>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-ink-200 text-ink-600 rounded">{detail.category}</span>
            </div>

            <div className="space-y-2 text-sm">
              {detail.address && (
                <div className="flex items-start gap-2 text-ink-700">
                  <MapPin size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <span className="flex-1">{detail.address}</span>
                </div>
              )}
              {detail.tel && (
                <div className="flex items-center gap-2 text-ink-700">
                  <Phone size={14} className="text-brand-500 shrink-0" />
                  <span>{detail.tel}</span>
                </div>
              )}
              {detail.openTime && (
                <div className="flex items-start gap-2 text-ink-700">
                  <Clock size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <span>{detail.openTime}</span>
                </div>
              )}
              {detail.petTypes && (
                <div className="flex items-start gap-2">
                  <Tag size={14} className="text-brand-500 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {detail.petTypes.split(',').filter(Boolean).map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-ink-50 text-ink-700 rounded-full">{t.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {detail.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detail.tags.split(/[,，]/).filter(Boolean).map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full">{t}</span>
                  ))}
                </div>
              )}
            </div>

            {detail.description && (
              <div className="border-t border-ink-100 pt-3">
                <div className="text-xs font-semibold text-ink-700 mb-1">服务介绍</div>
                <p className="text-sm text-ink-600 leading-relaxed">{detail.description}</p>
              </div>
            )}

            <div className="text-[10px] text-ink-400 bg-ink-50 px-2 py-1.5 rounded">
              🔗 后端跳转链接：<code className="text-ink-600">{detail.bookingUrl}</code>
            </div>

            {/* 操作按钮组 */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-ink-100">
              <button className="clickable flex flex-col items-center gap-1 py-2 bg-ink-50 hover:bg-ink-100 rounded-lg">
                <Navigation size={16} className="text-brand-500" />
                <span className="text-[10px] text-ink-600">到这去</span>
              </button>
              <button className="clickable flex flex-col items-center gap-1 py-2 bg-ink-50 hover:bg-ink-100 rounded-lg">
                <MessageCircle size={16} className="text-brand-500" />
                <span className="text-[10px] text-ink-600">咨询</span>
              </button>
              <button onClick={() => { const ti = types.find(t => t.code === detail?.serviceType); if (detail) { handleBook(ti, detail); setDetail(null) } }}
                className="clickable flex flex-col items-center gap-1 py-2 bg-ink-50 hover:bg-ink-100 rounded-lg">
                <Calendar size={16} className="text-brand-500" />
                <span className="text-[10px] text-ink-600">预约</span>
              </button>
            </div>
          </div>
        )}
      </DetailModal>

      {/* 下单弹窗 */}
      <DetailModal open={!!bookingSvc} onClose={() => !bookingSubmitting && setBookingSvc(null)} title="提交预约" wide
        footer={(
          <div className="flex gap-2 w-full">
            <button onClick={() => setBookingSvc(null)} disabled={bookingSubmitting}
              className="clickable px-4 py-2 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm rounded-lg">
              取消
            </button>
            <button onClick={submitBooking} disabled={bookingSubmitting}
              className="clickable flex-1 bg-brand-500 hover:bg-brand-600 disabled:bg-ink-300 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center justify-center gap-1">
              {bookingSubmitting && <Loader2 size={14} className="animate-spin" />}
              确认预约
            </button>
          </div>
        )}>
        {bookingSvc && (
          <div className="space-y-3">
            <div className="bg-ink-50 rounded-lg p-3 text-sm">
              <div className="font-semibold text-ink-900">{bookingSvc.svc.name}</div>
              <div className="text-xs text-ink-500 mt-0.5">
                {bookingSvc.typeInfo.name} · {bookingSvc.svc.serviceMode} · {bookingSvc.svc.priceRange}
              </div>
              <div className="text-[10px] text-ink-400 mt-1">
                后端：<code>{bookingSvc.svc.bookingUrl}</code>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-500">
                宠物名 *
                <input value={bookingForm.petName} onChange={e => setBookingForm(f => ({ ...f, petName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                  placeholder="圆圆" />
              </label>
              <label className="text-xs text-ink-500">
                宠物类型
                <select value={bookingForm.petType} onChange={e => setBookingForm(f => ({ ...f, petType: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500">
                  {petTypes.filter(p => p !== '全部').map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <label className="text-xs text-ink-500 block">
              上门地址 *（上门/殡葬类必填）
              <input value={bookingForm.address} onChange={e => setBookingForm(f => ({ ...f, address: e.target.value }))}
                className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                placeholder="浦东新区世纪大道123号" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-500">
                预约日期
                <input type="date" value={bookingForm.apptDate} onChange={e => setBookingForm(f => ({ ...f, apptDate: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500" />
              </label>
              <label className="text-xs text-ink-500">
                时段
                <select value={bookingForm.apptSlot} onChange={e => setBookingForm(f => ({ ...f, apptSlot: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500">
                  <option value="">选择时段</option>
                  <option value="09:00-10:00">09:00-10:00</option>
                  <option value="10:00-11:00">10:00-11:00</option>
                  <option value="14:00-15:00">14:00-15:00</option>
                  <option value="15:00-16:00">15:00-16:00</option>
                  <option value="19:00-20:00">19:00-20:00</option>
                </select>
              </label>
            </div>
            <label className="text-xs text-ink-500 block">
              备注
              <textarea value={bookingForm.remark} onChange={e => setBookingForm(f => ({ ...f, remark: e.target.value }))}
                rows={2} className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
                placeholder="特殊需求…" />
            </label>
          </div>
        )}
      </DetailModal>
    </PageShell>
  )
}