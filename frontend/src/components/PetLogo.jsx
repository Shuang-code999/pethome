// SVG 萌宠 Logo（非 emoji，符合 ui-ux-pro-max 规范）
export default function PetLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#FFE0D4" />
      {/* 耳朵 */}
      <path d="M14 16c-2-4-6-4-7 0c-1 3 1 6 4 7c1-3 2-5 3-7z" fill="#FF7A59"/>
      <path d="M34 16c2-4 6-4 7 0c1 3-1 6-4 7c-1-3-2-5-3-7z" fill="#FF7A59"/>
      {/* 脸 */}
      <ellipse cx="24" cy="28" rx="13" ry="11" fill="#FF7A59"/>
      {/* 眼睛 */}
      <circle cx="19" cy="27" r="2.2" fill="#1F2937"/>
      <circle cx="29" cy="27" r="2.2" fill="#1F2937"/>
      <circle cx="19.6" cy="26.4" r="0.7" fill="#fff"/>
      <circle cx="29.6" cy="26.4" r="0.7" fill="#fff"/>
      {/* 鼻子 */}
      <path d="M22.5 31.5c0.8-1 2.2-1 3 0l-1.5 1.5z" fill="#1F2937"/>
      {/* 嘴 */}
      <path d="M24 33v1.5M24 34.5c-1 1-2.5 1-3 0M24 34.5c1 1 2.5 1 3 0" stroke="#1F2937" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  )
}
