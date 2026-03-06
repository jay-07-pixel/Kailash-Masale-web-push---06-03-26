import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './RecentOrders.css'

const ORDERS_COLLECTION = 'orders'
const TOP_RECENT_COUNT = 4

function toDate(v) {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

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

const RecentOrders = () => {
  const navigate = useNavigate()
  const [firestoreOrders, setFirestoreOrders] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setFirestoreOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const orders = useMemo(() => {
    const sorted = [...firestoreOrders].sort((a, b) => {
      const da = toDate(a.timestamp) || parseOrderDate(a.date)
      const db_ = toDate(b.timestamp) || parseOrderDate(b.date)
      const ta = da ? da.getTime() : 0
      const tb = db_ ? db_.getTime() : 0
      return tb - ta
    })
    return sorted.slice(0, TOP_RECENT_COUNT)
  }, [firestoreOrders])

  const formatOrderRow = (doc) => {
    const d = toDate(doc.timestamp) || parseOrderDate(doc.date)
    const dateStr = d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '—'
    const timeStr = d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
    const shortId = doc.id ? `ORD-${doc.id.slice(-4).toUpperCase()}` : '—'
    return {
      orderId: shortId,
      employee: doc.employeeName || doc.employeeEmail || '—',
      distributor: doc.distributor || '—',
      volume: doc.totalKg != null ? `${doc.totalKg} KG` : (doc.kg != null ? `${doc.kg} KG` : '—'),
      date: dateStr,
      time: timeStr,
    }
  }

  return (
    <div className="recent-orders-card">
      <div className="card-header-section">
        <div>
          <h3 className="card-title">Recent Orders</h3>
          <p className="card-subtitle">Manage distributor orders and schemes</p>
        </div>
        <button className="new-order-button" onClick={() => navigate('/orders')}>View All Orders →</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>DATE</th>
              <th>TIME</th>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th>VOLUME [KG]</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="recent-orders-empty">
                  {isFirebaseConfigured && db
                    ? 'No orders yet. Orders from Firebase will appear here (latest first).'
                    : 'Connect Firebase to load recent orders.'}
                </td>
              </tr>
            ) : (
              orders.map((doc, index) => {
                const order = formatOrderRow(doc)
                return (
                  <tr key={doc.id || index}>
                    <td>
                      <span className="order-id">{order.orderId}</span>
                    </td>
                    <td>{order.date}</td>
                    <td>{order.time}</td>
                    <td>{order.employee}</td>
                    <td>
                      <div className="distributor-cell">
                        <img
                          src="/db-box-icon.png"
                          alt=""
                          className="distributor-icon"
                          aria-hidden
                        />
                        <span>{order.distributor}</span>
                      </div>
                    </td>
                    <td>{order.volume}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentOrders
