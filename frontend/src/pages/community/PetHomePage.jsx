import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function PetHomePage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="宠物主页功能开发中"
      desc="宠物主页将展示你的爱宠公开形象，支持被其他宠友关注、点赞、评论。我们正在打造更丰富的宠物社交体验，敬请期待～"
      onBack={() => navigate(-1)}
      accent="brand"
    />
  )
}
