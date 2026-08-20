/**
 * 萌宠之家 · 宠物图片爬虫 v2（干净图源版）
 *
 * 图源（全部官方策展，不含社区乱传图）：
 *   狗：dog.ceo  按品种全量拉取，URL 形如 images.dog.ceo/breeds/hound-afghan/xxx.jpg（自带品种，铁定是狗）
 *   猫：TheCatAPI 官方策展，只取 jpg/png
 *
 * 不再用 cataas（社区上传，混入大量非猫风景/表情包，这是上一版出问题的根源）。
 *
 * 输出：替换三个文件夹，命名数量不变，并生成 _source_manifest.json 供逐张核对来源。
 *
 *   内容社区_话题精选区_话题照片   topic-001.jpg .. topic-100.jpg  (100)
 *   内容社区_领养专区_领养宠物图片  adopt-001.jpg .. adopt-050.jpg   (50)
 *   内容社区_问答区_头像           avatar-001.jpg .. avatar-050.jpg  (50)
 *
 * 运行： node crawl_pets.js   （Node 22+ 内置 fetch）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PICTURE_DIR = __dirname;
const TASKS = [
  { dir: '内容社区_话题精选区_话题照片',   prefix: 'topic',  count: 100, ext: '.jpg' },
  { dir: '内容社区_领养专区_领养宠物图片',  prefix: 'adopt',  count: 50,  ext: '.jpg' },
  { dir: '内容社区_问答区_头像',           prefix: 'avatar', count: 50,  ext: '.jpg' },
];
const TOTAL = TASKS.reduce((s, t) => s + t.count, 0); // 200

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function seededShuffle(arr, seed = 20260814) {
  let s = seed >>> 0;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 0x100000000; };
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// 解析 JPEG SOF0 拿宽高，过滤过小/异常图
function jpegSize(buf) {
  // FF D8 ... FF E0/FE ... FF C0 (SOF0) 段中含 8 位精度 + 2字节高 + 2字节宽
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xC0 || marker === 0xC2) { // SOF0 / SOF2
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return { w, h };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

// ---------- 图源：dog.ceo ----------
async function fetchDogPool() {
  const out = [];
  const r = await fetch('https://dog.ceo/api/breeds/list/all');
  const d = await r.json();
  const breeds = Object.keys(d.message || {});
  console.log(`[dog.ceo] 品种 ${breeds.length} 个，逐品种拉图...`);
  await mapLimit(breeds, 8, async (breed) => {
    try {
      const rr = await fetch(`https://dog.ceo/api/breed/${breed}/images`);
      const dd = await rr.json();
      if (Array.isArray(dd.message)) {
        for (const u of dd.message) {
          if (/\.jpg$/i.test(u)) out.push({ url: u, kind: 'dog', breed });
        }
      }
    } catch (e) { /* 品种失败跳过 */ }
  });
  console.log(`[dog.ceo] 获得狗图候选 ${out.length} 张`);
  return out;
}

// ---------- 图源：TheCatAPI（官方策展） ----------
async function fetchCatPool(target = 160) {
  const out = [];
  let tries = 0;
  const seen = new Set();
  while (out.length < target && tries < 40) {
    tries++;
    try {
      const r = await fetch('https://api.thecatapi.com/v1/images/search?limit=10&mime_types=jpg,png');
      const d = await r.json();
      if (!Array.isArray(d) || d.length === 0) { await sleep(500); continue; }
      for (const c of d) {
        if (c && c.url && !seen.has(c.url)) {
          seen.add(c.url);
          out.push({ url: c.url, kind: 'cat' });
        }
      }
    } catch (e) { await sleep(500); }
  }
  console.log(`[TheCatAPI] 获得猫图候选 ${out.length} 张`);
  return out;
}

