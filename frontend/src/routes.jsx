import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from './components/layouts/AppLayout.jsx'
import ProtectedRoute from './components/layouts/ProtectedRoute.jsx'
import HomePage from './components/pages/HomePage.jsx'

// 懒加载所有独立页面，提升首屏速度
const PetListPage = lazy(() => import('./pages/pet/PetListPage.jsx'))
const PetDetailPage = lazy(() => import('./pages/pet/PetDetailPage.jsx'))
const HealthRecordPage = lazy(() => import('./pages/pet/HealthRecordPage.jsx'))
const WeightCurvePage = lazy(() => import('./pages/pet/WeightCurvePage.jsx'))
const MedicalArchivePage = lazy(() => import('./pages/pet/MedicalArchivePage.jsx'))
const RemindPage = lazy(() => import('./pages/pet/RemindPage.jsx'))
const NotePage = lazy(() => import('./pages/pet/NotePage.jsx'))

const ServiceBathPage = lazy(() => import('./pages/service/ServiceBathPage.jsx'))
const ServiceGroomingPage = lazy(() => import('./pages/service/ServiceGroomingPage.jsx'))
const ServiceFeedingPage = lazy(() => import('./pages/service/ServiceFeedingPage.jsx'))
const ServiceWalkingPage = lazy(() => import('./pages/service/ServiceWalkingPage.jsx'))
const ServiceBoardingPage = lazy(() => import('./pages/service/ServiceBoardingPage.jsx'))
const ServicePhotographyPage = lazy(() => import('./pages/service/ServicePhotographyPage.jsx'))
const ServiceFuneralPage = lazy(() => import('./pages/service/ServiceFuneralPage.jsx'))

const MallCategoryPage = lazy(() => import('./pages/mall/MallCategoryPage.jsx'))
const ProductDetailPage = lazy(() => import('./pages/mall/ProductDetailPage.jsx'))
const CartPage = lazy(() => import('./pages/mall/CartPage.jsx'))

const QaPage = lazy(() => import('./pages/community/QaPage.jsx'))
const TopicPage = lazy(() => import('./pages/community/TopicPage.jsx'))
const AdoptPage = lazy(() => import('./pages/community/AdoptPage.jsx'))
const PetHomePage = lazy(() => import('./pages/community/PetHomePage.jsx'))
const PostDetailPage = lazy(() => import('./pages/community/PostDetailPage.jsx'))
const UserProfilePage = lazy(() => import('./pages/community/UserProfilePage.jsx'))

const MallPageNew = lazy(() => import('./pages/mall/MallPage.jsx'))

const AiConsultPage = lazy(() => import('./pages/consult/AiConsultPage.jsx'))
const ChatConsultPage = lazy(() => import('./pages/consult/ChatConsultPage.jsx'))
const VideoConsultPage = lazy(() => import('./pages/consult/VideoConsultPage.jsx'))
const ConsultRecordsPage = lazy(() => import('./pages/consult/ConsultRecordsPage.jsx'))
const ReferralPage = lazy(() => import('./pages/consult/ReferralPage.jsx'))

const MePage = lazy(() => import('./pages/me/MePage.jsx'))
const FollowsPage = lazy(() => import('./pages/me/FollowsPage.jsx'))
const HistoryPage = lazy(() => import('./pages/me/HistoryPage.jsx'))
const OrdersPage = lazy(() => import('./pages/me/OrdersPage.jsx'))
const OrderDetailPage = lazy(() => import('./pages/me/OrderDetailPage.jsx'))
const WalletPage = lazy(() => import('./pages/me/WalletPage.jsx'))
const MessagesPage = lazy(() => import('./pages/me/MessagesPage.jsx'))
const AddressPage = lazy(() => import('./pages/me/AddressPage.jsx'))
const SettingsPage = lazy(() => import('./pages/me/SettingsPage.jsx'))
const NotificationPage = lazy(() => import('./pages/NotificationPage.jsx'))
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage.jsx'))

function PageFallback() {
  return (
    <div className="mx-auto max-w-page px-4 py-16 text-center">
      <div className="inline-block w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="mt-3 text-sm text-ink-500">加载中…</p>
    </div>
  )
}

