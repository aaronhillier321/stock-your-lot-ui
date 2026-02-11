import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Header from './Header'
import Login from './Login'
import SignUp from './SignUp'
import Welcome from './Welcome'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
