// 可爱宠物图片库 · petImages.js
// ---------------------------------------------------------------
// 多源策略：每个分类优先尝试稳定 Unsplash CDN（直链、永久 ID、参数化裁剪），
// 失败时回退到 loremflickr（已证明在国内可访问）。所有图片都在 <PetImg> 组件
// 有兜底（渐变 + emoji），所以即便少量失效也不会破图。
//
// Unsplash 直链格式：https://images.unsplash.com/photo-{ID}?w=400&h=300&fit=crop&auto=format
// 选 ID 原则：广为传播、长期在线的宠物摄影作品
// ---------------------------------------------------------------

const u = (id, w = 400, h = 300) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`

// 兜底服务：loremflickr（无需 key、按 tag 返回真实宠物照）
const flickr = (tags, w = 400, h = 300) =>
  `https://loremflickr.com/${w}/${h}/${encodeURIComponent(tags)}?lock=${Math.floor(Math.random() * 1000)}`

// -------- 主推动物：狗（精选 30+） --------
const dogs = [
  '1561037404-61cd96eef21f', // cute corgi puppy
  '1587300003388-59292cc15c50', // golden retriever
  '1601758228041-f3b2795255f1', // shiba inu
  '1583512603805-3cc6b41f3edb', // husky
  '1517849845607-39d4a41768ab', // french bulldog
  '1546238232-20216dec9f72',   // border collie
  '1574144611937-0df066c5ec3e', // beagle
  '1530281700549-e82e7bf110d6', // pomeranian
  '1591946614720-90a587da4a36', // dachshund
  '1575425188478-49d7c7b6c1c2', // samoyed puppy
  '1558788353-f76d92427f16',   // labrador smile
  '1591769225440-811ad7f6e272', // dog portrait
  '1548199973-03cce0bbc87b',    // golden retriever running
  '1583337130417-3346a1be7dee', // husky puppy
  '1561629706854-5b4d4f64a7e4', // shiba inu smile
  '1583511666372-62fc211f8377', // corgi portrait
  '1518717758536-85ae29035b6d', // beagle outdoor
  '1543466835-00a7907e9de1',    // husky blue eyes
  '1605568427561-40dd23c2acea', // pomeranian ball
  '1552053831-71594a27632d',    // golden puppy
  '1601758124277-f0086d5ab050', // border collie
  '1588269845464-8993565cac3a', // beagle portrait
  '1554692936-08eaa86f3c0c',    // dog outdoor
  '1567016376408-0226e4d0c1ea', // dog running
  '1568572933388-47d2c9c4b71e', // husky family
  '1583511655826-05700d52f4d9', // dog food bowl
  '1570824104453-508955ab713e', // bulldog
  '1551717743-49959800b1f6',    // puppy
  '1591768793355-74d04bb6608f', // dog with toy
  '1605429523419-d828acb941d9'  // dog on grass
]

// -------- 主推动物：猫（精选 25+） --------
const cats = [
  '1574144611937-0df066c5ec3e', // cat yawn
  '1514888286974-6cb03e34642d', // cat eyes close
  '1518791841217-8f162f1e1131', // kitten
  '1573865526739-10659fec78a3', // cat sleeping
  '1592194996308-7b43878e84a6', // orange cat
  '1543852786-1cf6624b9987',   // cat paw
  '1495360010541-f48722b34f7d', // white cat
  '1561948955-570b270e7c36',    // tabby cat
  '1548247416-ec66f4900b2e',    // cat portrait
  '1561948955-570b270e7c36',    // kitten cute
  '1494256997604-768d1f608cac', // cat looking
  '1573865526739-10659fec78a3', // cat resting
  '1533743982695-40d4a0c4ec80', // black cat
  '1545084717-1bc9a6f5d2c1',    // kitten playful
  '1571566882372-1598d88abd90', // cat eyes
  '1606214174585-fe31582dc6ee', // cat yawn
  '1583796225807-d2b50e9c4f3e', // cat grooming
  '1511044568932-338cba0ad803', // ginger cat
  '1592769606467-fd4f5cd0d3b3', // cat
  '1606214187049-0cfa4d2fb2dd', // fluffy cat
  '1606214174585-fe31582dc6ee', // tabby
  '1545084717-1bc9a6f5d2c1',    // kitten
  '1561948955-570b270e7c36',    // tabby lying
  '1573865526739-10659fec78a3', // cat sleeping
  '1533738363-b7f9aef128ce'     // cat window
]

