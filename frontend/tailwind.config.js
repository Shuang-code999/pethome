/** @type {import('tailwindcss').Config} */
// 设计系统来源：ui-ux-pro-max skill
//   风格：Claymorphism（软糯 3D、胖乎乎、厚边、双重柔影、圆角 16-24px）
//   配色：Pet Tech App #23（活泼橙 + 信任蓝），叠加可爱 pastel 辅色
//   字体：Fredoka（展示）+ Nunito（正文）— Playful Creative 配对
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'PingFang SC', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          // 活泼橙：主品牌色
          DEFAULT: '#FF7A59',
          50: '#FFF1EC',
          100: '#FFE0D4',
          200: '#FFCBB8',
          300: '#FFB099',
          400: '#FF9474',
          500: '#FF7A59',
          600: '#F2613E',
          700: '#CC4A2C',
          800: '#A53A22'
        },
        health: {
          // 信任青：健康/医疗
          DEFAULT: '#2EC4B6',
          50: '#E6FAF8',
          100: '#C4F3EE',
          500: '#2EC4B6',
          600: '#1FA89C'
        },
        trust: {
          // 信任蓝：问诊/保险
          DEFAULT: '#2563EB',
          50: '#EFF4FF',
          100: '#DCE8FF',
          500: '#2563EB',
          600: '#1D4ED8'
        },
        // 可爱 pastel 辅色：用于装饰 / 浮动元素
        peach: '#FFD6BA',
        mint: '#B8F2D8',
        sky: '#BBE3FF',
        lilac: '#E3D4FF',
        lemon: '#FFF3B0',
        rose: '#FFC9DC',
        ink: {
          900: '#1F2937',
          800: '#2A3340',
          700: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#FAFBFC'
        }
      },
      borderRadius: {
        xl2: '12px',
        clay: '20px',    // Claymorphism 标准圆角
        claylg: '28px',
        blob: '42% 58% 63% 37% / 41% 44% 56% 59%' // 有机 blob 形状
      },
      transitionDuration: {
        DEFAULT: '200ms',
        350: '350ms',
        500: '500ms'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 8px 24px rgba(0,0,0,0.10)',
        // Claymorphism 双重柔影：外凸 + 内陷，软糯 3D 感
        clay: '7px 7px 16px rgba(214,198,184,0.55), -7px -7px 16px rgba(255,255,255,0.9)',
        'clay-sm': '4px 4px 10px rgba(214,198,184,0.45), -4px -4px 10px rgba(255,255,255,0.85)',
        'clay-press': 'inset 4px 4px 10px rgba(214,198,184,0.5), inset -4px -4px 10px rgba(255,255,255,0.85)',
        'clay-hover': '10px 10px 22px rgba(214,198,184,0.6), -10px -10px 22px rgba(255,255,255,1)',
        // 彩色柔光（卡片悬浮着色）
        glow: '0 10px 30px -8px rgba(255,122,89,0.45)',
        'glow-health': '0 10px 30px -8px rgba(46,196,182,0.45)',
        'glow-trust': '0 10px 30px -8px rgba(37,99,235,0.35)'
      },
      maxWidth: {
        page: '1600px',
        // 内容中心：比 page 窄，左右各留更多空白
        content: '1120px'
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(4deg)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-6deg)' },
          '50%': { transform: 'rotate(6deg)' }
        },
        pawDrift: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.5' },
          '50%': { transform: 'translateY(-18px) rotate(8deg)', opacity: '0.85' },
          '100%': { transform: 'translateY(0) rotate(0deg)', opacity: '0.5' }
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        // 滚动揭示：透明 + 上移 → 显现（ui-ux-pro-max motion preset #4，power1.out 等效）
        revealUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        // 胖乎乎弹性入场（claymorphism bounce）
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85) translateY(12px)' },
          '70%': { opacity: '1', transform: 'scale(1.03) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        // Aurora 极光渐变流动（8-12s，来自 Aurora UI 风格 #10）
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        // Blob 有机形变（漂浮装饰用）
        blob: {
          '0%, 100%': { borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%' },
          '34%': { borderRadius: '63% 37% 41% 59% / 56% 59% 41% 44%' },
          '67%': { borderRadius: '37% 63% 59% 41% / 44% 41% 59% 56%' }
        },
        // 慢速旋转（浮动装饰）
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        // 横向漂浮（云朵 / 宠物横移）
        driftX: {
          '0%': { transform: 'translateX(-10vw)' },
          '100%': { transform: 'translateX(110vw)' }
        },
        // 心跳脉冲（提醒 / 健康）
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.12)' },
          '30%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.08)' },
          '60%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'float-y': 'floatY 3s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2.4s ease-in-out infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
        'paw-drift': 'pawDrift 4s ease-in-out infinite',
        'marquee-track': 'marquee 30s linear infinite',
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        'reveal-up': 'revealUp 0.5s ease-out both',
        'pop-in': 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        aurora: 'aurora 12s ease-in-out infinite',
        blob: 'blob 8s ease-in-out infinite',
        'spin-slow': 'spinSlow 24s linear infinite',
        'drift-x': 'driftX 28s linear infinite',
        heartbeat: 'heartbeat 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
