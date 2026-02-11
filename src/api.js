const HOSTED_API_URL = 'http://136.118.5.61'
const TOKEN_KEY = 'stock-your-lot-token'
const USER_NAME_KEY = 'stock-your-lot-user-name'
const USER_ROLE_KEY = 'stock-your-lot-user-role'

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

export function getStoredUserName() {
  return localStorage.getItem(USER_NAME_KEY)
}

export function setStoredUserName(name) {
  if (name) localStorage.setItem(USER_NAME_KEY, name)
  else localStorage.removeItem(USER_NAME_KEY)
}

export function clearStoredUserName() {
  localStorage.removeItem(USER_NAME_KEY)
}

export function getStoredUserRole() {
  return localStorage.getItem(USER_ROLE_KEY)
}

export function setStoredUserRole(role) {
  if (role) localStorage.setItem(USER_ROLE_KEY, role)
  else localStorage.removeItem(USER_ROLE_KEY)
}

export function clearStoredUserRole() {
  localStorage.removeItem(USER_ROLE_KEY)
}

/**
 * Resolve landing route from API roles array. Priority: admin > associate > dealer.
 * @param {string[]} roles - e.g. ["ADMIN"], ["ASSOCIATE"], ["DEALER"], ["ROLE_ADMIN"]
 * @returns {'admin'|'associate'|'dealer'}
 */
export function getLandingRouteFromRoles(roles) {
  if (!Array.isArray(roles)) return 'dealer'
  const lower = roles.map((r) => String(r).toLowerCase())
  if (lower.some((r) => r.includes('admin'))) return 'admin'
  if (lower.some((r) => r.includes('associate'))) return 'associate'
  if (lower.some((r) => r.includes('dealer'))) return 'dealer'
  return 'dealer'
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
