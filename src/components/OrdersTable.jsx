import React, { useState, useEffect, useMemo } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './OrdersTable.css'

const ORDERS_COLLECTION = 'orders'

/** Count by whole orders (Order 1, Order 2, …), not by sub-orders. Each order group counts as one Pending, Placed, or Declined. */
const getStatusCounts = (order, orderStatuses) => {
  const pad = (n) => String(n).padStart(2, '0')
  const orders = order.orders || []
  if (orders.length === 0) {
    const s = order.status || 'Pending'
    if (s === 'Pending') return { pending: pad(1), placed: pad(0), declined: pad(0) }
    if (s === 'Placed') return { pending: pad(0), placed: pad(1), declined: pad(0) }
    return { pending: pad(0), placed: pad(0), declined: pad(1) }
  }
  const groups = getOrderGroups(order)
  const statuses = orderStatuses[order.id] || {}
  let pending = 0
  let placed = 0
  let declined = 0
  groups.forEach((g) => {
    const lineStatuses = g.lines.map(
      (line) => (statuses[line.orderIndex] && statuses[line.orderIndex].status) || (line && line.status) || 'Pending'
    )
    const hasDeclined = lineStatuses.some((s) => s === 'Declined')
    const allPlaced = lineStatuses.every((s) => s === 'Placed')
    const groupStatus = hasDeclined ? 'Declined' : allPlaced ? 'Placed' : 'Pending'
    if (groupStatus === 'Pending') pending += 1
    else if (groupStatus === 'Placed') placed += 1
    else declined += 1
  })
  return { pending: pad(pending), placed: pad(placed), declined: pad(declined) }
}

const distributorInitial = (name) => {
  if (!name || typeof name !== 'string') return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  return name.slice(0, 2).toUpperCase()
}

