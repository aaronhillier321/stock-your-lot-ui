import { useNavigate } from 'react-router-dom'
import {
  getStoredUserName,
  getStoredUserRole,
  getStoredDealerName,
  clearStoredToken,
  clearStoredUserName,
  clearStoredUserRole,
  clearStoredDealerName,
} from './api'
import './Header.css'

const ROLE_LABELS = {
  admin: 'Admin',
  associate: 'Associate',
  dealer: 'User',
}

function formatDisplayName(name) {
  if (!name || typeof name !== 'string') return ''
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function UserIcon() {
  return (
    <svg className="app-header-user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export default function Header() {
  const navigate = useNavigate()
  const name = getStoredUserName()
  const role = getStoredUserRole()
  const dealerName = getStoredDealerName()
  const badgeLabel =
    role === 'dealer' && dealerName
      ? formatDisplayName(dealerName)
      : role
        ? (ROLE_LABELS[role] ?? role)
        : null
  const displayName = formatDisplayName(name)

  function handleSignOut() {
    clearStoredToken()
    clearStoredUserName()
    clearStoredUserRole()
    clearStoredDealerName()
    navigate('/', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1 className="app-header-logo">Stock Your Lot</h1>
        {badgeLabel && <span className="app-header-role">{badgeLabel}</span>}
      </div>
      {name && (
        <div className="app-header-user">
          <button type="button" className="app-header-user-trigger" aria-haspopup="true" aria-expanded="false">
            <UserIcon />
            <span className="app-header-user-name">{displayName}</span>
          </button>
          <div className="app-header-dropdown">
            <button type="button" className="app-header-signout" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
