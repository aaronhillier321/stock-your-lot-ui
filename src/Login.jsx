import { useState } from 'react'
import './Login.css'

const ROLE_DEALER = 'dealer'
const ROLE_BUYER = 'buyer'

export default function Login() {
  const [role, setRole] = useState(ROLE_DEALER)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleSubmit(e) {
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
    // Simulate login – replace with real auth later
    setTimeout(() => {
      setIsSubmitting(false)
      alert(`Welcome, ${role}! (Demo: you entered ${email})`)
    }, 800)
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
          Don’t have an account? <a href="#">Sign up</a>
        </p>
      </div>
    </div>
  )
}
