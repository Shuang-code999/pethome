-- 萌宠之家 数据库 schema
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT PRIMARY KEY,
  `phone` VARCHAR(20) DEFAULT NULL,
  `nickname` VARCHAR(64),
  `avatar` VARCHAR(255),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE INDEX `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pet` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `name` VARCHAR(32) NOT NULL,
  `species` VARCHAR(16) NOT NULL COMMENT '猫/狗/异宠',
  `breed` VARCHAR(32),
  `gender` TINYINT COMMENT '0母1公',
  `birthday` DATE,
  `weight` DECIMAL(5,2),
  `neutered` TINYINT DEFAULT 0,
  `chip_no` VARCHAR(64),
  `avatar` VARCHAR(255),
  `coat_color` VARCHAR(32) DEFAULT NULL COMMENT '毛色',
  `pedigree_no` VARCHAR(64) DEFAULT NULL COMMENT '血统编号（CKU/CFA 等）',
  `age_text` VARCHAR(32) DEFAULT NULL COMMENT '年龄文本',
  `arrive_date` DATE DEFAULT NULL COMMENT '到家日期',
  `staple_food` VARCHAR(255) DEFAULT NULL COMMENT '日常主食',
  `allergy` VARCHAR(255) DEFAULT NULL COMMENT '过敏史',
  `chronic_disease` VARCHAR(255) DEFAULT NULL COMMENT '慢性病',
  `temperament` VARCHAR(255) DEFAULT NULL COMMENT '脾气性格',
  `stress` VARCHAR(255) DEFAULT NULL COMMENT '应激情况',
  `forbidden_drugs` VARCHAR(255) DEFAULT NULL COMMENT '禁忌药物',
  `special_care` VARCHAR(500) DEFAULT NULL COMMENT '特殊照料要求',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `product` (
  `id` BIGINT PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `old_price` DECIMAL(10,2),
  `stock` INT NOT NULL DEFAULT 0,
  `image` VARCHAR(255),
  `tags` VARCHAR(128),
  `category` VARCHAR(32),
  `status` TINYINT DEFAULT 1 COMMENT '1上架0下架',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 秒杀券
CREATE TABLE IF NOT EXISTS `seckill_voucher` (
  `id` BIGINT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `total` INT NOT NULL COMMENT '总库存',
  `remain` INT NOT NULL COMMENT '剩余(冗余字段)',
  `discount` DECIMAL(10,2) NOT NULL COMMENT '立减金额',
  `begin_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `seckill_order` (
  `id` BIGINT PRIMARY KEY,
  `voucher_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `status` TINYINT DEFAULT 0 COMMENT '0未支付1已支付2已超时取消',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_voucher_user (`voucher_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `post` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `author` VARCHAR(64),
  `title` VARCHAR(128) NOT NULL,
  `body` TEXT,
  `images` VARCHAR(1024),
  `type` VARCHAR(16) DEFAULT 'post' COMMENT 'post/qa/adopt',
  `likes` INT DEFAULT 0,
  `comments` INT DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`),
  INDEX idx_time (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 关注关系（Feed 流推模式用）
CREATE TABLE IF NOT EXISTS `follow` (
  `follower` BIGINT NOT NULL,
  `followee` BIGINT NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower`, `followee`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 帖子点赞
CREATE TABLE IF NOT EXISTS `post_like` (
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 帖子评论
CREATE TABLE IF NOT EXISTS `comment` (
  `id` BIGINT PRIMARY KEY,
  `post_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `author` VARCHAR(64),
  `parent_id` BIGINT DEFAULT NULL,
  `content` TEXT NOT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_post (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 宠物健康记录
CREATE TABLE IF NOT EXISTS `health_record` (
  `id` BIGINT PRIMARY KEY,
  `pet_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `type` VARCHAR(16) NOT NULL COMMENT 'vaccine/deworm/checkup',
  `name` VARCHAR(64) NOT NULL,
  `record_date` DATE,
  `next_date` DATE,
  `note` TEXT,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pet (`pet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 健康提醒
CREATE TABLE IF NOT EXISTS `reminder` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `pet_id` BIGINT,
  `title` VARCHAR(128) NOT NULL,
  `remind_date` DATE NOT NULL,
  `status` TINYINT DEFAULT 0 COMMENT '0待提醒1已处理',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (`user_id`, `remind_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 问诊会话（多轮对话）
CREATE TABLE IF NOT EXISTS `consult_session` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT,
  `pet_id` BIGINT COMMENT '关联宠物档案，用于针对性问诊上下文',
  `title` VARCHAR(128),
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`),
  INDEX idx_pet (`pet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI 问诊知识库
CREATE TABLE IF NOT EXISTS `knowledge_entry` (
  `id` BIGINT PRIMARY KEY,
  `category` VARCHAR(32) DEFAULT '养护' COMMENT '疾病/养护/行为/营养',
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `tags` VARCHAR(255) DEFAULT '' COMMENT '逗号分隔标签',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 真实在线医生（区别于 mock，可被预约）
CREATE TABLE IF NOT EXISTS `doctor` (
  `id` BIGINT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `title` VARCHAR(64) DEFAULT '',
  `dept` VARCHAR(64) DEFAULT '',
  `hospital` VARCHAR(128) DEFAULT '',
  `avatar` VARCHAR(255) DEFAULT '',
  `tags` VARCHAR(255) DEFAULT '',
  `price` DECIMAL(8,2) DEFAULT 0,
  `years_exp` INT DEFAULT 0,
  `rating` DECIMAL(2,1) DEFAULT 5.0,
  `consult_count` INT DEFAULT 0,
  `bio` TEXT,
  `online` TINYINT(1) DEFAULT 1,
  `license_no` VARCHAR(64) DEFAULT '',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_dept (`dept`),
  INDEX idx_online (`online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 问诊预约
CREATE TABLE IF NOT EXISTS `appointment` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `doctor_id` BIGINT NOT NULL,
  `doctor_name` VARCHAR(64) DEFAULT '',
  `user_pet_name` VARCHAR(64) DEFAULT '',
  `pet_type` VARCHAR(16) DEFAULT '',
  `symptoms` TEXT,
  `appt_date` DATE,
  `appt_slot` VARCHAR(32) DEFAULT '',
  `status` VARCHAR(16) DEFAULT 'pending' COMMENT 'pending/confirmed/completed/cancelled',
  `amount` DECIMAL(8,2) DEFAULT 0,
  `pay_status` VARCHAR(16) DEFAULT 'unpaid' COMMENT 'unpaid/paid/refunded',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`),
  INDEX idx_doctor_date (`doctor_id`, `appt_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 保险方案
CREATE TABLE IF NOT EXISTS `insurance_plan` (
  `id` BIGINT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `company` VARCHAR(64) DEFAULT '',
  `tag` VARCHAR(16) DEFAULT '',
  `price` DECIMAL(8,2) DEFAULT 0,
  `unit` VARCHAR(16) DEFAULT '/年',
  `deduct` VARCHAR(64) DEFAULT '',
  `payout` VARCHAR(255) DEFAULT '',
  `coverage` TEXT COMMENT 'JSON 数组：保障责任',
  `highlights` TEXT COMMENT 'JSON 数组：亮点',
  `sort_order` INT DEFAULT 0,
  `active` TINYINT(1) DEFAULT 1,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 同城宠物门店
CREATE TABLE IF NOT EXISTS `pet_store` (
  `id` BIGINT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) DEFAULT '' COMMENT '供给方类型：门店/医院/个人/训练学校/殡葬馆',
  `service_type` VARCHAR(32) DEFAULT '' COMMENT 'feeding/grooming/boarding/transport/training/funeral',
  `service_mode` VARCHAR(16) DEFAULT '到店' COMMENT '到店/上门/双向',
  `pet_types` VARCHAR(64) DEFAULT '' COMMENT '适用宠物：狗/猫/小宠/爬宠/鸟/水族',
  `price_range` VARCHAR(32) DEFAULT '' COMMENT '价格区间文本',
  `booking_url` VARCHAR(255) DEFAULT '' COMMENT '后端跳转链接 /service/{type}/book/{id}',
  `address` VARCHAR(255) DEFAULT '',
  `city` VARCHAR(32) DEFAULT '',
  `district` VARCHAR(32) DEFAULT '',
  `lat` DECIMAL(10,6) DEFAULT 0,
  `lng` DECIMAL(10,6) DEFAULT 0,
  `tel` VARCHAR(32) DEFAULT '',
  `rating` DECIMAL(2,1) DEFAULT 5.0,
  `distance` INT DEFAULT 0,
  `open_time` VARCHAR(64) DEFAULT '',
  `photo` VARCHAR(255) DEFAULT '',
  `tags` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `sort_order` INT DEFAULT 0,
  INDEX idx_category (`category`),
  INDEX idx_service_type (`service_type`),
  INDEX idx_pet_types (`pet_types`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 兼容已有数据库：补齐新增字段（运行 schema.sql 前需确保字段不存在）
-- 注意：MySQL 8 不支持 ADD COLUMN IF NOT EXISTS，因此此段留空
-- 首次部署新数据库：以下注释中的 SQL 可手动执行
-- ALTER TABLE `pet_store`
--   ADD COLUMN `service_type` VARCHAR(32) DEFAULT '' AFTER `category`,
--   ADD COLUMN `service_mode` VARCHAR(16) DEFAULT '到店' AFTER `service_type`,
--   ADD COLUMN `pet_types` VARCHAR(64) DEFAULT '' AFTER `service_mode`,
--   ADD COLUMN `price_range` VARCHAR(32) DEFAULT '' AFTER `pet_types`,
--   ADD COLUMN `booking_url` VARCHAR(255) DEFAULT '' AFTER `price_range`;

-- 同城服务订单流水
CREATE TABLE IF NOT EXISTS `service_order` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `service_type` VARCHAR(32) NOT NULL COMMENT 'feeding/grooming/boarding/transport/training/funeral',
  `provider_id` BIGINT NOT NULL,
  `provider_name` VARCHAR(128) DEFAULT '',
  `pet_name` VARCHAR(64) DEFAULT '',
  `pet_type` VARCHAR(16) DEFAULT '',
  `address` VARCHAR(255) DEFAULT '',
  `appt_date` DATE DEFAULT NULL,
  `appt_slot` VARCHAR(32) DEFAULT '',
  `remark` TEXT,
  `amount` DECIMAL(8,2) DEFAULT 0,
  `status` VARCHAR(16) DEFAULT 'pending' COMMENT 'pending/confirmed/completed/cancelled',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`),
  INDEX idx_provider (`provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 问诊消息
CREATE TABLE IF NOT EXISTS `consult_message` (
  `id` BIGINT PRIMARY KEY,
  `session_id` BIGINT NOT NULL,
  `role` VARCHAR(16) NOT NULL COMMENT 'user/assistant',
  `content` TEXT NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL COMMENT '用户上传图片问诊',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ====== 初始数据 ======
INSERT INTO `user` (`id`,`phone`,`nickname`,`avatar`) VALUES
  (1,'18500000001','铲屎官圆圆','https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200'),
  (2,'18500000002','猫奴小王','https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200'),
  (3,'18500000003','金毛爸爸','https://images.unsplash.com/photo-1552053831-71594a27632d?w=200')
ON DUPLICATE KEY UPDATE `nickname`=VALUES(`nickname`),`avatar`=VALUES(`avatar`);

-- 演示用户的宠物档案：让首页"我的宠物"卡显示真实数据
INSERT INTO `pet` (`id`,`user_id`,`name`,`species`,`breed`,`gender`,`birthday`,`weight`,`neutered`,`chip_no`,`avatar`) VALUES
  (10101,1,'圆圆','狗','金毛巡回犬',1,'2023-04-12',28.50,1,'900123000000001','https://images.unsplash.com/photo-1552053831-71594a27632d?w=400'),
  (10102,2,'布丁','猫','英国短毛猫',0,'2022-09-08',4.20,1,'900123000000002','https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400'),
  (10103,3,'黑米','狗','拉布拉多',1,'2024-01-20',18.00,0,'900123000000003','https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400'),
  (10104,1,'饭团','猫','中华田园猫',0,'2024-06-01',3.50,0,'900123000000004','https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 健康记录：nextDate 会在 HealthService.create 时同步生成 reminder（演示用 INSERT 直插）
INSERT INTO `health_record` (`id`,`pet_id`,`user_id`,`type`,`name`,`record_date`,`next_date`,`note`) VALUES
  (20101,10101,1,'vaccine','狂犬疫苗','2026-08-01','2027-08-01','联众生物，2026Q3 加强'),
  (20102,10101,1,'deworm','体外驱虫','2026-07-20','2026-09-20','福来恩滴剂，户外活动多'),
  (20103,10101,1,'checkup','年度体检','2026-06-10',NULL,'血常规正常，体重略增'),
  (20104,10102,2,'vaccine','猫三联','2026-05-15','2027-05-15','妙三多第三针'),
  (20105,10102,2,'deworm','体内驱虫','2026-08-05','2026-11-05','拜耳'),
  (20106,10103,3,'vaccine','五联疫苗','2026-07-22','2026-10-22','幼犬第三针提醒'),
  (20107,10103,3,'checkup','幼犬体检','2026-08-09','2026-09-09','一个月后复查髋关节'),
  (20108,10104,1,'deworm','体外驱虫','2026-08-12','2026-09-12','新到家小猫首次驱虫')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 提醒：与健康记录 nextDate 对应，体现"一站式"：档案 → 健康记录 → 提醒
INSERT INTO `reminder` (`id`,`user_id`,`pet_id`,`title`,`remind_date`,`status`) VALUES
  (30101,1,10101,'圆圆的狂犬疫苗加强','2027-08-01',0),
  (30102,1,10101,'圆圆的体外驱虫','2026-09-20',0),
  (30103,2,10102,'布丁的猫三联年度加强','2027-05-15',0),
  (30104,2,10102,'布丁的体内驱虫','2026-11-05',0),
  (30105,3,10103,'黑米的五联疫苗加强','2026-10-22',0),
  (30106,3,10103,'黑米的髋关节复查','2026-09-09',0),
  (30107,1,10104,'饭团的体外驱虫','2026-09-12',0)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 关注：让 feed follow 流有内容
INSERT INTO `follow` (`follower`,`followee`) VALUES
  (1,2),(1,3),(2,3),(3,1),(3,2),(2,1)
ON DUPLICATE KEY UPDATE `create_time`=VALUES(`create_time`);

-- 清理旧商品数据（只保留 50 件，旧的设为下架）
UPDATE `product` SET `status` = 0 WHERE `id` > 50;

INSERT INTO `product` (`id`,`name`,`price`,`old_price`,`stock`,`image`,`tags`,`category`) VALUES
  (1,'皇家 金毛专用成犬粮 15kg',459.00,529.00,100,'/assets/coupon/皇家狗粮.png','主粮推荐','主粮'),
  (2,'鲜朗 冻干猫主食 1kg',168.00,199.00,200,'/assets/coupon/冻干.png','热销','零食'),
  (3,'福莱希 伸缩牵引绳 5m',89.00,119.00,150,'/assets/coupon/牵引绳.png','','用品'),
  (4,'pidan 混合猫砂 6L*2',119.00,159.00,300,'/assets/coupon/猫砂.png','囤货','猫砂'),
  (5,'大宠爱 体外驱虫 犬用',78.00,98.00,80,'/assets/coupon/宠物驱虫.png','处方','驱虫'),
  (6,'互动发声玩具球',29.00,45.00,500,'/assets/coupon/逗猫玩具球.png','','玩具'),
  (7,'渴望 六种鱼配方犬粮 11.4kg',599.00,699.00,60,'https://picsum.photos/seed/pet7/400/400','进口','主粮'),
  (8,'爱肯拿 草原盛宴犬粮 11.4kg',549.00,649.00,70,'https://picsum.photos/seed/pet8/400/400','热销','主粮'),
  (9,'皇家 室内成猫粮 4kg',289.00,349.00,120,'https://picsum.photos/seed/pet9/400/400','','主粮'),
  (10,'冠能 优护犬粮 12kg',399.00,479.00,80,'https://picsum.photos/seed/pet10/400/400','','主粮'),
  (11,'比瑞吉 无谷全期犬粮 10kg',329.00,399.00,90,'https://picsum.photos/seed/pet11/400/400','国产','主粮'),
  (12,'网易严选 全价猫粮 7.2kg',259.00,319.00,100,'https://picsum.photos/seed/pet12/400/400','性价比','主粮'),
  (13,'ZIWI 鹿肉罐头 185g*12',288.00,348.00,60,'https://picsum.photos/seed/pet13/400/400','进口','零食'),
  (14,'K9 冻干鸡肉条 100g',79.00,99.00,200,'https://picsum.photos/seed/pet14/400/400','','零食'),
  (15,'麦富迪 牛肉粒 500g',49.00,69.00,300,'https://picsum.photos/seed/pet15/400/400','热销','零食'),
  (16,'顽皮 鲜食罐头 80g*24',99.00,139.00,150,'https://picsum.photos/seed/pet16/400/400','','零食'),
  (17,'朗诺 冻干鸡肉猫零食 30g',35.00,49.00,400,'https://picsum.photos/seed/pet17/400/400','','零食'),
  (18,'麦仕 洁齿棒犬用 270g',39.00,55.00,250,'https://picsum.photos/seed/pet18/400/400','','零食'),
  (19,'里兜 混合猫砂 2.5kg*4',159.00,199.00,120,'https://picsum.photos/seed/pet19/400/400','','猫砂'),
  (20,'N1 绿茶豆腐猫砂 6.5L',79.00,99.00,200,'https://picsum.photos/seed/pet20/400/400','热销','猫砂'),
  (21,'蓝钻 极细膨润土猫砂 11.3kg',129.00,169.00,80,'https://picsum.photos/seed/pet21/400/400','进口','猫砂'),
  (22,'洁客 除臭王猫砂 10L',59.00,79.00,300,'https://picsum.photos/seed/pet22/400/400','','猫砂'),
  (23,'福来恩 体外驱虫滴剂 犬用',98.00,128.00,100,'https://picsum.photos/seed/pet23/400/400','处方','驱虫'),
  (24,'拜耳 拜宠清体内驱虫 犬用',65.00,85.00,120,'https://picsum.photos/seed/pet24/400/400','处方','驱虫'),
  (25,'海乐妙 体内外驱虫 猫用',88.00,118.00,90,'https://picsum.photos/seed/pet25/400/400','处方','驱虫'),
  (26,'妙三多 猫三联疫苗',98.00,128.00,50,'https://picsum.photos/seed/pet26/400/400','处方','驱虫'),
  (27,'超亚 体内驱虫片 犬猫通用',29.00,45.00,500,'https://picsum.photos/seed/pet27/400/400','','驱虫'),
  (28,'智能逗猫激光笔 自动旋转',69.00,89.00,150,'https://picsum.photos/seed/pet28/400/400','新品','玩具'),
  (29,'KONG 经典葫芦漏食球 犬用',89.00,119.00,100,'https://picsum.photos/seed/pet29/400/400','经典','玩具'),
  (30,'猫咪隧道 三通道折叠款',99.00,139.00,80,'https://picsum.photos/seed/pet30/400/400','','玩具'),
  (31,'耐咬发声球 中型犬专用',19.00,29.00,600,'https://picsum.photos/seed/pet31/400/400','','玩具'),
  (32,'多功能逗猫棒 羽毛铃铛款',15.00,25.00,800,'https://picsum.photos/seed/pet32/400/400','','玩具'),
  (33,'航空箱 宠物托运箱 S码',159.00,199.00,40,'https://picsum.photos/seed/pet33/400/400','','用品'),
  (34,'小佩 智能饮水机 2代',229.00,299.00,60,'https://picsum.photos/seed/pet34/400/400','智能','用品'),
  (35,'pidan 雪屋猫厕所',299.00,379.00,30,'https://picsum.photos/seed/pet35/400/400','设计奖','用品'),
  (36,'宠物自动喂食器 定时定量',189.00,249.00,50,'https://picsum.photos/seed/pet36/400/400','智能','用品'),
  (37,'304不锈钢食盆 双碗防滑',39.00,59.00,300,'https://picsum.photos/seed/pet37/400/400','','用品'),
  (38,'可拆洗狗窝 四季通用 L码',129.00,169.00,60,'https://picsum.photos/seed/pet38/400/400','','用品'),
  (39,'雪貂留香 宠物沐浴露 500ml',45.00,65.00,200,'https://picsum.photos/seed/pet39/400/400','热销','洗护'),
  (40,'宠物指甲剪 LED灯照射',35.00,49.00,250,'https://picsum.photos/seed/pet40/400/400','','洗护'),
  (41,'宠物除臭喷雾 生物酶 500ml',29.00,45.00,350,'https://picsum.photos/seed/pet41/400/400','','洗护'),
  (42,'宠物梳子 双面针梳 长毛专用',39.00,55.00,200,'https://picsum.photos/seed/pet42/400/400','','洗护'),
  (43,'齿科洁牙粉 犬猫通用 60g',49.00,69.00,150,'https://picsum.photos/seed/pet43/400/400','','洗护'),
  (44,'智能宠物烘干箱 家用款',599.00,799.00,15,'https://picsum.photos/seed/pet44/400/400','新品','洗护'),
  (45,'宠物湿巾 80抽*6包',25.00,39.00,500,'https://picsum.photos/seed/pet45/400/400','囤货','洗护'),
  (46,'渴望 猫粮 六种鱼配方 5.4kg',579.00,679.00,40,'https://picsum.photos/seed/pet46/400/400','进口','主粮'),
  (47,'比乐 原味鲜犬粮 12kg',279.00,349.00,70,'https://picsum.photos/seed/pet47/400/400','国产','主粮'),
  (48,'猫乐适 益生菌 调理肠胃',59.00,79.00,180,'https://picsum.photos/seed/pet48/400/400','','保健'),
  (49,'卫仕 卵磷脂美毛片 200粒',89.00,119.00,120,'https://picsum.photos/seed/pet49/400/400','热销','保健'),
  (50,'红狗 营养膏 犬猫通用 120g',55.00,75.00,200,'https://picsum.photos/seed/pet50/400/400','','保健')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`),`price`=VALUES(`price`),`old_price`=VALUES(`old_price`),`category`=VALUES(`category`),`tags`=VALUES(`tags`);

INSERT INTO `seckill_voucher` (`id`,`name`,`total`,`remain`,`discount`,`begin_time`,`end_time`) VALUES
  (1,'新用户立减券 ¥20',1000,1000,20.00,'2026-01-01 00:00:00','2026-12-31 23:59:59'),
  (2,'皇家金毛专用成犬粮 15kg',200,200,459.00,'2026-08-01 00:00:00','2026-08-20 23:59:59'),
  (3,'鲜朗冻干猫主食 1kg',300,300,168.00,'2026-08-01 00:00:00','2026-08-18 18:00:00'),
  (4,'pidan混合猫砂 6L×2',500,500,119.00,'2026-08-01 00:00:00','2026-08-25 23:59:59'),
  (5,'大宠爱体外驱虫 犬用',150,150,78.00,'2026-08-10 00:00:00','2026-08-16 12:00:00'),
  (6,'福莱希伸缩牵引绳 5m',400,400,89.00,'2026-08-01 00:00:00','2026-09-01 23:59:59')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

INSERT INTO `post` (`id`,`user_id`,`author`,`title`,`body`,`images`,`likes`,`comments`) VALUES
  (1,2,'猫奴小王','圆圆第一次洗澡居然没炸毛','分享几个让猫咪不害怕的小技巧','',128,32),
  (2,3,'金毛爸爸','三岁金毛体重28kg医生说刚好','分享一下我家的喂养清单和运动量','',96,18),
  (3,2,'布偶麻麻','血常规报告怎么看一帖教会你','每个指标代表什么全部整理在这张图里','',211,47),
  (4,3,'田园小队长','领养代替购买小黑找家第30天','从流浪到信任30天的变化真的很大','',340,89)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 订单
CREATE TABLE IF NOT EXISTS `order` (
  `id` BIGINT PRIMARY KEY,
  `order_no` VARCHAR(64) NOT NULL UNIQUE,
  `user_id` BIGINT NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `status` TINYINT DEFAULT 0 COMMENT '0待支付1已支付2已取消',
  `subject` VARCHAR(128),
  `trade_no` VARCHAR(64) COMMENT '支付宝交易号',
  `pay_time` DATETIME DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 体重记录
CREATE TABLE IF NOT EXISTS `weight_record` (
  `id` BIGINT PRIMARY KEY,
  `pet_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL COMMENT '体重kg',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `note` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pet_date (`pet_id`, `record_date`),
  INDEX idx_pet (`pet_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 宠物记事本
CREATE TABLE IF NOT EXISTS `pet_note` (
  `id` BIGINT PRIMARY KEY,
  `pet_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `content` TEXT,
  `tags` VARCHAR(255) DEFAULT NULL,
  `images` VARCHAR(500) DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pet (`pet_id`),
  INDEX idx_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收货地址
CREATE TABLE IF NOT EXISTS `address` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `receiver` VARCHAR(50) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `province` VARCHAR(30) DEFAULT '',
  `city` VARCHAR(30) DEFAULT '',
  `district` VARCHAR(30) DEFAULT '',
  `detail` VARCHAR(200) NOT NULL,
  `is_default` TINYINT DEFAULT 0,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消息通知
CREATE TABLE IF NOT EXISTS `notification` (
  `id` BIGINT PRIMARY KEY,
  `user_id` BIGINT NOT NULL,
  `type` VARCHAR(30) NOT NULL COMMENT 'appointment/consult/remind/order/system',
  `title` VARCHAR(100) NOT NULL,
  `content` VARCHAR(500),
  `is_read` TINYINT DEFAULT 0,
  `ref_id` BIGINT DEFAULT NULL,
  `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_read (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 演示体重记录
INSERT INTO `weight_record` (`id`,`pet_id`,`user_id`,`weight`,`record_date`,`note`) VALUES
  (40101,10101,1,28.50,'2026-06-01',NULL),
  (40102,10101,1,28.20,'2026-06-15','轻微下降'),
  (40103,10101,1,28.50,'2026-07-01',NULL),
  (40104,10101,1,28.80,'2026-07-15','夏天胃口一般'),
  (40105,10101,1,28.50,'2026-08-01',NULL),
  (40106,10102,2,4.20,'2026-06-01',NULL),
  (40107,10102,2,4.30,'2026-07-01',NULL),
  (40108,10102,2,4.20,'2026-08-01',NULL)
ON DUPLICATE KEY UPDATE `weight`=VALUES(`weight`);

-- 演示记事本
INSERT INTO `pet_note` (`id`,`pet_id`,`user_id`,`title`,`content`,`tags`) VALUES
  (50101,10101,1,'第一次游泳','今天带圆圆去了宠物泳池，一开始很抗拒，下水后开心得不行。','趣事,夏天'),
  (50102,10101,1,'搬家注意事项','提前 2 周开始用信息素，提前 1 天收拾房间；新家要清理危险物品。','养护,搬家'),
  (50103,10102,2,'布丁绝育恢复','手术后第 3 天开始主动进食，第 7 天拆线，恢复良好。','医疗,绝育')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- ============= 全站改造 v2：新增列（裸 ALTER，靠 application.yml 的 continue-on-error 兜底） =============

ALTER TABLE `product` ADD COLUMN `spec_options` JSON DEFAULT NULL COMMENT '规格选项JSON';
ALTER TABLE `product` ADD COLUMN `sales` INT NOT NULL DEFAULT 0 COMMENT '销量';
ALTER TABLE `product` ADD COLUMN `description` TEXT COMMENT '详情';

ALTER TABLE `order` ADD COLUMN `product_id` BIGINT DEFAULT NULL;
ALTER TABLE `order` ADD COLUMN `spec_label` VARCHAR(128) DEFAULT '';
ALTER TABLE `order` ADD COLUMN `quantity` INT DEFAULT 1;

ALTER TABLE `notification` ADD COLUMN `actor_id` BIGINT DEFAULT NULL COMMENT '触发者 user_id';
ALTER TABLE `notification` ADD COLUMN `actor_nickname` VARCHAR(64) DEFAULT '';
ALTER TABLE `notification` ADD COLUMN `actor_avatar` VARCHAR(255) DEFAULT '';

-- ====== v2 种子数据（REPLACE INTO 幂等）：商品/通知/关注 ======
-- ====== 商品扩容：94 条（id 7~100），含规格 JSON ======
REPLACE INTO `product` (`id`,`name`,`price`,`old_price`,`stock`,`sales`,`image`,`tags`,`category`,`status`,`spec_options`,`description`) VALUES
  (7,'皇家猫粮',99.00,116.00,71,219,'https://picsum.photos/seed/pet91/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质皇家猫粮，严选原料，适合爱宠日常所需。'),
  (8,'渴望猫粮',106.00,124.00,74,236,'https://picsum.photos/seed/pet104/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质渴望猫粮，严选原料，适合爱宠日常所需。'),
  (9,'爱肯拿鸭肉',113.00,132.00,77,253,'https://picsum.photos/seed/pet117/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质爱肯拿鸭肉，严选原料，适合爱宠日常所需。'),
  (10,'素力高羊肉',120.00,140.00,80,270,'https://picsum.photos/seed/pet130/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质素力高羊肉，严选原料，适合爱宠日常所需。'),
  (11,'蓝爵鸡肉',127.00,148.00,83,287,'https://picsum.photos/seed/pet143/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质蓝爵鸡肉，严选原料，适合爱宠日常所需。'),
  (12,'卡比低敏',134.00,156.00,86,304,'https://picsum.photos/seed/pet156/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质卡比低敏，严选原料，适合爱宠日常所需。'),
  (13,'福摩三文鱼',51.00,74.00,89,321,'https://picsum.photos/seed/pet169/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质福摩三文鱼，严选原料，适合爱宠日常所需。'),
  (14,'诺瑞鸡肉',58.00,82.00,92,338,'https://picsum.photos/seed/pet182/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质诺瑞鸡肉，严选原料，适合爱宠日常所需。'),
  (15,'欧冠鸭肉',65.00,75.00,95,355,'https://picsum.photos/seed/pet195/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质欧冠鸭肉，严选原料，适合爱宠日常所需。'),
  (16,'凯锐思营养',72.00,83.00,98,372,'https://picsum.photos/seed/pet208/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质凯锐思营养，严选原料，适合爱宠日常所需。'),
  (17,'佩玛思特幼犬',79.00,91.00,101,389,'https://picsum.photos/seed/pet221/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质佩玛思特幼犬，严选原料，适合爱宠日常所需。'),
  (18,'优基小型犬成犬粮',86.00,99.00,104,406,'https://picsum.photos/seed/pet234/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质优基小型犬成犬粮，严选原料，适合爱宠日常所需。'),
  (19,'宝路牛肉',93.00,107.00,107,423,'https://picsum.photos/seed/pet247/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质宝路牛肉，严选原料，适合爱宠日常所需。'),
  (20,'冠能大型犬',100.00,115.00,110,440,'https://picsum.photos/seed/pet260/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质冠能大型犬，严选原料，适合爱宠日常所需。'),
  (21,'耐吉斯幼猫',107.00,123.00,113,457,'https://picsum.photos/seed/pet273/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质耐吉斯幼猫，严选原料，适合爱宠日常所需。'),
  (22,'皇家犬奶糕',114.00,131.00,116,474,'https://picsum.photos/seed/pet286/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质皇家犬奶糕，严选原料，适合爱宠日常所需。'),
  (23,'比瑞吉鲜肉',121.00,139.00,119,491,'https://picsum.photos/seed/pet299/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质比瑞吉鲜肉，严选原料，适合爱宠日常所需。'),
  (24,'艾尔鲜肉无谷',128.00,147.00,122,508,'https://picsum.photos/seed/pet312/400/400','主粮,正品','主粮',1,'[{"name":"重量","options":["1kg","2kg","5kg","10kg"]},{"name":"年龄段","options":["幼年","成年","全期"]}]','优质艾尔鲜肉无谷，严选原料，适合爱宠日常所需。'),
  (25,'冻干鸡肉粒',95.00,115.00,125,525,'https://picsum.photos/seed/pet325/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质冻干鸡肉粒，严选原料，适合爱宠日常所需。'),
  (26,'磨牙鸡肉卷',12.00,33.00,128,542,'https://picsum.photos/seed/pet338/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质磨牙鸡肉卷，严选原料，适合爱宠日常所需。'),
  (27,'三文鱼咬胶',19.00,41.00,131,559,'https://picsum.photos/seed/pet351/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质三文鱼咬胶，严选原料，适合爱宠日常所需。'),
  (28,'猫咪营养膏',26.00,49.00,134,576,'https://picsum.photos/seed/pet364/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质猫咪营养膏，严选原料，适合爱宠日常所需。'),
  (29,'化毛零食罐',33.00,57.00,137,593,'https://picsum.photos/seed/pet377/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质化毛零食罐，严选原料，适合爱宠日常所需。'),
  (30,'鸡肉鳕鱼条',40.00,50.00,140,610,'https://picsum.photos/seed/pet390/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质鸡肉鳕鱼条，严选原料，适合爱宠日常所需。'),
  (31,'蓝莓狗狗饼干',47.00,58.00,143,627,'https://picsum.photos/seed/pet403/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质蓝莓狗狗饼干，严选原料，适合爱宠日常所需。'),
  (32,'羊奶布丁',54.00,66.00,146,644,'https://picsum.photos/seed/pet416/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质羊奶布丁，严选原料，适合爱宠日常所需。'),
  (33,'鸭肉薯条脆',61.00,74.00,149,661,'https://picsum.photos/seed/pet429/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质鸭肉薯条脆，严选原料，适合爱宠日常所需。'),
  (34,'猫薄荷饼干',68.00,82.00,152,678,'https://picsum.photos/seed/pet442/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质猫薄荷饼干，严选原料，适合爱宠日常所需。'),
  (35,'小饼干训练奖励',75.00,90.00,155,695,'https://picsum.photos/seed/pet455/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质小饼干训练奖励，严选原料，适合爱宠日常所需。'),
  (36,'兔肉冻干块',82.00,98.00,158,712,'https://picsum.photos/seed/pet468/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质兔肉冻干块，严选原料，适合爱宠日常所需。'),
  (37,'鹿肉冻干',89.00,106.00,161,729,'https://picsum.photos/seed/pet481/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质鹿肉冻干，严选原料，适合爱宠日常所需。'),
  (38,'鳕鱼皮卷',96.00,114.00,164,746,'https://picsum.photos/seed/pet494/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质鳕鱼皮卷，严选原料，适合爱宠日常所需。'),
  (39,'蓝罐金枪鱼',13.00,32.00,167,763,'https://picsum.photos/seed/pet507/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质蓝罐金枪鱼，严选原料，适合爱宠日常所需。'),
  (40,'鸡胸肉丝',20.00,40.00,170,780,'https://picsum.photos/seed/pet520/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质鸡胸肉丝，严选原料，适合爱宠日常所需。'),
  (41,'羊奶粉条',27.00,48.00,173,797,'https://picsum.photos/seed/pet533/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质羊奶粉条，严选原料，适合爱宠日常所需。'),
  (42,'狗狗肉干',34.00,56.00,176,814,'https://picsum.photos/seed/pet546/400/400','零食,正品','零食',1,'[{"name":"规格","options":["100g","300g","500g","1kg"]}]','优质狗狗肉干，严选原料，适合爱宠日常所需。'),
  (43,'豆腐猫砂6L',71.00,94.00,179,831,'https://picsum.photos/seed/pet559/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质豆腐猫砂6L，严选原料，适合爱宠日常所需。'),
  (44,'膨润土猫砂10kg',78.00,102.00,182,848,'https://picsum.photos/seed/pet572/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质膨润土猫砂10kg，严选原料，适合爱宠日常所需。'),
  (45,'混合猫砂5L',85.00,95.00,185,865,'https://picsum.photos/seed/pet585/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质混合猫砂5L，严选原料，适合爱宠日常所需。'),
  (46,'松木猫砂',92.00,103.00,188,882,'https://picsum.photos/seed/pet598/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质松木猫砂，严选原料，适合爱宠日常所需。'),
  (47,'水晶猫砂',99.00,111.00,191,899,'https://picsum.photos/seed/pet611/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质水晶猫砂，严选原料，适合爱宠日常所需。'),
  (48,'水冲猫砂',106.00,119.00,194,916,'https://picsum.photos/seed/pet624/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质水冲猫砂，严选原料，适合爱宠日常所需。'),
  (49,'低尘豆腐砂',113.00,127.00,197,933,'https://picsum.photos/seed/pet637/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质低尘豆腐砂，严选原料，适合爱宠日常所需。'),
  (50,'抗菌除臭砂',120.00,135.00,200,950,'https://picsum.photos/seed/pet650/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质抗菌除臭砂，严选原料，适合爱宠日常所需。'),
  (51,'快速结团砂',127.00,143.00,203,967,'https://picsum.photos/seed/pet663/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质快速结团砂，严选原料，适合爱宠日常所需。'),
  (52,'环保降解砂',44.00,61.00,206,984,'https://picsum.photos/seed/pet676/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质环保降解砂，严选原料，适合爱宠日常所需。'),
  (53,'活性炭除臭',51.00,69.00,209,1001,'https://picsum.photos/seed/pet689/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质活性炭除臭，严选原料，适合爱宠日常所需。'),
  (54,'柠檬香豆腐砂',58.00,77.00,212,1018,'https://picsum.photos/seed/pet702/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质柠檬香豆腐砂，严选原料，适合爱宠日常所需。'),
  (55,'原味豆腐砂',65.00,85.00,215,1035,'https://picsum.photos/seed/pet715/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质原味豆腐砂，严选原料，适合爱宠日常所需。'),
  (56,'绿茶味猫砂',72.00,93.00,218,1052,'https://picsum.photos/seed/pet728/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质绿茶味猫砂，严选原料，适合爱宠日常所需。'),
  (57,'薰衣草砂',79.00,101.00,221,1069,'https://picsum.photos/seed/pet741/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质薰衣草砂，严选原料，适合爱宠日常所需。'),
  (58,'玉米砂',86.00,109.00,224,1086,'https://picsum.photos/seed/pet754/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质玉米砂，严选原料，适合爱宠日常所需。'),
  (59,'木屑猫砂',93.00,117.00,227,1103,'https://picsum.photos/seed/pet767/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质木屑猫砂，严选原料，适合爱宠日常所需。'),
  (60,'进口矿砂',100.00,110.00,230,1120,'https://picsum.photos/seed/pet780/400/400','猫砂,正品','猫砂',1,'[{"name":"规格","options":["5L","10L","20L"]},{"name":"香味","options":["原味","绿茶","柠檬","薰衣草"]}]','优质进口矿砂，严选原料，适合爱宠日常所需。'),
  (61,'拜耳内虫宁',77.00,88.00,233,1137,'https://picsum.photos/seed/pet793/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质拜耳内虫宁，严选原料，适合爱宠日常所需。'),
  (62,'犬心保驱虫',84.00,96.00,236,1154,'https://picsum.photos/seed/pet806/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质犬心保驱虫，严选原料，适合爱宠日常所需。'),
  (63,'大宠爱滴剂',91.00,104.00,239,1171,'https://picsum.photos/seed/pet819/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质大宠爱滴剂，严选原料，适合爱宠日常所需。'),
  (64,'福来恩喷剂',98.00,112.00,242,1188,'https://picsum.photos/seed/pet832/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质福来恩喷剂，严选原料，适合爱宠日常所需。'),
  (65,'拜耳拜宠清',15.00,30.00,245,1205,'https://picsum.photos/seed/pet845/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质拜耳拜宠清，严选原料，适合爱宠日常所需。'),
  (66,'海乐妙幼猫',22.00,38.00,248,1222,'https://picsum.photos/seed/pet858/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质海乐妙幼猫，严选原料，适合爱宠日常所需。'),
  (67,'妙巴驱虫项圈',29.00,46.00,51,1239,'https://picsum.photos/seed/pet871/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质妙巴驱虫项圈，严选原料，适合爱宠日常所需。'),
  (68,'犬体内驱虫片',36.00,54.00,54,1256,'https://picsum.photos/seed/pet884/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质犬体内驱虫片，严选原料，适合爱宠日常所需。'),
  (69,'猫体内外一体',43.00,62.00,57,1273,'https://picsum.photos/seed/pet897/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质猫体内外一体，严选原料，适合爱宠日常所需。'),
  (70,'幼犬驱虫糖浆',50.00,70.00,60,1290,'https://picsum.photos/seed/pet910/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质幼犬驱虫糖浆，严选原料，适合爱宠日常所需。'),
  (71,'爱沃克滴剂',57.00,78.00,63,1307,'https://picsum.photos/seed/pet923/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质爱沃克滴剂，严选原料，适合爱宠日常所需。'),
  (72,'莫爱佳滴剂',64.00,86.00,66,1324,'https://picsum.photos/seed/pet936/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质莫爱佳滴剂，严选原料，适合爱宠日常所需。'),
  (73,'诺普星驱虫',71.00,94.00,69,1341,'https://picsum.photos/seed/pet949/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质诺普星驱虫，严选原料，适合爱宠日常所需。'),
  (74,'金盾爱滴爽',78.00,102.00,72,1358,'https://picsum.photos/seed/pet962/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质金盾爱滴爽，严选原料，适合爱宠日常所需。'),
  (75,'体外喷剂驱虫',85.00,95.00,75,1375,'https://picsum.photos/seed/pet975/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质体外喷剂驱虫，严选原料，适合爱宠日常所需。'),
  (76,'体内驱虫糖',92.00,103.00,78,1392,'https://picsum.photos/seed/pet988/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质体内驱虫糖，严选原料，适合爱宠日常所需。'),
  (77,'驱虫组合套装',99.00,111.00,81,1409,'https://picsum.photos/seed/pet1/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质驱虫组合套装，严选原料，适合爱宠日常所需。'),
  (78,'幼猫驱虫',16.00,29.00,84,1426,'https://picsum.photos/seed/pet14/400/400','驱虫,正品','驱虫',1,'[{"name":"规格","options":["1支","3支装","6支装"]},{"name":"适用","options":["猫","狗","通用"]}]','优质幼猫驱虫，严选原料，适合爱宠日常所需。'),
  (79,'逗猫棒羽毛',23.00,37.00,87,1443,'https://picsum.photos/seed/pet27/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质逗猫棒羽毛，严选原料，适合爱宠日常所需。'),
  (80,'猫爬架三层',30.00,45.00,90,1460,'https://picsum.photos/seed/pet40/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质猫爬架三层，严选原料，适合爱宠日常所需。'),
  (81,'激光逗猫笔',37.00,53.00,93,1477,'https://picsum.photos/seed/pet53/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质激光逗猫笔，严选原料，适合爱宠日常所需。'),
  (82,'磨爪剑麻柱',44.00,61.00,96,1494,'https://picsum.photos/seed/pet66/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质磨爪剑麻柱，严选原料，适合爱宠日常所需。'),
  (83,'自动弹球玩具',51.00,69.00,99,1511,'https://picsum.photos/seed/pet79/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质自动弹球玩具，严选原料，适合爱宠日常所需。'),
  (84,'猫咪隧道',58.00,77.00,102,1528,'https://picsum.photos/seed/pet92/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质猫咪隧道，严选原料，适合爱宠日常所需。'),
  (85,'发声老鼠玩具',65.00,85.00,105,1545,'https://picsum.photos/seed/pet105/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质发声老鼠玩具，严选原料，适合爱宠日常所需。'),
  (86,'猫薄荷球',72.00,93.00,108,1562,'https://picsum.photos/seed/pet118/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质猫薄荷球，严选原料，适合爱宠日常所需。'),
  (87,'啃咬咬胶绳',79.00,101.00,111,1579,'https://picsum.photos/seed/pet131/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质啃咬咬胶绳，严选原料，适合爱宠日常所需。'),
  (88,'飞盘狗狗玩具',86.00,109.00,114,1596,'https://picsum.photos/seed/pet144/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质飞盘狗狗玩具，严选原料，适合爱宠日常所需。'),
  (89,'拔河玩具绳',93.00,117.00,117,1613,'https://picsum.photos/seed/pet157/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质拔河玩具绳，严选原料，适合爱宠日常所需。'),
  (90,'球形漏食球',10.00,20.00,120,1630,'https://picsum.photos/seed/pet170/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质球形漏食球，严选原料，适合爱宠日常所需。'),
  (91,'橡胶骨头',17.00,28.00,123,1647,'https://picsum.photos/seed/pet183/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质橡胶骨头，严选原料，适合爱宠日常所需。'),
  (92,'漏食球智趣',24.00,36.00,126,1664,'https://picsum.photos/seed/pet196/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质漏食球智趣，严选原料，适合爱宠日常所需。'),
  (93,'猫抓板瓦楞',31.00,44.00,129,1681,'https://picsum.photos/seed/pet209/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质猫抓板瓦楞，严选原料，适合爱宠日常所需。'),
  (94,'秋千猫爬架',38.00,52.00,132,1698,'https://picsum.photos/seed/pet222/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质秋千猫爬架，严选原料，适合爱宠日常所需。'),
  (95,'旋转发光球',45.00,60.00,135,1715,'https://picsum.photos/seed/pet235/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质旋转发光球，严选原料，适合爱宠日常所需。'),
  (96,'嗅觉寻宝垫',52.00,68.00,138,1732,'https://picsum.photos/seed/pet248/400/400','玩具,正品','玩具',1,'[{"name":"颜色","options":["粉色","蓝色","黄色","随机"]}]','优质嗅觉寻宝垫，严选原料，适合爱宠日常所需。'),
  (97,'不锈钢食盆',59.00,76.00,141,1749,'https://picsum.photos/seed/pet261/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质不锈钢食盆，严选原料，适合爱宠日常所需。'),
  (98,'宠物慢食碗',66.00,84.00,144,1766,'https://picsum.photos/seed/pet274/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物慢食碗，严选原料，适合爱宠日常所需。'),
  (99,'伸缩牵引绳',73.00,92.00,147,1783,'https://picsum.photos/seed/pet287/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质伸缩牵引绳，严选原料，适合爱宠日常所需。'),
  (100,'胸背带套装',80.00,100.00,150,1800,'https://picsum.photos/seed/pet300/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质胸背带套装，严选原料，适合爱宠日常所需。');
  (101,'航空箱',87.00,108.00,153,1817,'https://picsum.photos/seed/pet313/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质航空箱，严选原料，适合爱宠日常所需。'),
  (102,'猫窝毛绒',94.00,116.00,156,1834,'https://picsum.photos/seed/pet326/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质猫窝毛绒，严选原料，适合爱宠日常所需。'),
  (103,'狗狗雨衣',11.00,34.00,159,1851,'https://picsum.photos/seed/pet339/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质狗狗雨衣，严选原料，适合爱宠日常所需。'),
  (104,'自动饮水机',18.00,42.00,162,1868,'https://picsum.photos/seed/pet352/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质自动饮水机，严选原料，适合爱宠日常所需。'),
  (105,'宠物剃毛器',25.00,35.00,165,1885,'https://picsum.photos/seed/pet365/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物剃毛器，严选原料，适合爱宠日常所需。'),
  (106,'宠物指甲剪',32.00,43.00,168,1902,'https://picsum.photos/seed/pet378/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物指甲剪，严选原料，适合爱宠日常所需。'),
  (107,'吸毛器滚刷',39.00,51.00,171,1919,'https://picsum.photos/seed/pet391/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质吸毛器滚刷，严选原料，适合爱宠日常所需。'),
  (108,'宠物吹水机',46.00,59.00,174,1936,'https://picsum.photos/seed/pet404/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物吹水机，严选原料，适合爱宠日常所需。'),
  (109,'宠物尿垫',53.00,67.00,177,1953,'https://picsum.photos/seed/pet417/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物尿垫，严选原料，适合爱宠日常所需。'),
  (110,'封闭式猫砂盆',60.00,75.00,180,1970,'https://picsum.photos/seed/pet430/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质封闭式猫砂盆，严选原料，适合爱宠日常所需。'),
  (111,'双层食盆架',67.00,83.00,183,1987,'https://picsum.photos/seed/pet443/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质双层食盆架，严选原料，适合爱宠日常所需。'),
  (112,'宠物浴液',74.00,91.00,186,2004,'https://picsum.photos/seed/pet456/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物浴液，严选原料，适合爱宠日常所需。'),
  (113,'宠物牙刷',81.00,99.00,189,2021,'https://picsum.photos/seed/pet469/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质宠物牙刷，严选原料，适合爱宠日常所需。'),
  (114,'消毒除味剂',88.00,107.00,192,2038,'https://picsum.photos/seed/pet482/400/400','用品,正品','用品',1,'[{"name":"规格","options":["小号","中号","大号"]}]','优质消毒除味剂，严选原料，适合爱宠日常所需。'),

-- ====== 消息分组通知（收件人 user_id=2087538000000000000） ======
REPLACE INTO `notification` (`id`,`user_id`,`type`,`title`,`content`,`is_read`,`ref_id`,`actor_id`,`actor_nickname`,`actor_avatar`,`create_time`) VALUES
  (500001,2087538000000000000,'health','布丁疫苗到期提醒','布丁的狂犬疫苗将于 7 天后到期，请及时预约接种。',0,1,NULL,'','',NOW() - INTERVAL 0 HOUR),
  (500002,2087538000000000000,'health','米米体重异常','米米本月体重下降 0.4kg，建议关注饮食。',0,2,NULL,'','',NOW() - INTERVAL 6 HOUR),
  (500003,2087538000000000000,'health','球球驱虫提醒','距离上次驱虫已 28 天，建议进行体内驱虫。',0,3,NULL,'','',NOW() - INTERVAL 12 HOUR);
REPLACE INTO `notification` (`id`,`user_id`,`type`,`title`,`content`,`is_read`,`ref_id`,`actor_id`,`actor_nickname`,`actor_avatar`,`create_time`) VALUES
  (500100,2087538000000000000,'private','宠友7202 私信你','你好，方便分享下布丁的口粮链接吗？',0,NULL,2087538000000000001,'宠友7202','',NOW() - INTERVAL 0 HOUR),
  (500101,2087538000000000000,'private','宠友7385 私信你','上次提到的宠物医院我也预约了，谢谢推荐！',0,NULL,2087538000000000002,'宠友7385','',NOW() - INTERVAL 3 HOUR),
  (500102,2087538000000000000,'private','宠友9904 私信你','我家也有同样症状，要不要视频问诊一下？',0,NULL,2087538000000000003,'宠友9904','',NOW() - INTERVAL 6 HOUR),
  (500103,2087538000000000000,'private','宠友1233 私信你','同城约个宠物咖啡厅吗？我带球球一起。',0,NULL,2087538000000000004,'宠友1233','',NOW() - INTERVAL 9 HOUR),
  (500104,2087538000000000000,'private','宠友5657 私信你','你发的那款冻干我也买了，确实不错。',0,NULL,2087538000000000005,'宠友5657','',NOW() - INTERVAL 12 HOUR);
REPLACE INTO `notification` (`id`,`user_id`,`type`,`title`,`content`,`is_read`,`ref_id`,`actor_id`,`actor_nickname`,`actor_avatar`,`create_time`) VALUES
  (500200,2087538000000000000,'follow','宠友7052 关注了你','点击查看 TA 的主页',0,NULL,2087538000000000006,'宠友7052','',NOW() - INTERVAL 0 HOUR),
  (500201,2087538000000000000,'follow','宠友4117 关注了你','点击查看 TA 的主页',0,NULL,2087538000000000007,'宠友4117','',NOW() - INTERVAL 5 HOUR),
  (500202,2087538000000000000,'follow','宠友4833 关注了你','点击查看 TA 的主页',0,NULL,2087538000000000008,'宠友4833','',NOW() - INTERVAL 10 HOUR),
  (500203,2087538000000000000,'follow','宠友5400 关注了你','点击查看 TA 的主页',0,NULL,2087538000000000009,'宠友5400','',NOW() - INTERVAL 15 HOUR);

-- ====== 关注关系（10 条，表 follow） ======
REPLACE INTO `follow` (`follower`,`followee`,`create_time`) VALUES
  (2087538000000000000,2087538000000000001,NOW() - INTERVAL 0 HOUR),
  (2087538000000000000,2087538000000000002,NOW() - INTERVAL 1 HOUR),
  (2087538000000000000,2087538000000000003,NOW() - INTERVAL 2 HOUR),
  (2087538000000000000,2087538000000000006,NOW() - INTERVAL 3 HOUR),
  (2087538000000000000,2087538000000000007,NOW() - INTERVAL 4 HOUR),
  (2087538000000000000,2087538000000000008,NOW() - INTERVAL 5 HOUR),
  (2087538000000000000,2087538000000000009,NOW() - INTERVAL 6 HOUR),
  (2087538000000000001,2087538000000000000,NOW() - INTERVAL 7 HOUR),
  (2087538000000000002,2087538000000000000,NOW() - INTERVAL 8 HOUR),
  (2087538000000000003,2087538000000000000,NOW() - INTERVAL 9 HOUR);
