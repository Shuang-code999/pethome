// 装饰性猫爪/狗爪 SVG（非 emoji），在 Banner 背景飘动
import { PawPrint } from 'lucide-react'

// 飘动的小爪印群
export default function PawDecor() {
  // 几个固定位置 + 不同延迟的飘动爪印
  const paws = [
    { top: '12%', left: '8%', size: 28, color: '#fff', opacity: 0.35, delay: '0s', dur: '4s' },
    { top: '70%', left: '18%', size: 22, color: '#fff', opacity: 0.3, delay: '0.8s', dur: '5s' },
    { top: '30%', left: '45%', size: 36, color: '#fff', opacity: 0.25, delay: '1.4s', dur: '4.5s' },
    { top: '78%', left: '60%', size: 24, color: '#fff', opacity: 0.3, delay: '2s', dur: '3.8s' },
    { top: '18%', left: '70%', size: 30, color: '#fff', opacity: 0.28, delay: '2.6s', dur: '5.2s' }
  ]
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {paws.map((p, i) => (
        <div
          key={i}
          className="paw-drift"
          style={{
            position: 'absolute',
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.dur,
            opacity: p.opacity
          }}
        >
          <PawPrint size={p.size} color={p.color} strokeWidth={2.2} />
        </div>
      ))}
      {/* 大半透明背景爪印 */}
      <div className="absolute -bottom-6 -right-4 opacity-10 wiggle" style={{ animationDuration: '6s' }}>
        <PawPrint size={160} color="#fff" strokeWidth={1.5} />
      </div>
    </div>
  )
}
