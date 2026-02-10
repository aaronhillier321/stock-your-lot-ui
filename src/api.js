const HOSTED_API_URL = 'http://136.118.5.61'
const TOKEN_KEY = 'stock-your-lot-token'

export function getApiBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    return HOSTED_API_URL
  }
  // Dev: use relative /api so Vite proxy sends to localhost:8080
  return ''
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * fetch that adds Authorization: Bearer <token> when a token is stored.
 * Use for authenticated API calls.
 */
export function authFetch(url, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...options, headers })
}
