import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { clearStoredToken } from './api'
import './Welcome.css'

export default function Welcome() {
  const location = useLocation()
  const navigate = useNavigate()
  const { name, email } = location.state || {}

  if (!name) {
    return <Navigate to="/" replace />
  }

  function handleSignOut() {
    clearStoredToken()
    navigate('/', { replace: true })
  }

  return (
    <div className="welcome">
      <p className="welcome-text">
        Welcome {name}, your email is {email ?? '(not set)'}
      </p>
      <button type="button" className="welcome-signout" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  )
}
