import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './Login'
import SignUp from './SignUp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
