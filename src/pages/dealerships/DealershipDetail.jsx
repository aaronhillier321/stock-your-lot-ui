import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './DealershipDetail.css'

export default function DealershipDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [dealership, setDealership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [purchases, setPurchases] = useState([])
  const [purchasesLoading, setPurchasesLoading] = useState(false)
  const [filter, setFilter] = useState({
    date: '',
    auctionPlatform: '',
    vin: '',
    vehicle: '',
    trim: '',
    miles: '',
    purchasePrice: '',
    transportQuote: '',
  })

  const filteredPurchases = purchases.filter((p) => {
    const dateStr = (p.date ?? '').toString().toLowerCase()
    const auctionStr = (p.auctionPlatform ?? '').toString().toLowerCase()
    const vinStr = (p.vin ?? '').toString().toLowerCase()
    const vehicleStr = [p.vehicleYear, p.vehicleMake, p.vehicleModel].filter(Boolean).join(' ').toLowerCase()
    const trimStr = (p.vehicleTrimLevel ?? '').toString().toLowerCase()
    const milesStr = (p.miles != null ? p.miles.toLocaleString() : '').toString()
    const priceStr = (p.purchasePrice != null ? `$${Number(p.purchasePrice).toLocaleString()}` : '').toString()
    const transportStr = (p.transportQuote != null ? `$${Number(p.transportQuote).toLocaleString()}` : '').toString()
    const fd = (filter.date ?? '').trim().toLowerCase()
    const fa = (filter.auctionPlatform ?? '').trim().toLowerCase()
    const fv = (filter.vin ?? '').trim().toLowerCase()
    const fveh = (filter.vehicle ?? '').trim().toLowerCase()
    const ft = (filter.trim ?? '').trim().toLowerCase()
    const fm = (filter.miles ?? '').trim()
    const fp = (filter.purchasePrice ?? '').trim()
    const fq = (filter.transportQuote ?? '').trim()
    if (fd && !dateStr.includes(fd)) return false
    if (fa && !auctionStr.includes(fa)) return false
    if (fv && !vinStr.includes(fv)) return false
    if (fveh && !vehicleStr.includes(fveh)) return false
    if (ft && !trimStr.includes(ft)) return false
    if (fm && !milesStr.includes(fm)) return false
    if (fp && !priceStr.includes(fp)) return false
    if (fq && !transportStr.includes(fq)) return false
    return true
  })

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

  return (
    <div className="dealership-detail-page">
      <div className="dealership-detail-top-bar">
        <Link to="/dealerships" className="dealership-detail-back">← Back to dealerships</Link>
        <button type="button" className="dealership-detail-add-user-btn" onClick={() => { setInviteError(''); setInviteSuccess(''); setShowInviteModal(true); }}>
          Add User
        </button>
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
        <h3 className="dealership-detail-section-title">Purchases</h3>
        <div className="dealership-detail-table-body">
          {purchasesLoading ? (
            <p className="dealership-detail-loading">Loading purchases…</p>
          ) : purchases.length === 0 ? (
            <p className="dealership-detail-empty">No purchases for this dealership.</p>
          ) : (
            <div className="dealership-detail-table-wrap">
              <table className="dealership-detail-purchases-table">
              <thead>
                <tr className="dealership-detail-filter-row">
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.date}
                      onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value }))}
                      aria-label="Filter by date"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.auctionPlatform}
                      onChange={(e) => setFilter((f) => ({ ...f, auctionPlatform: e.target.value }))}
                      aria-label="Filter by auction platform"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.vin}
                      onChange={(e) => setFilter((f) => ({ ...f, vin: e.target.value }))}
                      aria-label="Filter by VIN"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.vehicle}
                      onChange={(e) => setFilter((f) => ({ ...f, vehicle: e.target.value }))}
                      aria-label="Filter by vehicle"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.trim}
                      onChange={(e) => setFilter((f) => ({ ...f, trim: e.target.value }))}
                      aria-label="Filter by trim"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.miles}
                      onChange={(e) => setFilter((f) => ({ ...f, miles: e.target.value }))}
                      aria-label="Filter by miles"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.purchasePrice}
                      onChange={(e) => setFilter((f) => ({ ...f, purchasePrice: e.target.value }))}
                      aria-label="Filter by purchase price"
                    />
                  </th>
                  <th>
                    <input
                      type="text"
                      className="dealership-detail-filter-input"
                      placeholder="Filter…"
                      value={filter.transportQuote}
                      onChange={(e) => setFilter((f) => ({ ...f, transportQuote: e.target.value }))}
                      aria-label="Filter by transport quote"
                    />
                  </th>
                </tr>
                <tr>
                  <th>Date</th>
                  <th>Auction Platform</th>
                  <th>VIN</th>
                  <th>Vehicle</th>
                  <th>Trim</th>
                  <th>Miles</th>
                  <th>Purchase Price</th>
                  <th>Transport Quote</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date ?? '—'}</td>
                    <td>{p.auctionPlatform ?? '—'}</td>
                    <td>{p.vin ?? '—'}</td>
                    <td>{[p.vehicleYear, p.vehicleMake, p.vehicleModel].filter(Boolean).join(' ') || '—'}</td>
                    <td>{p.vehicleTrimLevel ?? '—'}</td>
                    <td>{p.miles != null ? p.miles.toLocaleString() : '—'}</td>
                    <td>{p.purchasePrice != null ? `$${Number(p.purchasePrice).toLocaleString()}` : '—'}</td>
                    <td>{p.transportQuote != null ? `$${Number(p.transportQuote).toLocaleString()}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
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
