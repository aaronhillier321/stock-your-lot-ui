import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './PurchaseDetail.css'

function toFormData(purchase) {
  return {
    dealershipId: purchase.dealershipId ?? '',
    date: purchase.date ?? '',
    auctionPlatform: purchase.auctionPlatform ?? '',
    vin: purchase.vin ?? '',
    miles: purchase.miles != null ? String(purchase.miles) : '',
    purchasePrice: purchase.purchasePrice != null ? String(purchase.purchasePrice) : '',
    vehicleYear: purchase.vehicleYear ?? '',
    vehicleMake: purchase.vehicleMake ?? '',
    vehicleModel: purchase.vehicleModel ?? '',
    vehicleTrimLevel: purchase.vehicleTrimLevel ?? '',
    transportQuote: purchase.transportQuote != null ? String(purchase.transportQuote) : '',
  }
}

function toUpdateBody(form) {
  const body = {}
  if (form.dealershipId) body.dealershipId = form.dealershipId
  if (form.date) body.date = form.date
  body.auctionPlatform = form.auctionPlatform === '' ? null : (form.auctionPlatform || null)
  body.vin = form.vin === '' ? null : (form.vin || null)
  const milesNum = form.miles === '' ? null : parseInt(form.miles, 10)
  body.miles = form.miles === '' ? null : (Number.isNaN(milesNum) ? null : milesNum)
  const priceNum = form.purchasePrice === '' ? null : parseFloat(form.purchasePrice)
  body.purchasePrice = form.purchasePrice === '' ? null : (Number.isNaN(priceNum) ? null : priceNum)
  body.vehicleYear = form.vehicleYear === '' ? null : (form.vehicleYear || null)
  body.vehicleMake = form.vehicleMake === '' ? null : (form.vehicleMake || null)
  body.vehicleModel = form.vehicleModel === '' ? null : (form.vehicleModel || null)
  body.vehicleTrimLevel = form.vehicleTrimLevel === '' ? null : (form.vehicleTrimLevel || null)
  const transportNum = form.transportQuote === '' ? null : parseFloat(form.transportQuote)
  body.transportQuote = form.transportQuote === '' ? null : (Number.isNaN(transportNum) ? null : transportNum)
  return body
}

