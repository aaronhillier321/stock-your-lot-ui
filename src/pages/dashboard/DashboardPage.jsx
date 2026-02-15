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
import UsersTable from '../../components/UsersTable'
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
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(role === 'admin')
  const [usersError, setUsersError] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserForm, setAddUserForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'BUYER' })
  const [addUserError, setAddUserError] = useState('')
  const [addUserSending, setAddUserSending] = useState(false)

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

  useEffect(() => {
    if (role !== 'admin' || !token) return
    let cancelled = false
    async function fetchUsers() {
      setUsersLoading(true)
      setUsersError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/users`)
        if (!res.ok) {
          if (res.status === 401) return
          const data = await res.json().catch(() => ({}))
          setUsersError(data.message || `Failed to load users (${res.status})`)
          setUsers([])
          return
        }
        const data = await res.json()
        if (!cancelled) setUsers(Array.isArray(data) ? data : data.users ?? data.content ?? [])
      } catch (err) {
        if (!cancelled) {
          setUsersError(err.message || 'Failed to load users')
          setUsers([])
        }
      } finally {
        if (!cancelled) setUsersLoading(false)
      }
    }
    fetchUsers()
    return () => { cancelled = true }
  }, [role, token])

  async function handleAddUser(e) {
    e.preventDefault()
    setAddUserError('')
    setAddUserSending(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: addUserForm.firstName.trim(),
          lastName: addUserForm.lastName.trim(),
          email: addUserForm.email.trim(),
          phoneNumber: addUserForm.phone.trim() || undefined,
          role: addUserForm.role,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setAddUserError(data.message || data.error || `Failed to add user (${res.status})`)
        return
      }
      setShowAddUserModal(false)
      setAddUserForm({ firstName: '', lastName: '', email: '', phone: '', role: 'BUYER' })
      const data = await res.json()
      setUsers((prev) => [data?.data ?? data, ...prev])
    } catch (err) {
      setAddUserError(err.message || 'Failed to add user')
    } finally {
      setAddUserSending(false)
    }
  }

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
              <div className="dashboard-admin-users-header">
                <button
                  type="button"
                  className="dashboard-admin-add-user-btn"
                  onClick={() => {
                    setShowAddUserModal(true)
                    setAddUserError('')
                    setAddUserForm({ firstName: '', lastName: '', email: '', phone: '', role: 'BUYER' })
                  }}
                >
                  Add user
                </button>
              </div>
              {usersError && (
                <div className="dashboard-admin-error" role="alert">
                  {usersError}
                </div>
              )}
              {usersLoading ? (
                <p className="dashboard-admin-loading">Loading users…</p>
              ) : users.length === 0 ? (
                <p className="dashboard-admin-empty">No users.</p>
              ) : (
                <UsersTable users={users} />
              )}

              {showAddUserModal && (
                <div className="dashboard-admin-modal-backdrop" onClick={() => setShowAddUserModal(false)} aria-hidden>
                  <div className="dashboard-admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-user-modal-title" aria-modal="true">
                    <div className="dashboard-admin-modal-header">
                      <h3 id="add-user-modal-title" className="dashboard-admin-modal-title">Add user</h3>
                      <button type="button" className="dashboard-admin-modal-close" onClick={() => setShowAddUserModal(false)} aria-label="Close">×</button>
                    </div>
                    <form onSubmit={handleAddUser} className="dashboard-admin-add-user-form">
                      <label className="dashboard-admin-add-user-label">
                        First Name
                        <input
                          type="text"
                          className="dashboard-admin-add-user-input"
                          placeholder="First name"
                          value={addUserForm.firstName}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, firstName: e.target.value }))}
                          disabled={addUserSending}
                          required
                          autoComplete="given-name"
                        />
                      </label>
                      <label className="dashboard-admin-add-user-label">
                        Last Name
                        <input
                          type="text"
                          className="dashboard-admin-add-user-input"
                          placeholder="Last name"
                          value={addUserForm.lastName}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, lastName: e.target.value }))}
                          disabled={addUserSending}
                          required
                          autoComplete="family-name"
                        />
                      </label>
                      <label className="dashboard-admin-add-user-label">
                        Email
                        <input
                          type="email"
                          className="dashboard-admin-add-user-input"
                          placeholder="user@example.com"
                          value={addUserForm.email}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                          disabled={addUserSending}
                          required
                          autoComplete="email"
                        />
                      </label>
                      <label className="dashboard-admin-add-user-label">
                        Phone number
                        <input
                          type="tel"
                          className="dashboard-admin-add-user-input"
                          placeholder="(555) 123-4567"
                          value={addUserForm.phone}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, phone: e.target.value }))}
                          disabled={addUserSending}
                          required
                          autoComplete="tel"
                        />
                      </label>
                      <label className="dashboard-admin-add-user-label">
                        Role
                        <select
                          className="dashboard-admin-add-user-input dashboard-admin-add-user-select"
                          value={addUserForm.role}
                          onChange={(e) => setAddUserForm((f) => ({ ...f, role: e.target.value }))}
                          disabled={addUserSending}
                          required
                        >
                          <option value="BUYER">Buyer</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </label>
                      {addUserError && <p className="dashboard-admin-add-user-error" role="alert">{addUserError}</p>}
                      <div className="dashboard-admin-modal-actions">
                        <button type="button" className="dashboard-admin-add-user-cancel" onClick={() => setShowAddUserModal(false)} disabled={addUserSending}>Cancel</button>
                        <button type="submit" className="dashboard-admin-add-user-submit" disabled={addUserSending}>{addUserSending ? 'Adding…' : 'Add user'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
