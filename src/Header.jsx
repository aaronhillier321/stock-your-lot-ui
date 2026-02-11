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

function NotificationIcon() {
  return (
    <svg className="app-header-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg className="app-header-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg className="app-header-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
        <div className="app-header-right">
          <button type="button" className="app-header-action" title="Notifications" aria-label="Notifications">
            <NotificationIcon />
          </button>
          <button type="button" className="app-header-action" title="Mail" aria-label="Mail">
            <MailIcon />
          </button>
          <button type="button" className="app-header-action" title="Help" aria-label="Help">
            <HelpIcon />
          </button>
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
        </div>
      )}
    </header>
  )
}
