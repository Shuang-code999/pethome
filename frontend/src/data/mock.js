// 萌宠图片：使用 petImages.js 的 petImg（优先稳定 Unsplash CDN，回退 loremflickr）
// 传入确定性 seedIdx 保证 SSR / 多次渲染稳定不抖动；onerror 回退见 PetImg 组件
import { petImg, petAvatar, bannerImg } from './petImages.js'
const flickr = (tags, w = 400, h = 300, seedIdx) => petImg(tags, w, h, seedIdx)
const _stableHash = (str) => {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h)
}
const _img = (tags, w, h) => petImg(tags, w, h, _stableHash(tags + w + h))
const _avt = (tags, s) => petAvatar(tags, s, _stableHash(tags + s))

export const myPet = {
  name: '圆圆',
  breed: '金毛巡回犬',
  age: '3岁',
  weight: '28kg',
  avatar: flickr('golden%20retriever,dog', 200, 200),
  nextVaccine: { name: '狂犬疫苗', date: '09-15', daysLeft: 4 }
}

// Banner 轮播（含背景图）
export const banners = [
  {
    title: '0 门槛建档',
    subtitle: '建档立享新用户专享洗护券 ¥20',
    cta: '立即建档',
    bg: 'linear-gradient(135deg, rgba(255,122,89,0.92) 0%, rgba(242,97,62,0.85) 100%)',
    img: flickr('golden%20retriever,puppy', 1200, 500)
  },
  {
    title: '7×24h AI 问诊',
    subtitle: 'AI 宠物医生秒回，描述症状即分诊',
    cta: '立即问诊',
    bg: 'linear-gradient(135deg, rgba(46,196,182,0.92) 0%, rgba(31,168,156,0.85) 100%)',
    img: flickr('cat,vet', 1200, 500)
  },
  {
    title: '新用户秒杀券',
    subtitle: '限时限量，先到先得，低至 5 折',
    cta: '抢券',
    bg: 'linear-gradient(135deg, rgba(99,102,241,0.92) 0%, rgba(79,70,229,0.85) 100%)',
    img: flickr('dog,food,shop', 1200, 500)
  }
]

// 快捷入口九宫格
export const quickEntries = [
  { label: '在线问诊', tag: 'consult', tags: 'stethoscope' },
  { label: '宠物洗护', tag: 'service', tags: 'dog,bath' },
  { label: '寄养托运', tag: 'service', tags: 'puppy' },
  { label: '爱宠商城', tag: 'mall', tags: 'dog,food' },
  { label: '内容社区', tag: 'community', tags: 'kitten' },
  { label: '宠物保险', tag: 'insurance', tags: 'cat,pet' },
  { label: '宠物训练', tag: 'service', tags: 'dog,training' },
  { label: '新建档案', tag: 'pet', tags: 'puppy' },
  { label: '记事本', tag: 'pet', tags: 'cat,notebook' }
]

// 推荐服务（坐标为上海示例，真实距离按用户定位计算）
export const services = [
  { name: '上门洗护', price: 88, unit: '起', rating: 4.9, lat: 31.2350, lng: 121.4800, img: flickr('dog,bath', 300, 240) },
  { name: '家庭寄养', price: 120, unit: '/天', rating: 4.8, lat: 31.2200, lng: 121.4600, img: flickr('puppy,home', 300, 240) },
  { name: '爱宠摄影', price: 299, unit: '起', rating: 5.0, lat: 31.2400, lng: 121.4900, img: flickr('cat,photography', 300, 240) },
  { name: '行为训练', price: 200, unit: '/节', rating: 4.7, lat: 31.2000, lng: 121.4500, img: flickr('dog,training', 300, 240) },
  { name: '友好门店', price: 0, unit: '附近12家', rating: 4.6, lat: 31.2320, lng: 121.4750, img: flickr('pet,shop', 300, 240) }
]

// 热门商品（秒杀专区）· 图片取自 picture/首页优惠券 本地资源
export const products = [
  { name: '皇家 金毛专用成犬粮 15kg', price: 459, old: 529, tag: '智能推荐', img: '/assets/coupon/皇家狗粮.png' },
  { name: '鲜朗 冻干猫主食 1kg', price: 168, old: 199, tag: '热销', img: '/assets/coupon/冻干.png' },
  { name: '福莱希 伸缩牵引绳 5m', price: 89, old: 119, tag: '', img: '/assets/coupon/牵引绳.png' },
  { name: 'pidan 混合猫砂 6L*2', price: 119, old: 159, tag: '囤货', img: '/assets/coupon/猫砂.png' },
  { name: '大宠爱 体外驱虫 犬用', price: 78, old: 98, tag: '处方', img: '/assets/coupon/宠物驱虫.png' },
  { name: '互动发声玩具球', price: 29, old: 45, tag: '', img: '/assets/coupon/逗猫玩具球.png' }
]

