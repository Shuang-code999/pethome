import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function ServiceStorePage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="友好门店开发中"
      desc="宠物友好门店地图正在筹备中，未来将汇总全国允许宠物入内的咖啡店、餐厅、酒店，让带宠出行更便捷～"
      onBack={() => navigate(-1)}
      accent="health"
    />
  )
}