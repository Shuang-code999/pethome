const fs = require('fs');

const surnames = ['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','马','胡','朱','郭','何','林','高','郑','罗','梁','谢','宋','唐','韩','曹','许','邓','冯','董','程','蔡','潘','袁','田','姜','范','汪','石','廖','贾','魏','薛','叶','阎','余','潘','杜','戴','夏','钟','汪','田','任','姜','方','石','姚','谭','廖','邹','熊','金','陆','郝','孔','白','崔','康','毛','邱','秦','江','史','顾','侯','邵','孟','龙','万','段','漕','钱','汤','尹','黎','易','常','武','乔','贺','赖','龚','文'];
const given_names = ['丽','华','明','芳','伟','娜','秀英','敏','静','丽丽','强','磊','军','洋','勇','艳','杰','娟','涛','超','慧','鑫','浩','博','文','一鸣','思远','雨桐','子轩','子涵','雨萱','思琪','俊杰','志远','晓明','晓峰','建华','建国','志强','海燕','桂英','玉兰','凤英','美玲','雪梅','秀兰','春梅','秀英'];

const species = ['狗','猫','兔子','仓鼠','鹦鹉','龟','龙猫','荷兰猪'];
const breeds = {
  '狗': ['金毛','拉布拉多','柯基','泰迪','哈士奇','萨摩耶','边牧','柴犬','博美','吉娃娃','法斗','英斗','阿拉斯加','雪纳瑞','贵宾'],
  '猫': ['英短','美短','布偶','暹罗','橘猫','狸花猫','波斯猫','缅因猫','折耳猫','无毛猫','加菲猫','蓝猫','黑猫','白猫','三花猫'],
  '兔子': ['荷兰垂耳兔','侏儒兔','安哥拉兔','雷克斯兔','荷兰兔','波兰兔','狮子兔','迷你雷克斯'],
  '仓鼠': ['金丝熊','三线仓鼠','一线仓鼠','布丁仓鼠','银狐仓鼠','紫仓','奶茶仓鼠','老公公'],
  '鹦鹉': ['虎皮鹦鹉','牡丹鹦鹉','玄凤鹦鹉','金刚鹦鹉','葵花鹦鹉','灰鹦鹉','亚历山大鹦鹉','小太阳鹦鹉'],
  '龟': ['巴西龟','草龟','乌龟','鳄龟','陆龟','海龟','麝香龟','蛋龟'],
  '龙猫': ['标准灰','米色','金色','丝绒黑','纯白','银斑','紫罗兰','蓝灰'],
  '荷兰猪': ['短顺','长顺','卷毛','无毛','泰迪','阿比西尼亚','喜马拉雅','斑点']
};

const pet_names = ['圆圆','豆豆','毛毛','球球','旺财','来福','小白','小黑','花花','咪咪','大黄','小黄','小灰','小白','小橘','小胖','乐乐','欢欢','贝贝','宝宝','甜甜','糖糖','果果','朵朵','豆豆','米米','萌萌','呆呆','二哈','笨笨','乖乖','皮皮','跳跳','闹闹','嘟嘟','噜噜','咕噜','布丁','奶茶','咖啡','奶糖','年糕','汤圆','饺子','包子','馒头','面条','火锅','烤肉','烤串'];

const verbs = ['洗澡','吃饭','睡觉','撒娇','拆家','遛弯','打滚','卖萌','发呆','奔跑','玩耍','打哈欠','伸懒腰','舔毛','打滚','蹭腿','咬拖鞋','追尾巴','转圈'];
const acts = ['吃饭','睡觉','玩耍','训练','美容','体检','洗澡','驱虫','打疫苗','散步'];
const topics = ['选粮','驱虫','洗澡','剪指甲','训练定点','社会化训练','护食','分离焦虑','挑食','换粮','疫苗','绝育','寄养','出行'];
const problems = ['拉肚子','呕吐','不吃东西','掉毛严重','皮肤红疹','打喷嚏','眼睛发炎','耳朵脏','便便异常','食欲不振'];
const diags = ['肠胃炎','感冒','过敏','寄生虫','皮肤真菌感染','结膜炎','耳螨','消化不良','口腔溃疡','营养不良'];
const tips = ['大家一定要注意定期驱虫！','建议每年体检一次哦','有问题及时就医不要拖','多观察宠物的日常状态','饮食要均衡'];
const places = ['公园','宠物乐园','海边','山里','草地','宠物咖啡厅','郊外','宠物友好商场'];
const skills = ['坐下','趴下','握手','捡球','装死','转圈','打滚','叼东西','等待','叫名字'];
const presents = ['新玩具','大鸡腿','罐头','冻干','新窝','零食大礼包','营养膏','磨牙棒'];
const adjs = ['奇葩','可爱','搞笑','呆萌','优雅','妖娆','霸气','委屈','无辜','贱萌'];
const emojis = ['😂','🤣','😍','🥰','😘','🤪','😴','🤤','😱','🥺'];
const details = ['我家毛孩子真的是个开心果！','每天都被它萌到不行','养宠的快乐谁懂啊','有它陪伴的日子真好','你们家的也这样吗？','简直不要太可爱','感觉它能治愈一切','爱了爱了','必须分享给所有铲屎官','已沦陷，不想上班只想吸猫'];

