import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'feeding',
  title: '上门喂养',
  subtitle: '认证喂养师上门 · 喂食 / 铲砂 / 陪伴 · 按次或包月',

  filterOptions: [
    { k: 'cat', l: '🐈 猫咪' },
    { k: 'dog', l: '🐕 狗狗' },
    { k: 'other', l: '🐾 其他小宠' }
  ],

  bookingFields: [
    { key: 'date', label: '上门日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'slot', label: '上门时段', type: 'select', required: true, options: [
      { v: 'morning',   l: '上午 09:00-12:00' },
      { v: 'noon',      l: '中午 12:00-14:00' },
      { v: 'evening',   l: '晚上 18:00-21:00' }
    ]},
    { key: 'package', label: '套餐', type: 'select', required: true, options: [
      { v: 'single',  l: '单次 ¥58' },
      { v: 'weekly',  l: '包周 ¥358' },
      { v: 'monthly', l: '包月 ¥1280' }
    ]},
    { key: 'items', label: '服务内容', type: 'select', required: true, options: [
      { v: 'feed',  l: '喂食 + 换水' },
      { v: 'litter', l: '喂食 + 铲砂 + 清洁' },
      { v: 'full',  l: '全套（喂食/铲砂/陪伴/拍照反馈）' }
    ]},
    { key: 'addr',  label: '上门地址', type: 'text', required: true, placeholder: '小区 + 门牌号' },
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '宠物数量、性格、食物位置、钥匙交接方式' }
  ],

  bookingSubmitNote: '预约已提交，喂养师将尽快与您联系 🍽️'
}

export default function ServiceFeedingPage() {
  return <ServicePageTemplate config={CONFIG} />
}