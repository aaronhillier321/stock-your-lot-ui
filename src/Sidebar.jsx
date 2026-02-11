import { Link } from 'react-router-dom'
import './Sidebar.css'

const NAV_ITEMS = [
  { label: 'Deals', path: '/deals' },
  { label: 'Purchases', path: '/purchases' },
  { label: 'Evaluation', path: '/evaluation' },
  { label: 'Recommendations', path: '/recommendations' },
]

function HamburgerIcon() {
  return (
    <svg className="sidebar-hamburger-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export default function Sidebar({ isOpen, onToggle }) {
  return (
    <aside className={`app-sidebar ${isOpen ? 'app-sidebar--open' : ''}`} aria-label="Main navigation">
      <button type="button" className="sidebar-hamburger" aria-label={isOpen ? 'Close menu' : 'Open menu'} aria-expanded={isOpen} onClick={onToggle}>
        <HamburgerIcon />
      </button>
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {NAV_ITEMS.map(({ label, path }) => (
            <li key={path}>
              <Link to={path} className="sidebar-link">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
