import { useState } from 'react'

// 图片组件：加载中显示 shimmer 骨架（防布局抖动），失败回退到萌系渐变占位
// className 仅用于容器尺寸定位；图片始终 object-cover 撑满
export default function PetImg({ src, alt = '', className = '', fallbackText = '' }) {
  const [err, setErr] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (err || !src) {
    return (
      <div className={`img-fallback flex items-center justify-center text-brand-500 font-bold overflow-hidden ${className}`}>
        <span className="text-2xl opacity-50">{fallbackText || (alt ? alt[0] : '🐾')}</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setErr(true)}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
