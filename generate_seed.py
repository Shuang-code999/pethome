import random
import json

# Chinese surnames
surnames = ['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','马','胡','朱','郭','何','林','高','郑','罗','梁','谢','宋','唐','韩','曹','许','邓','冯','董','程','蔡','潘','袁','田','姜','范','汪','石','廖','贾','魏','薛','叶','阎','余','潘','杜','戴','夏','钟','汪','田','任','姜','方','石','姚','谭','廖','邹','熊','金','陆','郝','孔','白','崔','康','毛','邱','秦','江','史','顾','侯','邵','孟','龙','万','段','漕','钱','汤','尹','黎','易','常','武','乔','贺','赖','龚','文']
given_names = ['丽','华','明','芳','伟','娜','秀英','敏','静','丽丽','强','磊','军','洋','勇','艳','杰','娟','涛','超','慧','鑫','浩','博','文','一鸣','思远','雨桐','子轩','子涵','雨萱','思琪','俊杰','志远','晓明','晓峰','建华','建国','志强','海燕','桂英','玉兰','凤英','美玲','雪梅','秀兰','春梅','秀英','志明','小明','大伟','建国','志强','海燕','文博','浩宇','浩然','俊杰','子豪','梓涵','雨涵','欣怡','雨欣','可欣','梦瑶','佳琪','思敏','思涵','静怡','静雯','嘉怡','子涵','一诺','梓萱','梓萌','诗涵','婧琪','雅琴','惠玲','桂芳','玉珍','兰英','凤英','丽华','素芬','秀芳','春梅','秀英','志明','小明','大伟','建国','志强','海燕','文博','浩宇','浩然','俊杰','子豪','梓涵','雨涵','欣怡','雨欣','可欣','梦瑶','佳琪','思敏','思涵','静怡','静雯','嘉怡','子涵','一诺','梓萱','梓萌','诗涵','婧琪','雅琴','惠玲','桂芳','玉珍','兰英','凤英','丽华','素芬','秀芳','春梅','秀英']

species = ['狗','猫','兔子','仓鼠','鹦鹉','龟','龙猫','荷兰猪']
breeds = {
    '狗': ['金毛','拉布拉多','柯基','泰迪','哈士奇','萨摩耶','边牧','柴犬','博美','吉娃娃','法斗','英斗','阿拉斯加','雪纳瑞','贵宾'],
    '猫': ['英短','美短','布偶','暹罗','橘猫','狸花猫','波斯猫','缅因猫','折耳猫','无毛猫','加菲猫','蓝猫','黑猫','白猫','三花猫'],
    '兔子': ['荷兰垂耳兔','侏儒兔','安哥拉兔','雷克斯兔','荷兰兔','波兰兔','狮子兔','迷你雷克斯'],
    '仓鼠': ['金丝熊','三线仓鼠','一线仓鼠','布丁仓鼠','银狐仓鼠','紫仓','奶茶仓鼠','老公公'],
    '鹦鹉': ['虎皮鹦鹉','牡丹鹦鹉','玄凤鹦鹉','金刚鹦鹉','葵花鹦鹉','灰鹦鹉','亚历山大鹦鹉','小太阳鹦鹉'],
    '龟': ['巴西龟','草龟','乌龟','鳄龟','陆龟','海龟','麝香龟','蛋龟'],
    '龙猫': ['标准灰','米色','金色','丝绒黑','纯白','银斑','紫罗兰','蓝灰'],
    '荷兰猪': ['短顺','长顺','卷毛','无毛','泰迪','阿比西尼亚','喜马拉雅','斑点']
}

pet_names = ['圆圆','豆豆','毛毛','球球','旺财','来福','小白','小黑','花花','咪咪','大黄','小黄','小灰','小白','小橘','小胖','乐乐','欢欢','贝贝','宝宝','甜甜','糖糖','果果','朵朵','豆豆','米米','萌萌','呆呆','二哈','笨笨','乖乖','皮皮','跳跳','闹闹','嘟嘟','噜噜','咕噜','布丁','奶茶','咖啡','奶糖','年糕','汤圆','饺子','包子','馒头','面条','火锅','烤肉','烤串']

