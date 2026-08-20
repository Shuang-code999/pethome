import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'boarding',
  title: '寄养托运',
  subtitle: '家庭寄养 · 门店寄养 · 同城 / 跨城运输 · 全程协议保障',

  filterOptions: [
    { k: 'home',    l: '🏠 家庭寄养' },
    { k: 'shop',    l: '🏪 门店寄养' },
    { k: 'city',    l: '🚗 同城运输' },
    { k: 'long',    l: '🛫 跨城运输' }
  ],

  bookingFields: [
    { key: 'mode', label: '寄养 / 托运方式', type: 'select', required: true, options: [
      { v: 'home', l: '家庭寄养 ¥128/晚' },
      { v: 'shop', l: '门店寄养 ¥168/晚' },
      { v: 'city', l: '同城运输 ¥99 起' },
      { v: 'long', l: '跨城运输 ¥499 起' }
    ]},
    { key: 'checkIn',  label: '入住 / 发车日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'checkOut', label: '退住 / 到达日期', type: 'date', required: true, defaultVal: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10) },
    { key: 'pickup',   label: '上门接送', type: 'select', options: [
      { v: 'no',  l: '不需要' },
      { v: 'yes', l: '需要上门接送（+¥50）' }
    ]},
    { key: 'video', label: '每日视频反馈', type: 'select', options: [
      { v: 'no',  l: '不需要' },
      { v: 'yes', l: '需要每日视频（+¥30/天）' }
    ]},
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '宠物品种、年龄、性格、用药情况、过敏史' }
  ],

  bookingSubmitNote: '预约已提交，寄养家庭 / 门店将尽快与您联系 🏠'
}

export default function ServiceBoardingPage() {
  return <ServicePageTemplate config={CONFIG} />
}