import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './OrdersSummaryCards.css'

const ORDERS_COLLECTION = 'orders'

/** Safe timestamp to milliseconds (handles Firestore Timestamp, never throws). */
function getTimestampMillis(doc) {
  try {
    if (!doc || doc.timestamp == null) return 0
    const t = doc.timestamp
    if (typeof t.toDate === 'function') {
      const ms = t.toDate().getTime()
      return Number.isFinite(ms) ? ms : 0
    }
    if (t && typeof t.getTime === 'function') {
      const ms = t.getTime()
      return Number.isFinite(ms) ? ms : 0
    }
    const d = new Date(t)
    return Number.isFinite(d.getTime()) ? d.getTime() : 0
  } catch (_) {
    return 0
  }
}

/** Group docs by (employeeEmail, orderNumber) so each "whole order" counts once, not sub-orders. */
function getOrderGroupsFromDocs(docs) {
  if (!Array.isArray(docs) || docs.length === 0) return []
  try {
    const sorted = [...docs].sort((a, b) => getTimestampMillis(a) - getTimestampMillis(b))
    const byEmployee = {}
    sorted.forEach((doc) => {
      const key = String(doc.employeeEmail ?? '').trim().toLowerCase()
      if (!byEmployee[key]) byEmployee[key] = []
      const distName = String(doc.distributor ?? '').trim() || '—'
      const orderNumber = doc.orderNumber != null ? Number(doc.orderNumber) : (doc.order_number != null ? Number(doc.order_number) : null)
      byEmployee[key].push({
        ...doc,
        distributor: distName,
        orderNumber: orderNumber ?? undefined,
      })
    })
    const groups = []
    Object.values(byEmployee).forEach((empDocs) => {
      const withDerived = [...empDocs].sort((a, b) => getTimestampMillis(a) - getTimestampMillis(b))
      const distToNum = {}
      let next = 1
      withDerived.forEach((d) => {
        const dk = d.distributor || '—'
        if (distToNum[dk] == null) {
          distToNum[dk] = next
          next += 1
        }
        d.derivedOrderNumber = distToNum[dk]
      })
      const useFirebase = new Set(empDocs.map((o) => o.orderNumber).filter((n) => n != null)).size > 1
      const byNum = {}
      empDocs.forEach((d) => {
        const num = useFirebase ? (d.orderNumber != null ? Number(d.orderNumber) : 1) : (d.derivedOrderNumber ?? 1)
        const numKey = Number.isFinite(num) ? num : 1
        if (!byNum[numKey]) byNum[numKey] = []
        byNum[numKey].push(d)
      })
      Object.values(byNum).forEach((lines) => groups.push(lines))
    })
    return groups
  } catch (_) {
    return []
  }
}

