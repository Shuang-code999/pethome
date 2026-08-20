// 爱宠商城 · 预爬取的运营内容（首页轮播 + 活动位 + 楼层）
// 模拟从「运营后台 / 京东 / 天猫」爬取的真实商品图文内容。
// 每个 banner 都明确包含：图、文（标题 / 副标题 / 卖点）、CTA、统计数据，
// 让前端轮播能展示「图 + 文 + 数据」三层信息，不再单一。

import { MALL_BANNERS, HOME_BANNERS } from './localImages.js'

// 把现有 /assets/mall/*.jpg 重新分配到不同的运营主题，确保「图与标题匹配」
// 同一张图可以被多个主题复用（兜底），新加的图片也可以直接放进 /assets/mall 然后改 src
const IMG = {
  food:    MALL_BANNERS[0] || '/assets/mall/VCG211354008311.jpg',  // 主粮 / 罐头
  treats:  MALL_BANNERS[1] || '/assets/mall/VCG41N1525581144.jpg', // 零食 / 冻干
  toys:    MALL_BANNERS[2] || '/assets/mall/VCG41N2157323320.jpg', // 玩具 / 服饰
  brand:   HOME_BANNERS[0] || '/assets/home/VCG211267967944.jpg', // 品牌专场
  vet:     HOME_BANNERS[1] || '/assets/home/VCG41N2172398491.jpg', // 医疗保健
}

export const MALL_SLIDES = [
  {
    id: 'food-2026',
    title: '主粮焕新季',
    subtitle: '皇家 / 渴望 / 爱肯拿 · 全线满 199 减 30',
    desc: '从幼犬到老年犬全阶段覆盖，科学营养配比',
    cta: '立即抢购',
    badge: '热销 TOP1',
    stat: '已售 12万+',
    sideTitle: '本周爆款',
    sideItems: ['金毛专用成犬粮 ¥459', '渴望六种鱼 5.4kg ¥599', '爱肯拿鸭肉梨 1kg ¥99'],
    sideTag: '0 元试吃',
    src: IMG.food,
    gradient: 'linear-gradient(135deg, #FFB088 0%, #FF7A59 60%, #F2613E 100%)',
    color: 'orange'
  },
  {
    id: 'treats-half',
    title: '零食大礼包',
    subtitle: '冻干 / 罐头 / 肉条 · 第二件半价',
    desc: '冻干锁鲜、罐头补水、肉条磨牙，全口味一站买齐',
    cta: '去抢半价',
    badge: '限时 3 天',
    stat: '已售 8万+',
    sideTitle: '人气 TOP3',
    sideItems: ['鲜朗冻干猫主食 ¥168', 'ZIWI 鹿肉罐头 ¥39', 'K9 冻干鸡肉条 ¥79'],
    sideTag: '满 99 包邮',
    src: IMG.treats,
    gradient: 'linear-gradient(135deg, #B8F2D8 0%, #2EC4B6 50%, #1FA89C 100%)',
    color: 'teal'
  },
  {
    id: 'toys-fun',
    title: '玩具总动员',
    subtitle: '逗猫棒 / 咬咬玩具 / 益智解闷 · 全场包邮',
    desc: '消耗精力、增进感情，让毛孩子告别无聊',
    cta: '全场包邮',
    badge: '新品',
    stat: '已售 5万+',
    sideTitle: '新品上市',
    sideItems: ['智能逗猫激光笔 ¥69', '耐咬发声球 ¥29', '藏猫隧道 ¥99'],
    sideTag: '买二送一',
    src: IMG.toys,
    gradient: 'linear-gradient(135deg, #E3D4FF 0%, #6366F1 60%, #4338CA 100%)',
    color: 'indigo'
  },
  {
    id: 'health-care',
    title: '医疗保健专场',
    subtitle: '驱虫 / 疫苗 / 处方 · 持证兽医师推荐',
    desc: '大宠爱、福来恩、拜耳…正品授权，扫码溯源',
    cta: '进店选购',
    badge: '正品溯源',
    stat: '已售 6万+',
    sideTitle: '本月畅销',
    sideItems: ['大宠爱体外驱虫 ¥78', '拜耳体内驱虫 ¥65', '妙三多猫三联 ¥98'],
    sideTag: '满 150 减 20',
    src: IMG.vet,
    gradient: 'linear-gradient(135deg, #C5F0FF 0%, #06B6D4 60%, #0E7490 100%)',
    color: 'cyan'
  },
  {
    id: 'brand-super',
    title: '品牌超级品类日',
    subtitle: '皇家 / pidan / 福莱希 · 官方旗舰',
    desc: '品牌方授权直发 · 7 天无理由退换',
    cta: '逛品牌',
    badge: '官方旗舰',
    stat: '已售 3万+',
    sideTitle: '推荐品牌',
    sideItems: ['皇家官方旗舰店', 'pidan 旗舰店', '福莱希旗舰店'],
    sideTag: '满 299 减 50',
    src: IMG.brand,
    gradient: 'linear-gradient(135deg, #FFE5C2 0%, #F59E0B 55%, #D97706 100%)',
    color: 'amber'
  }
]

// 楼层运营位（每个 tab 上方的卡片式推荐）
export const MALL_FLOORS = [
  {
    id: 'new',
    tag: '新人专享',
    title: '新用户 ¥20 礼包',
    desc: '首单立减 + 免邮',
    color: 'orange',
    icon: '🎁'
  },
  {
    id: 'plus',
    tag: 'PLUS 会员',
    title: '全场额外 9 折',
    desc: '每月 5 张专属券',
    color: 'amber',
    icon: '👑'
  },
  {
    id: 'subsidy',
    tag: '百亿补贴',
    title: '主粮直降',
    desc: '补贴到手价',
    color: 'rose',
    icon: '💰'
  }
]

// 秒杀（与后端 /seckill/list 同步）
export const SECKILL_FAKE = []  // 真实数据由后端接口提供，这里留空