const post_types = ['post','post','post','post','post','qa','qa','topic','topic','adopt'];

const post_templates = [
  ['{pet_name}{verb}，{desc}', '今天我家{pet_name}{action}，真是太可爱了！{detail}'],
  ['{pet_name}的{act}日常', '分享一下{pet_name}最近的{act}日常，大家觉得怎么样？{detail}'],
  ['养宠经验分享：{topic}', '今天来聊聊{topic}这件事，我的经验是{exp}，希望能帮到大家！'],
  ['{pet_name}生病了怎么办', '{pet_name}最近{problem}，去了医院医生说{diag}，还好已经好多了。{tip}'],
  ['{pet_name}的{num}个月记录', '从{pet_name}到我家已经{num}个月了，看着它一天天长大，真的好幸福！{detail}'],
  ['{pet_name}的{adj}睡姿', '快来看看{pet_name}今天的{adj}睡姿，简直{emoji}！{detail}'],
  ['带{pet_name}去{place}', '今天天气不错，带{pet_name}去{place}玩了一圈，{pet_name}超级开心！{detail}'],
  ['{pet_name}的{num}岁生日', '今天是{pet_name}的{num}岁生日，给它准备了{present}，{pet_name}吃得好开心！'],
  ['{pet_name}学会{skill}了', '经过{day}天的训练，{pet_name}终于学会{skill}了！太聪明了！{detail}'],
  ['{pet_name}的{adj}表情包', '抓拍到{pet_name}的{adj}表情，已经做成表情包了，需要的自取！{detail}'],
];

const comment_texts = [
  '好可爱！多大了呀？','我家也是这样！','求问这是在哪里买的？','太治愈了，每天看不够',
  '同款，握爪','建议带去检查一下','学到了，谢谢分享！','我家也是，脾气超好',
  '这个表情绝了😂','多发点，爱看！','求传授经验！','收藏了，以后用得上',
  '请问驱虫用什么药？','这也太可爱了吧！','你们家吃的什么粮？','我家那个完全不配合',
  '羡慕！我家只会拆家','已经开始期待下班回家吸猫了','请问这是在哪家医院看的？','多更新，关注了！',
];

