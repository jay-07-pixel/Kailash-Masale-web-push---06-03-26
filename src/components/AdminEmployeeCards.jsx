import React, { useMemo, useEffect } from 'react'
import './AdminEmployeeCards.css'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Parse any date value to a JS Date — always dd/mm/yyyy (Indian format)
function toDate(v) {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const clean = String(v).trim().replace(/\s/g, '')
  // "01/03/2026" or "01-03-2026" → day=1, month=3, year=2026 → March 1st
  if (/^\d{1,2}[/\-]\d{1,2}[/\-]\d{4}$/.test(clean)) {
    const [day, mon, yr] = clean.split(/[/\-]/).map(Number)
    const d = new Date(yr, mon - 1, day)
    return isNaN(d.getTime()) ? null : d
  }
  // ISO format "2026-03-01" handled natively by JS
  const parsed = new Date(v)
  return isNaN(parsed.getTime()) ? null : parsed
}

function weekOfMonth(day) {
  if (day <= 7)  return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

function getDateStr(d) {
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtKg(val) {
  const n = parseFloat(String(val ?? '').replace(/[^\d.]/g, ''))
  return isNaN(n) ? '—' : `${n} kg`
}

const AdminEmployeeCards = ({ checkIns = [], checkOuts = [], employees = [], distributors = [], selectedYear, selectedMonth, onCardsChange }) => {
  const monthIndex = MONTH_LABELS.indexOf(selectedMonth) // 0-based

  const cards = useMemo(() => {
    const inMonth = (d) => d && d.getFullYear() === Number(selectedYear) && d.getMonth() === monthIndex
    const filteredOuts = checkOuts.filter((co) => inMonth(toDate(co.date || co.timestamp)))
    const filteredIns = checkIns.filter((ci) => inMonth(toDate(ci.timestamp || ci.date)))

    // Build per-employee → per-distributor → per-week: distinct days (from check-in + check-out) and sales (from check-out)
    const empMap = {}
    const daySets = {}

    function ensureMaps(empKey, distKey) {
      if (!empMap[empKey]) empMap[empKey] = {}
      if (!empMap[empKey][distKey]) empMap[empKey][distKey] = { 1: null, 2: null, 3: null, 4: null }
      if (!daySets[empKey]) daySets[empKey] = {}
      if (!daySets[empKey][distKey]) daySets[empKey][distKey] = { 1: new Set(), 2: new Set(), 3: new Set(), 4: new Set() }
    }

    filteredIns.forEach((ci) => {
      const empKey = ci.employeeId || ci.employeeEmail || ci.employee_email || ''
      const distKey = ci.distributorId || ci.distributor || ''
      if (!empKey) return
      const d = toDate(ci.timestamp || ci.date)
      const week = d ? weekOfMonth(d.getDate()) : 1
      const dateStr = d ? getDateStr(d) : null
      if (!dateStr) return
      ensureMaps(empKey, distKey)
      daySets[empKey][distKey][week].add(dateStr)
    })

    filteredOuts.forEach((co) => {
      const empKey = co.employeeId || co.employeeEmail || co.employee_email || ''
      const distKey = co.distributorId || co.distributor || co.distributorName || ''
      if (!empKey) return
      ensureMaps(empKey, distKey)
      const d = toDate(co.date || co.timestamp)
      const week = d ? weekOfMonth(d.getDate()) : 1
      const dateStr = d ? getDateStr(d) : null
      if (dateStr) daySets[empKey][distKey][week].add(dateStr)

      const prev = empMap[empKey][distKey][week] || { primary: 0, secondary: 0, workingDays: 0 }
      const primary   = parseFloat(String(co.achievedPrimary   ?? co.primaryAchieved   ?? 0).replace(/[^\d.]/g, '')) || 0
      const secondary = parseFloat(String(co.achievedSecondary ?? co.secondaryAchieved ?? 0).replace(/[^\d.]/g, '')) || 0
      empMap[empKey][distKey][week] = {
        primary:   prev.primary   + primary,
        secondary: prev.secondary + secondary,
        workingDays: daySets[empKey][distKey][week].size,
      }
    })

    // Fill working days for weeks that have only check-ins (no check-out)
    Object.keys(daySets).forEach((empKey) => {
      Object.keys(daySets[empKey]).forEach((distKey) => {
        [1, 2, 3, 4].forEach((w) => {
          const n = daySets[empKey][distKey][w]?.size ?? 0
          if (n === 0) return
          const existing = empMap[empKey]?.[distKey]?.[w]
          if (!existing) {
            if (!empMap[empKey]) empMap[empKey] = {}
            if (!empMap[empKey][distKey]) empMap[empKey][distKey] = { 1: null, 2: null, 3: null, 4: null }
            empMap[empKey][distKey][w] = { primary: 0, secondary: 0, workingDays: n }
          }
        })
      })
    })

    // Build card list — one per employee that has any checkout in this period
    return Object.entries(empMap).map(([empKey, distMap]) => {
      const emp = employees.find(
        (e) => e.id === empKey || e.email === empKey || e.employeeEmail === empKey
      )
      const name   = emp?.salesPersonName || emp?.name || emp?.email || empKey
      const role   = emp?.designation || emp?.role || '—'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/\s+/g, '+'))}&background=6b7280&color=fff`

      const distRows = Object.entries(distMap).map(([distKey, weeks]) => {
        const dist = distributors.find(
          (d) => d.id === distKey || d.distributorName === distKey || d.name === distKey
        )
        const distName = dist?.distributorName || dist?.name || distKey || '—'
        const icon     = distName.slice(0, 2).toUpperCase()
        return { distKey, distName, icon, weeks }
      })

      return { empKey, name, role, avatar, distRows }
    }).sort((a, b) => a.name.localeCompare(b.name))
  }, [checkIns, checkOuts, employees, distributors, selectedYear, monthIndex])

  useEffect(() => {
    if (typeof onCardsChange === 'function' && selectedYear && selectedMonth) {
      onCardsChange(cards, selectedYear, selectedMonth)
    }
  }, [cards, selectedYear, selectedMonth, onCardsChange])

  if (cards.length === 0) {
    return (
      <div className="aec-empty">
        No checkout data found for {selectedMonth} {selectedYear}.
      </div>
    )
  }

  return (
    <div className="aec-grid">
      {cards.map((card) => (
        <div key={card.empKey} className="aec-card">
          <div className="aec-card-header">
            <img src={card.avatar} alt={card.name} className="aec-avatar" />
            <div>
              <div className="aec-emp-name">{card.name}</div>
              <div className="aec-emp-role">{card.role}</div>
            </div>
          </div>

          {card.distRows.length === 0 ? (
            <div className="aec-no-dist">No distributor data</div>
          ) : (
            <div className="aec-dist-list">
              {card.distRows.map((dr) => (
                <div key={dr.distKey} className="aec-dist-row">
                  <div className="aec-dist-name-cell">
                    <div className="aec-dist-icon">{dr.icon}</div>
                    <span className="aec-dist-name">{dr.distName}</span>
                  </div>
                  <div className="aec-weeks">
                    {[1, 2, 3, 4].map((w) => {
                      const wk = dr.weeks[w]
                      return (
                        <div key={w} className={`aec-week-box ${wk ? 'has-data' : 'no-data'}`}>
                          <div className="aec-week-label">Week {w}</div>
                          <div className="aec-week-row">
                            <span className="aec-week-tag working-days-tag">WD</span>
                            <span className="aec-week-val">{wk?.workingDays != null ? wk.workingDays : '—'}</span>
                          </div>
                          <div className="aec-week-row">
                            <span className="aec-week-tag primary-tag">P</span>
                            <span className="aec-week-val">{wk ? fmtKg(wk.primary) : '—'}</span>
                          </div>
                          <div className="aec-week-row">
                            <span className="aec-week-tag secondary-tag">S</span>
                            <span className="aec-week-val">{wk ? fmtKg(wk.secondary) : '—'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default AdminEmployeeCards
