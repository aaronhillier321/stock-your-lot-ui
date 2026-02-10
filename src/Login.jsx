import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiBase, setStoredToken } from './api'
import './Login.css'

const ROLE_DEALER = 'dealer'
const ROLE_BUYER = 'buyer'

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState(ROLE_DEALER)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!username.trim()) {
      setError('Please enter your name.')
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
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || `Login failed (${res.status})`)
        return
      }
      if (data.token) setStoredToken(data.token)
      navigate('/welcome', { state: { name: data.username, email: data.email } })
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

        <div className="login-tabs" role="tablist" aria-label="Account type">
          <button
            type="button"
            role="tab"
            aria-selected={role === ROLE_DEALER}
            className={`login-tab ${role === ROLE_DEALER ? 'login-tab--active' : ''}`}
            onClick={() => setRole(ROLE_DEALER)}
          >
            Dealer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === ROLE_BUYER}
            className={`login-tab ${role === ROLE_BUYER ? 'login-tab--active' : ''}`}
            onClick={() => setRole(ROLE_BUYER)}
          >
            Buyer
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label className="login-label">
            Name
            <input
              type="text"
              className="login-input"
              placeholder="your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
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
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
