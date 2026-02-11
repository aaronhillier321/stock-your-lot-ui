import { getStoredUserName, getStoredUserRole } from './api'
import './Header.css'

const ROLE_LABELS = {
  admin: 'Admin',
  associate: 'Associate',
  dealer: 'Dealer',
}

export default function Header() {
  const name = getStoredUserName()
  const role = getStoredUserRole()
  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : null

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h1 className="app-header-logo">Stock Your Lot</h1>
        {roleLabel && <span className="app-header-role">{roleLabel}</span>}
      </div>
      {name && (
        <span className="app-header-welcome">Welcome {name}</span>
      )}
    </header>
  )
}
