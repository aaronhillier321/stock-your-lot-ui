import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './DealershipDetail.css'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const YEARS = [currentYear, currentYear - 1, currentYear - 2]

const DEALERSHIP_ROLE_OPTIONS = [
  { value: 'BUYER', label: 'BUYER' },
  { value: 'ADMIN', label: 'ADMIN' },
]

function toLocalDateStr(dateVal) {
  if (dateVal == null) return ''
  if (typeof dateVal === 'string') return dateVal.slice(0, 10)
  return ''
}

function toFormData(dealership, usersAtDealership) {
  const raw = dealership.dealerPremiumRules ?? dealership.dealer_premium_rules ?? []
  const premiumRules = Array.isArray(raw)
    ? raw.map((a) => ({
        ruleId: a.ruleId ?? a.rule_id ?? '',
        startDate: toLocalDateStr(a.startDate ?? a.start_date),
        endDate: toLocalDateStr(a.endDate ?? a.end_date),
        level: a.level != null ? a.level : 1,
        numberOfSales: a.numberOfSales ?? a.number_of_sales ?? null,
      }))
    : []
  const dealershipUsers = (usersAtDealership || []).map((u) => {
    const roles = u.dealershipRoles ?? u.dealership_roles ?? []
    const d = roles.find((r) => (r.dealershipId ?? r.dealership_id) === dealership.id)
    return {
      userId: u.id,
      email: u.email ?? u.username ?? '',
      userName: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || (u.email ?? u.username ?? ''),
      role: (d?.role === 'ASSOCIATE' ? 'BUYER' : d?.role === 'ADMIN' ? 'ADMIN' : 'BUYER') || 'BUYER',
    }
  })
  return { premiumRules, dealershipUsers }
}

function toDealershipUpdateBody(form) {
  const body = {}
  if (form.premiumRules && form.premiumRules.length > 0) {
    body.dealerPremiumRules = form.premiumRules
      .filter((r) => r.ruleId && r.startDate)
      .map((r) => ({
        ruleId: r.ruleId,
        startDate: r.startDate,
        endDate: r.endDate || null,
        level: r.level != null && r.level !== '' ? Number(r.level) : 1,
        numberOfSales: r.numberOfSales != null && r.numberOfSales !== '' ? Number(r.numberOfSales) : null,
      }))
  } else {
    body.dealerPremiumRules = []
  }
  return body
}

export default function DealershipDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [dealership, setDealership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [users, setUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [premiumRules, setPremiumRules] = useState([])
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [summaryMonth, setSummaryMonth] = useState(currentMonth)
  const [summaryYear, setSummaryYear] = useState(currentYear)
  const [editingCommissionRules, setEditingCommissionRules] = useState(false)
  const [editingUsers, setEditingUsers] = useState(false)
  const [formData, setFormData] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submittingRules, setSubmittingRules] = useState(false)
  const [submittingUsers, setSubmittingUsers] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    async function fetchDealership() {
      if (!id || !token) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships/${id}`)
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setError('Dealership not found.')
          else if (res.status === 401) return
          else if (!cancelled) {
            const data = await res.json().catch(() => ({}))
            setError(data.message || `Failed to load (${res.status})`)
          }
          setDealership(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setDealership(data?.data ?? data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load dealership')
          setDealership(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchDealership()
    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchPremiumRules() {
      try {
        const res = await authFetch(`${getApiBase()}/api/premium-rules`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPremiumRules(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
    }
    fetchPremiumRules()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!id || !token) return
    let cancelled = false
    setUsersLoading(true)
    async function fetchUsers() {
      try {
        const res = await authFetch(`${getApiBase()}/api/users`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          const list = Array.isArray(data) ? data : data.users || data.content || []
          setAllUsers(list)
          const atDealership = list.filter((u) => {
            const roles = u.dealershipRoles ?? u.dealership_roles ?? []
            return roles.some((d) => (d.dealershipId ?? d.dealership_id) === id)
          })
          setUsers(atDealership)
        }
      } catch (_) {}
      if (!cancelled) setUsersLoading(false)
    }
    fetchUsers()
    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    if (!id || !token) return
    let cancelled = false
    setPurchasesLoading(true)
    async function fetchPurchases() {
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships/${id}/purchases`)
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
    if (y === currentYear) {
      return MONTHS.filter((m) => m.value <= currentMonth)
    }
    return MONTHS
  }, [summaryYear])

  useEffect(() => {
    if (summaryYear === currentYear && summaryMonth > currentMonth) {
      setSummaryMonth(currentMonth)
    }
  }, [summaryYear, summaryMonth])

  function getRuleName(ruleId) {
    const r = premiumRules.find((x) => x.id === ruleId)
    if (!r) return ruleId ?? '—'
    const name = r.ruleName ?? r.rule_name ?? r.id
    const amount = r.amount != null ? r.amount : '—'
    const type = r.premiumType ?? r.premium_type ?? '—'
    return `${name} (${amount} ${type})`
  }

  function getRoleAtDealership(user) {
    const roles = user.dealershipRoles ?? user.dealership_roles ?? []
    const d = roles.find((r) => (r.dealershipId ?? r.dealership_id) === id)
    const apiRole = d?.role ?? '—'
    return apiRole === 'ASSOCIATE' ? 'BUYER' : apiRole
  }

  function startEditingCommissionRules() {
    setFormData((prev) => prev ?? toFormData(dealership, users))
    setEditingCommissionRules(true)
    setSubmitError('')
  }

  function cancelEditingCommissionRules() {
    setEditingCommissionRules(false)
    setFormData((prev) => {
      if (!prev || !editingUsers) return null
      const fresh = toFormData(dealership, users)
      return { ...prev, premiumRules: fresh.premiumRules }
    })
    setSubmitError('')
  }

  async function handleSaveCommissionRules(e) {
    e?.preventDefault?.()
    if (!formData) return
    setSubmitError('')
    setSubmittingRules(true)
    try {
      const body = toDealershipUpdateBody(formData)
      const res = await authFetch(`${getApiBase()}/api/dealerships/${id}`, {
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
      setDealership(data?.data ?? data)
      setEditingCommissionRules(false)
      setFormData((prev) => (editingUsers && prev ? { ...prev, premiumRules: (data?.data ?? data)?.dealerPremiumRules ?? (data?.data ?? data)?.dealer_premium_rules ?? prev.premiumRules } : null))
    } catch (err) {
      setSubmitError(err.message || 'Failed to update commission rules')
    } finally {
      setSubmittingRules(false)
    }
  }

  function startEditingUsers() {
    setFormData((prev) => prev ?? toFormData(dealership, users))
    setEditingUsers(true)
    setSubmitError('')
  }

  function cancelEditingUsers() {
    setEditingUsers(false)
    setFormData((prev) => {
      if (!prev || !editingCommissionRules) return null
      const fresh = toFormData(dealership, users)
      return { ...prev, dealershipUsers: fresh.dealershipUsers }
    })
    setSubmitError('')
  }

  async function handleSaveUsers(e) {
    e?.preventDefault?.()
    if (!formData) return
    setSubmitError('')
    setSubmittingUsers(true)
    try {
      const initialUserIds = new Set(users.map((u) => u.id))
      const formUserIds = new Set(formData.dealershipUsers.map((d) => d.userId).filter(Boolean))
      for (const userId of initialUserIds) {
        if (!formUserIds.has(userId)) {
          const delRes = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships/${id}`, { method: 'DELETE' })
          if (!delRes.ok && delRes.status !== 404) {
            const errData = await delRes.json().catch(() => ({}))
            setSubmitError(errData.message || errData.error || `Failed to remove user (${delRes.status})`)
            setSubmittingUsers(false)
            return
          }
        }
      }
      for (const d of formData.dealershipUsers) {
        if (!d.userId || !d.email) continue
        const addRes = await authFetch(`${getApiBase()}/api/users/dealerships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: d.email,
            dealershipId: id,
            role: d.role === 'BUYER' ? 'ASSOCIATE' : d.role,
          }),
        })
        if (!addRes.ok) {
          const errData = await addRes.json().catch(() => ({}))
          setSubmitError(errData.message || errData.error || `Failed to add/update user (${addRes.status})`)
          setSubmittingUsers(false)
          return
        }
      }
      let updatedUsers = users
      const usersRes = await authFetch(`${getApiBase()}/api/users`)
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        const list = Array.isArray(usersData) ? usersData : usersData.users || usersData.content || []
        setAllUsers(list)
        updatedUsers = list.filter((u) => {
          const roles = u.dealershipRoles ?? u.dealership_roles ?? []
          return roles.some((d) => (d.dealershipId ?? d.dealership_id) === id)
        })
        setUsers(updatedUsers)
      }
      setEditingUsers(false)
      setFormData((prev) => (editingCommissionRules && prev ? { ...prev, dealershipUsers: toFormData(dealership, updatedUsers).dealershipUsers } : null))
    } catch (err) {
      setSubmitError(err.message || 'Failed to update users')
    } finally {
      setSubmittingUsers(false)
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault()
    const email = inviteEmail.trim()
    if (!email) {
      setInviteError('Please enter an email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setInviteError('Please enter a valid email address.')
      return
    }
    setInviteError('')
    setInviteSuccess('')
    setInviteSending(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, dealershipId: id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setInviteError(data.message || data.error || `Invite failed (${res.status})`)
        return
      }
      setInviteSuccess(`Invitation sent to ${email}.`)
      setInviteEmail('')
      setTimeout(() => {
        setShowInviteModal(false)
        setInviteSuccess('')
      }, 1500)
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite')
    } finally {
      setInviteSending(false)
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (loading) return <div className="dealership-detail-page"><p className="dealership-detail-loading">Loading…</p></div>
  if (error && !dealership) {
    return (
      <div className="dealership-detail-page">
        <p className="dealership-detail-error">{error}</p>
        <Link to="/dealerships" className="dealership-detail-back">← Back to dealerships</Link>
      </div>
    )
  }
  if (!dealership) return null

  const form = formData
  const premiumRulesData = editingCommissionRules ? (form?.premiumRules ?? []) : (dealership.dealerPremiumRules ?? dealership.dealer_premium_rules ?? [])
  const usersData = editingUsers ? (form?.dealershipUsers ?? []) : users
  const availableToAdd = editingUsers ? allUsers.filter((u) => !(form?.dealershipUsers ?? []).some((d) => d.userId === u.id)) : []

  const premiumRulesTable = (
    <div className="dealership-detail-card">
      <div className="dealership-detail-card-header-row">
        <h3 className="dealership-detail-card-title">Premium Rules</h3>
        {!editingCommissionRules ? (
          <button type="button" className="dealership-detail-table-edit-btn" onClick={startEditingCommissionRules}>
            Edit
          </button>
        ) : (
          <div className="dealership-detail-table-edit-actions">
            <button type="button" className="dealership-detail-table-cancel-btn" onClick={cancelEditingCommissionRules} disabled={submittingRules}>
              Cancel
            </button>
            <button type="button" className="dealership-detail-table-save-btn" onClick={handleSaveCommissionRules} disabled={submittingRules}>
              {submittingRules ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="dealership-detail-table-wrap-inner">
        <table className="dealership-detail-table dealership-detail-commission-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th className="dealership-detail-col-start-date">Start Date</th>
              <th className="dealership-detail-col-end-after">End After (Date / Sales)</th>
              <th className="dealership-detail-col-level">Level</th>
              {editingCommissionRules && <th className="dealership-detail-th-action">Remove</th>}
            </tr>
          </thead>
          <tbody>
            {!editingCommissionRules ? (
              premiumRulesData.length > 0 ? (
                premiumRulesData.map((a, idx) => (
                  <tr key={a.ruleId ?? a.rule_id ?? idx}>
                    <td>{getRuleName(a.ruleId ?? a.rule_id)}</td>
                    <td className="dealership-detail-col-start-date">{toLocalDateStr(a.startDate ?? a.start_date) || '—'}</td>
                    <td className="dealership-detail-col-end-after">{toLocalDateStr(a.endDate ?? a.end_date) || '—'} / {((a.numberOfSales ?? a.number_of_sales) != null) ? `${a.numberOfSales ?? a.number_of_sales} sales` : '—'}</td>
                    <td className="dealership-detail-col-level">{a.level != null ? a.level : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="dealership-detail-empty-cell">No commission rules.</td>
                </tr>
              )
            ) : (form?.premiumRules ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="dealership-detail-empty-cell">No commission rules. Use + below to add.</td>
              </tr>
            ) : (
              (form?.premiumRules ?? []).map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="dealership-detail-input dealership-detail-table-select"
                      value={r.ruleId}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          premiumRules: (f.premiumRules ?? []).map((x, i) => (i === idx ? { ...x, ruleId: e.target.value } : x)),
                        }))
                      }
                      required
                    >
                      <option value="">Select rule</option>
                      {premiumRules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                          {rule.ruleName ?? rule.rule_name} ({rule.amount} {rule.premiumType ?? rule.premium_type})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="dealership-detail-col-start-date">
                    <input
                      type="date"
                      className="dealership-detail-input dealership-detail-table-input"
                      value={r.startDate}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          premiumRules: (f.premiumRules ?? []).map((x, i) => (i === idx ? { ...x, startDate: e.target.value } : x)),
                        }))
                      }
                      required
                      aria-label="Start date"
                    />
                  </td>
                  <td className="dealership-detail-td-end-after dealership-detail-col-end-after">
                    <div className="dealership-detail-end-after-inputs">
                      <input
                        type="date"
                        className="dealership-detail-input dealership-detail-table-input"
                        value={r.endDate}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            premiumRules: (f.premiumRules ?? []).map((x, i) => (i === idx ? { ...x, endDate: e.target.value } : x)),
                          }))
                        }
                        aria-label="End date"
                      />
                      <input
                        type="number"
                        className="dealership-detail-input dealership-detail-table-num"
                        min={0}
                        value={r.numberOfSales == null || r.numberOfSales === '' ? '' : r.numberOfSales}
                        onChange={(e) =>
                          setFormData((f) => ({
                            ...f,
                            premiumRules: (f.premiumRules ?? []).map((x, i) =>
                              i === idx ? { ...x, numberOfSales: e.target.value === '' ? null : Number(e.target.value) } : x
                            ),
                          }))
                        }
                        aria-label="End after (sales)"
                      />
                    </div>
                  </td>
                  <td className="dealership-detail-col-level">
                    <input
                      type="number"
                      className="dealership-detail-input dealership-detail-table-num"
                      min={0}
                      value={r.level === null || r.level === '' ? '' : r.level}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          premiumRules: (f.premiumRules ?? []).map((x, i) =>
                            i === idx ? { ...x, level: e.target.value === '' ? 1 : Number(e.target.value) } : x
                          ),
                        }))
                      }
                      aria-label="Level"
                    />
                  </td>
                  <td className="dealership-detail-td-action">
                    <button
                      type="button"
                      className="dealership-detail-role-remove"
                      onClick={() =>
                        setFormData((f) => ({ ...f, premiumRules: (f.premiumRules ?? []).filter((_, i) => i !== idx) }))
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
        <div className="dealership-detail-commission-add">
          <button
            type="button"
            className="dealership-detail-role-add-btn"
            onClick={() => {
              const today = new Date().toISOString().slice(0, 10)
              const firstRuleId = premiumRules.length ? premiumRules[0].id : ''
              setFormData((f) => ({
                ...f,
                premiumRules: [
                  ...(f.premiumRules ?? []),
                  { ruleId: firstRuleId, startDate: today, endDate: '', level: 1, numberOfSales: null },
                ],
              }))
            }}
            aria-label="Add commission rule"
            title="Add rule"
            disabled={premiumRules.length === 0}
          >
            <span aria-hidden>+</span>
          </button>
          <span className="dealership-detail-commission-add-label">Add commission rule</span>
        </div>
      )}
    </div>
  )

  const usersTable = (
    <div className="dealership-detail-card">
      <div className="dealership-detail-card-header-row">
        <h3 className="dealership-detail-card-title">Users</h3>
        {!editingUsers ? (
          <button type="button" className="dealership-detail-table-edit-btn" onClick={startEditingUsers}>
            Edit
          </button>
        ) : (
          <div className="dealership-detail-table-edit-actions">
            <button type="button" className="dealership-detail-table-cancel-btn" onClick={cancelEditingUsers} disabled={submittingUsers}>
              Cancel
            </button>
            <button type="button" className="dealership-detail-table-save-btn" onClick={handleSaveUsers} disabled={submittingUsers}>
              {submittingUsers ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="dealership-detail-table-wrap-inner">
        <table className="dealership-detail-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              {editingUsers && <th className="dealership-detail-th-action">Remove</th>}
            </tr>
          </thead>
          <tbody>
            {!editingUsers ? (
              usersLoading ? (
                <tr>
                  <td colSpan={2} className="dealership-detail-empty-cell">Loading…</td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const userId = u.id
                  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || (u.email ?? u.username ?? '—')
                  const role = getRoleAtDealership(u)
                  return (
                    <tr key={userId}>
                      <td>
                        <Link to={`/users/${userId}`} className="dealership-detail-link">
                          {name}
                        </Link>
                      </td>
                      <td>{role}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={2} className="dealership-detail-empty-cell">No users at this dealership.</td>
                </tr>
              )
            ) : (form?.dealershipUsers ?? []).length === 0 ? (
              <tr>
                <td colSpan={3} className="dealership-detail-empty-cell">No users. Use + below to add.</td>
              </tr>
            ) : (
              (form?.dealershipUsers ?? []).map((d, idx) => (
                <tr key={d.userId ?? idx}>
                  <td>
                    {d.userId ? (
                      <Link to={`/users/${d.userId}`} className="dealership-detail-link">
                        {d.userName || d.email || '—'}
                      </Link>
                    ) : (
                      d.userName || d.email || '—'
                    )}
                  </td>
                  <td>
                    <select
                      className="dealership-detail-input dealership-detail-table-select"
                      value={d.role}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          dealershipUsers: (f.dealershipUsers ?? []).map((x, i) =>
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
                  <td className="dealership-detail-td-action">
                    <button
                      type="button"
                      className="dealership-detail-role-remove"
                      onClick={() =>
                        setFormData((f) => ({
                          ...f,
                          dealershipUsers: (f.dealershipUsers ?? []).filter((_, i) => i !== idx),
                        }))
                      }
                      aria-label="Remove user"
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
      {editingUsers && (
        <div className="dealership-detail-commission-add dealership-detail-users-add-row">
          <div className="dealership-detail-users-add-select-wrap">
            <select
              className="dealership-detail-input dealership-detail-table-select"
              value=""
              onChange={(e) => {
                const userId = e.target.value
                if (!userId) return
                const u = allUsers.find((x) => x.id === userId)
                if (!u) return
                const roles = u.dealershipRoles ?? u.dealership_roles ?? []
                const d = roles.find((r) => (r.dealershipId ?? r.dealership_id) === id)
                setFormData((f) => ({
                  ...f,
                  dealershipUsers: [
                    ...(f.dealershipUsers ?? []),
                    {
                      userId: u.id,
                      email: u.email ?? u.username ?? '',
                      userName: [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || (u.email ?? u.username ?? ''),
                      role: (d?.role === 'ADMIN' ? 'ADMIN' : 'BUYER') || 'BUYER',
                    },
                  ],
                }))
              e.target.value = ''
              }}
              aria-label="Add user"
            >
              <option value="">Add user…</option>
              {availableToAdd.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(' ').trim() || (u.email ?? u.username ?? u.id)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="dealership-detail-add-user-btn dealership-detail-invite-btn-inline"
            onClick={() => { setInviteError(''); setInviteSuccess(''); setShowInviteModal(true); }}
          >
            Invite user
          </button>
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
  const selectedMonthTotalPremiums = purchasesThisMonthList.reduce(
    (sum, p) => sum + (p.serviceFee != null ? Number(p.serviceFee) : p.service_fee != null ? Number(p.service_fee) : 0),
    0
  )
  const premiumBreakdown = (() => {
    const byAmount = {}
    for (const p of purchasesThisMonthList) {
      const fee = p.serviceFee != null ? Number(p.serviceFee) : p.service_fee != null ? Number(p.service_fee) : 0
      if (fee > 0) {
        byAmount[fee] = (byAmount[fee] || 0) + 1
      }
    }
    const entries = Object.entries(byAmount).sort((a, b) => Number(b[0]) - Number(a[0]))
    return entries.length === 0
      ? '—'
      : entries.map(([amt, count]) => `(${formatMoney(amt)} × ${count})`).join(' ')
  })()

  const monthPurchasesTable = (
    <div className="dealership-detail-card">
      <h3 className="dealership-detail-card-title">Purchases</h3>
      <div className="dealership-detail-table-wrap-inner">
        <table className="dealership-detail-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Buyer</th>
              <th>Date</th>
              <th>Service Fee</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {purchasesLoading ? (
              <tr>
                <td colSpan={5} className="dealership-detail-empty-cell">Loading…</td>
              </tr>
            ) : purchasesThisMonthList.length === 0 ? (
              <tr>
                <td colSpan={5} className="dealership-detail-empty-cell">No purchases for selected month.</td>
              </tr>
            ) : (
              purchasesThisMonthList.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/purchases/${p.id}`} className="dealership-detail-link">
                      {p.vin ?? '—'}
                    </Link>
                  </td>
                  <td>{p.buyerUsername ?? p.buyer_username ?? p.buyerEmail ?? p.buyer_email ?? '—'}</td>
                  <td>{toLocalDateStr(p.date ?? p.purchaseDate ?? p.purchase_date) || '—'}</td>
                  <td>{formatMoney(p.serviceFee ?? p.service_fee)}</td>
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
    <div className="dealership-detail-summary">
      <div className="dealership-detail-summary-filters">
        <label className="dealership-detail-filter-label">
          Month
          <select
            className="dealership-detail-filter-select"
            value={summaryMonth ?? ''}
            onChange={(e) => setSummaryMonth(e.target.value ? Number(e.target.value) : currentMonth)}
          >
            <option value="">Select month</option>
            {monthsForYear.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="dealership-detail-filter-label">
          Year
          <select
            className="dealership-detail-filter-select"
            value={summaryYear ?? ''}
            onChange={(e) => setSummaryYear(e.target.value ? Number(e.target.value) : currentYear)}
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="dealership-detail-summary-row">
        <div className="dealership-detail-summary-left">
          {monthPurchasesTable}
        </div>
        <div className="dealership-detail-summary-right">
          {purchasesLoading ? (
            <p className="dealership-detail-loading">Loading…</p>
          ) : (
            <dl className="dealership-detail-summary-dl">
              <dt>Number of purchases</dt>
              <dd>{purchasesThisMonthList.length}</dd>
              <dt>Premiums</dt>
              <dd>{premiumBreakdown}</dd>
              <dt>Total invoice</dt>
              <dd className="dealership-detail-summary-total">{formatMoney(selectedMonthTotalPremiums)}</dd>
            </dl>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="dealership-detail-page">
      <div className="dealership-detail-top-bar">
        <Link to="/dealerships" className="dealership-detail-back">← Back to dealerships</Link>
      </div>
      <header className="dealership-detail-header">
        <h2 className="dealership-detail-title">{dealership.name ?? 'Dealership'}</h2>
        <p className="dealership-detail-info-line">
          {[
            dealership.addressLine1 ?? dealership.address,
            [dealership.city, dealership.state, dealership.postalCode ?? dealership.zip].filter(Boolean).join(', '),
            dealership.phone,
          ].filter(Boolean).join(' · ') || '—'}
        </p>
      </header>

      <section className="dealership-detail-section">
        {(editingCommissionRules || editingUsers) && submitError && (
          <div className="dealership-detail-submit-error" role="alert">
            {submitError}
          </div>
        )}
        <div className="dealership-detail-tables-row">
          {usersTable}
          {premiumRulesTable}
        </div>
        {summaryBlock}
      </section>

      {showInviteModal && (
        <div className="dealership-detail-modal-backdrop" onClick={() => setShowInviteModal(false)} aria-hidden>
          <div className="dealership-detail-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="invite-modal-title" aria-modal="true">
            <div className="dealership-detail-modal-header">
              <h3 id="invite-modal-title" className="dealership-detail-modal-title">Invite User</h3>
              <button type="button" className="dealership-detail-modal-close" onClick={() => setShowInviteModal(false)} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={handleSendInvite} className="dealership-detail-invite-form">
              <label className="dealership-detail-invite-label">
                Email address
                <input
                  type="email"
                  className="dealership-detail-invite-input"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={inviteSending}
                  autoComplete="email"
                />
              </label>
              {inviteError && <p className="dealership-detail-invite-error" role="alert">{inviteError}</p>}
              {inviteSuccess && <p className="dealership-detail-invite-success" role="status">{inviteSuccess}</p>}
              <div className="dealership-detail-modal-actions">
                <button type="button" className="dealership-detail-invite-cancel" onClick={() => setShowInviteModal(false)} disabled={inviteSending}>
                  Cancel
                </button>
                <button type="submit" className="dealership-detail-invite-btn" disabled={inviteSending}>
                  {inviteSending ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
