import { useState, useEffect } from 'react'
import { IconPlus, IconPencil, IconTrash, IconCheck, IconX } from '@tabler/icons-react'
import { getApiBase, authFetch } from '../../api'
import './UserDetail.css'

function toLocalDateStr(dateVal) {
  if (dateVal == null) return ''
  if (typeof dateVal === 'string') return dateVal.slice(0, 10)
  return ''
}

function isCommissionRuleExpired(rule) {
  const status = (rule.status ?? rule.ruleStatus ?? '').toString().toUpperCase()
  return status === 'EXPIRED'
}

function mapCommissionRule(r) {
  return {
    id: r.id ?? r.userCommissionRuleId ?? r.commission_id ?? null,
    ruleId: r.ruleId ?? r.rule_id ?? '',
    startDate: toLocalDateStr(r.startDate ?? r.start_date),
    endDate: toLocalDateStr(r.endDate ?? r.end_date),
    level: r.level != null ? r.level : 1,
    numberOfSales: r.numberOfSales ?? r.number_of_sales ?? null,
  }
}

function toRulesList(data) {
  const raw = Array.isArray(data) ? data : data?.userCommissionRules ?? data?.commissionRules ?? []
  return raw.map(mapCommissionRule)
}

function ruleToBody(r) {
  return {
    ruleId: r.ruleId,
    startDate: r.startDate,
    endDate: r.endDate || null,
    level: r.level != null && r.level !== '' ? Number(r.level) : 1,
    numberOfSales: r.numberOfSales != null && r.numberOfSales !== '' ? Number(r.numberOfSales) : null,
  }
}