/** Group order.orders by order number. Uses Firebase orderNumber when present and varied; otherwise derives Order 1/2/... by distributor (first occurrence) so "another distributor" gets Order 2. */
const getOrderGroups = (order) => {
  const orders = order.orders || []
  const firebaseNumbers = new Set(orders.map((o) => o.orderNumber).filter((n) => n != null))
  const useFirebaseOrderNumber = firebaseNumbers.size > 1
  const byNum = {}
  orders.forEach((line) => {
    const num = useFirebaseOrderNumber
      ? (line.orderNumber != null ? Number(line.orderNumber) : 1)
      : (line.derivedOrderNumber != null ? line.derivedOrderNumber : 1)
    if (!byNum[num]) byNum[num] = []
    byNum[num].push(line)
  })
  return Object.keys(byNum)
    .map(Number)
    .sort((a, b) => a - b)
    .map((orderNumber) => ({ orderNumber, lines: byNum[orderNumber] }))
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseOrderDateToObj(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim().replace(/\//g, '-')
  const parts = s.split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const mon = parseInt(parts[1], 10) - 1
  const yr = parseInt(parts[2], 10)
  if (yr < 100) return new Date(yr + 2000, mon, day)
  return new Date(yr, mon, day)
}

/** Safe timestamp to milliseconds (handles Firestore Timestamp and avoids invalid Date). */
function getTimestampMillis(doc) {
  if (!doc || !doc.timestamp) return 0
  const t = doc.timestamp
  if (typeof t.toDate === 'function') return t.toDate().getTime()
  if (t && typeof t.getTime === 'function') return t.getTime()
  const d = new Date(t)
  return Number.isFinite(d.getTime()) ? d.getTime() : 0
}

function getOrderDate(doc) {
  if (doc.timestamp) {
    const d = typeof doc.timestamp.toDate === 'function' ? doc.timestamp.toDate() : new Date(doc.timestamp)
    if (!isNaN(d.getTime())) return d
  }
  if (doc.date) return parseOrderDateToObj(doc.date)
  return null
}

const OrdersTable = ({ searchQuery = '', year, month }) => {
  const [firestoreOrders, setFirestoreOrders] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const [activeOrderTab, setActiveOrderTab] = useState({})
  const [orderStatuses, setOrderStatuses] = useState({})
  const [declineModal, setDeclineModal] = useState(null)
  const [declineReason, setDeclineReason] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setFirestoreOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const setOrderTab = (rowId, tabIndex) => {
    setActiveOrderTab((prev) => ({ ...prev, [rowId]: tabIndex }))
  }

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const setOrderStatus = (rowId, orderIndex, status, declineReasonValue) => {
    setOrderStatuses((prev) => {
      const row = { ...(prev[rowId] || {}) }
      row[orderIndex] = { status, ...(declineReasonValue != null ? { declineReason: declineReasonValue } : {}) }
      return { ...prev, [rowId]: row }
    })
  }

  const openDeclineModal = (order, orderIndex) => {
    const line = order.orders && order.orders[orderIndex]
    const existingReason = line?.declineReason || orderStatuses[order.id]?.[orderIndex]?.declineReason || ''
    setDeclineReason(existingReason)
    setDeclineModal({
      rowId: order.id,
      orderIndex,
      firestoreId: line?.firestoreId || null,
    })
  }

  const closeDeclineModal = () => {
    setDeclineModal(null)
    setDeclineReason('')
  }

  const confirmDecline = async () => {
    if (!declineModal) return
    const { rowId, entries } = declineModal
    const reason = declineReason.trim() || null
    const toUpdate = entries || [{ orderIndex: declineModal.orderIndex, firestoreId: declineModal.firestoreId }]
    if (isFirebaseConfigured && db) {
      try {
        await Promise.all(
          toUpdate.map(({ firestoreId }) =>
            firestoreId
              ? updateDoc(doc(db, ORDERS_COLLECTION, firestoreId), {
                  status: 'Declined',
                  declineReason: reason,
                })
              : Promise.resolve()
          )
        )
      } catch (err) {
        console.error('Failed to update order(s) in Firebase:', err)
      }
    }
    toUpdate.forEach(({ orderIndex }) => setOrderStatus(rowId, orderIndex, 'Declined', reason))
    closeDeclineModal()
  }

  const handlePlaced = async (order, orderIndex) => {
    const line = order.orders && order.orders[orderIndex]
    const firestoreId = line?.firestoreId
    // Update the same order document only (never create a new one)
    if (isFirebaseConfigured && db && firestoreId) {
      try {
        await updateDoc(doc(db, ORDERS_COLLECTION, firestoreId), { status: 'Placed' })
      } catch (err) {
        console.error('Failed to update order in Firebase:', err)
        setOrderStatus(order.id, orderIndex, 'Placed')
      }
    } else {
      setOrderStatus(order.id, orderIndex, 'Placed')
    }
  }

  const getOrderStatus = (order, orderIndex) => {
    const statuses = orderStatuses[order.id] || {}
    const line = order.orders && order.orders[orderIndex]
    return (statuses[orderIndex] && statuses[orderIndex].status) || (line && line.status) || 'Pending'
  }

  /** Status for entire order group: Declined if any declined, Placed if all placed, else Pending */
  const getGroupStatus = (order, lines) => {
    if (!lines || lines.length === 0) return 'Pending'
    const statuses = lines.map((line) => getOrderStatus(order, line.orderIndex))
    if (statuses.some((s) => s === 'Declined')) return 'Declined'
    if (statuses.every((s) => s === 'Placed')) return 'Placed'
    return 'Pending'
  }

  const handlePlacedForGroup = async (order, lines) => {
    if (!lines || lines.length === 0) return
    if (isFirebaseConfigured && db) {
      try {
        await Promise.all(
          lines.map((line) =>
            line.firestoreId
              ? updateDoc(doc(db, ORDERS_COLLECTION, line.firestoreId), { status: 'Placed' })
              : Promise.resolve()
          )
        )
      } catch (err) {
        console.error('Failed to update order(s) in Firebase:', err)
      }
    }
    lines.forEach((line) => setOrderStatus(order.id, line.orderIndex, 'Placed'))
  }

  const openDeclineModalForGroup = (order, lines) => {
    if (!lines || lines.length === 0) return
    const firstReason =
      orderStatuses[order.id]?.[lines[0].orderIndex]?.declineReason ||
      lines[0]?.declineReason ||
      ''
    setDeclineReason(firstReason)
    setDeclineModal({
      rowId: order.id,
      entries: lines.map((line) => ({ orderIndex: line.orderIndex, firestoreId: line.firestoreId })),
    })
  }

  const getDistributorBadgeColors = (initial) => {
    const colors = {
      SB: { bg: '#DBEAFE', text: '#3B82F6' },
      DS: { bg: '#F3F4F6', text: '#6B7280' },
      VP: { bg: '#FED7AA', text: '#EA580C' },
    }
    return colors[initial] || { bg: '#F3F4F6', text: '#6B7280' }
  }

  const ordersData = useMemo(() => {
    if (!firestoreOrders.length) return []
    const targetYear = year != null ? Number(year) : null
    const targetMonthIndex = month != null ? MONTH_LABELS.indexOf(month) : -1
    const matchesFilter = (doc) => {
      if (targetYear == null && targetMonthIndex === -1) return true
      const d = getOrderDate(doc)
      if (!d) return true
      if (targetYear != null && d.getFullYear() !== targetYear) return false
      if (targetMonthIndex !== -1 && d.getMonth() !== targetMonthIndex) return false
      return true
    }
    // One card per (distributor, employee) pair — 1 distributor, 1 employee per row
    const groupKey = (doc) => {
      const emp = (doc.employeeEmail || '').trim().toLowerCase()
      const dist = (doc.distributor || '').trim().toLowerCase() || '—'
      return `${emp}|${dist}`
    }
    const groups = {}
    const sorted = [...firestoreOrders].filter(matchesFilter).sort((a, b) => {
      const ta = getTimestampMillis(a)
      const tb = getTimestampMillis(b)
      return ta - tb
    })
    sorted.forEach((doc) => {
      const key = groupKey(doc)
      if (!groups[key]) {
        const name = doc.employeeName || doc.employeeEmail || '—'
        const distName = (doc.distributor || '').trim() || '—'
        groups[key] = {
          id: key,
          employee: {
            name,
            role: doc.employeeEmail || '—',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6b7280&color=fff`,
          },
          distributor: {
            initial: distributorInitial(distName),
            name: distName,
            location: distName,
            names: [distName],
          },
          orderDetails: '0 Kg',
          status: 'Pending',
          orders: [],
        }
      }
      const ts = getTimestampMillis(doc)
      const dateObj = getOrderDate(doc)
      const dateStr = doc.date || (dateObj ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '—')
      const kg = doc.totalKg != null ? String(doc.totalKg) : (doc.kg != null ? String(doc.kg) : '—')
      const orderNumber = doc.orderNumber != null ? Number(doc.orderNumber) : (doc.order_number != null ? Number(doc.order_number) : 1)
      const orderIndex = groups[key].orders.length
      groups[key].orders.push({
        firestoreId: doc.id,
        date: dateStr,
        sku: doc.sku || '—',
        kg,
        scheme: doc.scheme || '—',
        status: (doc.status && ['Pending', 'Placed', 'Declined'].includes(doc.status)) ? doc.status : 'Pending',
        declineReason: doc.declineReason || undefined,
        orderNumber,
        orderIndex,
        distributor: (doc.distributor || '').trim() || '—',
        timestamp: ts,
      })
    })
    const rows = Object.values(groups)
    rows.forEach((row) => {
      const totalKg = row.orders.reduce((sum, o) => sum + (parseFloat(o.kg) || 0), 0)
      row.orderDetails = `${totalKg} Kg`
      // Derive Order 1 / Order 2: use Firebase orderNumber when present; else one distributor per row so same number
      const byTime = [...row.orders].sort((a, b) => a.timestamp - b.timestamp)
      byTime.forEach((line) => {
        if (line.derivedOrderNumber != null) return
        line.derivedOrderNumber = line.orderNumber != null ? line.orderNumber : 1
      })
      // Most recent order date for this row (for DATE column and sorting)
      const byTimeDesc = [...row.orders].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      const latest = byTimeDesc[0]
      row.displayDate = latest ? latest.date : '—'
      row.latestTimestamp = latest ? (latest.timestamp || 0) : 0
    })
    rows.sort((a, b) => (b.latestTimestamp || 0) - (a.latestTimestamp || 0))
    return rows
  }, [firestoreOrders, year, month])

  const filteredOrders = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim()
    if (!q) return ordersData
    return ordersData.filter((order) => {
      const empName = (order.employee?.name || '').toLowerCase()
      const empRole = (order.employee?.role || '').toLowerCase()
      const distName = (order.distributor?.name || '').toLowerCase()
      const distLocation = (order.distributor?.location || '').toLowerCase()
      return empName.includes(q) || empRole.includes(q) || distName.includes(q) || distLocation.includes(q)
    })
  }, [ordersData, searchQuery])

  return (
    <div className="orders-table-container">
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>DISTRIBUTOR</th>
              <th>EMPLOYEE</th>
              <th>DATE</th>
              <th>ORDER DETAILS KG</th>
              <th>Pending</th>
              <th>Placed</th>
              <th>Declined</th>
              <th>
                DETAILED
                <img src="/drop-down-icon.png" alt="" className="dropdown-icon-img" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="orders-table-empty">
                  {ordersData.length === 0
                    ? (isFirebaseConfigured && db
                        ? 'No orders yet. Orders from Firebase will appear here.'
                        : 'Connect Firebase to load orders.')
                    : 'No orders match your search.'}
                </td>
              </tr>
            ) : (
            filteredOrders.map((order) => (
              <React.Fragment key={order.id}>
              <tr>
                <td>
                  <div className="distributor-cell">
                    <span
                      className="distributor-badge"
                      style={{
                        backgroundColor: getDistributorBadgeColors(
                          order.distributor.initial
                        ).bg,
                        color: getDistributorBadgeColors(
                          order.distributor.initial
                        ).text,
                      }}
                    >
                      {order.distributor.initial}
                    </span>
                    <div className="distributor-info">
                      <div className="distributor-name">
                        {order.distributor.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="employee-cell">
                    <div className="employee-info">
                      <div className="employee-name">{order.employee.name}</div>
                      <div className="employee-role">{order.employee.role}</div>
                    </div>
                  </div>
                </td>
                <td className="order-date-cell">{order.displayDate || '—'}</td>
                <td className="order-details">{order.orderDetails}</td>
                {(() => {
                  const counts = getStatusCounts(order, orderStatuses)
                  const pendingNonZero = counts.pending !== '00'
                  return (
                    <>
                      <td className={`status-count ${pendingNonZero ? 'status-count-nonzero' : ''}`}>{counts.pending}</td>
                      <td className="status-count">{counts.placed}</td>
                      <td className="status-count">{counts.declined}</td>
                    </>
                  )
                })()}
                <td>
                  <button
                    className="detailed-button"
                    onClick={() => toggleRow(order.id)}
                  >
                    <img
                      src="/drop-down-icon.png"
                      alt=""
                      className={`detailed-arrow ${
                        expandedRows[order.id] ? 'expanded' : ''
                      }`}
                    />
                  </button>
                </td>
              </tr>
              {expandedRows[order.id] && order.orders && order.orders.length > 0 && (() => {
                const orderGroups = getOrderGroups(order)
                const groupIndex = Math.min(activeOrderTab[order.id] ?? 0, orderGroups.length - 1)
                const selectedGroup = orderGroups[groupIndex]
                const lines = selectedGroup ? selectedGroup.lines : []
                return (
                <tr className="orders-expanded-row">
                  <td colSpan={8} className="orders-expanded-cell">
                    <div className="orders-expanded-content">
                      <div className="order-tabs-with-actions">
                        <div className="order-tabs">
                          {orderGroups.map((g, idx) => (
                            <button
                              key={g.orderNumber}
                              type="button"
                              className={`order-tab ${groupIndex === idx ? 'active' : ''}`}
                              onClick={() => setOrderTab(order.id, idx)}
                            >
                              Order {g.orderNumber}
                            </button>
                          ))}
                        </div>
                        <div className="order-action-buttons">
                          {selectedGroup && lines.length > 0 && (
                            <>
                              <span className="order-action-label">Status:</span>
                              <span
                                className={`order-current-status order-status-badge order-status-${getGroupStatus(order, lines).toLowerCase()}`}
                              >
                                {getGroupStatus(order, lines)}
                              </span>
                              <button
                                type="button"
                                className="order-action-btn order-action-placed"
                                onClick={() => handlePlacedForGroup(order, lines)}
                              >
                                Placed
                              </button>
                              <button
                                type="button"
                                className="order-action-btn order-action-decline"
                                onClick={() => openDeclineModalForGroup(order, lines)}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          <span className="order-action-label">
                            {selectedGroup ? `Order ${selectedGroup.orderNumber} — ${lines.length} sub-order(s)` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="orders-detail-table-wrap">
                        <table className="orders-detail-table">
                          <thead>
                            <tr>
                              <th>DATE</th>
                              <th>SKU</th>
                              <th>KG</th>
                              <th>SCHEME</th>
                              <th>DISTRIBUTOR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lines.map((line) => (
                              <tr key={line.orderIndex}>
                                <td>{line.date}</td>
                                <td>{line.sku}</td>
                                <td className="kg-cell">{line.kg}</td>
                                <td>{line.scheme}</td>
                                <td>{line.distributor || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {(() => {
                        const firstWithReason = lines.find((line) => {
                          const status = getOrderStatus(order, line.orderIndex)
                          const reason = line?.declineReason || orderStatuses[order.id]?.[line.orderIndex]?.declineReason
                          return status === 'Declined' && reason
                        })
                        const reasonText = firstWithReason
                          ? (firstWithReason.declineReason || orderStatuses[order.id]?.[firstWithReason.orderIndex]?.declineReason || '')
                          : ''
                        if (!reasonText) return null
                        return (
                          <div className="order-decline-reasons">
                            <div className="order-decline-reason-display">
                              <strong>Reason of decline:</strong> {reasonText}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
                )
              })()}
              </React.Fragment>
            ))
            )}
          </tbody>
        </table>
      </div>

      {declineModal && (
        <div className="order-decline-modal-overlay" onClick={closeDeclineModal} role="presentation">
          <div className="order-decline-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="decline-modal-title">
            <h3 id="decline-modal-title" className="order-decline-modal-title">Reason for decline</h3>
            <p className="order-decline-modal-desc">Please provide a reason for declining this order (optional).</p>
            <textarea
              className="order-decline-modal-textarea"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Out of stock, customer request..."
              rows={4}
              aria-label="Decline reason"
            />
            <div className="order-decline-modal-actions">
              <button type="button" className="order-decline-modal-cancel" onClick={closeDeclineModal}>
                Cancel
              </button>
              <button type="button" className="order-decline-modal-submit" onClick={confirmDecline}>
                Confirm decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersTable
