import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './OrdersSummaryCards.css'

const ORDERS_COLLECTION = 'orders'

/** Group docs by (employeeEmail, orderNumber) so each "whole order" counts once, not sub-orders. */
function getOrderGroupsFromDocs(docs) {
  const sorted = [...docs].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
    return ta - tb
  })
  const byEmployee = {}
  sorted.forEach((doc) => {
    const key = (doc.employeeEmail || '').trim().toLowerCase()
    if (!byEmployee[key]) byEmployee[key] = []
    const distName = (doc.distributor || '').trim() || '—'
    const orderNumber = doc.orderNumber != null ? Number(doc.orderNumber) : (doc.order_number != null ? Number(doc.order_number) : null)
    byEmployee[key].push({
      ...doc,
      distributor: distName,
      orderNumber: orderNumber ?? undefined,
    })
  })
  const groups = []
  Object.values(byEmployee).forEach((empDocs) => {
    const withDerived = [...empDocs].sort((a, b) => (a.timestamp ? new Date(a.timestamp).getTime() : 0) - (b.timestamp ? new Date(b.timestamp).getTime() : 0))
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
      if (!byNum[num]) byNum[num] = []
      byNum[num].push(d)
    })
    Object.values(byNum).forEach((lines) => groups.push(lines))
  })
  return groups
}

/** One status per group: Declined if any, Placed if all, else Pending */
function getGroupStatus(lines) {
  const statuses = lines.map((d) => (d.status && ['Pending', 'Placed', 'Declined'].includes(d.status) ? d.status : 'Pending'))
  if (statuses.some((s) => s === 'Declined')) return 'Declined'
  if (statuses.every((s) => s === 'Placed')) return 'Placed'
  return 'Pending'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getOrderDate(doc) {
  if (doc.timestamp) {
    const d = typeof doc.timestamp.toDate === 'function' ? doc.timestamp.toDate() : new Date(doc.timestamp)
    if (!isNaN(d.getTime())) return d
  }
  if (doc.date) return parseOrderDate(doc.date)
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
      totalOrders,
      pending,
      totalKg: Math.round(totalKg * 10) / 10,
      selectedLabel,
    }
  }, [orders, year, month])

  function parseOrderDate(dateStr) {
    if (!dateStr) return null
    const s = String(dateStr).trim().replace(/\//g, '-')
    const parts = s.split('-')
    if (parts.length !== 3) return null
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = parseInt(parts[2], 10)
    if (year < 100) return new Date(year + 2000, month, day)
    return new Date(year, month, day)
  }

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
