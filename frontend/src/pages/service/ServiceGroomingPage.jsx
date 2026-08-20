import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'grooming',
  title: '美容造型',
  subtitle: '专业造型师 · 剪毛 / 染色 / SPA · 出门回头率 100%',

  filterOptions: [
    { k: 'dog',  l: '🐕 狗狗' },
    { k: 'cat',  l: '🐈 猫咪' },
    { k: '上门', l: '上门' },
    { k: '到店', l: '到店' }
  ],

  bookingFields: [
    { key: 'date', label: '预约日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'time', label: '时段', type: 'select', required: true, options: [
      { v: 'morning',   l: '上午 09:00-12:00' },
      { v: 'afternoon', l: '下午 13:00-17:00' }
    ]},
    { key: 'service', label: '服务项目', type: 'select', required: true, options: [
      { v: 'basic-cut', l: '基础修毛 ¥88 起' },
      { v: 'styled',    l: '造型修剪 ¥168 起' },
      { v: 'dye',       l: '染色 ¥288 起' },
      { v: 'nails',     l: '指甲护理 ¥30' },
      { v: 'spa',       l: 'SPA ¥128 起' }
    ]},
    { key: 'style', label: '造型风格', type: 'text', placeholder: '如 泰迪装 / 圆头 / 雪纳瑞修' },
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '可附上参考造型链接 / 备注特殊要求' }
  ],

  bookingSubmitNote: '预约已提交，造型师将尽快与您联系 ✂️'
}

export default function ServiceGroomingPage() {
  return <ServicePageTemplate config={CONFIG} />
}