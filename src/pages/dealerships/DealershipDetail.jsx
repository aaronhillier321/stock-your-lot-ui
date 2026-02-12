import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './DealershipDetail.css'

export default function DealershipDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [dealership, setDealership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchDealership() {
      if (!id || !token) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships/${id}`)
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setError('Dealership not found.')
          else if (res.status === 401) return
          else if (!cancelled) {
            const data = await res.json().catch(() => ({}))
            setError(data.message || `Failed to load (${res.status})`)
          }
          setDealership(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setDealership(data?.data ?? data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dealership')
          setDealership(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDealership()
    return () => { cancelled = true }
  }, [id, token])

  async function handleSendInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) {
      setInviteError('Please enter an email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setInviteError('Please enter a valid email address.')
      return
    }
    setInviteError('')
    setInviteSuccess('')
    setInviteSending(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/dealerships/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setInviteError(data.message || data.error || `Invite failed (${res.status})`)
        return
      }
      setInviteSuccess(`Invitation sent to ${email}.`)
      setInviteEmail('')
      setTimeout(() => {
        setShowInviteModal(false)
        setInviteSuccess('')
      }, 1500)
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite')
    } finally {
      setInviteSending(false)
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (loading) return <div className="dealership-detail-page"><div className="dealership-detail-card"><p className="dealership-detail-loading">Loading…</p></div></div>
  if (error && !dealership) {
    return (
      <div className="dealership-detail-page">
        <div className="dealership-detail-card">
          <p className="dealership-detail-error">{error}</p>
          <Link to="/dealerships" className="dealership-detail-back">← Back to dealerships</Link>
        </div>
      </div>
    )
  }
  if (!dealership) return null

  return (
    <div className="dealership-detail-page">
      <div className="dealership-detail-card">
        <Link to="/dealerships" className="dealership-detail-back">← Back to dealerships</Link>
        <h2 className="dealership-detail-title">{dealership.name ?? 'Dealership'}</h2>
        <dl className="dealership-detail-info">
          {dealership.address != null && dealership.address !== '' && (
            <>
              <dt>Address</dt>
              <dd>{dealership.address}</dd>
            </>
          )}
          {dealership.city != null && dealership.city !== '' && (
            <>
              <dt>City</dt>
              <dd>{dealership.city}</dd>
            </>
          )}
          {dealership.state != null && dealership.state !== '' && (
            <>
              <dt>State</dt>
              <dd>{dealership.state}</dd>
            </>
          )}
          {dealership.zip != null && dealership.zip !== '' && (
            <>
              <dt>ZIP</dt>
              <dd>{dealership.zip}</dd>
            </>
          )}
          {dealership.phone != null && dealership.phone !== '' && (
            <>
              <dt>Phone</dt>
              <dd>{dealership.phone}</dd>
            </>
          )}
        </dl>

        <section className="dealership-detail-invite-section">
          <button type="button" className="dealership-detail-add-user-btn" onClick={() => { setInviteError(''); setInviteSuccess(''); setShowInviteModal(true); }}>
            Add User
          </button>
        </section>
      </div>

      {showInviteModal && (
        <div className="dealership-detail-modal-backdrop" onClick={() => setShowInviteModal(false)} aria-hidden>
          <div className="dealership-detail-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="invite-modal-title" aria-modal="true">
            <div className="dealership-detail-modal-header">
              <h3 id="invite-modal-title" className="dealership-detail-modal-title">Invite User</h3>
              <button type="button" className="dealership-detail-modal-close" onClick={() => setShowInviteModal(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="dealership-detail-invite-form">
              <label className="dealership-detail-invite-label">
                Email address
                <input
                  type="email"
                  className="dealership-detail-invite-input"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteSending}
                  autoComplete="email"
                />
              </label>
              {inviteError && <p className="dealership-detail-invite-error" role="alert">{inviteError}</p>}
              {inviteSuccess && <p className="dealership-detail-invite-success" role="status">{inviteSuccess}</p>}
              <div className="dealership-detail-modal-actions">
                <button type="button" className="dealership-detail-invite-cancel" onClick={() => setShowInviteModal(false)} disabled={inviteSending}>
                  Cancel
                </button>
                <button type="submit" className="dealership-detail-invite-btn" disabled={inviteSending}>
                  {inviteSending ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
