import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
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

function isCommissionRuleExpired(rule) {
  const status = (rule.status ?? rule.ruleStatus ?? '').toString().toUpperCase()
  return status === 'EXPIRED'
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
  const [editingCommissionRules, setEditingCommissionRules] = useState(false)
  const [editingDealerships, setEditingDealerships] = useState(false)
  const [formData, setFormData] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submittingRules, setSubmittingRules] = useState(false)
  const [submittingDealerships, setSubmittingDealerships] = useState(false)
  const [availableRules, setAvailableRules] = useState([])
  const [availableDealerships, setAvailableDealerships] = useState([])
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [summaryMonth, setSummaryMonth] = useState(currentMonth)
  const [summaryYear, setSummaryYear] = useState(currentYear)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchRules() {
      try {
        const res = await authFetch(`${getApiBase()}/api/commission-rules`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAvailableRules(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
    }
    fetchRules()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!editingDealerships || !token) return
    let cancelled = false
    async function fetchDealerships() {
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAvailableDealerships(Array.isArray(data) ? data : data.dealerships || data.content || [])
        }
      } catch (_) {}
    }
    fetchDealerships()
    return () => { cancelled = true }
  }, [editingDealerships, token])

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

  function getRuleName(ruleId) {
    const r = availableRules.find((x) => x.id === ruleId)
    return r ? (r.ruleName ?? r.rule_name ?? r.id) : ruleId ?? '—'
  }

  function startEditingCommissionRules() {
    setFormData((prev) => prev ?? toFormData(user))
    setEditingCommissionRules(true)
    setSubmitError('')
  }

  function cancelEditingCommissionRules() {
    setEditingCommissionRules(false)
    setFormData((prev) => {
      if (!prev || !editingDealerships) return null
      const fresh = toFormData(user)
      return { ...prev, commissionRules: fresh.commissionRules }
    })
    setSubmitError('')
  }

  async function handleSaveCommissionRules(e) {
    e?.preventDefault?.()
    if (!formData) return
    setSubmitError('')
    setSubmittingRules(true)
    try {
      const body = toUpdateBody(formData)
      const res = await authFetch(`${getApiBase()}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Update failed (${res.status})`)
        setSubmittingRules(false)
        return
      }
      const data = await res.json()
      setUser(data?.data ?? data)
      setEditingCommissionRules(false)
      setFormData((prev) => (editingDealerships && prev ? { ...prev, commissionRules: (data?.data ?? data)?.userCommissionRules ?? (data?.data ?? data)?.commissionRules ?? prev.commissionRules } : null))
    } catch (err) {
      setSubmitError(err.message || 'Failed to update commission rules')
    } finally {
      setSubmittingRules(false)
    }
  }

  function startEditingDealerships() {
    setFormData((prev) => prev ?? toFormData(user))
    setEditingDealerships(true)
    setSubmitError('')
  }

  function cancelEditingDealerships() {
    setEditingDealerships(false)
    setFormData((prev) => {
      if (!prev || !editingCommissionRules) return null
      const fresh = toFormData(user)
      return { ...prev, dealershipRoles: fresh.dealershipRoles }
    })
    setSubmitError('')
  }

  async function handleSaveDealerships(e) {
    e?.preventDefault?.()
    if (!formData) return
    setSubmitError('')
    setSubmittingDealerships(true)
    try {
      const userEmail = (formData.email ?? user.email ?? '').toString().trim()
      const initialDealershipIds = new Set(
        (user.dealershipRoles ?? user.dealership_roles ?? []).map((d) => d.dealershipId ?? d.dealership_id).filter(Boolean)
      )
      const formDealershipIds = new Set(
        formData.dealershipRoles.map((d) => d.dealershipId).filter(Boolean)
      )
      for (const dealershipId of initialDealershipIds) {
        if (!formDealershipIds.has(dealershipId)) {
          const delRes = await authFetch(`${getApiBase()}/api/users/${id}/dealerships/${dealershipId}`, { method: 'DELETE' })
          if (!delRes.ok && delRes.status !== 404) {
            const errData = await delRes.json().catch(() => ({}))
            setSubmitError(errData.message || errData.error || `Failed to remove from dealership (${delRes.status})`)
            setSubmittingDealerships(false)
            return
          }
        }
      }
      for (const d of formData.dealershipRoles) {
        if (!d.dealershipId) continue
        const apiRole = d.role === 'BUYER' ? 'ASSOCIATE' : d.role
        const addRes = await authFetch(`${getApiBase()}/api/users/dealerships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail, dealershipId: d.dealershipId, role: apiRole }),
        })
        if (!addRes.ok) {
          const errData = await addRes.json().catch(() => ({}))
          setSubmitError(errData.message || errData.error || `Failed to add/update dealership (${addRes.status})`)
          setSubmittingDealerships(false)
          return
        }
      }
      let updatedUser = user
      const refetchRes = await authFetch(`${getApiBase()}/api/users/${id}`)
      if (refetchRes.ok) {
        const refetchData = await refetchRes.json()
        updatedUser = refetchData?.data ?? refetchData
        setUser(updatedUser)
      }
      setEditingDealerships(false)
      setFormData((prev) => (editingCommissionRules && prev ? { ...prev, dealershipRoles: toFormData(updatedUser).dealershipRoles } : null))
    } catch (err) {
      setSubmitError(err.message || 'Failed to update dealerships')
    } finally {
      setSubmittingDealerships(false)
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

  const editing = editingCommissionRules || editingDealerships
  const infoLine = !editing
    ? [email, user.phone ?? user.phoneNumber, formatRoles(user.roles ?? user.role ?? user.userRole)].filter(Boolean).join(' · ') || '—'
    : null

  const userHeader = (
    <header className="user-detail-header">
      {!editing ? (
        <>
          <h2 className="user-detail-title">{displayName}</h2>
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
        </div>
      )}
    </header>
  )

  const DEALERSHIP_ROLE_OPTIONS = [
    { value: 'BUYER', label: 'BUYER' },
    { value: 'ADMIN', label: 'ADMIN' },
  ]

  const dealershipRolesData = editingDealerships ? form.dealershipRoles : (user.dealershipRoles ?? user.dealership_roles ?? [])

  const dealershipsTable = (
    <div className="user-detail-commission-card">
      <div className="user-detail-card-header-row">
        <h3 className="user-detail-commission-title">Dealerships</h3>
        {!editingDealerships ? (
          <button type="button" className="user-detail-table-edit-btn" onClick={startEditingDealerships}>
            Edit
          </button>
        ) : (
          <div className="user-detail-table-edit-actions">
            <button type="button" className="user-detail-table-cancel-btn" onClick={cancelEditingDealerships} disabled={submittingDealerships}>
              Cancel
            </button>
            <button type="button" className="user-detail-table-save-btn" onClick={handleSaveDealerships} disabled={submittingDealerships}>
              {submittingDealerships ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="user-detail-commission-table-wrap">
        <table className="user-detail-commission-table">
          <thead>
            <tr>
              <th>Dealership</th>
              <th>Role</th>
              {editingDealerships && <th className="user-detail-commission-th-action">Remove</th>}
            </tr>
          </thead>
          <tbody>
            {!editingDealerships ? (
              dealershipRolesData.length > 0 ? (
                dealershipRolesData.map((d) => {
                  const id = d.dealershipId ?? d.dealership_id
                  const name = d.dealershipName ?? d.dealership_name ?? '—'
                  const apiRole = d.role ?? '—'
                  const displayRole = apiRole === 'ASSOCIATE' ? 'BUYER' : apiRole
                  return (
                    <tr key={id}>
                      <td>
                        {id ? (
                          <Link to={`/dealerships/${id}`} className="user-detail-link">
                            {name}
                          </Link>
                        ) : (
                          name
                        )}
                      </td>
                      <td>{displayRole}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={2} className="user-detail-commission-empty">No dealerships.</td>
                </tr>
              )
            ) : form.dealershipRoles.length === 0 ? (
              <tr>
                <td colSpan={3} className="user-detail-commission-empty">No dealerships. Use the + button below to add.</td>
              </tr>
            ) : (
              form.dealershipRoles.map((d, idx) => (
                <tr key={d.dealershipId ? `${d.dealershipId}-${idx}` : `new-${idx}`}>
                  <td>
                    <select
                      className="user-detail-input user-detail-commission-table-select"
                      value={d.dealershipId}
                      onChange={(e) => {
                        const sel = availableDealerships.find((x) => (x.id ?? x.dealershipId) === e.target.value)
                        setFormData((f) => ({
                          ...f,
                          dealershipRoles: f.dealershipRoles.map((x, i) =>
                            i === idx
                              ? {
                                  ...x,
                                  dealershipId: e.target.value,
                                  dealershipName: sel ? (sel.name ?? sel.dealershipName ?? '') : '',
                                }
                              : x
                          ),
                        }))
                      }}
                      required
                    >
                      <option value="">Select dealership</option>
                      {availableDealerships.map((dealership) => {
                        const did = dealership.id ?? dealership.dealershipId
                        const dname = dealership.name ?? dealership.dealershipName ?? did
                        return (
                          <option key={did} value={did}>
                            {dname}
                          </option>
                        )
                      })}
                    </select>
                  </td>
                  <td>
                    <select
                      className="user-detail-input user-detail-commission-table-select"
                      value={d.role}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          dealershipRoles: f.dealershipRoles.map((x, i) =>
                            i === idx ? { ...x, role: e.target.value } : x
                          ),
                        }))
                      }
                    >
                      {DEALERSHIP_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="user-detail-commission-td-action">
                    <button
                      type="button"
                      className="user-detail-role-remove"
                      onClick={() =>
                        setFormData((f) => ({
                          ...f,
                          dealershipRoles: f.dealershipRoles.filter((_, i) => i !== idx),
                        }))
                      }
                      aria-label="Remove dealership"
                      title="Remove"
                    >
                      <span aria-hidden>−</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editingDealerships && (
        <div className="user-detail-commission-add">
          <button
            type="button"
            className="user-detail-role-add-btn"
            onClick={() => {
              setFormData((f) => ({
                ...f,
                dealershipRoles: [
                  ...f.dealershipRoles,
                  { dealershipId: '', dealershipName: '', role: 'BUYER' },
                ],
              }))
            }}
            aria-label="Add dealership"
            title="Add dealership"
            disabled={availableDealerships.length === 0}
          >
            <span aria-hidden>+</span>
          </button>
          <span className="user-detail-commission-add-label">Add dealership</span>
        </div>
      )}
    </div>
  )

  const commissionRulesDataRaw = editingCommissionRules ? form.commissionRules : (user.userCommissionRules ?? user.commissionRules ?? [])
  const commissionRulesData = editingCommissionRules
    ? commissionRulesDataRaw
    : [...commissionRulesDataRaw].sort((a, b) => {
        const aExp = isCommissionRuleExpired(a)
        const bExp = isCommissionRuleExpired(b)
        if (aExp === bExp) return 0
        return aExp ? 1 : -1
      })

  const commissionTable = (
    <div className="user-detail-commission-card">
      <div className="user-detail-card-header-row">
        <h3 className="user-detail-commission-title">Commission Rules</h3>
        {!editingCommissionRules ? (
          <button type="button" className="user-detail-table-edit-btn" onClick={startEditingCommissionRules}>
            Edit
          </button>
        ) : (
          <div className="user-detail-table-edit-actions">
            <button type="button" className="user-detail-table-cancel-btn" onClick={cancelEditingCommissionRules} disabled={submittingRules}>
              Cancel
            </button>
            <button type="button" className="user-detail-table-save-btn" onClick={handleSaveCommissionRules} disabled={submittingRules}>
              {submittingRules ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="user-detail-commission-table-wrap">
      <table className="user-detail-commission-table">
        <thead>
          <tr>
            <th>Rule</th>
            <th>Start Date</th>
            <th className="user-detail-col-end-after">End After (Date / Sales)</th>
            <th className="user-detail-col-level">Level</th>
            {editingCommissionRules && <th className="user-detail-commission-th-action">Remove</th>}
          </tr>
        </thead>
        <tbody>
          {!editingCommissionRules ? (
            commissionRulesData.length > 0 ? (
              commissionRulesData.map((a, idx) => {
                const expired = isCommissionRuleExpired(a)
                return (
                  <tr key={idx} className={expired ? 'user-detail-commission-row-expired' : ''}>
                    <td>{getRuleName(a.ruleId ?? a.rule_id)}</td>
                    <td>{toLocalDateStr(a.startDate ?? a.start_date) || '—'}</td>
                    <td className="user-detail-col-end-after">
                      <span className="user-detail-end-after-cell">
                        {toLocalDateStr(a.endDate ?? a.end_date) || '—'} / {((a.numberOfSales ?? a.number_of_sales) != null) ? `${a.numberOfSales ?? a.number_of_sales} sales` : '—'}
                        {expired && <span className="user-detail-rule-expired-label">Expired</span>}
                      </span>
                    </td>
                    <td className="user-detail-col-level">{a.level != null ? a.level : '—'}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={4} className="user-detail-commission-empty">No commission rules.</td>
              </tr>
            )
          ) : form?.commissionRules?.length === 0 ? (
            <tr>
              <td colSpan={5} className="user-detail-commission-empty">No commission rules. Use the + button below to add.</td>
            </tr>
          ) : (
            (form?.commissionRules ?? []).map((r, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    className="user-detail-input user-detail-commission-table-select"
                    value={r.ruleId}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        commissionRules: f.commissionRules.map((x, i) =>
                          i === idx ? { ...x, ruleId: e.target.value } : x
                        ),
                      }))
                    }
                    required
                  >
                    <option value="">Select rule</option>
                    {availableRules.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.ruleName ?? rule.rule_name} ({rule.amount} {rule.commissionType ?? rule.commission_type})
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="date"
                    className="user-detail-input user-detail-commission-table-input"
                    value={r.startDate}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        commissionRules: f.commissionRules.map((x, i) =>
                          i === idx ? { ...x, startDate: e.target.value } : x
                        ),
                      }))
                    }
                    required
                    aria-label="Start date"
                  />
                </td>
                <td className="user-detail-td-end-after user-detail-col-end-after">
                  <div className="user-detail-end-after-inputs">
                    <input
                      type="date"
                      className="user-detail-input user-detail-commission-table-input"
                      value={r.endDate}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          commissionRules: f.commissionRules.map((x, i) =>
                            i === idx ? { ...x, endDate: e.target.value } : x
                          ),
                        }))
                      }
                      aria-label="End date"
                    />
                    <input
                      type="number"
                      className="user-detail-input user-detail-commission-table-num"
                      min={0}
                      value={r.numberOfSales == null || r.numberOfSales === '' ? '' : r.numberOfSales}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          commissionRules: f.commissionRules.map((x, i) =>
                            i === idx
                              ? { ...x, numberOfSales: e.target.value === '' ? null : Number(e.target.value) }
                              : x
                          ),
                        }))
                      }
                      aria-label="End after (sales)"
                    />
                  </div>
                </td>
                <td className="user-detail-col-level">
                  <input
                    type="number"
                    className="user-detail-input user-detail-commission-table-num"
                    min={0}
                    value={r.level === null || r.level === '' ? '' : r.level}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        commissionRules: f.commissionRules.map((x, i) =>
                          i === idx ? { ...x, level: e.target.value === '' ? 1 : Number(e.target.value) } : x
                        ),
                      }))
                    }
                    aria-label="Level"
                  />
                </td>
                <td className="user-detail-commission-td-action">
                  <button
                    type="button"
                    className="user-detail-role-remove"
                    onClick={() =>
                      setFormData((f) => ({
                        ...f,
                        commissionRules: f.commissionRules.filter((_, i) => i !== idx),
                      }))
                    }
                    aria-label="Remove rule"
                    title="Remove"
                  >
                    <span aria-hidden>−</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
      {editingCommissionRules && (
        <div className="user-detail-commission-add">
          <button
            type="button"
            className="user-detail-role-add-btn"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              const firstRuleId = availableRules.length ? availableRules[0].id : ''
              setFormData((f) => ({
                ...f,
                commissionRules: [
                  ...(f.commissionRules ?? []),
                  { ruleId: firstRuleId, startDate: today, endDate: '', level: 1, numberOfSales: null },
                ],
              }))
            }}
            aria-label="Add commission rule"
            title="Add commission rule"
            disabled={availableRules.length === 0}
          >
            <span aria-hidden>+</span>
          </button>
          <span className="user-detail-commission-add-label">Add commission rule</span>
        </div>
      )}
    </div>
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
            </tr>
          </thead>
          <tbody>
            {purchasesLoading ? (
              <tr>
                <td colSpan={4} className="user-detail-commission-empty">Loading…</td>
              </tr>
            ) : purchasesThisMonthList.length === 0 ? (
              <tr>
                <td colSpan={4} className="user-detail-commission-empty">No purchases for selected month.</td>
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
        {(editingCommissionRules || editingDealerships) && submitError && (
          <div className="user-detail-submit-error" role="alert">
            {submitError}
          </div>
        )}
        <div className="user-detail-tables-row">
          {dealershipsTable}
          {commissionTable}
        </div>
        {summaryBlock}
      </section>
    </div>
  )
}
