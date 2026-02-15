// Hosted UI: http://34.182.101.241/ — API base URL used in prod when VITE_API_BASE_URL not set
const HOSTED_API_URL = 'http://136.118.5.61'
const TOKEN_KEY = 'stock-your-lot-token'
const USER_NAME_KEY = 'stock-your-lot-user-name'
const USER_ROLE_KEY = 'stock-your-lot-user-role'
const USER_ROLES_KEY = 'stock-your-lot-user-roles'
const DEALER_NAME_KEY = 'stock-your-lot-dealer-name'

export function getApiBase() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    return HOSTED_API_URL
  }
  // Dev: hit API directly on port 8080
  return 'http://localhost:8080'
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

export function getStoredUserRoles() {
  try {
    const raw = localStorage.getItem(USER_ROLES_KEY)
    if (raw == null) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function setStoredUserRoles(roles) {
  if (Array.isArray(roles) && roles.length > 0) {
    localStorage.setItem(USER_ROLES_KEY, JSON.stringify(roles))
  } else {
    localStorage.removeItem(USER_ROLES_KEY)
  }
}

export function clearStoredUserRoles() {
  localStorage.removeItem(USER_ROLES_KEY)
}

export function getStoredDealerName() {
  return localStorage.getItem(DEALER_NAME_KEY)
}

export function setStoredDealerName(name) {
  if (name != null && String(name).trim()) localStorage.setItem(DEALER_NAME_KEY, String(name).trim())
  else localStorage.removeItem(DEALER_NAME_KEY)
}

export function clearStoredDealerName() {
  localStorage.removeItem(DEALER_NAME_KEY)
}

/**
 * Check if a role list contains Sales_Admin or Sales_Associate (any casing/underscore).
 */
function hasSalesAdmin(roleList) {
  if (!Array.isArray(roleList)) return false
  return roleList.some((r) => String(r).toLowerCase().replace(/-/g, '_').includes('sales_admin'))
}

function hasSalesAssociate(roleList) {
  if (!Array.isArray(roleList)) return false
  return roleList.some((r) => String(r).toLowerCase().replace(/-/g, '_').includes('sales_associate'))
}

/**
 * Resolve landing route from DEALERSHIP_ROLES in login response.
 * Roles: Sales_Admin, Sales_Associate, User. Priority: Sales_Admin > Sales_Associate > User (dealer).
 * @param {string[]} dealershipRoles - e.g. ["Sales_Admin"], ["Sales_Associate"], ["User"]
 * @returns {'admin'|'associate'|'dealer'}
 */
export function getLandingRouteFromDealershipRoles(dealershipRoles) {
  if (!Array.isArray(dealershipRoles)) return 'dealer'
  const normalized = dealershipRoles.map((r) => String(r).trim())
  if (normalized.some((r) => r === 'Sales_Admin' || r.toLowerCase().includes('sales_admin'))) return 'admin'
  if (normalized.some((r) => r === 'Sales_Associate' || r.toLowerCase().includes('sales_associate'))) return 'associate'
  if (normalized.some((r) => r === 'User' || r.toLowerCase() === 'user')) return 'dealer'
  return 'dealer'
}

/**
 * Resolve landing route: sales_admin / sales_associate in roles trump dealershipRoles.
 * @param {string[]} roles - user roles (Sales_Admin, Sales_Associate trump dealership)
 * @param {string[]} dealershipRoles - dealership roles when no sales role present
 * @returns {'admin'|'associate'|'dealer'}
 */
export function getLandingRoute(roles, dealershipRoles) {
  if (hasSalesAdmin(roles)) return 'admin'
  if (hasSalesAssociate(roles)) return 'associate'
  return getLandingRouteFromDealershipRoles(dealershipRoles)
}

/**
 * Clears all stored auth data (token, user name, role, dealer name).
 * Call on sign-out or when the API returns 401 (e.g. expired JWT).
 */
export function clearAuth() {
  clearStoredToken()
  clearStoredUserName()
  clearStoredUserRole()
  clearStoredUserRoles()
  clearStoredDealerName()
}

/**
 * fetch that adds Authorization: Bearer <token> when a token is stored.
 * On 401 (e.g. expired JWT), clears auth and redirects to login with session_expired=1.
 */
export function authFetch(url, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(url, { ...options, headers }).then((res) => {
    if (res.status === 401) {
      clearAuth()
      window.location.replace('/?session_expired=1')
    }
    return res
  })
}
