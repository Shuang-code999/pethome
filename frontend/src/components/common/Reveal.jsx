import { useReveal } from '../../hooks/useReveal'

// <Reveal delay={1} as="div"> ...children </Reveal>
// 给子节点加滚动揭示：进入视口后渐显 + 上移
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useReveal()
  const delayCls = delay ? `reveal-delay-${Math.min(Math.max(delay, 1), 5)}` : ''
  return (
    <Tag ref={ref} className={`reveal ${delayCls} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
