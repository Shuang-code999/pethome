// 七个一级 Tab + 各自 Mega Menu 子项 + 右栏 promo
// 图标名对应 lucide-react 组件名
import {
  Cat, FilePlus2, HeartPulse, TrendingUp, FolderArchive, BellRing,
  NotebookPen, QrCode,
  Bath, Scissors, UtensilsCrossed, Footprints, Home, Camera, Bone,
  Store, Flower2,
  ShoppingBag, Bone as BoneFood, Layers, Pill, Gift, ClipboardList,
  Newspaper, MessagesSquare, Hash, HeartHandshake, UserRound,
  Stethoscope, Video, MessageCircle, History, MapPin,
  Package, CreditCard, Wallet, Medal, Inbox, MapPinHouse, Settings, Store as StoreAlt, Stethoscope as StethoscopeAlt,
  Bell
} from 'lucide-react'

// Mega Menu 子项图标映射（lucide 组件直接用）
export const nav = [
  {
    key: 'pet',
    label: '宠物档案',
    icon: Cat,
    color: '#FF7A59',
    // 点击 Tab 不跳转，只展开/收起子菜单
    expandable: true,
    groups: [
      [
        { label: '我的宠物', icon: Cat, path: '/pet/list' },
        { label: '健康记录', icon: HeartPulse, path: '/pet/_petId_/health' },
        { label: '记事本', icon: NotebookPen, path: '/pet/_petId_/note' },
        { label: '健康提醒', icon: BellRing, path: '/pet/_petId_/remind' }
      ]
    ]
  },
  {
    key: 'service',
    label: '同城服务',
    icon: Store,
    color: '#2EC4B6',
    // 点击 Tab 不跳转，只展开/收起子菜单
    expandable: true,
    groups: [
      [
        { label: '宠物洗护', icon: Bath,         desc: '门店 / 上门',     path: '/service/bath' },
        { label: '美容造型', icon: Scissors,     desc: '剪毛 / 染色 / SPA', path: '/service/grooming' },
        { label: '上门喂养', icon: UtensilsCrossed, desc: '按次 / 包月',     path: '/service/feeding' },
        { label: '上门遛狗', icon: Footprints,   desc: '时段预约',       path: '/service/walking' },
        { label: '寄养托运', icon: Home,         desc: '家庭寄养 + 协议', path: '/service/boarding' },
        { label: '爱宠摄影', icon: Camera,       desc: '样片预约',       path: '/service/photography' },
        { label: '宠物殡葬', icon: Flower2,      desc: '火化 / 树葬 / 纪念', path: '/service/funeral' }
      ]
    ]
  },
  {
    key: 'mall',
    label: '爱宠商城',
    icon: ShoppingBag,
    color: '#FF7A59',
    path: '/mall',
    // 直连 /mall，按用户要求去除 dropdown
  },
  {
    key: 'community',
    label: '内容社区',
    icon: MessagesSquare,
    color: '#2EC4B6',
    // 按用户要求：与同城一致，可展开子菜单
    expandable: true,
    path: '/community/qa',
    groups: [
      [
        { label: '问答区', icon: MessageCircle, desc: '悬赏提问', path: '/community/qa' },
        { label: '话题活动', icon: Hash, desc: '#晒晒我家主子#', path: '/community/topic' },
        { label: '领养专区', icon: HeartHandshake, desc: '救助机构发布', path: '/community/adopt' }
      ]
    ]
  },
  {
    key: 'consult',
    label: '在线问诊',
    icon: Stethoscope,
    color: '#2EC4B6',
    // 按用户要求：点一下直接进入，不显示下拉
    path: '/consult/ai'
  },
  {
    key: 'me',
    label: '个人中心',
    icon: UserRound,
    color: '#FF7A59',
    path: '/me'
  }
]