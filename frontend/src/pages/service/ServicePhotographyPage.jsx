import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'photography',
  title: '爱宠摄影',
  subtitle: '专业宠物摄影师 · 室内 / 户外主题 · 样片可预约',

  filterOptions: [
    { k: 'indoor',  l: '🏠 室内' },
    { k: 'outdoor', l: '🌳 户外' },
    { k: 'family',  l: '👨‍👩‍👧 家庭合影' }
  ],

  bookingFields: [
    { key: 'date', label: '拍摄日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'package', label: '套餐', type: 'select', required: true, options: [
      { v: 'basic',    l: '基础写真 ¥499（20 张底片 + 6 张精修）' },
      { v: 'standard', l: '标准套餐 ¥899（40 张底片 + 12 张精修 + 相册）' },
      { v: 'premium',  l: '豪华套餐 ¥1599（80 张底片 + 25 张精修 + 相册 + 摆台）' }
    ]},
    { key: 'scene', label: '场景', type: 'select', required: true, options: [
      { v: 'studio',   l: '影棚' },
      { v: 'home',     l: '家中' },
      { v: 'park',     l: '公园 / 草地' },
      { v: 'cafe',     l: '宠物友好咖啡店' },
      { v: 'theme',    l: '主题（古风/日系等，备注）' }
    ]},
    { key: 'petCount', label: '拍摄宠物数量', type: 'select', required: true, options: [
      { v: '1', l: '1 只' },
      { v: '2', l: '2 只' },
      { v: '3+', l: '3 只及以上' }
    ]},
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '宠物品种、性格、希望的风格、参考样片链接' }
  ],

  bookingSubmitNote: '预约已提交，摄影师将尽快与您联系 📷'
}

export default function ServicePhotographyPage() {
  return <ServicePageTemplate config={CONFIG} />
}