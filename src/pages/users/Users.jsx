import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getStoredToken, getStoredUserRole, getApiBase, authFetch } from '../../api'
import UsersTable from '../../components/UsersTable'
import './Users.css'

export default function Users() {
  const token = getStoredToken()
  const role = getStoredUserRole()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [addUserForm, setAddUserForm] = useState({ firstName: '', lastName: '', email: '', phone: '', role: 'BUYER' })
  const [addUserError, setAddUserError] = useState('')
  const [addUserSending, setAddUserSending] = useState(false)

  useEffect(() => {
    if (!token || role !== 'admin') return
    let cancelled = false
    async function fetchUsers() {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/users`)
        if (!res.ok) {
          if (res.status === 401) return
          const data = await res.json().catch(() => ({}))
          setError(data.message || `Failed to load users (${res.status})`)
          setUsers([])
          return
        }
        const data = await res.json()
        if (!cancelled) setUsers(Array.isArray(data) ? data : data.users ?? data.content ?? [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load users')
          setUsers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUsers()
    return () => { cancelled = true }
  }, [token, role])

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

  if (!token) return <Navigate to="/" replace />
  if (role !== 'admin') return <Navigate to="/purchases" replace />

  return (
    <div className="users-page">
      <div className="users-header">
        <h2 className="users-title">Users</h2>
        <button
          type="button"
          className="users-add-btn"
          onClick={() => {
            setShowAddUserModal(true)
            setAddUserError('')
            setAddUserForm({ firstName: '', lastName: '', email: '', phone: '', role: 'BUYER' })
          }}
        >
          Add user
        </button>
      </div>

      {error && (
        <div className="users-error" role="alert">
          {error}
        </div>
      )}

      <div className="users-body">
        {loading ? (
          <p className="users-loading">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="users-empty">No users.</p>
        ) : (
          <UsersTable users={users} />
        )}
      </div>

      {showAddUserModal && (
        <div className="users-modal-backdrop" onClick={() => setShowAddUserModal(false)} aria-hidden>
          <div className="users-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-user-modal-title" aria-modal="true">
            <div className="users-modal-header">
              <h3 id="add-user-modal-title" className="users-modal-title">Add user</h3>
              <button type="button" className="users-modal-close" onClick={() => setShowAddUserModal(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleAddUser} className="users-add-user-form">
              <label className="users-add-user-label">
                <span className="users-add-user-label-text">First Name <span className="users-add-user-required" aria-hidden>*</span></span>
                <input
                  type="text"
                  className="users-add-user-input"
                  placeholder="First name"
                  value={addUserForm.firstName}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, firstName: e.target.value }))}
                  disabled={addUserSending}
                  required
                  autoComplete="given-name"
                />
              </label>
              <label className="users-add-user-label">
                <span className="users-add-user-label-text">Last Name <span className="users-add-user-required" aria-hidden>*</span></span>
                <input
                  type="text"
                  className="users-add-user-input"
                  placeholder="Last name"
                  value={addUserForm.lastName}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, lastName: e.target.value }))}
                  disabled={addUserSending}
                  required
                  autoComplete="family-name"
                />
              </label>
              <label className="users-add-user-label">
                <span className="users-add-user-label-text">Email <span className="users-add-user-required" aria-hidden>*</span></span>
                <input
                  type="email"
                  className="users-add-user-input"
                  placeholder="user@example.com"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={addUserSending}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="users-add-user-label">
                <span className="users-add-user-label-text">Phone number <span className="users-add-user-required" aria-hidden>*</span></span>
                <input
                  type="tel"
                  className="users-add-user-input"
                  placeholder="(555) 123-4567"
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, phone: e.target.value }))}
                  disabled={addUserSending}
                  required
                  autoComplete="tel"
                />
              </label>
              <label className="users-add-user-label">
                <span className="users-add-user-label-text">Role <span className="users-add-user-required" aria-hidden>*</span></span>
                <select
                  className="users-add-user-input users-add-user-select"
                  value={addUserForm.role}
                  onChange={(e) => setAddUserForm((f) => ({ ...f, role: e.target.value }))}
                  disabled={addUserSending}
                  required
                >
                  <option value="BUYER">Buyer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              {addUserError && <p className="users-add-user-error" role="alert">{addUserError}</p>}
              <div className="users-modal-actions">
                <button type="button" className="users-add-user-cancel" onClick={() => setShowAddUserModal(false)} disabled={addUserSending}>Cancel</button>
                <button type="submit" className="users-add-user-submit" disabled={addUserSending}>{addUserSending ? 'Adding…' : 'Add user'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