export default function UserCommissionRulesTable({ user, userId, onUserUpdated }) {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [availableRules, setAvailableRules] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCommissionId, setEditingCommissionId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [addForm, setAddForm] = useState({
    ruleId: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    level: 1,
    numberOfSales: null,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const raw = user?.userCommissionRules ?? user?.commissionRules ?? []
    setRules(toRulesList(raw))
    setLoading(false)
  }, [user])

  useEffect(() => {
    let cancelled = false
    async function fetchRules() {
      try {
        const res = await authFetch(`${getApiBase()}/api/commission-rules`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setAvailableRules(Array.isArray(data) ? data : data?.content ?? data?.commissionRules ?? [])
        }
      } catch (_) {}
    }
    fetchRules()
    return () => { cancelled = true }
  }, [])

  const sortedRules = [...rules].sort((a, b) => {
    const aExp = isCommissionRuleExpired(a)
    const bExp = isCommissionRuleExpired(b)
    if (aExp === bExp) return 0
    return aExp ? 1 : -1
  })

  async function refetchUser() {
    const res = await authFetch(`${getApiBase()}/api/users/${userId}`)
    if (res.ok) {
      const data = await res.json()
      const u = data?.data ?? data
      setRules(toRulesList(u?.userCommissionRules ?? u?.commissionRules ?? []))
      onUserUpdated?.(u)
    }
  }

  function getRuleName(ruleId) {
    const r = availableRules.find((x) => (x.id ?? x.ruleId) === ruleId)
    if (!r) return ruleId ?? '—'
    const name = r.ruleName ?? r.rule_name ?? r.id
    const amount = r.amount != null ? r.amount : '—'
    const type = r.commissionType ?? r.commission_type ?? '—'
    return `${name} (${amount} ${type})`
  }

  function openAddModal() {
    setShowAddModal(true)
    setAddForm({
      ruleId: availableRules.length ? availableRules[0].id ?? '' : '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      level: 1,
      numberOfSales: null,
    })
    setSubmitError('')
    setEditingCommissionId(null)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setSubmitError('')
  }

  async function handleAddSave() {
    if (!addForm.ruleId || !user) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const body = ruleToBody({
        ruleId: addForm.ruleId,
        startDate: addForm.startDate,
        endDate: addForm.endDate || null,
        level: addForm.level,
        numberOfSales: addForm.numberOfSales,
      })
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/commissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to add (${res.status})`)
        return
      }
      setShowAddModal(false)
      await refetchUser()
    } catch (err) {
      setSubmitError(err.message || 'Failed to add commission rule')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(r) {
    setEditingCommissionId(r.id)
    setEditForm({
      id: r.id,
      ruleId: r.ruleId ?? r.rule_id,
      startDate: r.startDate ?? toLocalDateStr(r.start_date),
      endDate: r.endDate ?? toLocalDateStr(r.end_date),
      level: r.level != null ? r.level : 1,
      numberOfSales: r.numberOfSales ?? r.number_of_sales ?? null,
    })
    setSubmitError('')
    setShowAddModal(false)
  }

  function cancelEdit() {
    setEditingCommissionId(null)
    setEditForm(null)
    setSubmitError('')
  }

  async function handleEditSave() {
    if (editForm == null || editForm.id == null || !user) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const body = ruleToBody(editForm)
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/commissions/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to update (${res.status})`)
        return
      }
      setEditingCommissionId(null)
      setEditForm(null)
      await refetchUser()
    } catch (err) {
      setSubmitError(err.message || 'Failed to update commission rule')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commissionId) {
    if (commissionId == null || !window.confirm('Remove this commission rule from the user?')) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/commissions/${commissionId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 404) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to remove (${res.status})`)
        return
      }
      await refetchUser()
    } catch (err) {
      setSubmitError(err.message || 'Failed to remove commission rule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="user-detail-commission-card">
      <div className="user-detail-card-header-row">
        <h3 className="user-detail-commission-title">Commission Rules</h3>
        <button
          type="button"
          className="user-detail-table-edit-btn user-detail-commission-rules-add-btn"
          onClick={openAddModal}
          disabled={loading || availableRules.length === 0 || showAddModal}
          aria-label="Add commission rule"
          title="Add commission rule"
        >
          <IconPlus size={16} stroke={2} aria-hidden />
          <span>Add</span>
        </button>
      </div>
      {submitError && !showAddModal && (
        <div className="user-detail-submit-error" role="alert">
          {submitError}
        </div>
      )}
      <div className="user-detail-commission-table-wrap">
        <table className="user-detail-commission-table user-detail-commission-rules-table">
          <thead>
            <tr>
              <th>Rule</th>
              <th>Start Date</th>
              <th className="user-detail-col-end-after">End After (Date / Sales)</th>
              <th className="user-detail-col-level">Level</th>
              <th className="user-detail-commission-th-action"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="user-detail-commission-empty">
                  Loading…
                </td>
              </tr>
            ) : sortedRules.length === 0 ? (
              <tr>
                <td colSpan={5} className="user-detail-commission-empty">
                  No commission rules.
                </td>
              </tr>
            ) : (
              sortedRules.map((r, idx) => {
                const ruleId = r.ruleId ?? r.rule_id
                const expired = isCommissionRuleExpired(r)
                const isEditing = r.id != null && r.id === editingCommissionId

                if (isEditing && editForm) {
                  return (
                    <tr key={`edit-${r.id ?? idx}`} className="user-detail-commission-rules-form-row">
                      <td>
                        <select
                          className="user-detail-input user-detail-commission-table-select"
                          value={editForm.ruleId}
                          disabled
                          aria-label="Rule"
                        >
                          <option value={editForm.ruleId}>{getRuleName(editForm.ruleId)}</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="user-detail-input user-detail-commission-table-input"
                          value={editForm.startDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))}
                          required
                          aria-label="Start date"
                        />
                      </td>
                      <td className="user-detail-td-end-after user-detail-col-end-after">
                        <div className="user-detail-end-after-inputs">
                          <input
                            type="date"
                            className="user-detail-input user-detail-commission-table-input"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))}
                            aria-label="End date"
                          />
                          <input
                            type="number"
                            className="user-detail-input user-detail-commission-table-num"
                            min={0}
                            value={editForm.numberOfSales == null || editForm.numberOfSales === '' ? '' : editForm.numberOfSales}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                numberOfSales: e.target.value === '' ? null : Number(e.target.value),
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
                          value={editForm.level === null || editForm.level === '' ? '' : editForm.level}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              level: e.target.value === '' ? 1 : Number(e.target.value),
                            }))
                          }
                          aria-label="Level"
                        />
                      </td>
                      <td className="user-detail-commission-td-action user-detail-commission-rules-actions-cell">
                        <button
                          type="button"
                          className="user-detail-dealerships-icon-btn user-detail-dealerships-icon-btn-save"
                          onClick={handleEditSave}
                          disabled={submitting}
                          aria-label="Save"
                          title="Save"
                        >
                          <IconCheck size={18} stroke={2} />
                        </button>
                        <button
                          type="button"
                          className="user-detail-dealerships-icon-btn user-detail-dealerships-icon-btn-cancel"
                          onClick={cancelEdit}
                          disabled={submitting}
                          aria-label="Cancel"
                          title="Cancel"
                        >
                          <IconX size={18} stroke={2} />
                        </button>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr key={idx} className={expired ? 'user-detail-commission-row-expired' : ''}>
                    <td>{getRuleName(ruleId)}</td>
                    <td>{r.startDate || toLocalDateStr(r.start_date) || '—'}</td>
                    <td className="user-detail-col-end-after">
                      <span className="user-detail-end-after-cell">
                        {r.endDate || toLocalDateStr(r.end_date) || '—'} /{' '}
                        {r.numberOfSales != null ? `${r.numberOfSales} sales` : '—'}
                        {expired && <span className="user-detail-rule-expired-label">Expired</span>}
                      </span>
                    </td>
                    <td className="user-detail-col-level">{r.level != null ? r.level : '—'}</td>
                    <td className="user-detail-commission-td-action user-detail-commission-rules-actions-cell">
                      <button
                        type="button"
                        className="user-detail-dealerships-icon-btn user-detail-dealerships-icon-btn-edit"
                        onClick={() => startEdit(r)}
                        disabled={submitting}
                        aria-label="Edit"
                        title="Edit"
                      >
                        <IconPencil size={18} stroke={2} />
                      </button>
                      <button
                        type="button"
                        className="user-detail-dealerships-icon-btn user-detail-dealerships-icon-btn-delete"
                        onClick={() => handleDelete(r.id)}
                        disabled={submitting}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <IconTrash size={18} stroke={2} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div
          className="user-detail-dealerships-modal-backdrop user-detail-commission-rules-modal-backdrop"
          onClick={closeAddModal}
          aria-hidden
        >
          <div
            className="user-detail-dealerships-modal user-detail-commission-rules-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="add-commission-rule-modal-title"
            aria-modal="true"
          >
            <div className="user-detail-dealerships-modal-header">
              <h3 id="add-commission-rule-modal-title" className="user-detail-dealerships-modal-title">
                Add commission rule
              </h3>
              <button
                type="button"
                className="user-detail-dealerships-modal-close"
                onClick={closeAddModal}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form
              className="user-detail-dealerships-modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                handleAddSave()
              }}
            >
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">Rule</span>
                <select
                  className="user-detail-dealerships-modal-input user-detail-dealerships-modal-select"
                  value={addForm.ruleId}
                  onChange={(e) => setAddForm((f) => ({ ...f, ruleId: e.target.value }))}
                  required
                  aria-label="Rule"
                >
                  <option value="">Select rule</option>
                  {availableRules.map((rule) => {
                    const rid = rule.id ?? rule.ruleId
                    const label = `${rule.ruleName ?? rule.rule_name ?? rid} (${rule.amount ?? '—'} ${rule.commissionType ?? rule.commission_type ?? ''})`
                    return (
                      <option key={rid} value={rid}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">Start Date</span>
                <input
                  type="date"
                  className="user-detail-dealerships-modal-input"
                  value={addForm.startDate}
                  onChange={(e) => setAddForm((f) => ({ ...f, startDate: e.target.value }))}
                  required
                  aria-label="Start date"
                />
              </label>
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">End Date (optional)</span>
                <input
                  type="date"
                  className="user-detail-dealerships-modal-input"
                  value={addForm.endDate}
                  onChange={(e) => setAddForm((f) => ({ ...f, endDate: e.target.value }))}
                  aria-label="End date"
                />
              </label>
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">End after (sales, optional)</span>
                <input
                  type="number"
                  className="user-detail-dealerships-modal-input"
                  min={0}
                  value={addForm.numberOfSales == null || addForm.numberOfSales === '' ? '' : addForm.numberOfSales}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      numberOfSales: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  aria-label="End after sales"
                />
              </label>
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">Level</span>
                <input
                  type="number"
                  className="user-detail-dealerships-modal-input"
                  min={0}
                  value={addForm.level}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, level: e.target.value === '' ? 1 : Number(e.target.value) }))
                  }
                  aria-label="Level"
                />
              </label>
              {submitError && (
                <p className="user-detail-dealerships-modal-error" role="alert">
                  {submitError}
                </p>
              )}
              <div className="user-detail-dealerships-modal-actions">
                <button
                  type="button"
                  className="user-detail-dealerships-modal-cancel"
                  onClick={closeAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="user-detail-dealerships-modal-submit"
                  disabled={submitting || !addForm.ruleId}
                >
                  {submitting ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
