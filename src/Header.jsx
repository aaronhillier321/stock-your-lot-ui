import { getStoredUserName } from './api'
import './Header.css'

export default function Header() {
  const name = getStoredUserName()

  return (
    <header className="app-header">
      <h1 className="app-header-logo">Stock Your Lot</h1>
      {name && (
        <span className="app-header-welcome">Welcome {name}</span>
      )}
    </header>
  )
}
