import UnderDev from '../../components/common/UnderDev.jsx'
import { useNavigate } from 'react-router-dom'

export default function AddressPage() {
  const navigate = useNavigate()
  return (
    <UnderDev
      title="收货地址开发中"
      desc="收货地址管理功能将支持新增、编辑、删除、设置默认地址，让商城下单更便捷～"
      onBack={() => navigate('/me')}
      accent="brand"
    />
  )
}
