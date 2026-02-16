import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import AcceptInvite from './pages/auth/AcceptInvite'
import Welcome from './pages/dashboard/Welcome'
import Users from './pages/users/Users'
import Associate from './pages/dashboard/Associate'
import Dealer from './pages/dashboard/Dealer'
import Dealerships from './pages/dealerships/Dealerships'
import DealershipDetail from './pages/dealerships/DealershipDetail'
import UserDetail from './pages/users/UserDetail'
import Rules from './pages/rules/Rules'
import Purchases from './pages/purchases/Purchases'
import NewPurchase from './pages/purchases/NewPurchase'
import PurchaseDetail from './pages/purchases/PurchaseDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/invite" element={<AcceptInvite />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/users" element={<Users />} />
          <Route path="/associate" element={<Associate />} />
          <Route path="/dealer" element={<Dealer />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/purchases/new" element={<NewPurchase />} />
          <Route path="/purchases/:id" element={<PurchaseDetail />} />
          <Route path="/dealerships" element={<Dealerships />} />
          <Route path="/dealerships/:id" element={<DealershipDetail />} />
          <Route path="/users/:id" element={<UserDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
