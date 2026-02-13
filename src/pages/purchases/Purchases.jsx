import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './Purchases.css'

export default function Purchases() {
  const token = getStoredToken()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({
    date: '',
    dealership: '',
    vin: '',
    vehicle: '',
    miles: '',
    purchasePrice: '',
  })

  const filteredPurchases = purchases.filter((p) => {
    const dateStr = (p.date ?? '').toString().toLowerCase()
    const dealershipStr = (p.dealershipName ?? p.dealership ?? '').toString().toLowerCase()
    const vinStr = (p.vin ?? '').toString().toLowerCase()
    const vehicleStr = [p.vehicleYear, p.vehicleMake, p.vehicleModel].filter(Boolean).join(' ').toLowerCase()
    const milesStr = (p.miles != null ? p.miles.toLocaleString() : '').toString()
    const priceStr = (p.purchasePrice != null ? `$${Number(p.purchasePrice).toLocaleString()}` : '').toString()
    const fd = (filter.date ?? '').trim().toLowerCase()
    const fdealer = (filter.dealership ?? '').trim().toLowerCase()
    const fv = (filter.vin ?? '').trim().toLowerCase()
    const fveh = (filter.vehicle ?? '').trim().toLowerCase()
    const fm = (filter.miles ?? '').trim()
    const fp = (filter.purchasePrice ?? '').trim()
    if (fd && !dateStr.includes(fd)) return false
    if (fdealer && !dealershipStr.includes(fdealer)) return false
    if (fv && !vinStr.includes(fv)) return false
    if (fveh && !vehicleStr.includes(fveh)) return false
    if (fm && !milesStr.includes(fm)) return false
    if (fp && !priceStr.includes(fp)) return false
    return true
  })

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchPurchases() {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/purchases/me`)
        if (!res.ok) {
          if (res.status === 401) return
          const data = await res.json().catch(() => ({}))
          setError(data.message || `Failed to load (${res.status})`)
          setPurchases([])
          return
        }
        const data = await res.json()
        if (!cancelled) setPurchases(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load purchases')
          setPurchases([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPurchases()
    return () => { cancelled = true }
  }, [token])

  if (!token) return <Navigate to="/" replace />

  return (
    <div className="purchases-page">
      <div className="purchases-header">
        <h2 className="purchases-title">Purchases</h2>
        <Link to="/purchases/new" className="purchases-new-btn">
          New Purchase
        </Link>
      </div>

      {error && (
        <div className="purchases-error" role="alert">
          {error}
        </div>
      )}

      <div className="purchases-body">
        {loading ? (
          <p className="purchases-loading">Loading purchases…</p>
        ) : purchases.length === 0 ? (
          <p className="purchases-empty">No purchases yet. Click “New Purchase” to add one.</p>
        ) : (
          <div className="purchases-table-wrap">
            <table className="purchases-table">
            <thead>
              <tr className="purchases-filter-row">
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.date}
                    onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
                    aria-label="Filter by date"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.dealership}
                    onChange={(e) => setFilter((f) => ({ ...f, dealership: e.target.value }))}
                    aria-label="Filter by dealership"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.vin}
                    onChange={(e) => setFilter((f) => ({ ...f, vin: e.target.value }))}
                    aria-label="Filter by VIN"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.vehicle}
                    onChange={(e) => setFilter((f) => ({ ...f, vehicle: e.target.value }))}
                    aria-label="Filter by vehicle"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.miles}
                    onChange={(e) => setFilter((f) => ({ ...f, miles: e.target.value }))}
                    aria-label="Filter by miles"
                  />
                </th>
                <th>
                  <input
                    type="text"
                    className="purchases-filter-input"
                    placeholder="Filter…"
                    value={filter.purchasePrice}
                    onChange={(e) => setFilter((f) => ({ ...f, purchasePrice: e.target.value }))}
                    aria-label="Filter by purchase price"
                  />
                </th>
              </tr>
              <tr className="purchases-header-row">
                <th>Date</th>
                <th>Dealership</th>
                <th>VIN</th>
                <th>Vehicle</th>
                <th>Miles</th>
                <th>Purchase Price</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map((p) => (
                <tr key={p.id}>
                  <td>{p.date ?? '—'}</td>
                  <td>{p.dealershipName ?? p.dealership ?? '—'}</td>
                  <td>{p.vin ?? '—'}</td>
                  <td>{[p.vehicleYear, p.vehicleMake, p.vehicleModel].filter(Boolean).join(' ') || '—'}</td>
                  <td>{p.miles != null ? p.miles.toLocaleString() : '—'}</td>
                  <td>{p.purchasePrice != null ? `$${Number(p.purchasePrice).toLocaleString()}` : '—'}</td>
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
