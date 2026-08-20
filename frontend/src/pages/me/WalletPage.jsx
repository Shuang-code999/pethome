import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function WalletPage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="钱包优惠券开发中"
      desc="钱包功能将支持余额充值、优惠券管理、消费明细等功能。期待为你提供更便捷的支付体验～"
      onBack={() => navigate('/me')}
      accent="brand"
    />
  )
}
