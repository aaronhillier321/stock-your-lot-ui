import { useState, useEffect } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { getApiBase, authFetch, getStoredToken } from '../../api'
import PurchasesTable from '../../components/PurchasesTable'
import './Purchases.css'

export default function Purchases() {
  const token = getStoredToken()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          setError(err.message || 'Failed to load your purchases')
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
        <h2 className="purchases-title">My Purchases</h2>
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
          <p className="purchases-loading">Loading your purchases…</p>
        ) : purchases.length === 0 ? (
          <p className="purchases-empty">No purchases yet. Click “New Purchase” to add one.</p>
        ) : (
          <PurchasesTable purchases={purchases} />
        )}
      </div>
    </div>
  )
}
