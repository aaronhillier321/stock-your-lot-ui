import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { getApiBase } from '../../api'
import './AcceptInvite.css'

/**
 * Route for invite links from email: /invite?token=...
 * Validates token with API, then shows set-password form and calls accept.
 */
export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading') // 'loading' | 'valid' | 'invalid' | 'accepted' | 'error'
  const [email, setEmail] = useState('')
  const [dealershipName, setDealershipName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token?.trim()) {
      setStatus('invalid')
      return
    }
    let cancelled = false
    async function validate() {
      try {
        const res = await fetch(
          `${getApiBase()}/api/invites/validate?token=${encodeURIComponent(token.trim())}`
        )
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data.valid) {
          setEmail(data.email ?? '')
          setDealershipName(data.dealershipName ?? '')
          setStatus('valid')
        } else {
          setStatus('invalid')
        }
      } catch (err) {
        if (!cancelled) setStatus('error')
      }
    }
    validate()
    return () => { cancelled = true }
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${getApiBase()}/api/invites/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(data.message || data.error || `Failed to accept invite (${res.status})`)
        return
      }
      setStatus('accepted')
      setTimeout(() => navigate('/', { replace: true, state: { inviteAccepted: true } }), 2000)
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="accept-invite">
        <div className="accept-invite-card">
          <h1 className="accept-invite-title">Accept invitation</h1>
          <p className="accept-invite-text">Checking your invite link…</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="accept-invite">
        <div className="accept-invite-card">
          <h1 className="accept-invite-title">Invalid or expired link</h1>
          <p className="accept-invite-text">
            This invite link is missing a token, has already been used, or has expired. Ask for a new invitation.
          </p>
          <Link to="/" className="accept-invite-link">Go to sign in</Link>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="accept-invite">
        <div className="accept-invite-card">
          <h1 className="accept-invite-title">Something went wrong</h1>
          <p className="accept-invite-text">We couldn’t verify your invite link. Please try again or ask for a new invitation.</p>
          <Link to="/" className="accept-invite-link">Go to sign in</Link>
        </div>
      </div>
    )
  }

  if (status === 'accepted') {
    return (
      <div className="accept-invite">
        <div className="accept-invite-card accept-invite-success">
          <h1 className="accept-invite-title">You’re all set</h1>
          <p className="accept-invite-text">Your account is active. Redirecting you to sign in…</p>
        </div>
      </div>
    )
  }

  // status === 'valid' — set password form
  return (
    <div className="accept-invite">
      <div className="accept-invite-card">
        <h1 className="accept-invite-title">Set your password</h1>
        <p className="accept-invite-text">
          You’ve been invited to join {dealershipName || 'Stock Your Lot'}. Choose a password to activate your account.
        </p>
        {email && <p className="accept-invite-email">{email}</p>}

        <form className="accept-invite-form" onSubmit={handleSubmit}>
          {submitError && (
            <div className="accept-invite-error" role="alert">{submitError}</div>
          )}
          <label className="accept-invite-label">
            Password (min 8 characters)
            <input
              type="password"
              className="accept-invite-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={submitting}
              minLength={8}
              required
            />
          </label>
          <label className="accept-invite-label">
            Confirm password
            <input
              type="password"
              className="accept-invite-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={submitting}
              minLength={8}
              required
            />
          </label>
          <button type="submit" className="accept-invite-button" disabled={submitting}>
            {submitting ? 'Activating…' : 'Activate account'}
          </button>
        </form>
      </div>
    </div>
  )
}
