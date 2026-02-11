import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Login from './Login'
import SignUp from './SignUp'
import Welcome from './Welcome'
import Admin from './Admin'
import Associate from './Associate'
import Dealer from './Dealer'

const SIDEBAR_WIDTH = 240
const SIDEBAR_COLLAPSED = 56

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  return (
    <BrowserRouter>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen((o) => !o)} />
      <div
        className="app-body"
        style={{ marginLeft: isSidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED }}
      >
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/associate" element={<Associate />} />
            <Route path="/dealer" element={<Dealer />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