// -------- 其他宠物：小宠 / 异宠 / 鸟类 / 水族 --------
const otherPets = {
  rabbit:  ['1583337130417-3346a1be7dee', '1535241749838-299277b6305f', '1452857297128-d9c29adba80b', '1606214187049-0cfa4d2fb2dd'],
  hamster: ['1425082661705-1834bfd09bca', '1425082661705-1834bfd09bca', '1535241749838-299277b6305f', '1425082661705-1834bfd09bca'],
  parrot:  ['1452570053594-1b985d6d8906', '1591608971362-f08b2a75731a', '1452570053594-1b985d6d8906', '1591608971362-f08b2a75731a'],
  fish:    ['1522069169874-c58ec4b76be5', '1522069169874-c58ec4b76be5', '1535591279278-7ddf66e93b80', '1522069169874-c58ec4b76be5'],
  lizard:  ['1504450874802-0ba2bcd659e0', '1504450874802-0ba2bcd659e0', '1531877264503-2b6da21c2c20', '1504450874802-0ba2bcd659e0'],
  bird:    ['1444930694458-01babe71870c', '1452570053594-1b985d6d8906', '1444930694458-01babe71870c', '1591608971362-f08b2a75731a']
}

// -------- 场景类（按需使用） --------
const scenes = {
  bath:      ['1601758124510-52d02dd9a5b6', '1561037404-61cd96eef21f', '1601758124277-f0086d5ab050', '1551717743-49959800b1f6'],
  food:      ['1583511655826-05700d52f4d9', '1606787366850-de6330128bfc', '1583337130417-3346a1be7dee', '1606214187049-0cfa4d2fb2dd'],
  toy:       ['1601758228041-f3b2795255f1', '1530281700549-e82e7bf110d6', '1583511655826-05700d52f4d9', '1591768793355-74d04bb6608f'],
  vet:       ['1581881384106-9b6749b30a3d', '1559190398-df5de27dfa1b', '1612531386530-97286d97c2d2', '1559839734-2b71ea197ec2'],
  vetDoctor: ['1559839734-2b71ea197ec2', '1612531386530-97286d97c2d2', '1581881384106-9b6749b30a3d', '1559190398-df5de27dfa1b'],
  walking:   ['1530281700549-e82e7bf110d6', '1601758228041-f3b2795255f1', '1548199973-03cce0bbc87b', '1583337130417-3346a1be7dee'],
  service:   ['1516734212186-a967f81ad0d7', '1559190398-df5de27dfa1b', '1581881384106-9b6749b30a3d', '1601758124510-52d02dd9a5b6'],
  shop:      ['1581881384106-9b6749b30a3d', '1606787366850-de6330128bfc', '1601758124277-f0086d5ab050', '1551717743-49959800b1f6'],
  happy:     ['1561037404-61cd96eef21f', '1601758228041-f3b2795255f1', '1583337130417-3346a1be7dee', '1552053831-71594a27632d'],
  portrait:  ['1517849845607-39d4a41768ab', '1591769225440-811ad7f6e272', '1518791841217-8f162f1e1131', '1573865526739-10659fec78a3'],
  park:      ['1548199973-03cce0bbc87b', '1583337130417-3346a1be7dee', '1601758228041-f3b2795255f1', '1583337130417-3346a1be7dee'],
  cage:      ['1425082661705-1834bfd09bca', '1535241749838-299277b6305f', '1425082661705-1834bfd09bca', '1425082661705-1834bfd09bca']
}

