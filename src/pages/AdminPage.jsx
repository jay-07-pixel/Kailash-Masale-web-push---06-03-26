import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import AdminEmployeeCards from '../components/AdminEmployeeCards'
import './AdminPage.css'

const CHECK_INS_COLLECTION    = 'check_ins'
const CHECK_OUTS_COLLECTION   = 'check_outs'
const EMPLOYEES_COLLECTION    = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const ORDERS_COLLECTION       = 'orders'
const ADMIN_COLLECTION        = 'admin'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function AdminPage() {
  const now = new Date()
  const [checkIns, setCheckIns]         = useState([])
  const [checkOuts, setCheckOuts]       = useState([])
  const [employees, setEmployees]       = useState([])
  const [distributors, setDistributors] = useState([])
  const [orders, setOrders]             = useState([])
  const [selectedYear, setSelectedYear]   = useState(String(now.getFullYear()))
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LABELS[now.getMonth()])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u0 = onSnapshot(collection(db, CHECK_INS_COLLECTION),   s => setCheckIns(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u1 = onSnapshot(collection(db, CHECK_OUTS_COLLECTION),   s => setCheckOuts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, EMPLOYEES_COLLECTION),    s => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), s => setDistributors(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u4 = onSnapshot(collection(db, ORDERS_COLLECTION),       s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u0(); u1(); u2(); u3(); u4() }
  }, [])

  const stats = useMemo(() => {
    let totalCalls = 0
    let productiveCalls = 0
    checkOuts.forEach(co => {
      totalCalls      += Number(co.totalCall ?? co.totalCalls ?? 0) || 0
      productiveCalls += Number(co.productiveCalls ?? co.productiveCall ?? 0) || 0
    })
    const productivityPct = totalCalls > 0 ? Math.round((productiveCalls / totalCalls) * 100) : 0
    const totalOrders    = orders.length
    const placedOrders   = orders.filter(o => o.status === 'Placed').length
    const pendingOrders  = orders.filter(o => !o.status || o.status === 'Pending').length
    const declinedOrders = orders.filter(o => o.status === 'Declined').length
    const totalKg        = orders.reduce((s, o) => s + (parseFloat(o.totalKg) || parseFloat(o.kg) || 0), 0)
    return { totalCalls, productiveCalls, productivityPct, totalEmployees: employees.length, totalOrders, placedOrders, pendingOrders, declinedOrders, totalKg: Math.round(totalKg * 10) / 10 }
  }, [checkOuts, employees, orders])

  const kpis = [
    { label: 'Total Calls',      value: stats.totalCalls.toLocaleString(),      sub: 'All time (from checkouts)',                                                        color: '#3b82f6', bg: '#eff6ff', icon: '📞' },
    { label: 'Productive Calls', value: stats.productiveCalls.toLocaleString(),  sub: `${stats.productivityPct}% of total calls`,                                        color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    { label: 'Total Employees',  value: stats.totalEmployees.toLocaleString(),   sub: 'Active team members',                                                              color: '#6366f1', bg: '#eef2ff', icon: '👥' },
    { label: 'Total Orders',     value: stats.totalOrders.toLocaleString(),      sub: `${stats.placedOrders} placed · ${stats.pendingOrders} pending · ${stats.declinedOrders} declined`, color: '#f59e0b', bg: '#fffbeb', icon: '📦' },
    { label: 'Total Volume',     value: `${stats.totalKg.toLocaleString()} Kg`, sub: 'Across all orders',                                                                color: '#8b5cf6', bg: '#f5f3ff', icon: '⚖️' },
  ]

  const yearOptions = [0, 1, 2].map(i => String(now.getFullYear() - i))

  const syncAdminAchievement = React.useCallback((cards, year, month) => {
    if (!db || !year || !month) return
    const docId = `${year}_${month}`
    const payload = {
      year,
      month,
      updatedAt: serverTimestamp(),
      employees: cards.map((c) => ({
        empKey: c.empKey,
        name: c.name,
        role: c.role,
        distRows: (c.distRows || []).map((dr) => ({
          distKey: dr.distKey,
          distName: dr.distName,
          icon: dr.icon,
          weeks: dr.weeks,
        })),
      })),
    }
    setDoc(doc(db, ADMIN_COLLECTION, docId), payload, { merge: true }).catch((err) => {
      console.warn('Admin sync failed:', err?.message)
    })
  }, [])

  return (
    <div className="main-content">
      <UniversalHeader title="Admin" />
      <div className="content-wrapper">

        {/* ── KPI Cards ── */}
        <div className="admin-section-title">Overall KPIs — All Time</div>
        <div className="admin-kpi-grid">
          {kpis.map((kpi, i) => (
            <div key={i} className="admin-kpi-card">
              <div className="admin-kpi-icon-wrap" style={{ background: kpi.bg }}>
                <span className="admin-kpi-icon">{kpi.icon}</span>
              </div>
              <div className="admin-kpi-body">
                <div className="admin-kpi-label">{kpi.label}</div>
                <div className="admin-kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="admin-kpi-sub">{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Employee / Distributor Achievement ── */}
        <div className="admin-section-header">
          <div className="admin-section-title" style={{ marginBottom: 0 }}>
            Employee · Distributor Achievement
          </div>
          <div className="admin-filter-row">
            <select className="admin-filter-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="admin-filter-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {MONTH_LABELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <AdminEmployeeCards
          checkIns={checkIns}
          checkOuts={checkOuts}
          employees={employees}
          distributors={distributors}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onCardsChange={syncAdminAchievement}
        />

      </div>
    </div>
  )
}

export default AdminPage
