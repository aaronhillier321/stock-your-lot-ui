import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import UserDealershipsTable from './UserDealershipsTable'
import UserCommissionRulesTable from './UserCommissionRulesTable'
import './UserDetail.css'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

function formatRoles(roles) {
  if (roles == null || roles === '') return '—'
  if (Array.isArray(roles)) return roles.join(', ')
  return String(roles)
}

function toLocalDateStr(dateVal) {
  if (dateVal == null) return ''
  if (typeof dateVal === 'string') return dateVal.slice(0, 10)
  return ''
}

const ROLE_OPTIONS = ['BUYER', 'DEALER', 'ADMIN']

function toFormData(user) {
  const name = (user.name ?? user.userName ?? user.fullName ?? user.displayName ?? '').toString().trim()
  const parts = name ? name.split(/\s+/) : []
  const firstName = user.firstName ?? parts[0] ?? ''
  const lastName = user.lastName ?? (parts.length > 1 ? parts.slice(1).join(' ') : '') ?? ''
  let roles = user.roles ?? user.role ?? user.userRole ?? 'BUYER'
  if (!Array.isArray(roles)) roles = roles ? [roles] : ['BUYER']
  if (roles.length === 0) roles = ['BUYER']
  const rawRules = user.userCommissionRules ?? user.commissionRules ?? []
  const commissionRules = Array.isArray(rawRules)
    ? rawRules.map((a) => ({
        ruleId: a.ruleId ?? a.rule_id ?? '',
        startDate: toLocalDateStr(a.startDate ?? a.start_date),
        endDate: toLocalDateStr(a.endDate ?? a.end_date),
        level: a.level != null ? a.level : 1,
        numberOfSales: a.numberOfSales ?? a.number_of_sales ?? null,
      }))
    : []
  const rawDealerships = user.dealershipRoles ?? user.dealership_roles ?? []
  const dealershipRoles = Array.isArray(rawDealerships)
    ? rawDealerships.map((d) => ({
        dealershipId: d.dealershipId ?? d.dealership_id ?? '',
        dealershipName: d.dealershipName ?? d.dealership_name ?? '',
        role: (d.role === 'ASSOCIATE' ? 'BUYER' : d.role) || 'BUYER',
      }))
    : []
  return {
    firstName,
    lastName,
    email: (user.email ?? user.userName ?? '').toString().trim(),
    phone: (user.phone ?? user.phoneNumber ?? '').toString().trim(),
    roles: [...roles],
    commissionRules,
    dealershipRoles,
  }
}

function toUpdateBody(form) {
  const body = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phoneNumber: form.phone.trim(),
    roles: form.roles.length ? form.roles : ['BUYER'],
  }
  if (form.commissionRules && form.commissionRules.length > 0) {
    body.userCommissionRules = form.commissionRules
      .filter((r) => r.ruleId && r.startDate)
      .map((r) => ({
        ruleId: r.ruleId,
        startDate: r.startDate,
        endDate: r.endDate || null,
        level: r.level != null && r.level !== '' ? Number(r.level) : 1,
        numberOfSales: r.numberOfSales != null && r.numberOfSales !== '' ? Number(r.numberOfSales) : null,
      }))
  } else {
    body.userCommissionRules = []
  }
  return body
}

