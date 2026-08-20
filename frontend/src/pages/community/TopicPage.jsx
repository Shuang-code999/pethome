import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, Sparkles, Flame, TrendingUp, RefreshCw } from 'lucide-react'
import { api } from '../../api'
import TextPostCard from '../../components/TextPostCard'
import { imgById, topicImg } from '../../data/communityImages.js'

// 模块级缓存：返回页面时不重新请求，避免「刷新感」+ 配合 ScrollRestoration 恢复滚动位置
const _topicCache = { posts: null }

/**
 * 话题活动（小红书风格瀑布流）
 *  - 顶部：搜索 + 热门话题 tag chip
 *  - 主体：图片帖为主、文字帖穿插；瀑布流布局
 *  - 点击单帖 → 进入帖子详情（不是话题聚合页）
 */
const HOT_TOPICS = [
  { tag: '夏日遛狗', emoji: '☀️', count: '2.1万' },
  { tag: '猫咪夏日护理', emoji: '🧴', count: '1.4万' },
  { tag: '幼犬训练日记', emoji: '🐕', count: '8.6千' },
  { tag: '异宠零基础', emoji: '🦎', count: '5.2千' },
  { tag: '领养故事', emoji: '🏠', count: '3.8千' },
  { tag: '深夜撸猫', emoji: '🌙', count: '1.2万' }
]

// 从「预爬取的内容社区_话题活动」模拟：每条都是带图为主 + 少量纯文字穿插
export const TOPIC_SEEDS = [
  { id: 1001, author: '金毛爸爸', title: '三岁金毛 28kg，今天体检全优', body: '医生说体重管理得很好，分享我家的喂养清单和运动量。', imgTags: 'golden,retriever', likes: 412, comments: 88 },
  { id: 1002, author: '猫奴小王', title: '圆圆第一次洗澡没炸毛！', body: '从进门到吹干 40 分钟，分享让猫咪不害怕的技巧…', imgTags: 'cat,bath', likes: 328, comments: 71 },
  { id: 1003, author: '布偶麻麻', title: '血常规报告一图看懂', body: '红细胞、白细胞、血小板每个指标代表什么，异常说明什么问题。', imgTags: 'cat,rabbit', likes: 511, comments: 124 },
  { id: 1004, author: '田园小队长', title: '领养代替购买 · 小黑找家第 30 天', body: '从流浪到信任，30 天的变化真的很大。', imgTags: 'black,cat', likes: 740, comments: 198 },
  { id: 1005, author: '柯基姐姐', title: '底盘低真的容易脏', body: '下雨天出门回来整个肚子都是泥，清洁湿巾推荐。', imgTags: null, likes: 158, comments: 32 },
  { id: 1006, author: '仓鼠君', title: '仓鼠笼布置清单 · 新手版', body: '跑轮、垫料、躲避屋、水壶哪些必备哪些智商税。', imgTags: 'hamster,cage', likes: 342, comments: 78 },
  { id: 1007, author: '法斗大叔', title: '法斗皮肤问题真是老大难', body: '又红了一片，医生说是过敏，有同款困扰的家长吗。', imgTags: 'dog,skin', likes: 277, comments: 91 },
  { id: 1008, author: '橘猫铲屎官', title: '橘猪又胖了半斤', body: '10 斤的橘猫两岁，目标控制在 11 斤以内，减肥打卡第一天。', imgTags: 'orange,cat', likes: 489, comments: 156 },
  { id: 1009, author: '边牧妈妈', title: '边牧智商高到离谱', body: '教了三遍就会开门，现在每天自己开笼子出来溜达…', imgTags: 'border,collie', likes: 656, comments: 138 },
  { id: 1010, author: '蜥蜴饲养员', title: '爬宠 UVB 灯怎么选', body: '5.0 和 10.0 的区别，按物种和距离来选。', imgTags: null, likes: 134, comments: 29 },
  { id: 1011, author: '狸花猫主人', title: '狸花真的超好养', body: '不挑食、身体好、还抓老鼠，田园猫 yyds。', imgTags: 'tabby,cat', likes: 467, comments: 73 },
  { id: 1012, author: '泰迪奶奶', title: '泰迪泪痕清理小妙招', body: '坚持每天擦 + 调整饮食，两周就淡了很多。', imgTags: 'poodle,dog', likes: 298, comments: 49 },
  { id: 1013, author: '英短主人', title: '英短掉毛季来了', body: '每天梳毛 + 鸡蛋黄，亲测有效。', imgTags: null, likes: 176, comments: 34 },
  { id: 1014, author: '哈士奇爸爸', title: '二哈拆家实录第 N 天', body: '今天咬坏了沙发垫，但看它无辜的眼神又舍不得打…', imgTags: 'husky,dog', likes: 712, comments: 192 },
  { id: 1015, author: '鹦鹉小姐姐', title: '教鹦鹉说话的第 50 天', body: '终于会清晰说「你好」了，分享训练录音。', imgTags: 'parrot,bird', likes: 324, comments: 81 },
  { id: 1016, author: '兔兔养护', title: '兔子的科学饮食', body: '80% 提摩西草 + 15% 兔粮 + 5% 蔬菜，不要喂水果太多。', imgTags: 'rabbit,pet', likes: 288, comments: 47 },
  { id: 1017, author: '布偶家长', title: '布偶猫换毛期护理', body: '每周梳 3 次 + 鱼油，从蒲公英变回缎子毛。', imgTags: 'ragdoll,cat', likes: 522, comments: 108 },
  { id: 1018, author: '比熊麻麻', title: '比熊泪痕的成因和解决', body: '饮水、粮食、眼睛结构，三个方向排查就能解决。', imgTags: 'bichon,dog', likes: 401, comments: 76 }
]