// 社区精选帖子
export const posts = [
  { author: '猫奴小王', time: '2小时前', title: '圆圆第一次洗澡居然没炸毛，记录全过程', likes: 128, comments: 32, img: flickr('cat,bath', 300, 200) },
  { author: '金毛爸爸', time: '5小时前', title: '三岁金毛体重 28kg，医生说刚好', likes: 96, comments: 18, img: flickr('golden%20retriever', 300, 200) },
  { author: '布偶麻麻', time: '昨天', title: '血常规报告怎么看，一帖教会你', likes: 211, comments: 47, img: flickr('cat,rabbit', 300, 200) },
  { author: '田园小队长', time: '2天前', title: '领养代替购买，小黑找家第 30 天', likes: 340, comments: 89, img: flickr('black%20cat', 300, 200) }
]

// 科普文章
export const articles = [
  { title: '猫咪下泌尿道处方粮，到底该不该吃？', tag: '营养' },
  { title: '如何看懂宠物血常规报告', tag: '体检' },
  { title: '犬猫疫苗接种时间表（2026 版）', tag: '疫苗' },
  { title: '体内外驱虫药怎么选，按体重一表清', tag: '驱虫' },
  { title: '这些食物千万别喂，有毒植物清单', tag: '安全' }
]

// 健康提醒（已登录显示）
export const reminders = [
  { level: 'warn', pet: '圆圆', text: '狂犬疫苗 09-15 到期', extra: '还有 4 天', cta: '立即预约', action: 'service' },
  { level: 'warn', pet: '圆圆', text: '体外驱虫 09-20 到期', extra: '', cta: '去商城', action: 'mall' },
  { level: 'ok', pet: '圆圆', text: '体检报告已上传，无异常', extra: '', cta: '查看', action: 'pet' }
]

// 商城品类导航
export const categories = [
  { name: '主粮', tags: 'dog,food', icon: 'BoneFood' },
  { name: '零食', tags: 'cat,treat', icon: 'Gift' },
  { name: '猫砂', tags: 'cat,litter', icon: 'Layers' },
  { name: '驱虫药', tags: 'dog,medicine', icon: 'Pill' },
  { name: '玩具', tags: 'dog,toy', icon: 'Gift' },
  { name: '牵引出行', tags: 'dog,leash', icon: 'Package' },
  { name: '窝垫', tags: 'cat,bed', icon: 'Home' },
  { name: '清洁护理', tags: 'dog,bath', icon: 'Bath' },
  { name: '处方粮', tags: 'cat,food', icon: 'ClipboardList' },
  { name: '智能设备', tags: 'pet,device', icon: 'Package' }
]

// 在线问诊科室
export const departments = [
  { name: '内科', icon: 'Stethoscope', desc: '呕吐/腹泻/食欲', color: '#FF7A59' },
  { name: '皮肤科', icon: 'HeartPulse', desc: '红疹/掉毛/瘙痒', color: '#2EC4B6' },
  { name: '行为科', icon: 'Bone', desc: '乱尿/拆家/攻击', color: '#6366F1' },
  { name: '眼科', icon: 'Eye', desc: '眼屎/红肿/流泪', color: '#F59E0B' },
  { name: '口腔科', icon: 'Smile', desc: '口臭/牙结石', color: '#EC4899' },
  { name: '骨科', icon: 'Bone', desc: '跛行/关节痛', color: '#8B5CF6' },
  { name: '产科', icon: 'HeartHandshake', desc: '怀孕/绝育/产后', color: '#F2613E' },
  { name: '急诊', icon: 'AlertCircle', desc: '突发状况', color: '#EF4444' }
]

// 推荐 AI 医生
export const doctors = [
  { name: '李医生', title: '高级兽医师', tags: '内科·皮肤', rating: 4.9, consults: '2.3万', avatar: flickr('doctor,vet', 120, 120) },
  { name: '王医生', title: '行为训练师', tags: '行为·训练', rating: 4.8, consults: '1.1万', avatar: flickr('vet,woman', 120, 120) },
  { name: '张医生', title: '外科主治医师', tags: '骨科·急诊', rating: 5.0, consults: '8600', avatar: flickr('surgeon,doctor', 120, 120) }
]

// 保险方案
export const insurances = [
  { name: '基础医疗险', price: 18, unit: '/月起', deduct: '0 免赔', payout: '报销 60%', highlight: false, tag: '入门' },
  { name: '综合医疗险', price: 48, unit: '/月起', deduct: '0 免赔', payout: '报销 80%', highlight: true, tag: '热销' },
  { name: '意外+医疗', price: 88, unit: '/月起', deduct: '0 免赔', payout: '报销 90%+意外', highlight: false, tag: '全面' }
]

// 铲屎官达人
export const kols = [
  { name: '猫奴小王', pets: '布偶·二毛', followers: '2.3万', avatar: flickr('girl,cat', 120, 120) },
  { name: '金毛爸爸', pets: '金毛·圆圆', followers: '5.6万', avatar: flickr('man,dog', 120, 120) },
  { name: '田园小队长', pets: '田园·小黑', followers: '1.8万', avatar: flickr('boy,puppy', 120, 120) },
  { name: '异宠研究所', pets: '仓鼠·龙猫', followers: '3.1万', avatar: flickr('hamster,pet', 120, 120) }
]

