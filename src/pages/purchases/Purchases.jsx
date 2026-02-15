import { useState, useEffect, useMemo } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken, getStoredUserRole } from '../../api'
import PurchasesTable from '../../components/PurchasesTable'
import './Purchases.css'

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

function getStartDate(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function getEndDate(year, month) {
  const last = new Date(year, month, 0)
  return `${year}-${String(month).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1
const YEARS = [currentYear, currentYear - 1]

export default function Purchases() {
  const token = getStoredToken()
  const role = getStoredUserRole()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [month, setMonth] = useState(currentMonth)
  const [year, setYear] = useState(currentYear)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const isAdmin = role === 'admin'
  const baseUrl = isAdmin ? '/api/purchases' : '/api/purchases/me'

  const monthsForYear = useMemo(() => {
    const y = year || currentYear
    if (y === currentYear) {
      return MONTHS.filter((m) => m.value <= currentMonth)
    }
    return MONTHS
  }, [year])

  const fetchUrl = useMemo(() => {
    let startDate
    let endDate
    if (customStartDate && customEndDate) {
      startDate = customStartDate
      endDate = customEndDate
    } else if (month && year) {
      startDate = getStartDate(year, month)
      endDate = getEndDate(year, month)
    } else {
      startDate = getStartDate(currentYear, currentMonth)
      endDate = getEndDate(currentYear, currentMonth)
    }
    const params = new URLSearchParams({ startDate, endDate })
    return `${baseUrl}?${params.toString()}`
  }, [baseUrl, year, month, customStartDate, customEndDate])

  useEffect(() => {
    if (year === currentYear && month > currentMonth) {
      setMonth(currentMonth)
    }
  }, [year, month])

  function handleCustomStartChange(val) {
    setCustomStartDate(val)
    if (val) {
      setMonth('')
      setYear('')
    }
  }

  function handleCustomEndChange(val) {
    setCustomEndDate(val)
    if (val) {
      setMonth('')
      setYear('')
    }
  }

  function handleMonthChange(val) {
    const n = val === '' ? '' : Number(val)
    setMonth(n)
    if (n) {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  function handleYearChange(val) {
    const n = val === '' ? '' : Number(val)
    setYear(n)
    if (n) {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  useEffect(() => {
    if (!token) return
    let cancelled = false
    async function fetchPurchases() {
      setLoading(true)
      setError('')
      try {
        const res = await authFetch(`${getApiBase()}${fetchUrl}`)
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
          setError(err.message || 'Failed to load your purchases')
          setPurchases([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchPurchases()
    return () => { cancelled = true }
  }, [token, fetchUrl])

  if (!token) return <Navigate to="/" replace />

  return (
    <div className="purchases-page">
      <div className="purchases-header">
        <h2 className="purchases-title">Purchases</h2>
        <Link to="/purchases/new" className="purchases-new-btn">
          Add Purchase
        </Link>
      </div>

      {error && (
        <div className="purchases-error" role="alert">
          {error}
        </div>
      )}

      <div className="purchases-filters">
        <label className="purchases-filter-label">
          Month
          <select
            className="purchases-filter-select"
            value={month ?? ''}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            <option value="">Select month</option>
            {monthsForYear.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="purchases-filter-label">
          Year
          <select
            className="purchases-filter-select"
            value={year ?? ''}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="">Select year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <span className="purchases-filter-divider">or</span>
        <label className="purchases-filter-label">
          Custom range
          <div className="purchases-custom-range">
            <input
              type="date"
              className="purchases-filter-input"
              value={customStartDate}
              onChange={(e) => handleCustomStartChange(e.target.value)}
              aria-label="Start date"
            />
            <span className="purchases-range-sep">to</span>
            <input
              type="date"
              className="purchases-filter-input"
              value={customEndDate}
              onChange={(e) => handleCustomEndChange(e.target.value)}
              aria-label="End date"
            />
          </div>
        </label>
      </div>

      <div className="purchases-body">
        {loading ? (
          <p className="purchases-loading">{isAdmin ? 'Loading all purchases…' : 'Loading your purchases…'}</p>
        ) : purchases.length === 0 ? (
          <p className="purchases-empty">{isAdmin ? 'No purchases.' : 'No purchases yet. Click "New Purchase" to add one.'}</p>
        ) : (
          <PurchasesTable purchases={purchases} showBuyerColumn={isAdmin} />
        )}
      </div>
    </div>
  )
}