export default function PurchaseDetail() {
  const { id } = useParams()
  const token = getStoredToken()
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(null)
  const [dealerships, setDealerships] = useState([])
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchPurchase() {
      if (!id || !token) return
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}/api/purchases/${id}`)
        if (!res.ok) {
          if (res.status === 404 && !cancelled) setError('Purchase not found.')
          else if (res.status === 401) return
          else if (!cancelled) {
            const data = await res.json().catch(() => ({}))
            setError(data.message || `Failed to load (${res.status})`)
          }
          setPurchase(null)
          return
        }
        const data = await res.json()
        if (!cancelled) setPurchase(data?.data ?? data)
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load purchase')
          setPurchase(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPurchase()
    return () => { cancelled = true }
  }, [id, token])

  useEffect(() => {
    if (!editing || !token) return
    let cancelled = false
    async function fetchDealerships() {
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setDealerships(Array.isArray(data) ? data : data.dealerships || data.content || [])
        }
      } catch (_) {}
    }
    fetchDealerships()
    return () => { cancelled = true }
  }, [editing, token])

  function startEditing() {
    setEditing(true)
    setFormData(toFormData(purchase))
    setSubmitError('')
  }

  function cancelEditing() {
    setEditing(false)
    setFormData(null)
    setSubmitError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const body = toUpdateBody(formData)
      const res = await authFetch(`${getApiBase()}/api/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data.message || data.error || `Update failed (${res.status})`)
        return
      }
      const data = await res.json()
      setPurchase(data?.data ?? data)
      setEditing(false)
      setFormData(null)
    } catch (err) {
      setSubmitError(err.message || 'Failed to update purchase')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return <Navigate to="/" replace />
  if (loading) return <div className="purchase-detail-page"><p className="purchase-detail-loading">Loading…</p></div>
  if (error && !purchase) {
    return (
      <div className="purchase-detail-page">
        <p className="purchase-detail-error">{error}</p>
        <Link to="/purchases" className="purchase-detail-back">← Back to My Purchases</Link>
      </div>
    )
  }
  if (!purchase) return null

  const vehicleLine = [purchase.vehicleYear, purchase.vehicleMake, purchase.vehicleModel].filter(Boolean).join(' ') || '—'
  const form = formData

  const content = (
    <div className="purchase-detail-cols">
      <div className="purchase-detail-col">
        <dl className="purchase-detail-dl">
          <dt>Date</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.date ?? '—') : (
              <input type="date" className="purchase-detail-input" value={form.date} onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))} />
            )}
          </dd>
          <dt>Dealership</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (
              purchase.dealershipId ? (
                <Link to={`/dealerships/${purchase.dealershipId}`} className="purchase-detail-link">
                  {purchase.dealershipName ?? purchase.dealership ?? '—'}
                </Link>
              ) : (
                purchase.dealershipName ?? purchase.dealership ?? '—'
              )
            ) : (
              <select className="purchase-detail-input" value={form.dealershipId} onChange={(e) => setFormData((f) => ({ ...f, dealershipId: e.target.value }))}>
                <option value="">—</option>
                {dealerships.map((d) => (
                  <option key={d.id} value={d.id}>{d.name ?? d.id}</option>
                ))}
              </select>
            )}
          </dd>
          <dt>VIN</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.vin ?? '—') : (
              <input type="text" className="purchase-detail-input" value={form.vin} onChange={(e) => setFormData((f) => ({ ...f, vin: e.target.value }))} maxLength={17} />
            )}
          </dd>
        </dl>
      </div>
      <div className="purchase-detail-col">
        <dl className="purchase-detail-dl">
          <dt>Vehicle</dt>
          <dd className="purchase-detail-dd">
            {!editing ? vehicleLine : (
              <span className="purchase-detail-vehicle-fields">
                <input type="text" className="purchase-detail-input purchase-detail-input-sm" placeholder="Year" value={form.vehicleYear} onChange={(e) => setFormData((f) => ({ ...f, vehicleYear: e.target.value }))} />
                <input type="text" className="purchase-detail-input" placeholder="Make" value={form.vehicleMake} onChange={(e) => setFormData((f) => ({ ...f, vehicleMake: e.target.value }))} />
                <input type="text" className="purchase-detail-input" placeholder="Model" value={form.vehicleModel} onChange={(e) => setFormData((f) => ({ ...f, vehicleModel: e.target.value }))} />
              </span>
            )}
          </dd>
          <dt>Trim</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.vehicleTrimLevel ?? '—') : (
              <input type="text" className="purchase-detail-input" value={form.vehicleTrimLevel} onChange={(e) => setFormData((f) => ({ ...f, vehicleTrimLevel: e.target.value }))} />
            )}
          </dd>
          <dt>Auction platform</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.auctionPlatform ?? '—') : (
              <input type="text" className="purchase-detail-input" value={form.auctionPlatform} onChange={(e) => setFormData((f) => ({ ...f, auctionPlatform: e.target.value }))} />
            )}
          </dd>
          <dt>Miles</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.miles != null ? purchase.miles.toLocaleString() : '—') : (
              <input type="number" className="purchase-detail-input" value={form.miles} onChange={(e) => setFormData((f) => ({ ...f, miles: e.target.value }))} min={0} />
            )}
          </dd>
        </dl>
      </div>
      <div className="purchase-detail-col">
        <dl className="purchase-detail-dl">
          <dt>Purchase price</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.purchasePrice != null ? `$${Number(purchase.purchasePrice).toLocaleString()}` : '—') : (
              <input type="number" step="any" className="purchase-detail-input" value={form.purchasePrice} onChange={(e) => setFormData((f) => ({ ...f, purchasePrice: e.target.value }))} min={0} />
            )}
          </dd>
          <dt>Transport quote</dt>
          <dd className="purchase-detail-dd">
            {!editing ? (purchase.transportQuote != null ? `$${Number(purchase.transportQuote).toLocaleString()}` : '—') : (
              <input type="number" step="any" className="purchase-detail-input" value={form.transportQuote} onChange={(e) => setFormData((f) => ({ ...f, transportQuote: e.target.value }))} min={0} />
            )}
          </dd>
          {(purchase.buyerEmail ?? purchase.buyer?.email) && (
            <>
              <dt>Buyer</dt>
              <dd className="purchase-detail-dd">{purchase.buyerEmail ?? purchase.buyer?.email}</dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )

  const commissions = purchase.commissions ?? []
  const purchasePriceNum = purchase.purchasePrice != null ? Number(purchase.purchasePrice) : null
  const serviceFeeNum = purchase.serviceFee != null ? Number(purchase.serviceFee) : null
  const totalInvoiceNum =
    purchasePriceNum != null && serviceFeeNum != null
      ? purchasePriceNum + serviceFeeNum
      : purchasePriceNum != null
        ? purchasePriceNum
        : null
  const formatMoney = (n) =>
    n != null ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'

  const totalCommissionsNum = commissions.reduce(
    (sum, c) => sum + (c.amount != null ? Number(c.amount) : 0),
    0
  )
  const profitNum =
    serviceFeeNum != null && totalCommissionsNum != null
      ? serviceFeeNum - totalCommissionsNum
      : serviceFeeNum != null
        ? serviceFeeNum
        : null

  const commissionsTable = !editing && (
    <div className="purchase-detail-commissions">
      <h3 className="purchase-detail-commissions-title">Commissions</h3>
      {commissions.length > 0 ? (
        <div className="purchase-detail-commissions-table-wrap">
          <table className="purchase-detail-commissions-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Rule</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c, idx) => {
                const username = c.userUsername ?? c.user_username ?? '—'
                const ruleName = c.ruleName ?? c.rule_name ?? '—'
                const amount = c.amount != null ? formatMoney(Number(c.amount)) : '—'
                return (
                  <tr key={c.userId ?? c.user_id ?? idx}>
                    <td>{username}</td>
                    <td>{ruleName}</td>
                    <td>{amount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="purchase-detail-commissions-empty">No commissions.</p>
      )}
    </div>
  )

  const invoiceSummary = !editing && (
    <div className="purchase-detail-invoice">
      <h3 className="purchase-detail-invoice-title">Invoice</h3>
      <dl className="purchase-detail-invoice-dl">
        <dt>Purchase Price</dt>
        <dd>{formatMoney(purchasePriceNum)}</dd>
        <dt>Service Fee</dt>
        <dd>{formatMoney(serviceFeeNum)}</dd>
        <dt>Total Invoice</dt>
        <dd className="purchase-detail-invoice-total">{formatMoney(totalInvoiceNum)}</dd>
      </dl>
    </div>
  )

  const serviceFeeSummary = !editing && (
    <div className="purchase-detail-service-fee">
      <h3 className="purchase-detail-invoice-title">Service Fee</h3>
      <dl className="purchase-detail-invoice-dl">
        <dt>Service Fee</dt>
        <dd>{formatMoney(serviceFeeNum)}</dd>
        <dt>Commissions</dt>
        <dd>{formatMoney(totalCommissionsNum)}</dd>
        <dt>Profit</dt>
        <dd className="purchase-detail-invoice-total">{formatMoney(profitNum)}</dd>
      </dl>
    </div>
  )

  const rightSideSummary = !editing && (
    <div className="purchase-detail-right-summary">
      {serviceFeeSummary}
      {invoiceSummary}
    </div>
  )

  const commissionsAndInvoice = !editing && (
    <div className="purchase-detail-commissions-row">
      {commissionsTable}
      {rightSideSummary}
    </div>
  )

  return (
    <div className="purchase-detail-page">
      <div className="purchase-detail-top-bar">
        <Link to="/purchases" className="purchase-detail-back">← Back to My Purchases</Link>
        {!editing ? (
          <button type="button" className="purchase-detail-edit-btn" onClick={startEditing}>
            Edit
          </button>
        ) : (
          <div className="purchase-detail-edit-actions">
            <button type="button" className="purchase-detail-cancel-btn" onClick={cancelEditing} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="purchase-detail-form" className="purchase-detail-save-btn" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <header className="purchase-detail-header">
        <h2 className="purchase-detail-title">{vehicleLine}</h2>
        <p className="purchase-detail-info-line">
          {[purchase.date ?? '—', purchase.dealershipName ?? purchase.dealership ?? '—', purchase.vin ?? '—'].filter(Boolean).join(' · ')}
        </p>
      </header>

      <section className="purchase-detail-section">
        {submitError && (
          <div className="purchase-detail-submit-error" role="alert">
            {submitError}
          </div>
        )}
        {editing ? (
          <form id="purchase-detail-form" className="purchase-detail-form" onSubmit={handleSubmit}>
            {content}
          </form>
        ) : (
          content
        )}
        {commissionsAndInvoice}
      </section>
    </div>
  )
}
