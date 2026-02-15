import { useNavigate, Navigate } from 'react-router-dom'
import {
  clearStoredToken,
  clearStoredUserName,
  clearStoredUserRole,
  clearStoredDealerName,
  getStoredToken,
  getStoredUserName,
} from '../../api'
import './DashboardPage.css'

const ROLE_LABELS = {
  admin: 'Sales Admin',
  associate: 'Sales Associate',
  dealer: 'Dealer',
}

export default function DashboardPage({ role }) {
  const navigate = useNavigate()
  const token = getStoredToken()
  const name = getStoredUserName()
  const label = ROLE_LABELS[role] ?? role

  function handleSignOut() {
    clearStoredToken()
    clearStoredUserName()
    clearStoredUserRole()
    clearStoredDealerName()
    navigate('/', { replace: true })
  }

  if (!token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <h2 className="dashboard-title">{label}</h2>
        <p className="dashboard-text">
          Welcome{name ? `, ${name}` : ''}. You're in the {label} area.
        </p>
        <button type="button" className="dashboard-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}