verbs = ['洗澡','吃饭','睡觉','撒娇','拆家','遛弯','打滚','卖萌','发呆','奔跑','玩耍','打哈欠','伸懒腰','舔毛','打滚','蹭腿','咬拖鞋','追尾巴','转圈']
acts = ['吃饭','睡觉','玩耍','训练','美容','体检','洗澡','驱虫','打疫苗','散步']
topics = ['选粮','驱虫','洗澡','剪指甲','训练定点','社会化训练','护食','分离焦虑','挑食','换粮','疫苗','绝育','寄养','出行']
problems = ['拉肚子','呕吐','不吃东西','掉毛严重','皮肤红疹','打喷嚏','眼睛发炎','耳朵脏','便便异常','食欲不振']
diags = ['肠胃炎','感冒','过敏','寄生虫','皮肤真菌感染','结膜炎','耳螨','消化不良','口腔溃疡','营养不良']
tips = ['大家一定要注意定期驱虫！','建议每年体检一次哦','有问题及时就医不要拖','多观察宠物的日常状态','饮食要均衡']
places = ['公园','宠物乐园','海边','山里','草地','宠物咖啡厅','郊外','宠物友好商场']
skills = ['坐下','趴下','握手','捡球','装死','转圈','打滚','叼东西','等待','叫名字']
presents = ['新玩具','大鸡腿','罐头','冻干','新窝','零食大礼包','营养膏','磨牙棒']
adjs = ['奇葩','可爱','搞笑','呆萌','优雅','妖娆','霸气','委屈','无辜','贱萌']
emojis = ['😂','🤣','😍','🥰','😘','🤪','😴','🤤','😱','🥺']
details = ['我家毛孩子真的是个开心果！','每天都被它萌到不行','养宠的快乐谁懂啊','有它陪伴的日子真好','你们家的也这样吗？','简直不要太可爱','感觉它能治愈一切','爱了爱了','必须分享给所有铲屎官','已沦陷，不想上班只想吸猫']

post_templates = [
    ('{pet_name}{verb}，{desc}', '今天我家{pet_name}{action}，真是太可爱了！{detail}'),
    ('{pet_name}的{act}日常', '分享一下{pet_name}最近的{act}日常，大家觉得怎么样？{detail}'),
    ('养宠经验分享：{topic}', '今天来聊聊{topic}这件事，我的经验是{exp}，希望能帮到大家！'),
    ('{pet_name}生病了怎么办', '{pet_name}最近{problem}，去了医院医生说{diag}，还好已经好多了。{tip}'),
    ('{pet_name}的{num}个月记录', '从{pet_name}到我家已经{num}个月了，看着它一天天长大，真的好幸福！{detail}'),
    ('{pet_name}的{adj}睡姿', '快来看看{pet_name}今天的{adj}睡姿，简直{emoji}！{detail}'),
    ('带{pet_name}去{place}', '今天天气不错，带{pet_name}去{place}玩了一圈，{pet_name}超级开心！{detail}'),
    ('{pet_name}的{num}岁生日', '今天是{pet_name}的{num}岁生日，给它准备了{present}，{pet_name}吃得好开心！'),
    ('{pet_name}学会{skill}了', '经过{day}天的训练，{pet_name}终于学会{skill}了！太聪明了！{detail}'),
    ('{pet_name}的{adj}表情包', '抓拍到{pet_name}的{adj}表情，已经做成表情包了，需要的自取！{detail}'),
]

comment_texts = [
    '好可爱！多大了呀？',
    '我家也是这样！',
    '求问这是在哪里买的？',
    '太治愈了，每天看不够',
    '同款，握爪',
    '建议带去检查一下',
    '学到了，谢谢分享！',
    '我家也是，脾气超好',
    '这个表情绝了😂',
    '多发点，爱看！',
    '求传授经验！',
    '收藏了，以后用得上',
    '请问驱虫用什么药？',
    '这也太可爱了吧！',
    '你们家吃的什么粮？',
    '我家那个完全不配合',
    '羡慕！我家只会拆家',
    '已经开始期待下班回家吸猫了',
    '请问这是在哪家医院看的？',
    '多更新，关注了！',
]

def random_phone():
    prefixes = ['130','131','132','133','135','136','137','138','139','150','151','152','153','155','156','157','158','159','180','181','182','183','185','186','187','188','189']
    return random.choice(prefixes) + ''.join([str(random.randint(0,9)) for _ in range(8)])

def generate_user(idx):
    phone = random_phone()
    return {'id': 2087538000000000000 + idx, 'phone': phone, 'email': f'pet{idx}@test.com', 'nickname': f'宠友{phone[-4:]}', 'avatar': ''}

users = [generate_user(i) for i in range(100)]

posts = []
comments_list = []
post_id_start = 2087539000000000000
comment_id_start = 2087540000000000000