/** One status per group: Declined if any, Placed if all, else Pending */
function getGroupStatus(lines) {
  const statuses = lines.map((d) => (d.status && ['Pending', 'Placed', 'Declined'].includes(d.status) ? d.status : 'Pending'))
  if (statuses.some((s) => s === 'Declined')) return 'Declined'
  if (statuses.every((s) => s === 'Placed')) return 'Placed'
  return 'Pending'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseOrderDate(dateStr) {
  if (!dateStr) return null
  try {
    const s = String(dateStr).trim().replace(/\//g, '-')
    const parts = s.split('-')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null
    if (year < 100) return new Date(year + 2000, month, day)
    return new Date(year, month, day)
  } catch {
    return null
  }
}

function getOrderDate(doc) {
  try {
    if (doc && doc.timestamp) {
      const t = doc.timestamp
      if (typeof t.toDate === 'function') {
        const d = t.toDate()
        if (d && Number.isFinite(d.getTime())) return d
      } else if (t && typeof t.getTime === 'function' && Number.isFinite(t.getTime())) {
        return t
      } else {
        const d = new Date(t)
        if (Number.isFinite(d.getTime())) return d
      }
    }
    if (doc && doc.date) return parseOrderDate(doc.date)
  } catch (_) {}
  return null
}

const OrdersSummaryCards = ({ year, month }) => {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const stats = useMemo(() => {
    const safe = { totalOrders: 0, pending: 0, totalKg: 0, selectedLabel: null }
    try {
      const targetYear = year != null ? Number(year) : null
      const targetMonthIndex = month != null ? MONTH_LABELS.indexOf(String(month)) : -1

      const filteredOrders = orders.filter((doc) => {
        const d = getOrderDate(doc)
        if (!d) return true
        if (targetYear != null && d.getFullYear() !== targetYear) return false
        if (targetMonthIndex !== -1 && d.getMonth() !== targetMonthIndex) return false
        return true
      })

      const orderGroups = getOrderGroupsFromDocs(filteredOrders)
      const totalOrders = orderGroups.length
      const pending = orderGroups.filter((lines) => getGroupStatus(lines) === 'Pending').length
      const totalKg = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.totalKg) || parseFloat(o.kg) || 0), 0)

      const selectedLabel = month && year
        ? `${month} ${year}`
        : month || (year ? String(year) : null)

      return {
        totalOrders: Number.isFinite(totalOrders) ? totalOrders : 0,
        pending: Number.isFinite(pending) ? pending : 0,
        totalKg: Number.isFinite(totalKg) ? Math.round(totalKg * 10) / 10 : 0,
        selectedLabel,
      }
    } catch (_) {
      return safe
    }
  }, [orders, year, month])

  const cards = useMemo(() => [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      subtitle: stats.selectedLabel ? `In ${stats.selectedLabel}` : 'All time',
      iconBg: '#dbeafe',
      icon: '📁',
    },
    {
      title: 'Pending Approval',
      value: String(stats.pending),
      status: stats.pending > 0 ? 'Action required' : null,
      subtitle: stats.pending === 0 ? 'No pending orders' : null,
      statusType: 'warning',
      iconBg: '#fef3c7',
      icon: '⚠️',
    },
    {
      title: 'Total Volume (Kg)',
      value: `${stats.totalKg.toLocaleString()} kg`,
      subtitle: stats.selectedLabel ? `In ${stats.selectedLabel}` : 'Across all SRAs',
      iconBg: '#ede9fe',
      icon: '🔔',
    },
  ], [stats])

  return (
    <div className="orders-summary-cards">
      {cards.map((card, index) => {
        const isTotalOrders = card.title === 'Total Orders'
        const isPendingApproval = card.title === 'Pending Approval'
        const isTotalVolume = card.title === 'Total Volume (Kg)'
        return (
          <div key={index} className="orders-summary-card">
            <div className="card-content-wrapper">
              <div className="card-title">{card.title}</div>
              <div className="card-value">{card.value}</div>
              {card.status ? (
                <div className={`card-status ${card.statusType}`}>
                  {card.status}
                </div>
              ) : card.subtitle ? (
                <div className="card-subtitle">{card.subtitle}</div>
              ) : null}
            </div>
            <div
              className={`card-icon-wrapper ${
                isTotalOrders
                  ? 'total-orders-wrapper'
                  : isPendingApproval
                  ? 'pending-approval-wrapper'
                  : isTotalVolume
                  ? 'total-volume-wrapper'
                  : ''
              }`}
              style={{ backgroundColor: card.iconBg }}
            >
              {isTotalOrders ? (
                <img
                  src="/total-orders-icon.png"
                  alt="Total Orders"
                  className="card-icon-image total-orders-icon"
                />
              ) : isPendingApproval ? (
                <img
                  src="/pending-approval-icon.png"
                  alt="Pending Approval"
                  className="card-icon-image pending-approval-icon"
                />
              ) : isTotalVolume ? (
                <img
                  src="/total-volume-icon.png"
                  alt="Total Volume"
                  className="card-icon-image total-volume-icon"
                />
              ) : (
                <span className="card-icon">{card.icon}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OrdersSummaryCards
