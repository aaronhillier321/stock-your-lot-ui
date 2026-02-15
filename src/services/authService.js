import { getStoredToken, getStoredUserRoles, getStoredUserRole } from '../api'

/**
 * Normalize a role string for comparison (lowercase, underscores).
 */
function normalizeRole(role) {
  if (role == null || typeof role !== 'string') return ''
  return String(role).trim().toLowerCase().replace(/-/g, '_')
}

/**
 * Get the current user's roles from storage.
 * @returns {string[]}
 */
export function getRoles() {
  return getStoredUserRoles()
}

/**
 * Check if the current user has the given role.
 * Uses stored user.roles; comparison is case-insensitive.
 * Also treats legacy stored "landing" role: if roles array is empty but
 * getStoredUserRole() equals the given role (e.g. 'admin'), returns true.
 *
 * @param {string} role - Role to check (e.g. 'ADMIN', 'BUYER', 'Sales_Admin')
 * @returns {boolean}
 */
export function hasRole(role) {
  const roles = getStoredUserRoles()
  const want = normalizeRole(role)
  if (!want) return false
  const hasInArray = roles.some((r) => normalizeRole(r) === want || normalizeRole(r).endsWith(want) || want.endsWith(normalizeRole(r)))
  if (hasInArray) return true
  const legacyRole = getStoredUserRole()
  if (legacyRole && (normalizeRole(legacyRole) === want || (want === 'admin' && legacyRole === 'admin'))) return true
  return false
}

/**
 * Check if the current user has any of the given roles.
 * @param {string[]} roles - Roles to check
 * @returns {boolean}
 */
export function hasAnyRole(roles) {
  if (!Array.isArray(roles)) return false
  return roles.some((r) => hasRole(r))
}

/**
 * Guard: require the user to be authenticated (have a token).
 * @returns {boolean} - true if authenticated
 */
export function isAuthenticated() {
  return !!getStoredToken()
}

/**
 * Guard for route or action: require the user to have the given role.
 * Use in components: if (!requireRole('ADMIN')) return <Navigate to="/purchases" replace />
 * or run a redirect yourself.
 *
 * @param {string} role - Required role (e.g. 'ADMIN')
 * @returns {boolean} - true if user has the role, false otherwise
 */
export function requireRole(role) {
  return hasRole(role)
}
