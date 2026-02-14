import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { getApiBase, getStoredToken, setStoredToken, setStoredUserName, setStoredUserRole, setStoredDealerName, getLandingRoute } from '../../api'
import './Login.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getStoredToken()
  const inviteAccepted = location.state?.inviteAccepted
  const sessionExpired = new URLSearchParams(location.search).get('session_expired') === '1'
  const [email, setEmail] = useState('')

  if (token) {
    return <Navigate to="/purchases" replace />
  }
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBase()}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || `Login failed (${res.status})`)
        return
      }
      if (data.token) setStoredToken(data.token)
      if (data.username) setStoredUserName(data.username)
      const dealerName = data.dealerName ?? data.dealershipName
      if (dealerName != null) setStoredDealerName(dealerName)
      const landingRole = getLandingRoute(data.roles, data.dealershipRoles)
      setStoredUserRole(landingRole)
      navigate('/purchases', { state: { name: data.username, email: data.email } })
    } catch (err) {
      setError(err.message || 'Network error. Is the API running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">Enter your details to continue</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {sessionExpired && (
            <div className="login-session-expired" role="alert">
              Your session has expired. Please sign in again.
            </div>
          )}
          {inviteAccepted && (
            <div className="login-success" role="status">
              Your account is active. Sign in with your email and password.
            </div>
          )}
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="login-label">
            Email
            <input
              type="email"
              className="login-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>

          <label className="login-label">
            Password
            <input
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
