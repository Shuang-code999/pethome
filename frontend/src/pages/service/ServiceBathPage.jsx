import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'bath',
  title: '宠物洗护',
  subtitle: '专业洗护师上门 / 门店到店 · 安全温和无刺激',

  // 顶部 chip 筛选
  filterOptions: [
    { k: 'dog',   l: '🐕 狗狗' },
    { k: 'cat',   l: '🐈 猫咪' },
    { k: 'other', l: '🐾 其他' },
    { k: '上门',  l: '上门' },
    { k: '到店',  l: '到店' }
  ],

  // 预约表单字段（每类服务可不同）
  bookingFields: [
    {
      key: 'date', label: '预约日期', type: 'date', required: true,
      defaultVal: new Date().toISOString().slice(0, 10)
    },
    {
      key: 'time', label: '时段', type: 'select', required: true,
      options: [
        { v: 'morning',   l: '上午 09:00-12:00' },
        { v: 'afternoon', l: '下午 13:00-17:00' },
        { v: 'evening',   l: '晚上 18:00-21:00' }
      ]
    },
    {
      key: 'service', label: '服务项目', type: 'select', required: true,
      options: [
        { v: 'basic',  l: '基础洗澡 ¥68 起' },
        { v: 'spa',    l: 'SPA 护理 ¥128 起' },
        { v: 'med',    l: '药浴 ¥158 起' },
        { v: 'nails',  l: '剪指甲 ¥20' },
        { v: 'ears',   l: '清耳 ¥30' },
        { v: 'gland',  l: '挤肛门腺 ¥30' }
      ]
    },
    {
      key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号'
    },
    {
      key: 'note', label: '备注', type: 'textarea', placeholder: '宠物品种、毛发长度、特殊要求等'
    }
  ],

  bookingSubmitNote: '预约已提交，商家将尽快与您联系 🛁'
}

export default function ServiceBathPage() {
  return <ServicePageTemplate config={CONFIG} />
}