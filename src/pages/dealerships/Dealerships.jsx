import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './Dealerships.css'

export default function Dealerships() {
  const navigate = useNavigate()
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
  const [filter, setFilter] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    purchases: '',
  })

  const filteredDealerships = dealerships.filter((d) => {
    const name = (d.name ?? '').toString().toLowerCase()
    const address = (d.addressLine1 ?? d.address ?? '').toString().toLowerCase()
    const city = (d.city ?? '').toString().toLowerCase()
    const state = (d.state ?? '').toString().toLowerCase()
    const zip = (d.postalCode ?? d.zip ?? '').toString().toLowerCase()
    const phone = (d.phone ?? '').toString().toLowerCase()
    const purchasesStr = (d.id != null ? (d.purchaseCount ?? d.purchase_count ?? 0) : '').toString()
    const fn = (filter.name ?? '').trim().toLowerCase()
    const fa = (filter.address ?? '').trim().toLowerCase()
    const fc = (filter.city ?? '').trim().toLowerCase()
    const fst = (filter.state ?? '').trim().toLowerCase()
    const fz = (filter.zip ?? '').trim().toLowerCase()
    const fph = (filter.phone ?? '').trim().toLowerCase()
    const fp = (filter.purchases ?? '').trim()
    if (fn && !name.includes(fn)) return false
    if (fa && !address.includes(fa)) return false
    if (fc && !city.includes(fc)) return false
    if (fst && !state.includes(fst)) return false
    if (fz && !zip.includes(fz)) return false
    if (fph && !phone.includes(fph)) return false
    if (fp && !purchasesStr.includes(fp)) return false
    return true
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
        <button type="button" className="dealerships-add-btn" onClick={() => setShowForm(true)}>
          Add dealership
        </button>
      </div>

      {error && (
        <div className="dealerships-error" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <form className="dealerships-form" onSubmit={handleSubmit}>
            <h3 className="dealerships-form-title">New dealership</h3>
            <label className="dealerships-label">
              Name <span className="dealerships-required">*</span>
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
            <div className="dealerships-form-actions">
              <button type="button" className="dealerships-cancel-btn" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="dealerships-submit-btn" disabled={submitting}>
                {submitting ? 'Creating…' : 'Create'}
              </button>
            </div>
          </form>
        )}

        <div className="dealerships-body">
          {loading ? (
            <p className="dealerships-loading">Loading dealerships…</p>
          ) : dealerships.length === 0 ? (
            <p className="dealerships-empty">No dealerships yet. Click "Add dealership" to create one.</p>
          ) : (
            <div className="dealerships-table-wrap">
              <table className="dealerships-table">
              <thead>
                <tr className="dealerships-filter-row">
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.name}
                      onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                      aria-label="Filter by name"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.address}
                      onChange={(e) => setFilter((f) => ({ ...f, address: e.target.value }))}
                      aria-label="Filter by address"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.city}
                      onChange={(e) => setFilter((f) => ({ ...f, city: e.target.value }))}
                      aria-label="Filter by city"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.state}
                      onChange={(e) => setFilter((f) => ({ ...f, state: e.target.value }))}
                      aria-label="Filter by state"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.zip}
                      onChange={(e) => setFilter((f) => ({ ...f, zip: e.target.value }))}
                      aria-label="Filter by ZIP"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.phone}
                      onChange={(e) => setFilter((f) => ({ ...f, phone: e.target.value }))}
                      aria-label="Filter by phone"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealerships-filter-input"
                      placeholder="Filter…"
                      value={filter.purchases}
                      onChange={(e) => setFilter((f) => ({ ...f, purchases: e.target.value }))}
                      aria-label="Filter by purchases"
                    />
                  </th>
                </tr>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>City</th>
                  <th>State</th>
                  <th>ZIP</th>
                  <th>Phone</th>
                  <th>Purchases</th>
                </tr>
              </thead>
              <tbody>
                {filteredDealerships.map((d) => (
                  <tr
                    key={d.id ?? d.name}
                    className="dealerships-row-clickable"
                    onClick={() => (d.id != null ? navigate(`/dealerships/${d.id}`) : null)}
                    role={d.id != null ? 'button' : undefined}
                    tabIndex={d.id != null ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (d.id != null && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault()
                        navigate(`/dealerships/${d.id}`)
                      }
                    }}
                  >
                    <td>{d.name ?? '—'}</td>
                    <td>{d.addressLine1 ?? d.address ?? '—'}</td>
                    <td>{d.city ?? '—'}</td>
                    <td>{d.state ?? '—'}</td>
                    <td>{d.postalCode ?? d.zip ?? '—'}</td>
                    <td>{d.phone ?? '—'}</td>
                    <td>{d.id != null ? (d.purchaseCount ?? d.purchase_count ?? 0) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  )
}
