import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import { hasRole } from '../../services/authService'
import './Rules.css'

const COMMISSION_TYPES = ['FLAT', 'PERCENT']
const PREMIUM_TYPES = ['FLAT', 'PERCENT']

export default function Rules() {
  const token = getStoredToken()
  const isAdmin = hasRole('ADMIN')
  const [commissionRules, setCommissionRules] = useState([])
  const [premiumRules, setPremiumRules] = useState([])
  const [loadingCommission, setLoadingCommission] = useState(true)
  const [loadingPremium, setLoadingPremium] = useState(true)
  const [error, setError] = useState('')
  const [editingCommissionId, setEditingCommissionId] = useState(null)
  const [editingPremiumId, setEditingPremiumId] = useState(null)
  const [showAddCommission, setShowAddCommission] = useState(false)
  const [showAddPremium, setShowAddPremium] = useState(false)
  const [commissionForm, setCommissionForm] = useState({ ruleName: '', amount: '', commissionType: 'FLAT' })
  const [premiumForm, setPremiumForm] = useState({ ruleName: '', amount: '', premiumType: 'FLAT' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchCommission() {
      setLoadingCommission(true)
      try {
        const res = await authFetch(`${getApiBase()}/api/commission-rules`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setCommissionRules(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
      if (!cancelled) setLoadingCommission(false)
    }
    fetchCommission()
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchPremium() {
      setLoadingPremium(true)
      try {
        const res = await authFetch(`${getApiBase()}/api/premium-rules`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setPremiumRules(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
      if (!cancelled) setLoadingPremium(false)
    }
    fetchPremium()
    return () => { cancelled = true }
  }, [token])

  async function handleSaveCommission(e) {
    e?.preventDefault?.()
    setSubmitError('')
    const name = commissionForm.ruleName?.trim()
    const amount = commissionForm.amount === '' ? null : Number(commissionForm.amount)
    if (!name) {
      setSubmitError('Rule name is required.')
      return
    }
    setSubmitting(true)
    try {
      if (editingCommissionId) {
        const res = await authFetch(`${getApiBase()}/api/commission-rules/${editingCommissionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleName: name,
            amount: amount ?? 0,
            commissionType: commissionForm.commissionType || 'FLAT',
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.message || data.error || `Update failed (${res.status})`)
          return
        }
        const data = await res.json()
        const updated = data?.data ?? data
        setCommissionRules((prev) => prev.map((r) => (r.id === editingCommissionId ? updated : r)))
        setEditingCommissionId(null)
      } else {
        const res = await authFetch(`${getApiBase()}/api/commission-rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleName: name,
            amount: amount ?? 0,
            commissionType: commissionForm.commissionType || 'FLAT',
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.message || data.error || `Create failed (${res.status})`)
          return
        }
        const data = await res.json()
        setCommissionRules((prev) => [data?.data ?? data, ...prev])
        setShowAddCommission(false)
      }
      setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' })
    } catch (err) {
      setSubmitError(err.message || 'Failed to save commission rule')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSavePremium(e) {
    e?.preventDefault?.()
    setSubmitError('')
    const name = premiumForm.ruleName?.trim()
    const amount = premiumForm.amount === '' ? null : Number(premiumForm.amount)
    if (!name) {
      setSubmitError('Rule name is required.')
      return
    }
    setSubmitting(true)
    try {
      if (editingPremiumId) {
        const res = await authFetch(`${getApiBase()}/api/premium-rules/${editingPremiumId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleName: name,
            amount: amount ?? 0,
            premiumType: premiumForm.premiumType || 'FLAT',
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.message || data.error || `Update failed (${res.status})`)
          return
        }
        const data = await res.json()
        const updated = data?.data ?? data
        setPremiumRules((prev) => prev.map((r) => (r.id === editingPremiumId ? updated : r)))
        setEditingPremiumId(null)
      } else {
        const res = await authFetch(`${getApiBase()}/api/premium-rules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruleName: name,
            amount: amount ?? 0,
            premiumType: premiumForm.premiumType || 'FLAT',
          }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setSubmitError(data.message || data.error || `Create failed (${res.status})`)
          return
        }
        const data = await res.json()
        setPremiumRules((prev) => [data?.data ?? data, ...prev])
        setShowAddPremium(false)
      }
      setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' })
    } catch (err) {
      setSubmitError(err.message || 'Failed to save premium rule')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCommission(id) {
    if (!window.confirm('Delete this commission rule?')) return
    setSubmitError('')
    try {
      const res = await authFetch(`${getApiBase()}/api/commission-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Delete failed (${res.status})`)
        return
      }
      setCommissionRules((prev) => prev.filter((r) => r.id !== id))
      if (editingCommissionId === id) setEditingCommissionId(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to delete')
    }
  }

  async function handleDeletePremium(id) {
    if (!window.confirm('Delete this premium rule?')) return
    setSubmitError('')
    try {
      const res = await authFetch(`${getApiBase()}/api/premium-rules/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Delete failed (${res.status})`)
        return
      }
      setPremiumRules((prev) => prev.filter((r) => r.id !== id))
      if (editingPremiumId === id) setEditingPremiumId(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to delete')
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (!isAdmin) return <Navigate to="/purchases" replace />

  return (
    <div className="rules-page">
      <div className="rules-header">
        <h2 className="rules-title">Rules</h2>
      </div>
      {error && <div className="rules-error" role="alert">{error}</div>}

      <div className="rules-sections">
        <section className="rules-card">
          <div className="rules-card-header">
            <h3 className="rules-card-title">Commission Rules</h3>
            <button
              type="button"
              className="rules-add-btn"
              onClick={() => {
                setShowAddCommission(true)
                setEditingCommissionId(null)
                setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' })
                setSubmitError('')
              }}
            >
              Add rule
            </button>
          </div>
          <div className="rules-table-wrap">
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th className="rules-th-icon">Edit</th>
                  <th className="rules-th-icon">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loadingCommission ? (
                  <tr>
                    <td colSpan={5} className="rules-empty">Loading…</td>
                  </tr>
                ) : commissionRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="rules-empty">No commission rules.</td>
                  </tr>
                ) : (
                  commissionRules.map((r) => (
                    <tr key={r.id}>
                      {editingCommissionId === r.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="rules-inline-input"
                              value={commissionForm.ruleName}
                              onChange={(e) => setCommissionForm((f) => ({ ...f, ruleName: e.target.value }))}
                              disabled={submitting}
                              required
                              aria-label="Rule name"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="rules-inline-input rules-inline-input-amount"
                              min={0}
                              step={0.01}
                              value={commissionForm.amount}
                              onChange={(e) => setCommissionForm((f) => ({ ...f, amount: e.target.value }))}
                              disabled={submitting}
                              aria-label="Amount"
                            />
                          </td>
                          <td>
                            <select
                              className="rules-inline-select"
                              value={commissionForm.commissionType}
                              onChange={(e) => setCommissionForm((f) => ({ ...f, commissionType: e.target.value }))}
                              disabled={submitting}
                              aria-label="Type"
                            >
                              {COMMISSION_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-save-inline-btn"
                              onClick={() => handleSaveCommission()}
                              disabled={submitting}
                              aria-label="Save"
                            >
                              {submitting ? '…' : 'Save'}
                            </button>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-cancel-inline-btn"
                              onClick={() => {
                                setEditingCommissionId(null)
                                setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' })
                                setSubmitError('')
                              }}
                              disabled={submitting}
                              aria-label="Cancel"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{r.ruleName ?? r.rule_name ?? '—'}</td>
                          <td>{r.amount != null ? r.amount : '—'}</td>
                          <td>{r.commissionType ?? r.commission_type ?? '—'}</td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-edit-btn"
                              onClick={() => {
                                setEditingCommissionId(r.id)
                                setShowAddCommission(false)
                                setCommissionForm({
                                  ruleName: r.ruleName ?? r.rule_name ?? '',
                                  amount: r.amount != null ? String(r.amount) : '',
                                  commissionType: (() => { const t = r.commissionType ?? r.commission_type; return t === 'PERCENTAGE' ? 'PERCENT' : (t === 'FLAT' || t === 'PERCENT' ? t : 'FLAT'); })(),
                                })
                                setSubmitError('')
                              }}
                              aria-label="Edit"
                              title="Edit"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-delete-btn"
                              onClick={() => handleDeleteCommission(r.id)}
                              aria-label="Delete"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {(editingCommissionId && submitError) ? <p className="rules-inline-error" role="alert">{submitError}</p> : null}
        </section>

        <section className="rules-card">
          <div className="rules-card-header">
            <h3 className="rules-card-title">Premium Rules</h3>
            <button
              type="button"
              className="rules-add-btn"
              onClick={() => {
                setShowAddPremium(true)
                setEditingPremiumId(null)
                setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' })
                setSubmitError('')
              }}
            >
              Add rule
            </button>
          </div>
          <div className="rules-table-wrap">
            <table className="rules-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th className="rules-th-icon">Edit</th>
                  <th className="rules-th-icon">Delete</th>
                </tr>
              </thead>
              <tbody>
                {loadingPremium ? (
                  <tr>
                    <td colSpan={5} className="rules-empty">Loading…</td>
                  </tr>
                ) : premiumRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="rules-empty">No premium rules.</td>
                  </tr>
                ) : (
                  premiumRules.map((r) => (
                    <tr key={r.id}>
                      {editingPremiumId === r.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              className="rules-inline-input"
                              value={premiumForm.ruleName}
                              onChange={(e) => setPremiumForm((f) => ({ ...f, ruleName: e.target.value }))}
                              disabled={submitting}
                              required
                              aria-label="Rule name"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="rules-inline-input rules-inline-input-amount"
                              min={0}
                              step={0.01}
                              value={premiumForm.amount}
                              onChange={(e) => setPremiumForm((f) => ({ ...f, amount: e.target.value }))}
                              disabled={submitting}
                              aria-label="Amount"
                            />
                          </td>
                          <td>
                            <select
                              className="rules-inline-select"
                              value={premiumForm.premiumType}
                              onChange={(e) => setPremiumForm((f) => ({ ...f, premiumType: e.target.value }))}
                              disabled={submitting}
                              aria-label="Type"
                            >
                              {PREMIUM_TYPES.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-save-inline-btn"
                              onClick={() => handleSavePremium()}
                              disabled={submitting}
                              aria-label="Save"
                            >
                              {submitting ? '…' : 'Save'}
                            </button>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-cancel-inline-btn"
                              onClick={() => {
                                setEditingPremiumId(null)
                                setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' })
                                setSubmitError('')
                              }}
                              disabled={submitting}
                              aria-label="Cancel"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{r.ruleName ?? r.rule_name ?? '—'}</td>
                          <td>{r.amount != null ? r.amount : '—'}</td>
                          <td>{r.premiumType ?? r.premium_type ?? '—'}</td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-edit-btn"
                              onClick={() => {
                                setEditingPremiumId(r.id)
                                setShowAddPremium(false)
                                setPremiumForm({
                                  ruleName: r.ruleName ?? r.rule_name ?? '',
                                  amount: r.amount != null ? String(r.amount) : '',
                                  premiumType: (() => { const t = r.premiumType ?? r.premium_type; return t === 'PERCENTAGE' ? 'PERCENT' : (t === 'FLAT' || t === 'PERCENT' ? t : 'FLAT'); })(),
                                })
                                setSubmitError('')
                              }}
                              aria-label="Edit"
                              title="Edit"
                            >
                              Edit
                            </button>
                          </td>
                          <td className="rules-td-icon">
                            <button
                              type="button"
                              className="rules-delete-btn"
                              onClick={() => handleDeletePremium(r.id)}
                              aria-label="Delete"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {(editingPremiumId && submitError) ? <p className="rules-inline-error" role="alert">{submitError}</p> : null}
        </section>
      </div>

      {showAddCommission ? (
        <div className="rules-modal-backdrop" onClick={() => { setShowAddCommission(false); setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' }); setSubmitError(''); }} aria-hidden>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="commission-rule-modal-title" aria-modal="true">
            <div className="rules-modal-header">
              <h3 id="commission-rule-modal-title" className="rules-modal-title">Add commission rule</h3>
              <button type="button" className="rules-modal-close" onClick={() => { setShowAddCommission(false); setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' }); setSubmitError(''); }} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSaveCommission} className="rules-modal-form">
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Rule name <span className="rules-required" aria-hidden>*</span></span>
                <input
                  type="text"
                  className="rules-modal-input"
                  placeholder="Rule name"
                  value={commissionForm.ruleName}
                  onChange={(e) => setCommissionForm((f) => ({ ...f, ruleName: e.target.value }))}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Amount</span>
                <input
                  type="number"
                  className="rules-modal-input"
                  placeholder="Amount"
                  min={0}
                  step={0.01}
                  value={commissionForm.amount}
                  onChange={(e) => setCommissionForm((f) => ({ ...f, amount: e.target.value }))}
                  disabled={submitting}
                />
              </label>
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Type</span>
                <select
                  className="rules-modal-input rules-modal-select"
                  value={commissionForm.commissionType}
                  onChange={(e) => setCommissionForm((f) => ({ ...f, commissionType: e.target.value }))}
                  disabled={submitting}
                >
                  {COMMISSION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              {submitError && <p className="rules-modal-error" role="alert">{submitError}</p>}
              <div className="rules-modal-actions">
                <button type="button" className="rules-modal-cancel" onClick={() => { setShowAddCommission(false); setCommissionForm({ ruleName: '', amount: '', commissionType: 'FLAT' }); setSubmitError(''); }} disabled={submitting}>Cancel</button>
                <button type="submit" className="rules-modal-submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showAddPremium ? (
        <div className="rules-modal-backdrop" onClick={() => { setShowAddPremium(false); setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' }); setSubmitError(''); }} aria-hidden>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="premium-rule-modal-title" aria-modal="true">
            <div className="rules-modal-header">
              <h3 id="premium-rule-modal-title" className="rules-modal-title">Add premium rule</h3>
              <button type="button" className="rules-modal-close" onClick={() => { setShowAddPremium(false); setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' }); setSubmitError(''); }} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSavePremium} className="rules-modal-form">
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Rule name <span className="rules-required" aria-hidden>*</span></span>
                <input
                  type="text"
                  className="rules-modal-input"
                  placeholder="Rule name"
                  value={premiumForm.ruleName}
                  onChange={(e) => setPremiumForm((f) => ({ ...f, ruleName: e.target.value }))}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Amount</span>
                <input
                  type="number"
                  className="rules-modal-input"
                  placeholder="Amount"
                  min={0}
                  step={0.01}
                  value={premiumForm.amount}
                  onChange={(e) => setPremiumForm((f) => ({ ...f, amount: e.target.value }))}
                  disabled={submitting}
                />
              </label>
              <label className="rules-modal-label">
                <span className="rules-modal-label-text">Type</span>
                <select
                  className="rules-modal-input rules-modal-select"
                  value={premiumForm.premiumType}
                  onChange={(e) => setPremiumForm((f) => ({ ...f, premiumType: e.target.value }))}
                  disabled={submitting}
                >
                  {PREMIUM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              {submitError && <p className="rules-modal-error" role="alert">{submitError}</p>}
              <div className="rules-modal-actions">
                <button type="button" className="rules-modal-cancel" onClick={() => { setShowAddPremium(false); setPremiumForm({ ruleName: '', amount: '', premiumType: 'FLAT' }); setSubmitError(''); }} disabled={submitting}>Cancel</button>
                <button type="submit" className="rules-modal-submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
