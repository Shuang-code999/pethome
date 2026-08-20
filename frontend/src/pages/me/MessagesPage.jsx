import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function MessagesPage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="消息中心开发中"
      desc="消息中心将聚合预约提醒、问诊回复、系统通知、订单状态等所有消息类型，让你不再错过任何重要事项～"
      onBack={() => navigate('/me')}
      accent="health"
    />
  )
}
