import { RouterProvider } from 'react-router-dom'
import { router } from './routes.jsx'
import CustomerServiceWidget from './components/CustomerServiceWidget.jsx'

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <CustomerServiceWidget />
    </>
  )
}
