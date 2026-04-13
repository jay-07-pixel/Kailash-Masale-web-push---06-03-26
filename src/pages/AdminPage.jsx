import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import AdminEmployeeCards from '../components/AdminEmployeeCards'
import { rollupEmployeeRecordTotals } from '../utils/employeeRecordRollup'
import './AdminPage.css'

const CHECK_INS_COLLECTION    = 'check_ins'
const CHECK_OUTS_COLLECTION   = 'check_outs'
const EMPLOYEES_COLLECTION    = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const ORDERS_COLLECTION       = 'orders'
const ADMIN_COLLECTION        = 'admin'
const MONTHLY_DATA_COLLECTION = 'monthly_data'
const MONTHLY_OVERRIDES_COLLECTION = 'monthlyData'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const TOTAL_MONTH_OPTION = 'Total'

function parseMonthlyDataDocId(docId) {
  if (!docId || typeof docId !== 'string') return null
  const parts = docId.split('_')
  if (parts.length < 3) return null
  const month = Number(parts[parts.length - 1])
  const year = Number(parts[parts.length - 2])
  const empId = parts.slice(0, -2).join('_')
  if (Number.isNaN(month) || Number.isNaN(year)) return null
  return { month, year, empId }
}

function parsePeriod(period) {
  if (!period || typeof period !== 'string') return null
  const [yearStr, monthLabel] = period.split('_')
  const year = Number(yearStr)
  const month = MONTH_LABELS.indexOf(monthLabel) + 1
  if (Number.isNaN(year) || month <= 0) return null
  return { year, month }
}