for i in range(200):
    pid = post_id_start + i
    uid = random.choice(users)['id']
    template = random.choice(post_templates)
    sp = random.choice(species)
    br = random.choice(breeds[sp])
    pn = random.choice(pet_names)

    vars_dict = {
        'pet_name': pn,
        'verb': random.choice(verbs),
        'desc': random.choice(details),
        'action': random.choice(acts),
        'act': random.choice(acts),
        'topic': random.choice(topics),
        'exp': f'经过{random.randint(1,12)}个月的实践，总结出以下几点',
        'problem': random.choice(problems),
        'diag': random.choice(diags),
        'tip': random.choice(tips),
        'num': str(random.randint(1,8)),
        'adj': random.choice(adjs),
        'emoji': random.choice(emojis),
        'place': random.choice(places),
        'present': random.choice(presents),
        'skill': random.choice(skills),
        'day': str(random.randint(3,30)),
        'detail': random.choice(details),
    }

    title = template[0].format(**vars_dict)
    body = template[1].format(**vars_dict)
    likes = random.randint(0, 500)
    img_tags = f'{sp},{br}'

    posts.append({
        'id': pid,
        'user_id': uid,
        'author': next(u['nickname'] for u in users if u['id'] == uid),
        'title': title[:128],
        'body': body,
        'images': '',
        'likes': likes,
        'comments': random.randint(0, 30)
    })

    num_comments = random.randint(0, 10)
    for j in range(num_comments):
        cid = comment_id_start + i * 10 + j
        cu = random.choice(users)
        posts.append(None)  # placeholder, will be removed
        comments_list.append({
            'id': cid,
            'post_id': pid,
            'user_id': cu['id'],
            'author': cu['nickname'],
            'content': random.choice(comment_texts)
        })
    posts.pop()  # remove placeholder

# Write SQL
with open('backend/seed_data.sql', 'w', encoding='utf-8') as f:
    f.write('-- ============================================================\n')
    f.write('-- 种子数据：100个用户 + 200条帖子 + 评论 + 商品图片\n')
    f.write('-- ============================================================\n\n')

    f.write('-- 用户表\n')
    f.write('REPLACE INTO `user` (`id`, `phone`, `email`, `nickname`, `avatar`) VALUES\n')
    for i, u in enumerate(users):
        comma = ',' if i < len(users) - 1 else ';'
        f.write(f"  ({u['id']},'{u['phone']}','{u['email']}','{u['nickname']}',''){comma}\n")
    f.write('\n')

    f.write('-- 帖子表\n')
    f.write('REPLACE INTO `post` (`id`,`user_id`,`author`,`title`,`body`,`images`,`likes`,`comments`) VALUES\n')
    for i, p in enumerate(posts):
        comma = ',' if i < len(posts) - 1 else ';'
        body_escaped = p['body'].replace("\\", "\\\\").replace("'", "\\'").replace('\n', '\\n')
        title_escaped = p['title'].replace("\\", "\\\\").replace("'", "\\'")
        f.write(f"  ({p['id']},{p['user_id']},'{p['author']}','{title_escaped}','{body_escaped}','{p['images']}',{p['likes']},{p['comments']}){comma}\n")
    f.write('\n')

    f.write('-- 评论表\n')
    f.write('REPLACE INTO `comment` (`id`,`post_id`,`user_id`,`author`,`content`) VALUES\n')
    for i, c in enumerate(comments_list):
        comma = ',' if i < len(comments_list) - 1 else ';'
        content_escaped = c['content'].replace("\\", "\\\\").replace("'", "\\'")
        f.write(f"  ({c['id']},{c['post_id']},{c['user_id']},'{c['author']}','{content_escaped}'){comma}\n")
    f.write('\n')

    f.write('-- 商品图片（Unsplash 真实宠物商品图）\n')
    f.write('UPDATE `product` SET `image` = CASE `id`\n')
    f.write('  WHEN 1 THEN "https://images.unsplash.com/photo-1565708097881-bbf061e260e0?w=400"\n')
    f.write('  WHEN 2 THEN "https://images.unsplash.com/photo-1578874109531-ee2b1d3c19b0?w=400"\n')
    f.write('  WHEN 3 THEN "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400"\n')
    f.write('  WHEN 4 THEN "https://images.unsplash.com/photo-1583337130417-3346c1be7b0e?w=400"\n')
    f.write('  WHEN 5 THEN "https://images.unsplash.com/photo-1583336663277-620dc20b3e3c?w=400"\n')
    f.write('  WHEN 6 THEN "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400"\n')
    f.write('  ELSE `image`\n')
    f.write('END WHERE `id` BETWEEN 1 AND 6;\n')

print(f"Generated {len(users)} users, {len(posts)} posts, {len(comments_list)} comments")