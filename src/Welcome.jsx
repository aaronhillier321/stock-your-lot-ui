import { useLocation, Navigate } from 'react-router-dom'
import './Welcome.css'

export default function Welcome() {
  const location = useLocation()
  const { name, email } = location.state || {}

  if (!name) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="welcome">
      <p className="welcome-text">
        Welcome {name}, your email is {email ?? '(not set)'}
      </p>
    </div>
  )
}