export default function UserDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [formData, setFormData] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [summaryMonth, setSummaryMonth] = useState(currentMonth)
  const [summaryYear, setSummaryYear] = useState(currentYear)

  useEffect(() => {
    if (!id || !token) return
    let cancelled = false
    setPurchasesLoading(true)
    async function fetchPurchases() {
      try {
        const res = await authFetch(`${getApiBase()}/api/purchases/buyer/${id}`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPurchases(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
      if (!cancelled) setPurchasesLoading(false)
    }
    fetchPurchases()
    return () => { cancelled = true }
  }, [id, token])

  const monthsForYear = useMemo(() => {
    const y = summaryYear || currentYear
    if (y === currentYear) return MONTHS.filter((m) => m.value <= currentMonth)
    return MONTHS
  }, [summaryYear])

  useEffect(() => {
    if (summaryYear === currentYear && summaryMonth > currentMonth) {
      setSummaryMonth(currentMonth)
    }
  }, [summaryYear, summaryMonth])

  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
      if (!id || !token) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/users/${id}`)
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setError('User not found.')
          else if (res.status === 401) return
          else if (!cancelled) {
            const data = await res.json().catch(() => ({}))
            setError(data.message || `Failed to load (${res.status})`)
          }
          setUser(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setUser(data?.data ?? data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load user')
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchUser()
    return () => { cancelled = true }
  }, [id, token])

  function startEditingProfile() {
    setFormData((prev) => prev ?? toFormData(user))
    setEditingProfile(true)
    setSubmitError('')
  }

  function cancelEditingProfile() {
    setEditingProfile(false)
    setFormData(null)
    setSubmitError('')
  }

  async function handleSaveProfile(e) {
    e?.preventDefault?.()
    if (!formData) return
    setSubmitError('')
    setSubmittingProfile(true)
    try {
      const body = toUpdateBody({
        ...formData,
        commissionRules: toFormData(user).commissionRules,
      })
      const res = await authFetch(`${getApiBase()}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Update failed (${res.status})`)
        setSubmittingProfile(false)
        return
      }
      const data = await res.json()
      setUser(data?.data ?? data)
      setEditingProfile(false)
      setFormData(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to update profile')
    } finally {
      setSubmittingProfile(false)
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (loading) return <div className="user-detail-page"><p className="user-detail-loading">Loading…</p></div>
  if (error && !user) {
    return (
      <div className="user-detail-page">
        <p className="user-detail-error">{error}</p>
        <Link to="/users" className="user-detail-back">← Back to Users</Link>
      </div>
    )
  }
  if (!user) return null

  const first = (user.firstName ?? '').toString().trim()
  const last = (user.lastName ?? '').toString().trim()
  const fromParts = [first, last].filter(Boolean).join(' ').trim()
  const displayName = fromParts || (user.name ?? user.userName ?? user.fullName ?? user.displayName ?? '').toString().trim() || '—'
  const email = (user.email ?? user.userName ?? '').toString().trim() || '—'
  const form = formData

  const editing = editingProfile
  const infoLine = !editing
    ? [email, user.phone ?? user.phoneNumber, formatRoles(user.roles ?? user.role ?? user.userRole)].filter(Boolean).join(' · ') || '—'
    : null

  const userHeader = (
    <header className="user-detail-header">
      {!editing ? (
        <>
          <div className="user-detail-header-row">
            <h2 className="user-detail-title">{displayName}</h2>
            <button type="button" className="user-detail-table-edit-btn" onClick={startEditingProfile}>
              Edit
            </button>
          </div>
          <p className="user-detail-info-line">{infoLine}</p>
        </>
      ) : (
        <div className="user-detail-header-edit">
          <div className="user-detail-header-edit-row">
            <input
              type="text"
              className="user-detail-input user-detail-header-input"
              value={form.firstName}
              onChange={(e) => setFormData((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
              required
            />
            <input
              type="text"
              className="user-detail-input user-detail-header-input"
              value={form.lastName}
              onChange={(e) => setFormData((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
              required
            />
            <input
              type="email"
              className="user-detail-input user-detail-header-input"
              value={form.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              required
            />
            <input
              type="tel"
              className="user-detail-input user-detail-header-input"
              value={form.phone}
              onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone"
              required
            />
          </div>
          <div className="user-detail-header-roles">
            <ul className="user-detail-roles-list">
              {form.roles.map((role, idx) => (
                <li key={`${role}-${idx}`} className="user-detail-role-chip">
                  <span className="user-detail-role-label">{role === 'BUYER' ? 'Buyer' : role === 'DEALER' ? 'Dealer' : 'Admin'}</span>
                  <button
                    type="button"
                    className="user-detail-role-remove"
                    onClick={() => setFormData((f) => ({ ...f, roles: f.roles.filter((_, i) => i !== idx) }))}
                    aria-label={`Remove ${role}`}
                    title={`Remove ${role}`}
                  >
                    <span aria-hidden>−</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="user-detail-roles-add">
              <select
                className="user-detail-input user-detail-select user-detail-roles-select"
                value=""
                onChange={(e) => {
                  const v = e.target.value
                  if (v) {
                    setFormData((f) => ({ ...f, roles: [...f.roles, v] }))
                    e.target.value = ''
                  }
                }}
                aria-label="Add role"
                disabled={!ROLE_OPTIONS.some((r) => !form.roles.includes(r))}
              >
                <option value="">Add role…</option>
                {ROLE_OPTIONS.filter((r) => !form.roles.includes(r)).map((r) => (
                  <option key={r} value={r}>
                    {r === 'BUYER' ? 'Buyer' : r === 'DEALER' ? 'Dealer' : 'Admin'}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="user-detail-role-add-btn"
                onClick={() => {
                  const available = ROLE_OPTIONS.filter((r) => !form.roles.includes(r))
                  if (available.length) setFormData((f) => ({ ...f, roles: [...f.roles, available[0]] }))
                }}
                aria-label="Add role"
                title="Add role"
                disabled={!ROLE_OPTIONS.some((r) => !form.roles.includes(r))}
              >
                <span aria-hidden>+</span>
              </button>
            </div>
          </div>
          <div className="user-detail-header-edit-actions">
            <button type="button" className="user-detail-table-cancel-btn" onClick={cancelEditingProfile} disabled={submittingProfile}>
              Cancel
            </button>
            <button type="button" className="user-detail-table-save-btn" onClick={handleSaveProfile} disabled={submittingProfile}>
              {submittingProfile ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </header>
  )

  const formatMoney = (n) =>
    n != null ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const selectedYearMonth = summaryMonth && summaryYear
    ? `${summaryYear}-${String(summaryMonth).padStart(2, '0')}`
    : `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const purchasesThisMonthList = purchases.filter((p) => {
    const d = p.date ?? p.purchaseDate ?? ''
    return String(d).slice(0, 7) === selectedYearMonth
  })

  function getPurchaseCommissionsList(p) {
    return p.commissions ?? p.purchaseCommissions ?? p.commission_list ?? []
  }

  function getPurchaseCommissionTotal(p) {
    const list = getPurchaseCommissionsList(p)
    if (Array.isArray(list) && list.length > 0) {
      return list.reduce(
        (sum, c) => sum + (typeof c === 'number' ? c : Number(c?.amount ?? c?.value ?? 0) || 0),
        0
      )
    }
    return Number(p.commission ?? p.commissionAmount ?? p.serviceFee ?? p.service_fee) || 0
  }

  const selectedMonthTotalCommissions = purchasesThisMonthList.reduce(
    (sum, p) => sum + getPurchaseCommissionTotal(p),
    0
  )
  const commissionBreakdown = (() => {
    const byAmount = {}
    for (const p of purchasesThisMonthList) {
      const list = getPurchaseCommissionsList(p)
      const total = getPurchaseCommissionTotal(p)
      if (Array.isArray(list) && list.length > 0) {
        for (const c of list) {
          const amt = typeof c === 'number' ? c : Number(c?.amount ?? c?.value ?? 0) || 0
          byAmount[amt] = (byAmount[amt] || 0) + 1
        }
      } else {
        byAmount[total] = (byAmount[total] || 0) + 1
      }
    }
    const entries = Object.entries(byAmount).sort((a, b) => Number(b[0]) - Number(a[0]))
    return entries.length === 0 ? '—' : entries.map(([amt, count]) => `(${formatMoney(Number(amt))} × ${count})`).join('\n')
  })()

  const monthPurchasesTable = (
    <div className="user-detail-commission-card">
      <h3 className="user-detail-commission-title">Purchases</h3>
      <div className="user-detail-summary-table-wrap">
        <table className="user-detail-commission-table user-detail-purchases-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Dealership</th>
              <th>Date</th>
              <th>Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchasesLoading ? (
              <tr>
                <td colSpan={5} className="user-detail-commission-empty">Loading…</td>
              </tr>
            ) : purchasesThisMonthList.length === 0 ? (
              <tr>
                <td colSpan={5} className="user-detail-commission-empty">No purchases for selected month.</td>
              </tr>
            ) : (
              purchasesThisMonthList.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/purchases/${p.id}`} className="user-detail-link">
                      {p.vin ?? '—'}
                    </Link>
                  </td>
                  <td>
                    {(p.dealershipId ?? p.dealership_id) ? (
                      <Link to={`/dealerships/${p.dealershipId ?? p.dealership_id}`} className="user-detail-link">
                        {p.dealershipName ?? p.dealership_name ?? '—'}
                      </Link>
                    ) : (
                      p.dealershipName ?? p.dealership_name ?? '—'
                    )}
                  </td>
                  <td>{toLocalDateStr(p.date ?? p.purchaseDate ?? p.purchase_date) || '—'}</td>
                  <td>{formatMoney(getPurchaseCommissionTotal(p))}</td>
                  <td>{p.status ?? p.purchaseStatus ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const summaryBlock = (
    <div className="user-detail-summary">
      <div className="user-detail-summary-filters">
        <label className="user-detail-filter-label">
          Month
          <select
            className="user-detail-filter-select"
            value={summaryMonth ?? ''}
            onChange={(e) => setSummaryMonth(e.target.value ? Number(e.target.value) : currentMonth)}
          >
            <option value="">Select month</option>
            {monthsForYear.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </label>
        <label className="user-detail-filter-label">
          Year
          <select
            className="user-detail-filter-select"
            value={summaryYear ?? ''}
            onChange={(e) => setSummaryYear(e.target.value ? Number(e.target.value) : currentYear)}
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="user-detail-summary-row">
        <div className="user-detail-summary-left">
          {monthPurchasesTable}
        </div>
        <div className="user-detail-summary-right">
          {purchasesLoading ? (
            <p className="user-detail-loading">Loading…</p>
          ) : (
            <dl className="user-detail-summary-dl">
              <dt>Number of purchases</dt>
              <dd>{purchasesThisMonthList.length}</dd>
              <dt>Commissions</dt>
              <dd className="user-detail-summary-breakdown">{commissionBreakdown}</dd>
              <dt>Total invoice</dt>
              <dd className="user-detail-summary-total">{formatMoney(selectedMonthTotalCommissions)}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="user-detail-page">
      <div className="user-detail-top-bar">
        <Link to="/users" className="user-detail-back">← Back to Users</Link>
      </div>

      {userHeader}
      <section className="user-detail-section">
        {submitError && (
          <div className="user-detail-submit-error" role="alert">
            {submitError}
          </div>
        )}
        <div className="user-detail-tables-row">
          <UserDealershipsTable user={user} userId={id} onUserUpdated={setUser} />
          <UserCommissionRulesTable user={user} userId={id} onUserUpdated={setUser} />
        </div>
        {summaryBlock}
      </section>
    </div>
  )
}
