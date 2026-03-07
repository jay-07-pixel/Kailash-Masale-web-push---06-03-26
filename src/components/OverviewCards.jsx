import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './OverviewCards.css'

const EMPLOYEES_COLLECTION = 'employees'
const ORDERS_COLLECTION = 'orders'
const TASKS_COLLECTION = 'tasks'
const CHECK_INS_COLLECTION = 'check_ins'
const CHECK_OUTS_COLLECTION = 'check_outs'



/** Order groups from docs (same logic as OrdersSummaryCards) for counting whole orders */
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
    byEmployee[key].push({ ...doc, orderNumber: doc.orderNumber ?? doc.order_number, distributor: (doc.distributor || '').trim() || '—' })
  })
  const groups = []
  Object.values(byEmployee).forEach((empDocs) => {
    const withDerived = [...empDocs].sort((a, b) => (a.timestamp ? new Date(a.timestamp).getTime() : 0) - (b.timestamp ? new Date(b.timestamp).getTime() : 0))
    const distToNum = {}
    let next = 1
    withDerived.forEach((d) => {
      const dk = d.distributor || '—'
      if (distToNum[dk] == null) { distToNum[dk] = next; next += 1 }
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

const OverviewCards = () => {
  const [employees, setEmployees] = useState([])
  const [orders, setOrders] = useState([])
  const [tasks, setTasks] = useState([])
  const [checkIns, setCheckIns] = useState([])
  const [checkOuts, setCheckOuts] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, TASKS_COLLECTION), (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, CHECK_INS_COLLECTION), (snapshot) => {
      setCheckIns(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, CHECK_OUTS_COLLECTION), (snapshot) => {
      setCheckOuts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const orderStats = useMemo(() => {
    const groups = getOrderGroupsFromDocs(orders)
    let pending = 0, placed = 0, declined = 0
    groups.forEach((lines) => {
      const statuses = lines.map((d) => (d.status && ['Pending', 'Placed', 'Declined'].includes(d.status) ? d.status : 'Pending'))
      if (statuses.some((s) => s === 'Declined')) declined++
      else if (statuses.every((s) => s === 'Placed')) placed++
      else pending++
    })
    return { pending, placed, declined }
  }, [orders])

  const cards = useMemo(() => {
    const ongoingTasks = tasks.filter((t) => (t.status || 'pending') !== 'resolved').length
    const checkInsTotal = checkIns.length
    const checkOutsTotal = checkOuts.length
    return [
      {
        icon: '👥',
        title: 'Total Employees',
        value: String(employees.length),
        change: 'Live',
        changeType: 'neutral',
      },
      {
        icon: '📦',
        title: 'Orders',
        isOrderBreakdown: true,
        change: 'Live',
        changeType: 'neutral',
      },
      {
        icon: '🚩',
        title: 'Ongoing Tasks',
        value: String(ongoingTasks),
        change: 'Live',
        changeType: 'neutral',
      },
      {
        icon: '⏰',
        title: 'Check-ins / Check-Outs',
        value: `${checkInsTotal} / ${checkOutsTotal}`,
        change: 'Live',
        changeType: 'neutral',
      },
    ]
  }, [employees, orderStats, tasks, checkIns, checkOuts])

  const cardRoutes = {
    'Total Employees': '/my-team',
    'Orders': '/orders',
    'Ongoing Tasks': '/pending-task',
    'Check-ins / Check-Outs': '/check-in-out',
  }

  return (
    <div className="overview-cards">
      {cards.map((card, index) => {
        const isTotalEmployees = card.title === 'Total Employees'
        const isOrders = card.isOrderBreakdown
        const isOngoingTasks = card.title === 'Ongoing Tasks'
        const isCheckInOut = card.title === 'Check-ins / Check-Outs'
        const to = cardRoutes[card.title]
        const Wrapper = to ? Link : 'div'
        const wrapperProps = to ? { to, style: { display: 'block', textDecoration: 'none', color: 'inherit' } } : {}
        return (
          <Wrapper key={index} className="overview-card" {...wrapperProps}>
            <div className="card-header">
              {isTotalEmployees ? (
                <div className="card-icon-wrapper card-icon-wrapper-blue">
                  <img src="/tot-empl-icon.png" alt="Total Employees" className="card-icon-image card-icon-total-empl" />
                </div>
              ) : isOrders ? (
                <div className="card-icon-wrapper card-icon-wrapper-purple">
                  <img src="/active-orders-icon.png" alt="Orders" className="card-icon-image card-icon-active-orders" />
                </div>
              ) : isOngoingTasks ? (
                <div className="card-icon-wrapper card-icon-wrapper-orange">
                  <img src="/pending-task-card-icon.png" alt="Ongoing Tasks" className="card-icon-image card-icon-pending-tasks" />
                </div>
              ) : isCheckInOut ? (
                <div className="card-icon-wrapper card-icon-wrapper-green">
                  <img src="/checkin-out-card-icon.png" alt="Check-ins / Check-Outs" className="card-icon-image card-icon-checkin-out" />
                </div>
              ) : (
                <span className="card-icon">{card.icon}</span>
              )}
              <span className={`card-change ${card.changeType === 'positive' ? 'positive' : card.changeType === 'negative' ? 'negative' : 'neutral'}`}>
                {card.change}
              </span>
            </div>
            <div className="card-title">{card.title}</div>
            {isOrders ? (
              <div className="order-breakdown">
                <div className="order-breakdown-item">
                  <span className="order-breakdown-dot pending-dot" />
                  <span className="order-breakdown-label">Pending</span>
                  <span className="order-breakdown-value">{orderStats.pending}</span>
                </div>
                <div className="order-breakdown-item">
                  <span className="order-breakdown-dot placed-dot" />
                  <span className="order-breakdown-label">Placed</span>
                  <span className="order-breakdown-value">{orderStats.placed}</span>
                </div>
                <div className="order-breakdown-item">
                  <span className="order-breakdown-dot declined-dot" />
                  <span className="order-breakdown-label">Declined</span>
                  <span className="order-breakdown-value">{orderStats.declined}</span>
                </div>
              </div>
            ) : (
              <div className="card-value">{card.value}</div>
            )}
          </Wrapper>
        )
      })}
    </div>
  )
}

export default OverviewCards
