import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  clearStoredToken,
  clearStoredUserName,
  clearStoredUserRole,
  clearStoredDealerName,
  getStoredToken,
  getStoredUserName,
  getApiBase,
  authFetch,
} from '../../api'
import './DashboardPage.css'

const ROLE_LABELS = {
  admin: 'Sales Admin',
  associate: 'Sales Associate',
  dealer: 'Dealer',
}

export default function DashboardPage({ role }) {
  const navigate = useNavigate()
  const token = getStoredToken()
  const name = getStoredUserName()
  const label = ROLE_LABELS[role] ?? role

  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(role === 'admin')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState({
    date: '',
    dealership: '',
    vin: '',
    vehicle: '',
    miles: '',
    purchasePrice: '',
    buyer: '',
  })

  const filteredPurchases =
    role === 'admin'
      ? purchases.filter((p) => {
          const dateStr = (p.date ?? '').toString().toLowerCase()
          const dealershipStr = (p.dealershipName ?? p.dealership ?? '').toString().toLowerCase()
          const vinStr = (p.vin ?? '').toString().toLowerCase()
          const vehicleStr = [p.vehicleYear, p.vehicleMake, p.vehicleModel].filter(Boolean).join(' ').toLowerCase()
          const milesStr = (p.miles != null ? p.miles.toLocaleString() : '').toString()
          const priceStr = (p.purchasePrice != null ? `$${Number(p.purchasePrice).toLocaleString()}` : '').toString()
          const buyerStr = (p.buyerEmail ?? p.buyer?.email ?? '').toString().toLowerCase()
          const fd = (filter.date ?? '').trim().toLowerCase()
          const fdealer = (filter.dealership ?? '').trim().toLowerCase()
          const fv = (filter.vin ?? '').trim().toLowerCase()
          const fveh = (filter.vehicle ?? '').trim().toLowerCase()
          const fm = (filter.miles ?? '').trim()
          const fp = (filter.purchasePrice ?? '').trim()
          const fbuyer = (filter.buyer ?? '').trim().toLowerCase()
          if (fd && !dateStr.includes(fd)) return false
          if (fdealer && !dealershipStr.includes(fdealer)) return false
          if (fv && !vinStr.includes(fv)) return false
          if (fveh && !vehicleStr.includes(fveh)) return false
          if (fm && !milesStr.includes(fm)) return false
          if (fp && !priceStr.includes(fp)) return false
          if (fbuyer && !buyerStr.includes(fbuyer)) return false
          return true
        })
      : []

  useEffect(() => {
    if (role !== 'admin' || !token) return
    let cancelled = false
    async function fetchAll() {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/purchases`)
        if (!res.ok) {
          if (res.status === 401) return
          const data = await res.json().catch(() => ({}))
          setError(data.message || `Failed to load (${res.status})`)
          setPurchases([])
          return
        }
        const data = await res.json()
        if (!cancelled) setPurchases(Array.isArray(data) ? data : data.purchases || data.content || [])
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load purchases')
          setPurchases([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchAll()
    return () => { cancelled = true }
  }, [role, token])

  function handleSignOut() {
    clearStoredToken()
    clearStoredUserName()
    clearStoredUserRole()
    clearStoredDealerName()
    navigate('/', { replace: true })
  }

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (role === 'admin') {
    return (
      <div className="dashboard dashboard-admin">
        <div className="dashboard-admin-header">
          <h2 className="dashboard-admin-title">Admin</h2>
        </div>
        {error && (
          <div className="dashboard-admin-error" role="alert">
            {error}
          </div>
        )}
        <div className="dashboard-admin-body">
          {loading ? (
            <p className="dashboard-admin-loading">Loading all purchases…</p>
          ) : purchases.length === 0 ? (
            <p className="dashboard-admin-empty">No purchases.</p>
          ) : (
            <div className="dashboard-admin-table-wrap">
              <table className="dashboard-admin-table">
                <thead>
                  <tr className="dashboard-admin-filter-row">
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.date}
                        onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
                        aria-label="Filter by date"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.dealership}
                        onChange={(e) => setFilter((f) => ({ ...f, dealership: e.target.value }))}
                        aria-label="Filter by dealership"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.vin}
                        onChange={(e) => setFilter((f) => ({ ...f, vin: e.target.value }))}
                        aria-label="Filter by VIN"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.vehicle}
                        onChange={(e) => setFilter((f) => ({ ...f, vehicle: e.target.value }))}
                        aria-label="Filter by vehicle"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.miles}
                        onChange={(e) => setFilter((f) => ({ ...f, miles: e.target.value }))}
                        aria-label="Filter by miles"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.purchasePrice}
                        onChange={(e) => setFilter((f) => ({ ...f, purchasePrice: e.target.value }))}
                        aria-label="Filter by purchase price"
                      />
                    </th>
                    <th>
                      <input
                        type="text"
                        className="dashboard-admin-filter-input"
                        placeholder="Filter…"
                        value={filter.buyer}
                        onChange={(e) => setFilter((f) => ({ ...f, buyer: e.target.value }))}
                        aria-label="Filter by buyer"
                      />
                    </th>
                  </tr>
                  <tr className="dashboard-admin-header-row">
                    <th>Date</th>
                    <th>Dealership</th>
                    <th>VIN</th>
                    <th>Vehicle</th>
                    <th>Miles</th>
                    <th>Purchase Price</th>
                    <th>Buyer</th>
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
                      <td>{p.buyerEmail ?? p.buyer?.email ?? '—'}</td>
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

  return (
    <div className="dashboard">
      <div className="dashboard-card">
        <h2 className="dashboard-title">{label}</h2>
        <p className="dashboard-text">
          Welcome{name ? `, ${name}` : ''}. You're in the {label} area.
        </p>
        <button type="button" className="dashboard-signout" onClick={handleSignOut}>
          Sign out
        </button>
      </div>
    </div>
  )
}