function AdminPage() {
  const now = new Date()
  const [checkIns, setCheckIns]         = useState([])
  const [checkOuts, setCheckOuts]       = useState([])
  const [employees, setEmployees]       = useState([])
  const [distributors, setDistributors] = useState([])
  const [orders, setOrders]             = useState([])
  const [monthlyData, setMonthlyData]   = useState([])
  const [monthlyOverrides, setMonthlyOverrides] = useState([])
  const [selectedYear, setSelectedYear]   = useState(String(now.getFullYear()))
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LABELS[now.getMonth()])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u0 = onSnapshot(collection(db, CHECK_INS_COLLECTION),   s => setCheckIns(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u1 = onSnapshot(collection(db, CHECK_OUTS_COLLECTION),   s => setCheckOuts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, EMPLOYEES_COLLECTION),    s => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), s => setDistributors(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u4 = onSnapshot(collection(db, ORDERS_COLLECTION),       s => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u5 = onSnapshot(collection(db, MONTHLY_DATA_COLLECTION), s => setMonthlyData(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u6 = onSnapshot(collection(db, MONTHLY_OVERRIDES_COLLECTION), s => setMonthlyOverrides(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u0(); u1(); u2(); u3(); u4(); u5(); u6() }
  }, [])

  const employeeRecordRollup = useMemo(
    () =>
      rollupEmployeeRecordTotals({
        employees,
        distributors,
        monthlyData2: monthlyData,
        monthlyOverrides,
        checkOuts,
        year: selectedYear,
        monthLabel: selectedMonth,
      }),
    [employees, distributors, monthlyData, monthlyOverrides, checkOuts, selectedYear, selectedMonth]
  )

  const stats = useMemo(() => {
    const toTsMs = (v) => {
      if (!v) return 0
      if (typeof v?.toDate === 'function') return v.toDate().getTime() || 0
      if (v instanceof Date) return v.getTime() || 0
      const n = Number(v)
      return Number.isNaN(n) ? 0 : n
    }
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
    const selectedYearNum = Number(selectedYear)
    const selectedMonthNum = MONTH_LABELS.indexOf(selectedMonth) + 1
    const isTotalMonth = selectedMonth === TOTAL_MONTH_OPTION
    const targetByEmpDist = new Map()
    const overrideByEmpDist = new Map()
    monthlyData.forEach((mdDoc) => {
      const parsed = parseMonthlyDataDocId(mdDoc.id)
      const year = Number(mdDoc.year ?? parsed?.year)
      const month = Number(mdDoc.month ?? mdDoc.Month ?? parsed?.month)
      if (Number.isNaN(year) || Number.isNaN(month)) return
      if (year !== selectedYearNum) return
      if (!isTotalMonth && month !== selectedMonthNum) return
      const rows = Array.isArray(mdDoc.rows) ? mdDoc.rows : []
      const empId = mdDoc.employeeId || parsed?.empId || mdDoc.id
      const updatedAtMs = toTsMs(mdDoc.updatedAt)
      rows.forEach((row, rowIndex) => {
        const distKey = row?.distributorId || row?.distributorName || row?.distributor || `row-${rowIndex}`
        const mapKey = `${year}_${month}__${empId}__${distKey}`
        const target = Number(row?.targetKg ?? row?.target ?? 0) || 0
        const prev = targetByEmpDist.get(mapKey)
        if (!prev || updatedAtMs >= prev.updatedAtMs) {
          targetByEmpDist.set(mapKey, { target, updatedAtMs })
        }
      })
    })
    monthlyOverrides.forEach((ovDoc) => {
      const parsedPeriod = parsePeriod(ovDoc.period)
      const year = Number(parsedPeriod?.year)
      const month = Number(parsedPeriod?.month)
      if (Number.isNaN(year) || Number.isNaN(month)) return
      if (year !== selectedYearNum) return
      if (!isTotalMonth && month !== selectedMonthNum) return
      const empId = ovDoc.employeeId || ovDoc.id
      const details = ovDoc.distributorDetails || {}
      Object.entries(details).forEach(([distId, detail]) => {
        if (!distId) return
        const target = Number(detail?.target)
        if (Number.isNaN(target)) return
        const key = `${year}_${month}__${empId}__${distId}`
        overrideByEmpDist.set(key, target)
      })
    })
    const allKeys = new Set([
      ...targetByEmpDist.keys(),
      ...overrideByEmpDist.keys(),
    ])
    const totalTargetTillNow = Array.from(allKeys).reduce((sum, key) => {
      const overrideTarget = overrideByEmpDist.get(key)
      if (overrideTarget != null && overrideTarget !== 0) return sum + overrideTarget
      return sum + (targetByEmpDist.get(key)?.target || 0)
    }, 0)
    return {
      totalCalls,
      productiveCalls,
      productivityPct,
      totalEmployees: employees.length,
      totalOrders,
      placedOrders,
      pendingOrders,
      declinedOrders,
      totalKg: Math.round(totalKg * 10) / 10,
      totalTargetTillNow: Math.round(totalTargetTillNow * 10) / 10,
    }
  }, [checkOuts, employees, orders, monthlyData, monthlyOverrides, selectedYear, selectedMonth])

  const periodSubEmployeeRecord =
    selectedMonth === TOTAL_MONTH_OPTION
      ? `Employee Record · ${selectedYear} Total`
      : `Employee Record · ${selectedMonth} ${selectedYear}`

  const kpis = [
    { label: 'Total Calls',      value: stats.totalCalls.toLocaleString(),      sub: 'All time (from checkouts)',                                                        color: '#3b82f6', bg: '#eff6ff', icon: '📞' },
    { label: 'Productive Calls', value: stats.productiveCalls.toLocaleString(),  sub: `${stats.productivityPct}% of total calls`,                                        color: '#10b981', bg: '#ecfdf5', icon: '✅' },
    { label: 'Total Employees',  value: stats.totalEmployees.toLocaleString(),   sub: 'Active team members',                                                              color: '#6366f1', bg: '#eef2ff', icon: '👥' },
    { label: 'Total Orders',     value: stats.totalOrders.toLocaleString(),      sub: `${stats.placedOrders} placed · ${stats.pendingOrders} pending · ${stats.declinedOrders} declined`, color: '#f59e0b', bg: '#fffbeb', icon: '📦' },
    { label: 'Total Volume',     value: `${stats.totalKg.toLocaleString()} Kg`, sub: 'Across all orders',                                                                color: '#8b5cf6', bg: '#f5f3ff', icon: '⚖️' },
    { label: 'Total Target Till Now', value: `${stats.totalTargetTillNow.toLocaleString()} Kg`, sub: `${periodSubEmployeeRecord} · sum of TARGET`, color: '#0ea5e9', bg: '#ecfeff', icon: '🎯' },
    { label: 'Total Achieved', value: `${employeeRecordRollup.achievedPrimaryKg.toLocaleString()} Kg`, sub: `${periodSubEmployeeRecord} · sum of ACHIEVED column`, color: '#059669', bg: '#ecfdf5', icon: '📈' },
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

        <div className="admin-page-toolbar">
          <div className="admin-page-toolbar-label">Employee Record period</div>
          <div className="admin-filter-row admin-page-toolbar-filters">
            <select className="admin-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select className="admin-filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              <option value={TOTAL_MONTH_OPTION}>{TOTAL_MONTH_OPTION}</option>
              {MONTH_LABELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <p className="admin-page-toolbar-hint">Total Target &amp; Total Achieved use this month (or year total). Other cards are all-time.</p>
        </div>

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
        <div className="admin-section-header admin-section-header-simple">
          <div className="admin-section-title" style={{ marginBottom: 0 }}>
            Employee · Distributor Achievement
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
