import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function VideoConsultPage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="视频问诊开发中"
      desc="视频问诊正在筹备中，未来将与认证医师 1v1 视频通话问诊，更直观地观察宠物状态。请期待～"
      onBack={() => navigate(-1)}
      accent="health"
    />
  )
}