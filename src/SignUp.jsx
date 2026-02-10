import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiBase } from './api'
import './SignUp.css'

export default function SignUp() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim()) {
      setError('Please enter a username.')
      return
    }
    if (username.trim().length < 2) {
      setError('Username must be at least 2 characters.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email.')
      return
    }
    if (!password) {
      setError('Please enter a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${getApiBase()}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || data.error || `Registration failed (${res.status})`)
        return
      }
      setSuccess(data.message || 'Account created. You can sign in now.')
      setUsername('')
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Network error. Is the API running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Sign up</h1>
          <p className="signup-subtitle">Create an account to get started</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          {error && (
            <div className="signup-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="signup-success" role="status">
              {success}
            </div>
          )}

          <label className="signup-label">
            Username
            <input
              type="text"
              className="signup-input"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              disabled={isSubmitting}
              minLength={2}
              maxLength={100}
            />
          </label>

          <label className="signup-label">
            Email
            <input
              type="email"
              className="signup-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
            />
          </label>

          <label className="signup-label">
            Password
            <input
              type="password"
              className="signup-input"
              placeholder="•••••••• (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={8}
            />
          </label>

          <button
            type="submit"
            className="signup-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account…' : 'Submit'}
          </button>
        </form>

        <p className="signup-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
