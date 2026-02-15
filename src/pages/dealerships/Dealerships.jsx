import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import DealershipsTable from '../../components/DealershipsTable'
import './Dealerships.css'

export default function Dealerships() {
  const token = getStoredToken()
  const [dealerships, setDealerships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  })

  async function fetchList() {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${getApiBase()}/api/dealerships`)
      if (!res.ok) {
        if (res.status === 401) return
        const data = await res.json().catch(() => ({}))
        setError(data.message || `Failed to load (${res.status})`)
        setDealerships([])
        return
      }
      const data = await res.json()
      setDealerships(Array.isArray(data) ? data : data.dealerships || data.content || [])
    } catch (err) {
      setError(err.message || 'Failed to load dealerships')
      setDealerships([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) fetchList()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!formData.name?.trim()) {
      setError('Dealership name is required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch(`${getApiBase()}/api/dealerships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          addressLine1: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          postalCode: formData.zip?.trim() || null,
          phone: formData.phone?.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || data.error || `Create failed (${res.status})`)
        return
      }
      setShowForm(false)
      setFormData({ name: '', address: '', city: '', state: '', zip: '', phone: '' })
      await fetchList()
    } catch (err) {
      setError(err.message || 'Failed to create dealership')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return <Navigate to="/" replace />

  return (
    <div className="dealerships-page">
      <div className="dealerships-header">
        <h2 className="dealerships-title">Dealerships</h2>
        <button type="button" className="dealerships-add-btn" onClick={() => {
          setShowForm(true)
          setError('')
          setFormData({ name: '', address: '', city: '', state: '', zip: '', phone: '' })
        }}>
          Add dealership
        </button>
      </div>

      {error && !showForm && (
        <div className="dealerships-error" role="alert">
          {error}
        </div>
      )}

      <div className="dealerships-body">
          {loading ? (
            <p className="dealerships-loading">Loading dealerships…</p>
          ) : dealerships.length === 0 ? (
            <p className="dealerships-empty">No dealerships yet. Click "Add dealership" to create one.</p>
          ) : (
            <DealershipsTable dealerships={dealerships} />
          )}
      </div>

      {showForm && (
        <div className="dealerships-modal-backdrop" onClick={() => { setShowForm(false); setError(''); }} aria-hidden>
          <div className="dealerships-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="add-dealership-modal-title" aria-modal="true">
            <div className="dealerships-modal-header">
              <h3 id="add-dealership-modal-title" className="dealerships-modal-title">Add dealership</h3>
              <button type="button" className="dealerships-modal-close" onClick={() => { setShowForm(false); setError(''); }} aria-label="Close">×</button>
            </div>
            <form onSubmit={handleSubmit} className="dealerships-modal-form">
              <label className="dealerships-label">
                <span className="dealerships-label-text">Name <span className="dealerships-required">*</span></span>
                <input
                  type="text"
                  className="dealerships-input"
                  value={formData.name}
                  onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Dealership name"
                  required
                  disabled={submitting}
                />
              </label>
              <label className="dealerships-label">
                Address
                <input
                  type="text"
                  className="dealerships-input"
                  value={formData.address}
                  onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
                  placeholder="Street address"
                  disabled={submitting}
                />
              </label>
              <div className="dealerships-row">
                <label className="dealerships-label">
                  City
                  <input
                    type="text"
                    className="dealerships-input"
                    value={formData.city}
                    onChange={(e) => setFormData((d) => ({ ...d, city: e.target.value }))}
                    placeholder="City"
                    disabled={submitting}
                  />
                </label>
                <label className="dealerships-label">
                  State
                  <input
                    type="text"
                    className="dealerships-input"
                    value={formData.state}
                    onChange={(e) => setFormData((d) => ({ ...d, state: e.target.value }))}
                    placeholder="State"
                    disabled={submitting}
                  />
                </label>
                <label className="dealerships-label">
                  ZIP
                  <input
                    type="text"
                    className="dealerships-input"
                    value={formData.zip}
                    onChange={(e) => setFormData((d) => ({ ...d, zip: e.target.value }))}
                    placeholder="ZIP"
                    disabled={submitting}
                  />
                </label>
              </div>
              <label className="dealerships-label">
                Phone
                <input
                  type="tel"
                  className="dealerships-input"
                  value={formData.phone}
                  onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
                  placeholder="Phone"
                  disabled={submitting}
                />
              </label>
              {error && (
                <p className="dealerships-modal-error" role="alert">{error}</p>
              )}
              <div className="dealerships-modal-actions">
                <button type="button" className="dealerships-cancel-btn" onClick={() => { setShowForm(false); setError(''); }} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="dealerships-submit-btn" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
