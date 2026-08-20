import { useEffect, useRef } from 'react'

// useReveal：IntersectionObserver 驱动的一次性揭示
// 给元素 ref 后，进入视口加 .is-visible（css 处理透明度+位移）
// 规范来源：ui-ux-pro-max motion preset #4（Scroll Reveal Subtle，power1.out）
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            entry.target.classList.remove('is-visible')
          }
        }
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])
  return ref
}