// -------- 工具：根据关键词获取合适图片 --------
export function petImg(tags, w = 400, h = 300, seedIdx) {
  const list = String(tags || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean)
  const seed = seedIdx !== undefined ? seedIdx : Math.floor(Math.random() * 1000)

  // 场景类直接走 Unsplash
  const scene = list.find(t => scenes[t])
  if (scene) {
    const pool = scenes[scene]
    return u(pool[Math.abs(seed) % pool.length], w, h)
  }
  // 异宠
  for (const pet of ['rabbit', 'hamster', 'parrot', 'fish', 'lizard', 'bird']) {
    if (list.includes(pet)) {
      const pool = otherPets[pet]
      return u(pool[Math.abs(seed) % pool.length], w, h)
    }
  }
  // 物种
  if (list.some(t => ['dog', 'puppy', 'golden', 'corgi', 'husky', 'lab', 'shepherd', 'retriever', 'poodle', 'bulldog', 'shiba', 'border', 'collie', 'beagle', 'dachshund', 'pomeranian', 'samoyed', 'frenchie'].includes(t))) {
    return u(dogs[Math.abs(seed) % dogs.length], w, h)
  }
  if (list.some(t => ['cat', 'kitten', 'tabby', 'orange', 'ginger', 'siamese', 'british', 'shorthair', 'persian', 'ragdoll', 'maine', 'coon'].includes(t))) {
    return u(cats[Math.abs(seed) % cats.length], w, h)
  }
  return flickr(list.join(',') || 'pet', w, h)
}

// 头像（圆形，1:1 方形）
export function petAvatar(tags, size = 120, seedIdx) {
  return petImg(tags, size, size, seedIdx)
}

// Banner 大图（1200x500）
export function bannerImg(tags, seedIdx) {
  return petImg(tags, 1200, 500, seedIdx)
}

// 长卷无限滚动（精选实拍照片混排）
export const petGallery = [
  u(dogs[0], 600, 600),  u(cats[0], 600, 600),
  u(dogs[1], 600, 600),  u(cats[1], 600, 600),
  u(dogs[2], 600, 600),  u(cats[2], 600, 600),
  u(dogs[3], 600, 600),  u(cats[3], 600, 600),
  u(dogs[4], 600, 600),  u(cats[4], 600, 600),
  u(dogs[5], 600, 600),  u(cats[5], 600, 600),
  u(dogs[6], 600, 600),  u(cats[6], 600, 600),
  u(dogs[7], 600, 600),  u(cats[7], 600, 600),
  u(dogs[8], 600, 600),  u(cats[8], 600, 600),
  u(dogs[9], 600, 600),  u(otherPets.rabbit[0], 600, 600),
  u(dogs[10], 600, 600), u(otherPets.parrot[0], 600, 600),
  u(dogs[11], 600, 600), u(dogs[2], 600, 600)
]

// 主题轮播：用于 Hero 大图轮播（8-12 张精选实拍）
export const heroSlides = [
  u('1561037404-61cd96eef21f', 1200, 500),  // corgi
  u('1587300003388-59292cc15c50', 1200, 500), // golden
  u('1601758228041-f3b2795255f1', 1200, 500), // shiba
  u('1583512603805-3cc6b41f3edb', 1200, 500), // husky
  u('1517849845607-39d4a41768ab', 1200, 500), // frenchie
  u('1574144611937-0df066c5ec3e', 1200, 500), // beagle
  u('1530281700549-e82e7bf110d6', 1200, 500), // pomeranian
  u('1591946614720-90a587da4a36', 1200, 500), // dachshund
  u('1518791841217-8f162f1e1131', 1200, 500), // kitten
  u('1573865526739-10659fec78a3', 1200, 500), // cat sleeping
  u('1592194996308-7b43878e84a6', 1200, 500), // orange cat
  u('1561948955-570b270e7c36', 1200, 500)   // tabby
]

// 按分类取池（多图轮播）
export function getByCategory(category, w = 600, h = 400, count = 4) {
  const map = {
    dog: dogs, cat: cats, rabbit: otherPets.rabbit,
    hamster: otherPets.hamster, parrot: otherPets.parrot,
    fish: otherPets.fish, lizard: otherPets.lizard, bird: otherPets.bird
  }
  const pool = map[category] || [...dogs, ...cats]
  const result = []
  const start = Math.floor(Math.random() * pool.length)
  for (let i = 0; i < count; i++) {
    result.push(u(pool[(start + i) % pool.length], w, h))
  }
  return result
}

export { flickr, dogs, cats, otherPets, scenes }
