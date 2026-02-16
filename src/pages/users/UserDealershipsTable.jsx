import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconPlus, IconPencil, IconTrash, IconCheck, IconX } from '@tabler/icons-react'
import { getApiBase, authFetch } from '../../api'
import './UserDetail.css'

const DEALERSHIP_ROLE_OPTIONS = [
  { value: 'BUYER', label: 'BUYER' },
  { value: 'ADMIN', label: 'ADMIN' },
]

function mapDealershipRole(d) {
  return {
    dealershipId: d.dealershipId ?? d.dealership_id ?? '',
    dealershipName: d.dealershipName ?? d.dealership_name ?? '',
    role: d.role || 'BUYER',
  }
}

function toDealershipRolesList(data) {
  const raw = Array.isArray(data) ? data : data?.dealerships ?? data?.content ?? []
  return raw.map(mapDealershipRole)
}

export default function UserDealershipsTable({ user, userId, onUserUpdated }) {
  const [userDealerships, setUserDealerships] = useState([])
  const [userDealershipsLoading, setUserDealershipsLoading] = useState(true)
  const [availableDealerships, setAvailableDealerships] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingRowId, setEditingRowId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [addForm, setAddForm] = useState({ dealershipId: '', dealershipName: '', role: 'BUYER' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setUserDealershipsLoading(true)
    async function fetchUserDealerships() {
      try {
        const res = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setUserDealerships(toDealershipRolesList(data?.data ?? data))
        }
      } catch (_) {}
      if (!cancelled) setUserDealershipsLoading(false)
    }
    fetchUserDealerships()
    return () => { cancelled = true }
  }, [userId])

  useEffect(() => {
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
  }, [])

  async function refetchAndNotify() {
    const res = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships`)
    if (res.ok) {
      const data = await res.json()
      setUserDealerships(toDealershipRolesList(data?.data ?? data))
    }
    const userRes = await authFetch(`${getApiBase()}/api/users/${userId}`)
    if (userRes.ok) {
      const userData = await userRes.json()
      onUserUpdated?.(userData?.data ?? userData)
    }
  }

  function openAddModal() {
    setShowAddModal(true)
    setAddForm({ dealershipId: '', dealershipName: '', role: 'BUYER' })
    setSubmitError('')
    setEditingRowId(null)
  }

  function closeAddModal() {
    setShowAddModal(false)
    setSubmitError('')
  }

  async function handleAddSave() {
    if (!addForm.dealershipId || !user) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealershipId: addForm.dealershipId,
          role: addForm.role,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to add (${res.status})`)
        return
      }
      setShowAddModal(false)
      await refetchAndNotify()
    } catch (err) {
      setSubmitError(err.message || 'Failed to add dealership')
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(d) {
    const id = d.dealershipId ?? d.dealership_id
    setEditingRowId(id)
    setEditForm({ dealershipId: id, dealershipName: d.dealershipName ?? d.dealership_name ?? '', role: d.role ?? 'BUYER' })
    setSubmitError('')
    setShowAddModal(false)
  }

  function cancelEdit() {
    setEditingRowId(null)
    setEditForm(null)
    setSubmitError('')
  }

  async function handleEditSave() {
    if (!editForm?.dealershipId || !user) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships/${editForm.dealershipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editForm.role }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to update (${res.status})`)
        return
      }
      setEditingRowId(null)
      setEditForm(null)
      await refetchAndNotify()
    } catch (err) {
      setSubmitError(err.message || 'Failed to update dealership')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(dealershipId) {
    if (!dealershipId || !window.confirm('Remove this user from the dealership?')) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/users/${userId}/dealerships/${dealershipId}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 404) {
        const errData = await res.json().catch(() => ({}))
        setSubmitError(errData.message || errData.error || `Failed to remove (${res.status})`)
        return
      }
      await refetchAndNotify()
    } catch (err) {
      setSubmitError(err.message || 'Failed to remove from dealership')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="user-detail-commission-card">
      <div className="user-detail-card-header-row">
        <h3 className="user-detail-commission-title">Dealerships</h3>
        <button
          type="button"
          className="user-detail-table-edit-btn user-detail-dealerships-add-btn"
          onClick={openAddModal}
          disabled={userDealershipsLoading || availableDealerships.length === 0 || showAddModal}
          aria-label="Add dealership"
          title="Add dealership"
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
        <table className="user-detail-commission-table user-detail-dealerships-table">
          <thead>
            <tr>
              <th>Dealership</th>
              <th>Role</th>
              <th className="user-detail-commission-th-action"></th>
            </tr>
          </thead>
          <tbody>
            {userDealershipsLoading ? (
              <tr>
                <td colSpan={3} className="user-detail-commission-empty">
                  Loading…
                </td>
              </tr>
            ) : userDealerships.length === 0 ? (
              <tr>
                <td colSpan={3} className="user-detail-commission-empty">
                  No dealerships.
                </td>
              </tr>
            ) : (
              userDealerships.map((d) => {
                const id = d.dealershipId ?? d.dealership_id
                const name = d.dealershipName ?? d.dealership_name ?? '—'
                const displayRole = d.role ?? '—'
                const isEditing = editingRowId === id

                if (isEditing && editForm) {
                  return (
                    <tr key={id} className="user-detail-dealerships-form-row">
                      <td>
                        <select
                          className="user-detail-input user-detail-commission-table-select"
                          value={editForm.dealershipId}
                          disabled
                          aria-label="Dealership"
                        >
                          <option value={editForm.dealershipId}>{editForm.dealershipName || editForm.dealershipId}</option>
                        </select>
                      </td>
                      <td>
                        <select
                          className="user-detail-input user-detail-commission-table-select"
                          value={editForm.role}
                          onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                          aria-label="Role"
                        >
                          {DEALERSHIP_ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="user-detail-commission-td-action user-detail-dealerships-actions-cell">
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
                    <td className="user-detail-commission-td-action user-detail-dealerships-actions-cell">
                      <button
                        type="button"
                        className="user-detail-dealerships-icon-btn user-detail-dealerships-icon-btn-delete"
                        onClick={() => handleDelete(id)}
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
          className="user-detail-dealerships-modal-backdrop"
          onClick={closeAddModal}
          aria-hidden
        >
          <div
            className="user-detail-dealerships-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="add-dealership-modal-title"
            aria-modal="true"
          >
            <div className="user-detail-dealerships-modal-header">
              <h3 id="add-dealership-modal-title" className="user-detail-dealerships-modal-title">
                Add dealership
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
                <span className="user-detail-dealerships-modal-label-text">Dealership</span>
                <select
                  className="user-detail-dealerships-modal-input user-detail-dealerships-modal-select"
                  value={addForm.dealershipId}
                  onChange={(e) => {
                    const sel = availableDealerships.find((x) => (x.id ?? x.dealershipId) === e.target.value)
                    setAddForm((f) => ({
                      ...f,
                      dealershipId: e.target.value,
                      dealershipName: sel ? (sel.name ?? sel.dealershipName ?? '') : '',
                    }))
                  }}
                  required
                  aria-label="Dealership"
                >
                  <option value="">Select dealership</option>
                  {availableDealerships
                    .filter((d) => {
                      const did = d.id ?? d.dealershipId
                      const alreadyMember = userDealerships.some(
                        (ud) => (ud.dealershipId ?? ud.dealership_id) === did
                      )
                      return !alreadyMember
                    })
                    .map((dealership) => {
                      const did = dealership.id ?? dealership.dealershipId
                      const dname = dealership.name ?? dealership.dealershipName ?? did
                      return (
                        <option key={did} value={did}>
                          {dname}
                        </option>
                      )
                    })}
                </select>
              </label>
              <label className="user-detail-dealerships-modal-label">
                <span className="user-detail-dealerships-modal-label-text">Role</span>
                <select
                  className="user-detail-dealerships-modal-input user-detail-dealerships-modal-select"
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                  aria-label="Role"
                >
                  {DEALERSHIP_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                  disabled={submitting || !addForm.dealershipId}
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
