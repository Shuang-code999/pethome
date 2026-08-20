import ServicePageTemplate from './ServicePageTemplate.jsx'

const CONFIG = {
  slug: 'training',
  title: '宠物训练',
  subtitle: '专业训犬师 · 行为矫正 · 1v1 私教课程',
  filterOptions: [
    { k: 'basic',    l: '基础服从' },
    { k: 'badhabit', l: '恶习矫正' },
    { k: 'trick',    l: '技能学习' }
  ],
  bookingFields: [
    {
      key: 'date', label: '开课日期', type: 'date', required: true,
      defaultVal: new Date().toISOString().slice(0, 10)
    },
    {
      key: 'course', label: '课程类型', type: 'select', required: true,
      options: [
        { v: 'basic',    l: '基础服从课（10 节）' },
        { v: 'badhabit', l: '行为矫正课程' },
        { v: 'trick',    l: '趣味技能包' },
        { v: 'social',   l: '社交训练' }
      ]
    },
    {
      key: 'mode', label: '上课方式', type: 'select', required: true,
      options: [
        { v: '私教', l: '1v1 私教' },
        { v: '线上', l: '线上课程' }
      ]
    },
    {
      key: 'phone', label: '联系电话', type: 'tel', required: true, placeholder: '请输入手机号' }
  ],
  bookingSubmitNote: '报名已提交，训犬师会与您电话确认 🎓'
}

export default function ServiceTrainingPage() {
  return <ServicePageTemplate config={CONFIG} />
}
