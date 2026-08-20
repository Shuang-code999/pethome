import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'walking',
  title: '上门遛狗',
  subtitle: '认证遛狗师 · 实时路线分享 · 30/60/90 分钟可选',

  filterOptions: [
    { k: 'small',  l: '🐕 小型犬' },
    { k: 'medium', l: '🐕‍🦺 中型犬' },
    { k: 'large',  l: '🦮 大型犬' }
  ],

  bookingFields: [
    { key: 'date', label: '遛狗日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'slot', label: '遛狗时段', type: 'select', required: true, options: [
      { v: 'morning', l: '🌅 早 07:00-09:00' },
      { v: 'noon',    l: '☀️ 中 12:00-14:00' },
      { v: 'evening', l: '🌆 晚 19:00-21:00' }
    ]},
    { key: 'duration', label: '时长', type: 'select', required: true, options: [
      { v: '30',  l: '30 分钟 ¥38' },
      { v: '60',  l: '60 分钟 ¥58' },
      { v: '90',  l: '90 分钟 ¥88' }
    ]},
    { key: 'dogCount', label: '狗狗数量', type: 'select', required: true, options: [
      { v: '1', l: '1 只' },
      { v: '2', l: '2 只（+¥20/只）' },
      { v: '3+', l: '3 只及以上（联系客服）' }
    ]},
    { key: 'addr',  label: '遛狗地址', type: 'text', required: true, placeholder: '小区 + 门牌号' },
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '狗狗性格、是否牵绳、路线偏好' }
  ],

  bookingSubmitNote: '预约已提交，遛狗师将尽快与您联系 🐾'
}

export default function ServiceWalkingPage() {
  return <ServicePageTemplate config={CONFIG} />
}