import { useMemo } from 'react'
import { petAvatar } from '../data/petImages.js'

// FloatingPets · 浮动宠物装饰
// ---------------------------------------------------------------
// 设计来源：ui-ux-pro-max Claymorphism + Aurora UI
//  - 多个胖乎乎的有机 blob（柔光、模糊、缓动）作为背景氛围
//  - 一组真实宠物实拍小图缓慢上浮 + 轻微旋转（替代旧版 emoji 装饰）
//  - 全部 pointer-events-none、aria-hidden，绝对定位，不影响交互与可访问性
//  - 尊重 prefers-reduced-motion（global css 处理）
// ---------------------------------------------------------------

const BLOBS = [
  { top: '-8%',  left: '-10%', size: 360, color: '#FFD6BA', delay: '0s',   dur: '10s' },
  { top: '20%',  left: '85%',  size: 280, color: '#B8F2D8', delay: '2s',   dur: '12s' },
  { top: '70%',  left: '-8%',  size: 320, color: '#BBE3FF', delay: '4s',   dur: '11s' },
  { top: '85%',  left: '75%',  size: 240, color: '#E3D4FF', delay: '1.5s', dur: '13s' },
  { top: '45%',  left: '50%',  size: 200, color: '#FFF3B0', delay: '3s',   dur: '14s' }
]

// 漂浮的真实宠物实拍小图（替代 emoji 装饰，按用户要求"多用真实拍摄宠物图片"）
// tags 为空时随机走 happy/puppy|happy/kitten 等实拍池
const FLOATERS = [
  { tags: 'dog,cute,portrait', style: { top: '8%',  left: '6%',   size: 56 }, anim: 'float-y', delay: '0s' },
  { tags: 'cat,cute,portrait', style: { top: '14%', left: '88%',  size: 52 }, anim: 'float-y', delay: '0.7s' },
  { tags: 'dog,puppy,happy',   style: { top: '38%', left: '92%',  size: 40 }, anim: 'paw-drift', delay: '1.4s' },
  { tags: 'cat,kitten',        style: { top: '68%', left: '4%',   size: 42 }, anim: 'float-y', delay: '0.4s' },
  { tags: 'dog,golden,happy',  style: { top: '82%', left: '88%',  size: 50 }, anim: 'float-y', delay: '1s' },
  { tags: 'cat,tabby',         style: { top: '54%', left: '2%',   size: 46 }, anim: 'paw-drift', delay: '2s' },
  { tags: 'dog,corgi',         style: { top: '24%', left: '46%',  size: 38 }, anim: 'float-y', delay: '1.6s' },
  { tags: 'cat,orange',        style: { top: '72%', left: '52%',  size: 42 }, anim: 'float-y', delay: '0.3s' }
]

export default function FloatingPets({ density = 'normal' }) {
  // density = 'sparse' 用于局部区域（如 Hero），'normal' 用于首页装饰
  const blobs = useMemo(() => density === 'sparse' ? BLOBS.slice(0, 3) : BLOBS, [density])
  const floaters = useMemo(() => density === 'sparse' ? FLOATERS.slice(0, 4) : FLOATERS, [density])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* 柔光 blob 背景层：模糊的大色斑，缓慢变形 */}
      {blobs.map((b, i) => (
        <div
          key={`blob-${i}`}
          className="mesh-dot animate-blob absolute"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.color,
            borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%',
            animationDelay: b.delay,
            animationDuration: b.dur,
            filter: 'blur(60px)',
            opacity: 0.55
          }}
        />
      ))}

      {/* 漂浮的真实宠物实拍小图（圆形剪裁） */}
      {floaters.map((f, i) => (
        <div
          key={`float-${i}`}
          className={`animate-${f.anim} absolute select-none`}
          style={{
            ...f.style,
            width: f.style.size,
            height: f.style.size,
            animationDelay: f.delay,
            animationDuration: f.anim === 'paw-drift' ? '4s' : '3.5s',
            filter: 'drop-shadow(0 6px 12px rgba(31,41,55,0.12))',
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: '0 8px 20px -6px rgba(31,41,55,0.18)'
          }}
        >
          <img
            src={petAvatar(f.tags, f.style.size * 2, i)}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
          />
        </div>
      ))}
    </div>
  )
}

// === 局部用的"宠物标签云"——挂在某一块卡片角落作为装饰 ===
// 改用真实宠物实拍小图（圆形），默认尺寸 32
export function PetBubble({ tags = 'dog,cute,portrait', size = 32, className = '', seed = 0 }) {
  return (
    <div
      className={`inline-flex items-center justify-center animate-bounce-soft overflow-hidden rounded-full ring-2 ring-white/80 shadow-clay-sm ${className}`}
      style={{
        width: size,
        height: size
      }}
      aria-hidden
    >
      <img
        src={petAvatar(tags, size * 2, seed)}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.parentElement.style.display = 'none' }}
      />
    </div>
  )
}
