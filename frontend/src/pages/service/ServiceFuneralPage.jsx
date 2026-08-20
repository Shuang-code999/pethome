import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'funeral',
  title: '宠物殡葬',
  subtitle: '温柔送别 · 单宠火化 / 集体火化 / 树葬 / 纪念品',

  filterOptions: [
    { k: 'single',  l: '🕊️ 单宠火化' },
    { k: 'group',   l: '集体火化' },
    { k: 'tree',    l: '🌳 树葬' },
    { k: 'memorial', l: '💎 纪念品' }
  ],

  bookingFields: [
    { key: 'service', label: '服务项目', type: 'select', required: true, options: [
      { v: 'single-cremation', l: '单宠火化 ¥899 起' },
      { v: 'group-cremation',  l: '集体火化 ¥199' },
      { v: 'tree-burial',      l: '树葬 ¥1280 起' },
      { v: 'memorial-urn',     l: '纪念骨灰盒 ¥299 起' },
      { v: 'memorial-diamond', l: '毛发钻石 ¥6800 起' }
    ]},
    { key: 'receive', label: '接收方式', type: 'select', required: true, options: [
      { v: 'pickup',  l: '上门接收（+¥100）' },
      { v: 'self',    l: '家属自行送到' }
    ]},
    { key: 'date', label: '预约日期', type: 'date', required: true, defaultVal: new Date().toISOString().slice(0, 10) },
    { key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' },
    { key: 'note',  label: '备注', type: 'textarea', placeholder: '宠物姓名 / 告别仪式偏好 / 其他' }
  ],

  bookingSubmitNote: '预约已提交，工作人员将以温柔的方式与您联系 🕊️'
}

export default function ServiceFuneralPage() {
  return <ServicePageTemplate config={CONFIG} />
}