/* eslint-disable */
/**
 * 批量瘦身 frontend/public/assets 下的图片
 * - JPG：最大宽 1280px，mozjpeg q80，渐进式
 * - PNG：最大宽 1280px，压缩等级 9（保留透明通道）
 * - WEBP：最大宽 1280px，q80
 * 只缩小不放大（withoutEnlargement），原地覆盖。
 *
 * 运行：node scripts/shrink-images.js
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const ROOT = path.resolve(__dirname, '..', 'public', 'assets')
const MAX_WIDTH = 1280
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (EXTS.has(path.extname(name).toLowerCase())) out.push(full)
  }
  return out
}

;(async () => {
  const files = walk(ROOT)
  if (!files.length) { console.log('没有可处理的图片'); return }

  let beforeTotal = 0, afterTotal = 0, count = 0
  for (const file of files) {
    const before = fs.statSync(file).size
    try {
      const buf = await sharp(file)
        .resize({ width: MAX_WIDTH, height: undefined, fit: 'inside', withoutEnlargement: true })
      const ext = path.extname(file).toLowerCase()
      let out
      if (ext === '.jpg' || ext === '.jpeg') {
        out = await buf.jpeg({ quality: 80, mozjpeg: true, progressive: true }).toBuffer()
      } else if (ext === '.png') {
        out = await buf.png({ compressionLevel: 9 }).toBuffer()
      } else {
        out = await buf.webp({ quality: 80 }).toBuffer()
      }
      // 只在新文件更小时覆盖（避免个别本来就小的图被重编码变大）
      if (out.length < before) {
        await sharp(out).toFile(file + '.tmp')
        fs.renameSync(file + '.tmp', file)
        afterTotal += out.length
        beforeTotal += before
        count++
        if (out.length < before * 0.5 || before > 1_000_000) {
          console.log(`${path.relative(ROOT, file)}  ${(before / 1048576).toFixed(2)}MB -> ${(out.length / 1048576).toFixed(2)}MB`)
        }
      } else {
        afterTotal += before
        beforeTotal += before
      }
    } catch (e) {
      console.warn(`跳过 ${path.relative(ROOT, file)}: ${e.message}`)
      afterTotal += fs.statSync(file).size
      beforeTotal += fs.statSync(file).size
    }
    if (++count % 50 === 0) console.log(`已处理 ${count}/${files.length}`)
  }

  const saved = beforeTotal - afterTotal
  console.log(`\n完成：处理 ${count} 张，${(beforeTotal / 1048576).toFixed(1)}MB -> ${(afterTotal / 1048576).toFixed(1)}MB，节省 ${(saved / 1048576).toFixed(1)}MB (${((saved / beforeTotal) * 100).toFixed(1)}%)`)
})()
