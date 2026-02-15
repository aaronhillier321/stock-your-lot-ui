import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './UserDetail.css'

function formatRoles(roles) {
  if (roles == null || roles === '') return '—'
  if (Array.isArray(roles)) return roles.join(', ')
  return String(roles)
}

function toFormData(user) {
  const name = (user.name ?? user.userName ?? user.fullName ?? user.displayName ?? '').toString().trim()
  const parts = name ? name.split(/\s+/) : []
  const firstName = user.firstName ?? parts[0] ?? ''
  const lastName = user.lastName ?? (parts.length > 1 ? parts.slice(1).join(' ') : '') ?? ''
  return {
    firstName,
    lastName,
    email: (user.email ?? user.userName ?? '').toString().trim(),
    phone: (user.phone ?? user.phoneNumber ?? '').toString().trim(),
    role: user.role ?? user.userRole ?? 'BUYER',
  }
}

function toUpdateBody(form) {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phone.trim(),
    role: form.role,
  }
}

export default function UserDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
      if (!id || !token) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/users/${id}`)
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setError('User not found.')
          else if (res.status === 401) return
          else if (!cancelled) {
            const data = await res.json().catch(() => ({}))
            setError(data.message || `Failed to load (${res.status})`)
          }
          setUser(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setUser(data?.data ?? data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load user')
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUser()
    return () => { cancelled = true }
  }, [id, token])

  function startEditing() {
    setEditing(true)
    setFormData(toFormData(user))
    setSubmitError('')
  }

  function cancelEditing() {
    setEditing(false)
    setFormData(null)
    setSubmitError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const body = toUpdateBody(formData)
      const res = await authFetch(`${getApiBase()}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Update failed (${res.status})`)
        return
      }
      const data = await res.json()
      setUser(data?.data ?? data)
      setEditing(false)
      setFormData(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to update user')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (loading) return <div className="user-detail-page"><p className="user-detail-loading">Loading…</p></div>
  if (error && !user) {
    return (
      <div className="user-detail-page">
        <p className="user-detail-error">{error}</p>
        <Link to="/admin" className="user-detail-back">← Back to Admin</Link>
      </div>
    )
  }
  if (!user) return null

  const displayName = (user.name ?? user.userName ?? user.fullName ?? user.displayName ?? '').toString().trim() || '—'
  const email = (user.email ?? user.userName ?? '').toString().trim() || '—'
  const form = formData

  const content = (
    <div className="user-detail-card">
      <dl className="user-detail-dl">
        <dt>First Name</dt>
        <dd className="user-detail-dd">
          {!editing ? (user.firstName ?? displayName.split(/\s+/)[0] ?? '—') : (
            <input
              type="text"
              className="user-detail-input"
              value={form.firstName}
              onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
              required
            />
          )}
        </dd>
        <dt>Last Name</dt>
        <dd className="user-detail-dd">
          {!editing ? (user.lastName ?? (displayName.split(/\s+/).slice(1).join(' ') || '—')) : (
            <input
              type="text"
              className="user-detail-input"
              value={form.lastName}
              onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
              required
            />
          )}
        </dd>
        <dt>Email</dt>
        <dd className="user-detail-dd">
          {!editing ? email : (
            <input
              type="email"
              className="user-detail-input"
              value={form.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          )}
        </dd>
        <dt>Phone</dt>
        <dd className="user-detail-dd">
          {!editing ? (user.phone ?? user.phoneNumber ?? '—') : (
            <input
              type="tel"
              className="user-detail-input"
              value={form.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              required
            />
          )}
        </dd>
        <dt>Role</dt>
        <dd className="user-detail-dd">
          {!editing ? formatRoles(user.role ?? user.userRole ?? user.roles) : (
            <select
              className="user-detail-input user-detail-select"
              value={form.role}
              onChange={(e) => setFormData((f) => ({ ...f, role: e.target.value }))}
              required
            >
              <option value="BUYER">Buyer</option>
              <option value="DEALER">Dealer</option>
              <option value="ADMIN">Admin</option>
            </select>
          )}
        </dd>
      </dl>
    </div>
  )

  return (
    <div className="user-detail-page">
      <div className="user-detail-top-bar">
        <Link to="/admin" className="user-detail-back">← Back to Admin</Link>
        {!editing ? (
          <button type="button" className="user-detail-edit-btn" onClick={startEditing}>
            Edit
          </button>
        ) : (
          <div className="user-detail-edit-actions">
            <button type="button" className="user-detail-cancel-btn" onClick={cancelEditing} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="user-detail-form" className="user-detail-save-btn" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <header className="user-detail-header">
        <h2 className="user-detail-title">{displayName}</h2>
        <p className="user-detail-info-line">{email}</p>
      </header>

      <section className="user-detail-section">
        {submitError && (
          <div className="user-detail-submit-error" role="alert">
            {submitError}
          </div>
        )}
        {editing ? (
          <form id="user-detail-form" className="user-detail-form" onSubmit={handleSubmit}>
            {content}
          </form>
        ) : (
          content
        )}
      </section>
    </div>
  )
}
