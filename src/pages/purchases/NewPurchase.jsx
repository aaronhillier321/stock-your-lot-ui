import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import './NewPurchase.css'

const emptyForm = {
  dealership: '',
  date: '',
  auctionPlatform: '',
  vin: '',
  ymmt: '',
  miles: '',
  purchasePrice: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleTrimLevel: '',
  transportQuote: '',
}

export default function NewPurchase() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const body = {
        dealership: formData.dealership?.trim() || null,
        date: formData.date || null,
        auctionPlatform: formData.auctionPlatform?.trim() || null,
        vin: formData.vin?.trim() || null,
        ymmt: formData.ymmt?.trim() || null,
        miles: formData.miles === '' ? null : Number(formData.miles),
        purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
        vehicleYear: formData.vehicleYear?.trim() || null,
        vehicleMake: formData.vehicleMake?.trim() || null,
        vehicleModel: formData.vehicleModel?.trim() || null,
        vehicleTrimLevel: formData.vehicleTrimLevel?.trim() || null,
        transportQuote: formData.transportQuote === '' ? null : Number(formData.transportQuote),
      }
      const res = await authFetch(`${getApiBase()}/api/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.message || data.error || `Failed to save (${res.status})`)
        return
      }
      navigate('/purchases', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to save purchase')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return <Navigate to="/" replace />

  return (
    <div className="new-purchase-page">
      <div className="new-purchase-card">
        <Link to="/purchases" className="new-purchase-back">← Back to Purchases</Link>
        <h2 className="new-purchase-title">New Purchase</h2>

        <form className="new-purchase-form" onSubmit={handleConfirm}>
          {error && (
            <div className="new-purchase-error" role="alert">
              {error}
            </div>
          )}
          <label className="new-purchase-label">
            Dealership
            <input
              type="text"
              className="new-purchase-input"
              value={formData.dealership}
              onChange={(e) => update('dealership', e.target.value)}
              placeholder="Dealership name"
            />
          </label>

          <label className="new-purchase-label">
            Date
            <input
              type="date"
              className="new-purchase-input"
              value={formData.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </label>

          <label className="new-purchase-label">
            Auction Platform
            <input
              type="text"
              className="new-purchase-input"
              value={formData.auctionPlatform}
              onChange={(e) => update('auctionPlatform', e.target.value)}
              placeholder="e.g. Manheim, Copart"
            />
          </label>

          <label className="new-purchase-label">
            Vehicle Identification Number (VIN)
            <input
              type="text"
              className="new-purchase-input"
              value={formData.vin}
              onChange={(e) => update('vin', e.target.value)}
              placeholder="17-character VIN"
              maxLength={17}
            />
          </label>

          <label className="new-purchase-label">
            YMMT
            <input
              type="text"
              className="new-purchase-input"
              value={formData.ymmt}
              onChange={(e) => update('ymmt', e.target.value)}
              placeholder="Year / Make / Model / Trim"
            />
          </label>

          <label className="new-purchase-label">
            Miles
            <input
              type="number"
              className="new-purchase-input"
              value={formData.miles}
              onChange={(e) => update('miles', e.target.value)}
              placeholder="Odometer"
              min={0}
              step={1}
            />
          </label>

          <label className="new-purchase-label">
            Purchase Price
            <input
              type="number"
              className="new-purchase-input"
              value={formData.purchasePrice}
              onChange={(e) => update('purchasePrice', e.target.value)}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </label>

          <label className="new-purchase-label">
            Vehicle Year
            <input
              type="text"
              className="new-purchase-input"
              value={formData.vehicleYear}
              onChange={(e) => update('vehicleYear', e.target.value)}
              placeholder="e.g. 2022"
            />
          </label>

          <label className="new-purchase-label">
            Vehicle Make
            <input
              type="text"
              className="new-purchase-input"
              value={formData.vehicleMake}
              onChange={(e) => update('vehicleMake', e.target.value)}
              placeholder="e.g. Toyota"
            />
          </label>

          <label className="new-purchase-label">
            Vehicle Model
            <input
              type="text"
              className="new-purchase-input"
              value={formData.vehicleModel}
              onChange={(e) => update('vehicleModel', e.target.value)}
              placeholder="e.g. Camry"
            />
          </label>

          <label className="new-purchase-label">
            Vehicle Trim Level
            <input
              type="text"
              className="new-purchase-input"
              value={formData.vehicleTrimLevel}
              onChange={(e) => update('vehicleTrimLevel', e.target.value)}
              placeholder="e.g. LE, XSE"
            />
          </label>

          <label className="new-purchase-label">
            Transport Quote
            <input
              type="number"
              className="new-purchase-input"
              value={formData.transportQuote}
              onChange={(e) => update('transportQuote', e.target.value)}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </label>

          <div className="new-purchase-actions">
            <Link to="/purchases" className="new-purchase-cancel" tabIndex={submitting ? -1 : 0}>
              Cancel
            </Link>
            <button type="submit" className="new-purchase-confirm" disabled={submitting}>
              {submitting ? 'Saving…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
