import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import { usePdfPreview } from '../../hooks/usePdfPreview'
import PdfPreviewModal from '../../components/PdfPreviewModal'
import carImage from '../../../assets/Car.png'
import './NewPurchase.css'

function randomUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  )
}

const emptyForm = {
  dealershipId: '',
  date: '',
  auctionPlatform: '',
  vin: '',
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
  const billOfSaleInputRef = useRef(null)
  const conditionReportInputRef = useRef(null)
  const continueBtnRef = useRef(null)
  const [carStartPos, setCarStartPos] = useState(null)
  const [dealerships, setDealerships] = useState([])
  const [dealershipsLoading, setDealershipsLoading] = useState(true)
  const [formData, setFormData] = useState(emptyForm)
  const [billOfSaleFile, setBillOfSaleFile] = useState(null)
  const [conditionReportFile, setConditionReportFile] = useState(null)
  const [extracted, setExtracted] = useState(false)
  const [purchaseId, setPurchaseId] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOverZone, setDragOverZone] = useState(null)
  const [conflictErrors, setConflictErrors] = useState({})
  const [uploadToken, setUploadToken] = useState(null)
  const [confirmedAccurate, setConfirmedAccurate] = useState(false)
  const pdfPreview = usePdfPreview()

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchDealerships() {
      try {
        const res = await authFetch(`${getApiBase()}/api/dealerships`)
        if (res.ok && !cancelled) {
          const data = await res.json()
          setDealerships(Array.isArray(data) ? data : [])
        }
      } catch (_) {}
      if (!cancelled) setDealershipsLoading(false)
    }
    fetchDealerships()
    return () => { cancelled = true }
  }, [token])

  function update(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function isValidPdf(file) {
    return file && file.type === 'application/pdf' && file.name.toLowerCase().endsWith('.pdf')
  }

  const fmt = (v) => (v != null ? String(v) : '')
  const fmtNum = (v) => (v != null ? String(v) : '')
  const fmtDate = (v) => {
    if (v == null) return ''
    const s = String(v)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
    const d = new Date(s)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
    return s
  }

  function normalizeForCompare(v) {
    if (v == null) return ''
    const s = String(v).trim()
    return s
  }

  async function runExtractions() {
    if (!formData.dealershipId?.trim() || !billOfSaleFile || !conditionReportFile) return
    const btn = continueBtnRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const carHeight = 80
      const centerY = rect.top + rect.height / 2
      const clampedY = Math.max(carHeight / 2, Math.min(window.innerHeight - carHeight / 2, centerY))
      setCarStartPos({ left: rect.right - 50, top: clampedY })
    }
    setError('')
    setConflictErrors({})
    setExtracting(true)
    const token = randomUUID()
    try {
      const billForm = new FormData()
      billForm.append('file', billOfSaleFile)
      billForm.append('uploadToken', token)
      const conditionForm = new FormData()
      conditionForm.append('file', conditionReportFile)
      conditionForm.append('uploadToken', token)

      const [billRes, conditionRes] = await Promise.all([
        authFetch(`${getApiBase()}/api/bill-of-sale/extract`, { method: 'POST', body: billForm }),
        authFetch(`${getApiBase()}/api/condition-report/extract`, { method: 'POST', body: conditionForm }),
      ])

      const billData = await billRes.json().catch(() => null)
      const conditionData = await conditionRes.json().catch(() => null)

      if (!billRes.ok) {
        setError(billData?.message || billData?.error || `Bill of Sale extraction failed (${billRes.status})`)
        return
      }
      if (!conditionRes.ok) {
        setError(conditionData?.message || conditionData?.error || `Condition Report extraction failed (${conditionRes.status})`)
        return
      }

      const returnedToken = billData?.uploadToken ?? conditionData?.uploadToken ?? token
      setUploadToken(returnedToken)
      if (billData?.id) setPurchaseId(billData.id)
      setExtracted(true)

      const conflicts = {}
      const merge = (formKey, billVal, conditionVal, formatter = fmt) => {
        const b = billVal != null ? formatter(billVal) : ''
        const c = conditionVal != null ? formatter(conditionVal) : ''
        if (b && c && normalizeForCompare(b) !== normalizeForCompare(c)) {
          conflicts[formKey] = { billOfSale: b, conditionReport: c }
          return b
        }
        return b || c
      }

      setFormData((prev) => ({
        ...prev,
        vin: merge('vin', billData?.vin, conditionData?.vin),
        vehicleMake: merge('vehicleMake', billData?.make, conditionData?.make),
        vehicleModel: merge('vehicleModel', billData?.model, conditionData?.model),
        vehicleTrimLevel: merge('vehicleTrimLevel', billData?.trim, conditionData?.trim),
        auctionPlatform: merge('auctionPlatform', billData?.auction, conditionData?.auction),
        vehicleYear: merge('vehicleYear', billData?.vehicleYear, conditionData?.vehicleYear, fmtNum),
        miles: merge('miles', billData?.miles, conditionData?.miles, fmtNum),
        purchasePrice: fmtNum(billData?.purchasePrice ?? null),
        date: fmtDate(billData?.saleDate ?? null),
      }))
      setConflictErrors(conflicts)
    } catch (err) {
      setError(err.message || 'Failed to extract from documents')
    } finally {
      setExtracting(false)
      setCarStartPos(null)
    }
  }

  const allThreeReady = formData.dealershipId?.trim() && billOfSaleFile && conditionReportFile

  function handleConditionReportFile(file) {
    if (!isValidPdf(file)) {
      setError('Condition Report must be a valid PDF file.')
      return
    }
    setError('')
    setConditionReportFile(file)
  }

  function handleDragOver(e, zone) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone(zone)
  }

  function handleDragLeave(e, zone) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone((z) => (z === zone ? null : z))
  }

  function handleBillOfSaleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone(null)
    if (extracting || extracted) return
    const file = e.dataTransfer?.files?.[0]
    if (file && isValidPdf(file)) {
      setError('')
      setBillOfSaleFile(file)
    } else if (file) {
      setError('Bill of Sale must be a valid PDF file.')
    }
  }

  function handleConditionReportDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragOverZone(null)
    if (extracted) return
    const file = e.dataTransfer?.files?.[0]
    if (file) handleConditionReportFile(file)
  }

  function handleBillOfSaleSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      if (isValidPdf(file)) {
        setError('')
        setBillOfSaleFile(file)
      } else {
        setError('Bill of Sale must be a valid PDF file.')
      }
    }
    e.target.value = ''
  }

  function handleConditionReportSelect(e) {
    const file = e.target.files?.[0]
    if (file) handleConditionReportFile(file)
    e.target.value = ''
  }

  async function handleConfirm(e) {
    e.preventDefault()
    setError('')
    if (!formData.dealershipId?.trim()) {
      setError('Please select a dealership.')
      return
    }
    if (!formData.auctionPlatform?.trim()) {
      setError('Auction platform is required.')
      return
    }
    if (!formData.vin?.trim()) {
      setError('VIN is required.')
      return
    }
    setSubmitting(true)
    try {
      let res
      if (purchaseId) {
        const body = {
          dealershipId: formData.dealershipId.trim(),
          date: formData.date || null,
          auctionPlatform: formData.auctionPlatform?.trim() || null,
          vin: formData.vin?.trim() || null,
          miles: formData.miles === '' ? null : Number(formData.miles),
          purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
          vehicleYear: formData.vehicleYear?.trim() || null,
          vehicleMake: formData.vehicleMake?.trim() || null,
          vehicleModel: formData.vehicleModel?.trim() || null,
          vehicleTrimLevel: formData.vehicleTrimLevel?.trim() || null,
          transportQuote: formData.transportQuote === '' ? null : Number(formData.transportQuote),
          ...(uploadToken && { uploadToken }),
        }
        res = await authFetch(`${getApiBase()}/api/purchases/${purchaseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        const body = {
          dealershipId: formData.dealershipId.trim(),
          date: formData.date || null,
          auctionPlatform: formData.auctionPlatform?.trim() || null,
          vin: formData.vin?.trim() || null,
          miles: formData.miles === '' ? null : Number(formData.miles),
          purchasePrice: formData.purchasePrice === '' ? null : Number(formData.purchasePrice),
          vehicleYear: formData.vehicleYear?.trim() || null,
          vehicleMake: formData.vehicleMake?.trim() || null,
          vehicleModel: formData.vehicleModel?.trim() || null,
          vehicleTrimLevel: formData.vehicleTrimLevel?.trim() || null,
          transportQuote: formData.transportQuote === '' ? null : Number(formData.transportQuote),
          ...(uploadToken && { uploadToken }),
        }
        res = await authFetch(`${getApiBase()}/api/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }

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
      <Link to="/purchases" className="new-purchase-back">← Back to My Purchases</Link>
      <h2 className="new-purchase-title">New Purchase</h2>

      <div className="new-purchase-card">
        {!extracted ? (
          <>
            <label className="new-purchase-label new-purchase-label-dropdown">
              <span className="new-purchase-label-text">Dealership <span className="new-purchase-required" aria-hidden>*</span></span>
              <select
                className="new-purchase-input new-purchase-select"
                value={formData.dealershipId}
                onChange={(e) => update('dealershipId', e.target.value)}
                disabled={dealershipsLoading || extracting}
              >
                <option value="">Select dealership</option>
                {dealerships.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? d.id}
                  </option>
                ))}
              </select>
            </label>
            <div className="new-purchase-dropzones">
              <div
                className={`new-purchase-dropzone ${dragOverZone === 'billOfSale' ? 'new-purchase-dropzone-active' : ''} ${extracting ? 'new-purchase-dropzone-disabled' : ''} ${extracted ? 'new-purchase-dropzone-disabled' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'billOfSale')}
                onDragLeave={(e) => handleDragLeave(e, 'billOfSale')}
                onDrop={handleBillOfSaleDrop}
                onClick={() => !extracting && billOfSaleInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !extracting) {
                    e.preventDefault()
                    billOfSaleInputRef.current?.click()
                  }
                }}
                aria-label="Drop Bill of Sale PDF or click to browse"
              >
                <input
                  ref={billOfSaleInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleBillOfSaleSelect}
                  className="new-purchase-dropzone-input"
                  aria-hidden
                />
                {billOfSaleFile ? (
                  <>
                    <span className="new-purchase-dropzone-icon">✓</span>
                    <span className="new-purchase-dropzone-text">{billOfSaleFile.name}</span>
                    <span className="new-purchase-dropzone-hint">Click to replace</span>
                  </>
                ) : (
                  <>
                    <span className="new-purchase-dropzone-icon">📄</span>
                    <span className="new-purchase-dropzone-text">Bill of Sale <span className="new-purchase-required" aria-hidden>*</span></span>
                    <span className="new-purchase-dropzone-hint">Drop PDF or click</span>
                  </>
                )}
              </div>
              <div
                className={`new-purchase-dropzone ${dragOverZone === 'conditionReport' ? 'new-purchase-dropzone-active' : ''} ${extracting ? 'new-purchase-dropzone-disabled' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'conditionReport')}
                onDragLeave={(e) => handleDragLeave(e, 'conditionReport')}
                onDrop={handleConditionReportDrop}
                onClick={() => conditionReportInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    conditionReportInputRef.current?.click()
                  }
                }}
                aria-label="Drop Condition Report PDF or click to browse"
              >
                <input
                  ref={conditionReportInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleConditionReportSelect}
                  className="new-purchase-dropzone-input"
                  aria-hidden
                />
                {conditionReportFile ? (
                  <>
                    <span className="new-purchase-dropzone-icon">✓</span>
                    <span className="new-purchase-dropzone-text">{conditionReportFile.name}</span>
                    <span className="new-purchase-dropzone-hint">Click to replace</span>
                  </>
                ) : (
                  <>
                    <span className="new-purchase-dropzone-icon">📋</span>
                    <span className="new-purchase-dropzone-text">Condition Report <span className="new-purchase-required" aria-hidden>*</span></span>
                    <span className="new-purchase-dropzone-hint">Drop PDF or click</span>
                  </>
                )}
              </div>
            </div>
            <div className="new-purchase-extract-row">
              <button
                ref={continueBtnRef}
                type="button"
                className="new-purchase-extract-btn"
                disabled={!allThreeReady || extracting}
                onClick={runExtractions}
              >
                {extracting ? 'Extracting…' : 'Continue'}
              </button>
            </div>
            {extracting && carStartPos &&
              createPortal(
                <div
                  className="new-purchase-car-sprite"
                  style={{
                    '--car-start-left': `${carStartPos.left}px`,
                    '--car-start-top': `${carStartPos.top}px`,
                  }}
                  aria-hidden
                >
                  <img src={carImage} alt="" className="new-purchase-car-sprite-img" />
                </div>,
                document.body
              )
            }
            {error && (
              <div className="new-purchase-error" role="alert">
                {error}
              </div>
            )}
          </>
        ) : (
          <form className="new-purchase-form" onSubmit={handleConfirm}>
            {error && (
              <div className="new-purchase-error" role="alert">
                {error}
              </div>
            )}

            <label className="new-purchase-label">
              <span className="new-purchase-label-text">Dealership <span className="new-purchase-required" aria-hidden>*</span></span>
              <select
                className="new-purchase-input new-purchase-select"
                value={formData.dealershipId}
                onChange={(e) => update('dealershipId', e.target.value)}
                disabled={dealershipsLoading}
              >
                <option value="">Select dealership</option>
                {dealerships.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name ?? d.id}
                  </option>
                ))}
              </select>
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
              <span className="new-purchase-label-text">Auction Platform <span className="new-purchase-required" aria-hidden>*</span></span>
              <input
                type="text"
                className={`new-purchase-input ${conflictErrors.auctionPlatform ? 'new-purchase-input-conflict' : ''}`}
                value={formData.auctionPlatform}
                onChange={(e) => update('auctionPlatform', e.target.value)}
                placeholder="e.g. Manheim, Copart"
              />
              {conflictErrors.auctionPlatform && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.auctionPlatform.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.auctionPlatform.conditionReport}&quot;
                </span>
              )}
            </label>

            <label className="new-purchase-label">
              <span className="new-purchase-label-text">Vehicle Identification Number (VIN) <span className="new-purchase-required" aria-hidden>*</span></span>
              <input
                type="text"
                className={`new-purchase-input ${conflictErrors.vin ? 'new-purchase-input-conflict' : ''}`}
                value={formData.vin}
                onChange={(e) => update('vin', e.target.value)}
                placeholder="17-character VIN"
                maxLength={17}
              />
              {conflictErrors.vin && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.vin.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.vin.conditionReport}&quot;
                </span>
              )}
            </label>

            <label className="new-purchase-label">
              Miles
              <input
                type="number"
                className={`new-purchase-input ${conflictErrors.miles ? 'new-purchase-input-conflict' : ''}`}
                value={formData.miles}
                onChange={(e) => update('miles', e.target.value)}
                placeholder="Odometer"
                min={0}
                step={1}
              />
              {conflictErrors.miles && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.miles.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.miles.conditionReport}&quot;
                </span>
              )}
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
                className={`new-purchase-input ${conflictErrors.vehicleYear ? 'new-purchase-input-conflict' : ''}`}
                value={formData.vehicleYear}
                onChange={(e) => update('vehicleYear', e.target.value)}
                placeholder="e.g. 2022"
              />
              {conflictErrors.vehicleYear && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.vehicleYear.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.vehicleYear.conditionReport}&quot;
                </span>
              )}
            </label>

            <label className="new-purchase-label">
              Vehicle Make
              <input
                type="text"
                className={`new-purchase-input ${conflictErrors.vehicleMake ? 'new-purchase-input-conflict' : ''}`}
                value={formData.vehicleMake}
                onChange={(e) => update('vehicleMake', e.target.value)}
                placeholder="e.g. Toyota"
              />
              {conflictErrors.vehicleMake && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.vehicleMake.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.vehicleMake.conditionReport}&quot;
                </span>
              )}
            </label>

            <label className="new-purchase-label">
              Vehicle Model
              <input
                type="text"
                className={`new-purchase-input ${conflictErrors.vehicleModel ? 'new-purchase-input-conflict' : ''}`}
                value={formData.vehicleModel}
                onChange={(e) => update('vehicleModel', e.target.value)}
                placeholder="e.g. Camry"
              />
              {conflictErrors.vehicleModel && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.vehicleModel.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.vehicleModel.conditionReport}&quot;
                </span>
              )}
            </label>

            <label className="new-purchase-label">
              Vehicle Trim Level
              <input
                type="text"
                className={`new-purchase-input ${conflictErrors.vehicleTrimLevel ? 'new-purchase-input-conflict' : ''}`}
                value={formData.vehicleTrimLevel}
                onChange={(e) => update('vehicleTrimLevel', e.target.value)}
                placeholder="e.g. LE, XSE"
              />
              {conflictErrors.vehicleTrimLevel && (
                <span className="new-purchase-conflict-msg">
                  Bill of Sale: &quot;{conflictErrors.vehicleTrimLevel.billOfSale}&quot; vs Condition Report: &quot;{conflictErrors.vehicleTrimLevel.conditionReport}&quot;
                </span>
              )}
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

            <div className="new-purchase-footer-row">
              <div className="new-purchase-uploads-row">
                <button
                  type="button"
                  className="new-purchase-upload-badge new-purchase-upload-badge-clickable"
                  title={billOfSaleFile?.name ? `Preview: ${billOfSaleFile.name}` : 'Preview PDF'}
                  onClick={() => pdfPreview.openPreview(billOfSaleFile, 'Bill of Sale')}
                >
                  <span className="new-purchase-upload-pdf">PDF</span>
                  <span className="new-purchase-upload-check">✓</span>
                  <span className="new-purchase-upload-label">Bill of Sale</span>
                </button>
                <button
                  type="button"
                  className="new-purchase-upload-badge new-purchase-upload-badge-clickable"
                  title={conditionReportFile?.name ? `Preview: ${conditionReportFile.name}` : 'Preview PDF'}
                  onClick={() => pdfPreview.openPreview(conditionReportFile, 'Condition Report')}
                >
                  <span className="new-purchase-upload-pdf">PDF</span>
                  <span className="new-purchase-upload-check">✓</span>
                  <span className="new-purchase-upload-label">Condition Report</span>
                </button>
              </div>
              <div className="new-purchase-actions">
                <label className="new-purchase-confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={confirmedAccurate}
                    onChange={(e) => setConfirmedAccurate(e.target.checked)}
                    disabled={submitting}
                  />
                  <span>I have confirmed the above information is accurate.</span>
                </label>
                <Link to="/purchases" className="new-purchase-cancel" tabIndex={submitting ? -1 : 0}>
                  Cancel
                </Link>
                <button type="submit" className="new-purchase-confirm" disabled={submitting || !confirmedAccurate}>
                  {submitting ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <PdfPreviewModal
        open={pdfPreview.isOpen}
        url={pdfPreview.url}
        label={pdfPreview.label}
        onClose={pdfPreview.closePreview}
      />
    </div>
  )
}
