import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './DisbursementTable.css'

const CHECK_INS_COLLECTION    = 'check_ins'
const CHECK_OUTS_COLLECTION   = 'check_outs'
const EMPLOYEES_COLLECTION    = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Always parse as dd/mm/yyyy (Indian format)
function parseDate(v) {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const clean = String(v).trim().replace(/\s/g, '')
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const [day, mon, yr] = clean.split(/[\/\-]/).map(Number)
    const d = new Date(yr, mon - 1, day)
    return isNaN(d.getTime()) ? null : d
  }
  const p = new Date(v)
  return isNaN(p.getTime()) ? null : p
}

function toN(v) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}

function fmt(v) {
  return v > 0 ? v : '—'
}

const DisbursementTable = ({ year = '2026', month = 'Jan', searchQuery = '' }) => {
  const [expandedRows, setExpandedRows] = useState({})
  const [checkIns, setCheckIns]         = useState([])
  const [checkOuts, setCheckOuts]       = useState([])
  const [employees, setEmployees]       = useState([])
  const [distributors, setDistributors] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u1 = onSnapshot(collection(db, CHECK_INS_COLLECTION),    s => setCheckIns(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, CHECK_OUTS_COLLECTION),   s => setCheckOuts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, EMPLOYEES_COLLECTION),    s => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u4 = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), s => setDistributors(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3(); u4() }
  }, [])

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))

  // Build bits lookup: normalised date-key → empKey → distKey → bits string
  // key format: "dd/mm/yyyy" (normalised from the date field)
  const bitsLookup = useMemo(() => {
    const lookup = {}
    checkIns.forEach(ci => {
      const empKey  = ci.employeeId || ci.employeeEmail || ci.employee_email || ''
      const distKey = ci.distributorId || ci.distributor || ci.distributorName || ''
      const bits    = ci.bits || ci.bitName || ci.bit || ''
      const dateRaw = ci.date || ci.timestamp
      if (!empKey || !bits || !dateRaw) return
      const d = parseDate(dateRaw)
      if (!d) return
      const dateKey = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`
      if (!lookup[dateKey]) lookup[dateKey] = {}
      if (!lookup[dateKey][empKey]) lookup[dateKey][empKey] = {}
      lookup[dateKey][empKey][distKey] = bits
    })
    return lookup
  }, [checkIns])

  const tableData = useMemo(() => {
    const monthIndex = MONTH_LABELS.indexOf(month)  // 0-based
    const yr = Number(year)

    // Filter checkouts to selected month/year
    const filtered = checkOuts.filter(co => {
      const d = parseDate(co.date || co.timestamp)
      if (!d) return false
      return d.getFullYear() === yr && d.getMonth() === monthIndex
    })

    // Group: empKey → [checkout records]
    const empMap = {}
    filtered.forEach(co => {
      const empKey = co.employeeId || co.employeeEmail || co.employee_email || ''
      if (!empKey) return
      if (!empMap[empKey]) empMap[empKey] = []
      empMap[empKey].push(co)
    })

    // Build row per employee
    const rows = Object.entries(empMap).map(([empKey, records]) => {
      const emp = employees.find(
        e => e.id === empKey || e.email === empKey || e.employeeEmail === empKey
      )
      const name   = emp?.salesPersonName || emp?.name || emp?.email || empKey
      const role   = emp?.designation || emp?.role || '—'
      const salary = emp?.salary ?? '—'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/\s+/g, '+'))}&background=6b7280&color=fff`

      // One detail row per checkout record (sorted by date ascending)
      const details = records
        .slice()
        .sort((a, b) => {
          const da = parseDate(a.date || a.timestamp)
          const db_ = parseDate(b.date || b.timestamp)
          return (da || 0) - (db_ || 0)
        })
        .map(co => {
          const distKey  = co.distributorId || co.distributor || co.distributorName || ''
          const dist     = distributors.find(d => d.id === distKey || d.distributorName === distKey || d.name === distKey)
          const distName = dist?.distributorName || dist?.name || co.distributorName || distKey || '—'
          const location = dist?.zone || dist?.area || dist?.location || '—'
          const icon     = distName.slice(0, 2).toUpperCase()

          // Format date as "1 Mar 2026"
          const dateObj = parseDate(co.date || co.timestamp)
          const dateLabel = dateObj
            ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : (co.date || '—')

          // Resolve bits from check_ins using date+emp+dist key
          const dateObj2 = parseDate(co.date || co.timestamp)
          const dateKey  = dateObj2 ? `${dateObj2.getDate()}/${dateObj2.getMonth()}/${dateObj2.getFullYear()}` : ''
          const distKey2 = co.distributorId || co.distributor || co.distributorName || ''
          const bitsFromCI = (bitsLookup[dateKey]?.[empKey]?.[distKey2]) || ''
          const bitName = bitsFromCI || co.bits || co.bitName || '—'

          return {
            id: co.id,
            dateLabel,
            distName, location, icon,
            bitName,
            secondary:      toN(co.achievedSecondary ?? co.secondaryAchieved),
            totalCalls:     toN(co.totalCall ?? co.totalCalls),
            productiveCalls:toN(co.productiveCalls ?? co.productiveCall),
            ta:             toN(co.ta ?? co.TA ?? co.travelAllowance),
            da:             toN(co.da ?? co.DA ?? co.dailyAllowance),
            nh:             toN(co.nh ?? co.NH ?? co.nightHalt),
          }
        })

      // Unique work days = distinct dates across all checkout records
      const uniqueDates = new Set(
        records.map(co => {
          const d = parseDate(co.date || co.timestamp)
          return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null
        }).filter(Boolean)
      )

      // Employee-level totals
      const totals = details.reduce(
        (acc, d) => ({
          secondary:       acc.secondary        + d.secondary,
          productiveCalls: acc.productiveCalls   + d.productiveCalls,
          ta:              acc.ta                + d.ta,
          da:              acc.da                + d.da,
          nh:              acc.nh                + d.nh,
        }),
        { secondary: 0, productiveCalls: 0, ta: 0, da: 0, nh: 0 }
      )

      const workDays = uniqueDates.size

      return { empKey, employee: { name, role, avatar }, salary, details, workDays, ...totals }
    })

    // Apply search filter
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase().trim()
    return rows.filter(r =>
      r.employee.name.toLowerCase().includes(q) ||
      r.details.some(d => d.distName.toLowerCase().includes(q))
    )
  }, [checkOuts, employees, distributors, bitsLookup, year, month, searchQuery])

  if (tableData.length === 0) {
    return (
      <div className="disbursement-table-container">
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 14 }}>
          No checkout data found for {month} {year}.
        </p>
      </div>
    )
  }

  return (
    <div className="disbursement-table-container">
      <div className="table-wrapper">
        <table className="disbursement-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>TOTAL SECONDARY (KG)</th>
              <th>TOTAL WORK DAYS</th>
              <th>TOTAL PRODUCTIVE CALLS</th>
              <th>TOTAL TA</th>
              <th>TOTAL DA</th>
              <th>TOTAL N/H</th>
              <th>SALARY</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <React.Fragment key={row.empKey}>
                <tr>
                  <td>
                    <div className="employee-cell">
                      <img src={row.employee.avatar} alt={row.employee.name} className="employee-avatar" />
                      <div className="employee-info">
                        <div className="employee-name">{row.employee.name}</div>
                        <div className="employee-role">{row.employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{fmt(row.secondary)}</td>
                  <td>{fmt(row.workDays)}</td>
                  <td>{fmt(row.productiveCalls)}</td>
                  <td>{fmt(row.ta)}</td>
                  <td>{fmt(row.da)}</td>
                  <td>{fmt(row.nh)}</td>
                  <td className="salary-cell">{row.salary}</td>
                  <td>
                    <button className="expand-button" onClick={() => toggleRow(row.empKey)}>
                      <img
                        src="/drop-down-icon.png"
                        alt=""
                        className={`expand-arrow ${expandedRows[row.empKey] ? 'expanded' : ''}`}
                      />
                    </button>
                  </td>
                </tr>

                {expandedRows[row.empKey] && (
                  <tr className="expanded-row">
                    <td colSpan="9" className="expanded-cell" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="expanded-content">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>DATE</th>
                              <th>DISTRIBUTOR NAME</th>
                              <th>BIT NAME</th>
                              <th>SECONDARY (KG)</th>
                              <th>TOTAL CALLS</th>
                              <th>PRODUCTIVE CALLS</th>
                              <th>TA</th>
                              <th>DA</th>
                              <th>N/H</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details.length === 0 ? (
                              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No checkout data</td></tr>
                            ) : (
                              row.details.map((detail) => (
                                <tr key={detail.id}>
                                  <td className="disb-date-cell">{detail.dateLabel}</td>
                                  <td>
                                    <div className="distributor-cell">
                                      <div className="distributor-info">
                                        <div className="distributor-name">{detail.distName}</div>
                                        <div className="distributor-location">{detail.location}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{detail.bitName}</td>
                                  <td>{fmt(detail.secondary)}</td>
                                  <td>{fmt(detail.totalCalls)}</td>
                                  <td>{fmt(detail.productiveCalls)}</td>
                                  <td>{fmt(detail.ta)}</td>
                                  <td>{fmt(detail.da)}</td>
                                  <td>{fmt(detail.nh)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DisbursementTable
