import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  clearStoredToken,
  clearStoredUserName,
  clearStoredUserRole,
  clearStoredDealerName,
  getStoredToken,
  getStoredUserName,
  getApiBase,
  authFetch,
} from '../../api'
import { Tabs } from '@mantine/core'
import PurchasesTable from '../../components/PurchasesTable'
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

  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(role === 'admin')
  const [error, setError] = useState('')

  useEffect(() => {
    if (role !== 'admin' || !token) return
    let cancelled = false
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/purchases`)
        if (!res.ok) {
          if (res.status === 401) return
          const data = await res.json().catch(() => ({}))
          setError(data.message || `Failed to load (${res.status})`)
          setPurchases([])
          return
        }
        const data = await res.json()
        if (!cancelled) setPurchases(Array.isArray(data) ? data : data.purchases || data.content || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load purchases')
          setPurchases([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [role, token])

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

  if (role === 'admin') {
    return (
      <div className="dashboard dashboard-admin">
        {error && (
          <div className="dashboard-admin-error" role="alert">
            {error}
          </div>
        )}
        <div className="dashboard-admin-card">
          <Tabs defaultValue="purchases" className="dashboard-admin-tabs">
            <Tabs.List className="dashboard-admin-tabs-list">
              <Tabs.Tab value="purchases">Purchases</Tabs.Tab>
              <Tabs.Tab value="users">Users</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="purchases" className="dashboard-admin-tabs-panel">
              <div className="dashboard-admin-table-section">
                {loading ? (
                  <p className="dashboard-admin-loading">Loading all purchases…</p>
                ) : purchases.length === 0 ? (
                  <p className="dashboard-admin-empty">No purchases.</p>
                ) : (
                  <PurchasesTable purchases={purchases} showBuyerColumn />
                )}
              </div>
              <div className="dashboard-admin-below-section">
                {/* Add other content here */}
              </div>
            </Tabs.Panel>
            <Tabs.Panel value="users" className="dashboard-admin-tabs-panel">
              <p className="dashboard-admin-empty">Users — coming soon.</p>
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
    )
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