// 把 mock 转换为统一格式（小红书瀑布流需要 images 字段）
// 用本地话题图片
function normalize(p) {
  const img = topicImg(p.id)
  return { ...p, images: [img] }
}

export default function TopicPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [activeTag, setActiveTag] = useState('')
  const [posts, setPosts] = useState(_topicCache.posts || [])
  const [loading, setLoading] = useState(!_topicCache.posts)

  useEffect(() => {
    // 有缓存就跳过请求（返回时不刷新）
    if (_topicCache.posts) return
    setLoading(true)
    api.recommendPosts('', 30).then(r => {
      let data
      if (r.code === 200 && (r.data || []).length) {
        data = r.data || []
      } else {
        // 后端无数据时使用预爬取的种子
        data = TOPIC_SEEDS
      }
      setPosts(data)
      _topicCache.posts = data
    }).finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    let list = posts.map(normalize)
    if (activeTag) list = list.filter(p => (p.title || '').includes(activeTag) || (p.body || '').includes(activeTag))
    if (keyword) list = list.filter(p => (p.title || '').includes(keyword) || (p.body || '').includes(keyword))
    return list
  }, [posts, keyword, activeTag])

  // 随机换一批（小红书式「刷新」体感）
  const shuffle = () => {
    setPosts(p => {
      const next = [...p].sort(() => Math.random() - 0.5)
      _topicCache.posts = next
      return next
    })
  }

  if (loading) return (
    <div className="mx-auto max-w-content px-4 py-16 text-center">
      <Loader2 size={20} className="animate-spin inline mr-2" />加载中…
    </div>
  )

  return (
    <div className="mx-auto max-w-content px-4 py-6 fade-in">
      {/* 顶部搜索 */}
      <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 mb-4 sticky top-16 z-30 bg-white py-2 -mx-4 px-4 border-b border-ink-100">
        <div className="flex-1 flex items-center gap-2 bg-ink-100 rounded-xl px-3 py-2.5">
          <Search size={16} className="text-ink-500" />
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
                 placeholder="搜索话题关键词…"
                 className="bg-transparent text-sm outline-none w-full" />
        </div>
        <button type="button" onClick={shuffle}
                className="clickable bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold px-3 rounded-xl flex items-center gap-1">
          <RefreshCw size={13} /> 换一批
        </button>
      </form>

      {/* 热门话题 chip */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar -mx-1 px-1">
        <button onClick={() => setActiveTag('')}
                className={`clickable shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition
                  ${activeTag === '' ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 border border-ink-200'}`}>
          <Sparkles size={11} className="inline mr-0.5 -mt-0.5" /> 全部话题
        </button>
        {HOT_TOPICS.map(t => (
          <button key={t.tag} onClick={() => setActiveTag(activeTag === t.tag ? '' : t.tag)}
                  className={`clickable shrink-0 text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition flex items-center gap-1
                    ${activeTag === t.tag ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 border border-ink-200'}`}>
            <span>{t.emoji}</span>
            <span>#{t.tag}</span>
            <span className={`text-[10px] ${activeTag === t.tag ? 'opacity-80' : 'text-rose-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* 标题区 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink-900 flex items-center gap-1.5">
          <Flame size={15} className="text-rose-500 fill-rose-500" /> 话题活动 · 小红书精选
        </h3>
        <span className="text-[11px] text-ink-400 flex items-center gap-1">
          <TrendingUp size={11} /> 共 {visible.length} 条
        </span>
      </div>

      {/* 小红书瀑布流：点击进入帖子详情（不是话题页） */}
      {visible.length === 0 ? (
        <div className="text-center text-sm text-ink-400 py-12">
          没有匹配的话题，换个关键词试试
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map(p => (
            <TextPostCard key={p.id} post={p}
                          onClick={() => navigate(`/community/post/${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}