const withSuspense = (Comp) => (
  <Suspense fallback={<PageFallback />}>
    <Comp />
  </Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },

      // 宠物档案
      { path: 'pet', element: <Navigate to="/pet/list" replace /> },
      { path: 'pet/list', element: <ProtectedRoute>{withSuspense(PetListPage)}</ProtectedRoute> },
      { path: 'pet/:id', element: <ProtectedRoute>{withSuspense(PetDetailPage)}</ProtectedRoute> },
      { path: 'pet/:id/health', element: <ProtectedRoute>{withSuspense(HealthRecordPage)}</ProtectedRoute> },
      { path: 'pet/:id/weight', element: <ProtectedRoute>{withSuspense(WeightCurvePage)}</ProtectedRoute> },
      { path: 'pet/:id/medical', element: <ProtectedRoute>{withSuspense(MedicalArchivePage)}</ProtectedRoute> },
      { path: 'pet/:id/remind', element: <ProtectedRoute>{withSuspense(RemindPage)}</ProtectedRoute> },
      { path: 'pet/:id/note', element: <ProtectedRoute>{withSuspense(NotePage)}</ProtectedRoute> },

      // 同城服务
      { path: 'service/bath', element: withSuspense(ServiceBathPage) },
      { path: 'service/grooming', element: withSuspense(ServiceGroomingPage) },
      { path: 'service/feeding', element: withSuspense(ServiceFeedingPage) },
      { path: 'service/walking', element: withSuspense(ServiceWalkingPage) },
      { path: 'service/boarding', element: withSuspense(ServiceBoardingPage) },
      { path: 'service/photography', element: withSuspense(ServicePhotographyPage) },
      { path: 'service/funeral', element: withSuspense(ServiceFuneralPage) },

      // 爱宠商城
      { path: 'mall/food', element: withSuspense(MallCategoryPage) },
      { path: 'mall/treats', element: withSuspense(MallCategoryPage) },
      { path: 'mall/litter', element: withSuspense(MallCategoryPage) },
      { path: 'mall/deworm', element: withSuspense(MallCategoryPage) },
      { path: 'mall/toys', element: withSuspense(MallCategoryPage) },
      { path: 'mall/supplies', element: withSuspense(MallCategoryPage) },
      { path: 'mall/product/:id', element: withSuspense(ProductDetailPage) },
      { path: 'mall/cart', element: <ProtectedRoute>{withSuspense(CartPage)}</ProtectedRoute> },

      // 内容社区
      { path: 'community/qa', element: withSuspense(QaPage) },
      { path: 'community/topic', element: withSuspense(TopicPage) },
      { path: 'community/adopt', element: withSuspense(AdoptPage) },
      { path: 'community/pet-home', element: withSuspense(PetHomePage) },
      { path: 'community/post/:id', element: withSuspense(PostDetailPage) },
      { path: 'community/user/:id', element: withSuspense(UserProfilePage) },

      // 在线问诊
      { path: 'consult/ai', element: <ProtectedRoute>{withSuspense(AiConsultPage)}</ProtectedRoute> },
      { path: 'consult/chat', element: <ProtectedRoute>{withSuspense(ChatConsultPage)}</ProtectedRoute> },
      { path: 'consult/video', element: withSuspense(VideoConsultPage) },
      { path: 'consult/records', element: <ProtectedRoute>{withSuspense(ConsultRecordsPage)}</ProtectedRoute> },
      { path: 'consult/referral', element: withSuspense(ReferralPage) },

      // 个人中心
      { path: 'me', element: <ProtectedRoute>{withSuspense(MePage)}</ProtectedRoute> },
      { path: 'me/follows', element: <ProtectedRoute>{withSuspense(FollowsPage)}</ProtectedRoute> },
      { path: 'me/history', element: <ProtectedRoute>{withSuspense(HistoryPage)}</ProtectedRoute> },
      { path: 'me/pets', element: <ProtectedRoute>{withSuspense(PetListPage)}</ProtectedRoute> },
      { path: 'me/orders', element: <ProtectedRoute>{withSuspense(OrdersPage)}</ProtectedRoute> },
      { path: 'me/order/:orderNo', element: <ProtectedRoute>{withSuspense(OrderDetailPage)}</ProtectedRoute> },
      { path: 'me/wallet', element: <ProtectedRoute>{withSuspense(WalletPage)}</ProtectedRoute> },
      { path: 'me/messages', element: <ProtectedRoute>{withSuspense(MessagesPage)}</ProtectedRoute> },
      { path: 'me/address', element: <ProtectedRoute>{withSuspense(AddressPage)}</ProtectedRoute> },
      { path: 'me/settings', element: <ProtectedRoute>{withSuspense(SettingsPage)}</ProtectedRoute> },
      { path: 'notification', element: <ProtectedRoute>{withSuspense(NotificationPage)}</ProtectedRoute> },
      { path: 'search', element: withSuspense(SearchResultsPage) },

      // 在线问诊 index → AI 症状自查
      { path: 'consult', element: <Navigate to="/consult/ai" replace /> },

      // 爱宠商城（淘宝式）
      { path: 'mall', element: withSuspense(MallPageNew) },

      { path: '*', element: (
        <div className="mx-auto max-w-page px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-ink-900 mb-3">404</h1>
          <p className="text-sm text-ink-500">页面不存在</p>
        </div>
      )},
    ],
  },
])