const questions = ['猫咪挑食怎么办','狗狗护食怎么纠正','幼犬多久打一次疫苗','猫咪掉毛严重怎么办','怎么给狗狗剪指甲','宠物坐车晕车怎么办','夏天怎么给宠物防暑','狗狗乱咬东西怎么教育','猫咪晚上不睡觉怎么办','宠物牙结石怎么清理'];
const question_details = ['试了好几种方法都不行，求助大家经验','求有经验的朋友指点一下','已经试过网上说的办法，效果不好','有没有什么好的产品推荐？','急！在线等！'];
const adopt_titles = ['小橘猫找新家','三花猫妹妹求领养','金毛幼犬无偿领养','小奶狗救助找领养','流浪猫妈妈和宝宝','纯种布偶找领养','拉布拉多求收养','被遗弃的小猫找家'];
const cities = ['北京','上海','广州','深圳','杭州','成都','武汉','南京','重庆','西安','苏州','长沙','郑州','青岛','大连'];
const adopt_details = ['已驱虫已打疫苗，健康活泼','性格温顺亲人，适合新手','希望找一个有爱心的家庭','会定期回访，请理解','领养代替购买，给它一个家','已做体检，身体健康'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomPhone() {
  const prefixes = ['130','131','132','133','135','136','137','138','139','150','151','152','153','155','156','157','158','159','180','181','182','183','185','186','187','188','189'];
  return rand(prefixes) + Array.from({length:8}, () => Math.floor(Math.random()*10)).join('');
}

function esc(s) { return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n'); }

// Generate 100 users
const users = [];
const BASE_ID = 2087538000000000000n;
for (let i = 0n; i < 100n; i++) {
  const phone = randomPhone();
  users.push({ id: String(BASE_ID + i), phone, email: `pet${i}@test.com`, nickname: `宠友${phone.slice(-4)}`, avatar: '' });
}

// Generate 200 posts
const posts = [];
const comments = [];
const pid_start = 2087539000000000000n;
const cid_start = 2087540000000000000n;

for (let i = 0n; i < 200n; i++) {
  const pid = String(pid_start + i);
  const uid = rand(users).id;
  const tmpl = rand(post_templates);
  const sp = rand(species);
  const br = rand(breeds[sp]);
  const pn = rand(pet_names);

  const vars = {
    pet_name: pn, verb: rand(verbs), desc: rand(details), action: rand(acts),
    act: rand(acts), topic: rand(topics), exp: `经过${Math.floor(Math.random()*12)+1}个月的实践，总结出以下几点`,
    problem: rand(problems), diag: rand(diags), tip: rand(tips),
    num: String(Math.floor(Math.random()*8)+1), adj: rand(adjs), emoji: rand(emojis),
    place: rand(places), present: rand(presents), skill: rand(skills),
    day: String(Math.floor(Math.random()*28)+3), detail: rand(details),
  };

  const title = tmpl[0].replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
  const body = tmpl[1].replace(/\{(\w+)\}/g, (_, k) => vars[k] || '');
  const author = users.find(u => u.id === uid).nickname;

  const ptype = rand(post_types);
  let ptitle = title.slice(0, 128);
  let pbody = body;
  // Customize based on type
  if (ptype === 'qa') {
    ptitle = `[问答] ${rand(questions)}`;
    pbody = `${rand(question_details)}\n\n已有 ${Math.floor(Math.random()*20)+1} 个回答，悬赏 ${Math.floor(Math.random()*50)+5} 积分`;
  } else if (ptype === 'topic') {
    ptitle = `#晒晒我家主子# ${ptitle}`;
  } else if (ptype === 'adopt') {
    ptitle = `[领养] ${rand(adopt_titles)}`;
    pbody = `品种：${br}\n性别：${rand(['公','母'])}\n年龄：${Math.floor(Math.random()*5)+1}个月\n地区：${rand(cities)}\n${rand(adopt_details)}`;
  }

  posts.push({
    id: pid, user_id: uid, author, title: ptitle,
    body: pbody, images: '', type: ptype,
    likes: Math.floor(Math.random()*500),
    comments: 0, // updated later
  });

  const numComments = Math.floor(Math.random() * 11);
  for (let j = 0n; j < BigInt(numComments); j++) {
    const cu = rand(users);
    comments.push({
      id: String(cid_start + i * 10n + j), post_id: pid,
      user_id: cu.id, author: cu.nickname, content: rand(comment_texts),
    });
  }
  posts[posts.length - 1].comments = numComments;
}

// Write SQL
let sql = '-- ============================================================\n';
sql += '-- 种子数据：100个用户 + 200条帖子 + 评论 + 商品图片\n';
sql += '-- ============================================================\n\n';
sql += 'SET NAMES utf8mb4;\n\n';

// Users
sql += '-- 用户表\n';
sql += 'REPLACE INTO `user` (`id`, `phone`, `email`, `nickname`, `avatar`) VALUES\n';
sql += users.map((u, i) => {
  const comma = i < users.length - 1 ? ',' : ';';
  return `  (${u.id},'${u.phone}','${u.email}','${u.nickname}','')${comma}`;
}).join('\n');
sql += '\n\n';

// Posts
sql += '-- 帖子表\n';
sql += 'REPLACE INTO `post` (`id`,`user_id`,`author`,`title`,`body`,`images`,`type`,`likes`,`comments`) VALUES\n';
sql += posts.map((p, i) => {
  const comma = i < posts.length - 1 ? ',' : ';';
  return `  (${p.id},${p.user_id},'${esc(p.author)}','${esc(p.title)}','${esc(p.body)}','${p.images}','${p.type}',${p.likes},${p.comments})${comma}`;
}).join('\n');
sql += '\n\n';

// Comments
if (comments.length > 0) {
  sql += '-- 评论表\n';
  sql += 'REPLACE INTO `comment` (`id`,`post_id`,`user_id`,`author`,`content`) VALUES\n';
  sql += comments.map((c, i) => {
    const comma = i < comments.length - 1 ? ',' : ';';
    return `  (${c.id},${c.post_id},${c.user_id},'${esc(c.author)}','${esc(c.content)}')${comma}`;
  }).join('\n');
  sql += '\n\n';
}

// Product images
sql += '-- 商品图片\n';
sql += 'UPDATE `product` SET `image` = CASE `id`\n';
sql += '  WHEN 1 THEN "https://images.unsplash.com/photo-1565708097881-bbf061e260e0?w=400"\n';
sql += '  WHEN 2 THEN "https://images.unsplash.com/photo-1578874109531-ee2b1d3c19b0?w=400"\n';
sql += '  WHEN 3 THEN "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"\n';
sql += '  WHEN 4 THEN "https://images.unsplash.com/photo-1583337130417-3346c1be7b0e?w=400"\n';
sql += '  WHEN 5 THEN "https://images.unsplash.com/photo-1583336663277-620dc20b3e3c?w=400"\n';
sql += '  WHEN 6 THEN "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400"\n';
sql += '  ELSE `image`\n';
sql += 'END WHERE `id` BETWEEN 1 AND 6;\n';

// Update schema.sql ON DUPLICATE KEY
sql += '\n-- 更新 product 插入语句的 ON DUPLICATE KEY\n';
sql += '-- 将 schema.sql 中的 ON DUPLICATE KEY UPDATE `name`=VALUES(`name`) 改为：\n';
sql += '-- ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`image`=VALUES(`image`);\n';

fs.writeFileSync('backend/seed_data.sql', sql, 'utf-8');
console.log(`Generated ${users.length} users, ${posts.length} posts, ${comments.length} comments`);
console.log(`File size: ${(fs.statSync('backend/seed_data.sql').size / 1024).toFixed(1)} KB`);