// ---------- 下载 ----------
async function downloadOne(item, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const r = await fetch(item.url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 3000) throw new Error('过小 ' + buf.length + 'B');
      const sz = jpegSize(buf);
      if (!sz) throw new Error('无法解析尺寸');
      if (sz.w < 200 || sz.h < 200) throw new Error(`尺寸过小 ${sz.w}x${sz.h}`);
      return { buf, sz };
    } catch (e) {
      if (attempt < retries) { await sleep(500 * (attempt + 1)); continue; }
      return null;
    }
  }
  return null;
}

async function mapLimit(items, limit, worker) {
  let idx = 0;
  async function run() { while (idx < items.length) { const i = idx++; await worker(items[i], i); } }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

// 头像偏好方形；dog.ceo/cataas 原图多为矩形，这里不做裁剪（直接用原图，头像组件会 object-fit 裁）
// ---------- 主流程 ----------
async function main() {
  console.log(`需要宠物图片 ${TOTAL} 张（dog.ceo 狗 + TheCatAPI 猫，均为官方策展）`);

  const [dogs, cats] = await Promise.all([fetchDogPool(), fetchCatPool(160)]);
  if (dogs.length + cats.length < TOTAL + 40) {
    throw new Error(`图源候选不足：${dogs.length + cats.length}，需 ≥ ${TOTAL + 40}`);
  }

  // 去重 + 洗牌，目标比例：约 60% 狗 40% 猫，保证两类都进各文件夹
  const seen = new Set();
  const dogPool = seededShuffle(dogs.filter((x) => !seen.has(x.url) && seen.add(x.url)));
  const catPool = seededShuffle(cats.filter((x) => !seen.has(x.url) && seen.add(x.url)));
  // 交错合并：狗猫穿插
  const pool = [];
  const di = dogPool[Symbol.iterator](), ci = catPool[Symbol.iterator]();
  while (pool.length < TOTAL + 60) {
    const dv = di.next(); if (!dv.done) pool.push(dv.value);
    const cv = ci.next(); if (!cv.done) pool.push(cv.value);
    if (dv.done && cv.done) break;
  }
  console.log(`总池 ${pool.length} 张（狗 ${dogPool.length} / 猫 ${catPool.length}），开始替换下载`);

  // 清空旧图
  for (const t of TASKS) {
    const dir = path.join(PICTURE_DIR, t.dir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      if (/\.(jpe?g|png|webp|gif)$/i.test(f)) fs.unlinkSync(path.join(dir, f));
    }
  }
  console.log('已清空三个文件夹旧图');

  const manifest = {};
  let cursor = 0, fail = 0;
  for (const t of TASKS) {
    const dir = path.join(PICTURE_DIR, t.dir);
    const jobs = [];
    for (let i = 0; i < t.count; i++) {
      const name = `${t.prefix}-${String(i + 1).padStart(3, '0')}${t.ext}`;
      jobs.push({ name });
    }
    await mapLimit(jobs, 6, async (job, idx) => {
      let cur = null, res = null;
      while (cursor < pool.length) { cur = pool[cursor++]; res = await downloadOne(cur); if (res) break; fail++; }
      if (!res) { console.error(`[跳过] ${job.name} 无可用图`); fail++; return; }
      fs.writeFileSync(path.join(dir, job.name), res.buf);
      manifest[`${t.dir}/${job.name}`] = { url: cur.url, kind: cur.kind, breed: cur.breed || null, size: `${res.sz.w}x${res.sz.h}` };
      if (((idx + 1) % 10) === 0) console.log(`[${t.prefix}] ${idx + 1}/${t.count}`);
    });
    console.log(`[${t.prefix}] 完成 ${t.count} 张 -> ${t.dir}`);
  }

  fs.writeFileSync(path.join(PICTURE_DIR, '_source_manifest.json'),
    JSON.stringify(manifest, null, 2));
  console.log(`\n完成。失败/换源 ${fail} 次。来源清单已写 _source_manifest.json（可逐张核对：breeds/xxx=狗，thecatapi=猫）`);
}

main().catch((e) => { console.error('爬虫出错:', e); process.exit(1); });