// 社区瀑布流帖子（小红书风格，部分带图部分纯文，高度参差）
// imgTags 为 null 表示纯文字帖（短卡）
export const communityPosts = [
  { id: 3001, author: '猫奴小王', avatar: 'girl,cat', time: '2小时前', title: '圆圆第一次洗澡居然没炸毛，记录全过程', body: '从进门到吹干全程 40 分钟，圆圆比我想象中乖很多，分享几个让猫咪不害怕的小技巧…', imgTags: 'cat,bath', likes: 128, comments: 32 },
  { id: 3002, author: '金毛爸爸', avatar: 'man,dog', time: '5小时前', title: '三岁金毛体重 28kg，医生说刚好', body: '今天带圆圆体检，各项指标都正常，分享一下我家的喂养清单和运动量。', imgTags: 'golden,retriever', likes: 96, comments: 18 },
  { id: 3003, author: '布偶麻麻', avatar: 'woman,cat', time: '昨天', title: '血常规报告怎么看？一帖教会你', body: '红细胞、白细胞、血小板…每个指标代表什么，异常说明什么问题，全部整理在这张图里。', imgTags: 'cat,rabbit', likes: 211, comments: 47 },
  { id: 3004, author: '田园小队长', avatar: 'boy,puppy', time: '2天前', title: '领养代替购买，小黑找家第 30 天', body: '从流浪到信任，30 天的变化真的很大。', imgTags: 'black,cat', likes: 340, comments: 89 },
  { id: 3005, author: '柯基姐姐', avatar: 'girl,corgi', time: '3小时前', title: '柯基底盘低真的容易脏', body: '下雨天出门回来整个肚子都是泥，分享一款超好用的清洁湿巾。', imgTags: null, likes: 58, comments: 12 },
  { id: 3006, author: '仓鼠君', avatar: 'boy,hamster', time: '6小时前', title: '仓鼠笼布置清单（新手版）', body: '跑轮、垫料、躲避屋、水壶…哪些是必备，哪些是智商税，我都踩过坑了。', imgTags: 'hamster,cage', likes: 142, comments: 28 },
  { id: 3007, author: '法斗大叔', avatar: 'man,bulldog', time: '8小时前', title: '法斗的皮肤问题真是老大难', body: '又红了一片，医生说是过敏，有没有同款困扰的家长交流一下。', imgTags: 'dog,skin', likes: 77, comments: 41 },
  { id: 3008, author: '橘猫铲屎官', avatar: 'girl,orange,cat', time: '1天前', title: '橘猪又胖了半斤', body: '10 斤的橘猫两岁，目标控制在 11 斤以内，减肥打卡第一天。', imgTags: 'orange,cat', likes: 189, comments: 56 },
  { id: 3009, author: '边牧妈妈', avatar: 'woman,dog', time: '2天前', title: '边牧的智商真的高到离谱', body: '教了三遍就会开门了，现在每天自己开笼子出来溜达…', imgTags: 'border,collie', likes: 256, comments: 38 },
  { id: 3010, author: '蜥蜴饲养员', avatar: 'man,lizard', time: '4小时前', title: '爬宠 uvb 灯怎么选', body: '5.0 和 10.0 的区别，按饲养物种和距离来选，别买错。', imgTags: null, likes: 34, comments: 9 },
  { id: 3011, author: '狸花猫主人', avatar: 'girl,tabby', time: '5小时前', title: '狸花真的超好养', body: '不挑食、身体好、还抓老鼠，田园猫 yyds。', imgTags: 'tabby,cat', likes: 167, comments: 23 },
  { id: 3012, author: '泰迪奶奶', avatar: 'woman,poodle', time: '昨天', title: '泰迪泪痕清理小妙招', body: '坚持每天擦 + 调整饮食，两周就淡了很多。', imgTags: 'poodle,dog', likes: 98, comments: 19 },
  { id: 3013, author: '英短主人', avatar: 'boy,british,shorthair', time: '3天前', title: '英短掉毛季来了', body: '每天梳毛 + 鸡蛋黄，亲测有效。', imgTags: null, likes: 76, comments: 14 },
  { id: 3014, author: '哈士奇爸爸', avatar: 'man,husky', time: '6小时前', title: '二哈拆家实录第 N 天', body: '今天咬坏了沙发垫，但看它无辜的眼神又舍不得打…', imgTags: 'husky,dog', likes: 312, comments: 72 },
  { id: 3015, author: '鹦鹉小姐姐', avatar: 'girl,parrot', time: '2天前', title: '教鹦鹉说话的第 50 天', body: '终于会清晰说「你好」了，分享训练录音。', imgTags: 'parrot,bird', likes: 124, comments: 31 },
  { id: 3016, author: '兔兔养护', avatar: 'woman,rabbit', time: '7小时前', title: '兔子的科学饮食', body: '80% 提摩西草 + 15% 兔粮 + 5% 蔬菜，不要喂水果太多。', imgTags: 'rabbit,pet', likes: 88, comments: 17 }
]

// 平台数据统计
export const stats = [
  { num: '52万+', label: '建档宠物' },
  { num: '1.2万+', label: '认证服务者' },
  { num: '860+', label: '合作医生' },
  { num: '320+', label: '友好门店' }
]
