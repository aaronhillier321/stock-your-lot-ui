import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { clearStoredToken, clearStoredUserName, clearStoredUserRole, getStoredUserName } from './api'
import './Welcome.css'

export default function Welcome() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromState = location.state || {}
  const name = fromState.name || getStoredUserName()
  const email = fromState.email

  if (!name) {
    return <Navigate to="/" replace />
  }

  function handleSignOut() {
    clearStoredToken()
    clearStoredUserName()
    clearStoredUserRole()
    navigate('/', { replace: true })
  }

  return (
    <div className="welcome">
      <div className="welcome-card">
        <p className="welcome-text">
          Welcome {name}, your email is {email ?? '(not set)'}
        </p>
        <button type="button" className="welcome-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}
