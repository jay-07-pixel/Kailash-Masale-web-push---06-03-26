import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './WeeklyApprovalsTable.css'

const WEEKLY_PLANS_COLLECTION = 'weekly_plans'
const DISTRIBUTORS_COLLECTION = 'distributors'
const EMPLOYEES_COLLECTION = 'employees'

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '—'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2)
  return name.slice(0, 2).toUpperCase()
}

const getDistributorColors = (initials) => {
  const i = (initials || '—').charCodeAt(0) % 3
  const colors = [
    { bg: '#EEF2FF', text: '#6366F1' },
    { bg: '#FEF3C7', text: '#D97706' },
    { bg: '#D1FAE5', text: '#059669' },
  ]
  return colors[i] || colors[0]
}

const getWeekOfMonthFromDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null
  const parts = dateStr.trim().split(/[\s/]+/).filter(Boolean)
  const day = parseInt(parts[0], 10)
  if (!day || isNaN(day) || day < 1 || day > 31) return null
  if (day <= 7) return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

const getCurrentWeekOfMonth = () => {
  const day = new Date().getDate()
  if (day <= 7) return 1
  if (day <= 14) return 2
  if (day <= 21) return 3
  return 4
}

const WeeklyApprovalsTable = ({ year = '', month = '', searchQuery = '' }) => {
  const [expandedRows, setExpandedRows] = useState({})
  const [activeWeek, setActiveWeek] = useState(getCurrentWeekOfMonth)
  const [plans, setPlans] = useState([])
  const [editModal, setEditModal] = useState({ open: false, row: null, activeWeek: 1, primaryGoal: '', visitList: [] })
  const [saving, setSaving] = useState(false)
  const [distributors, setDistributors] = useState([])
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, WEEKLY_PLANS_COLLECTION), (snapshot) => {
      setPlans(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      setDistributors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const getBitsForDistributor = (distributorName) => {
    if (!(distributorName || '').trim()) return []
    const name = String(distributorName).trim()
    const dist = distributors.find(
      (d) => (d.distributorName || d.name || '').trim() === name
    )
    if (!dist) return []
    const set = new Set()
    const bits = Array.isArray(dist.bits) ? dist.bits.filter(Boolean) : []
    bits.forEach((b) => set.add(String(b).trim()))
    if ((dist.bitName || '').trim()) set.add(String(dist.bitName).trim())
    if ((dist.area || '').trim()) set.add(String(dist.area).trim())
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }

  const setRowStatus = async (rowId, status) => {
    if (!isFirebaseConfigured || !db) return
    const newStatus = status === 'approved' ? 'approved' : 'rejected'
    setPlans((prev) =>
      prev.map((p) =>
        p.id === rowId ? { ...p, status: newStatus } : p
      )
    )
    const patch =
      newStatus === 'approved'
        ? { status: 'approved', approvedAt: serverTimestamp(), rejectedAt: null }
        : { status: 'rejected', rejectedAt: serverTimestamp(), approvedAt: null }
    try {
      await setDoc(doc(db, WEEKLY_PLANS_COLLECTION, rowId), patch, { merge: true })
    } catch (e) {
      console.error('setRowStatus failed:', e)
      setPlans((prev) =>
        prev.map((p) => (p.id === rowId ? { ...p, status: p.status } : p))
      )
    }
  }

  const openEdit = (row, week) => {
    const raw = String(row.primaryGoal || '').replace(/\s*kgs?/i, '').trim()
    const dd = row.detailsByWeek?.[week] ?? row.details ?? []
    const visitList = dd.map((d) => ({
      date: d.date || '',
      distributorName: d.distributor?.name ?? '',
      bitName: d.bitName ?? '',
      lastDayVisit: d.lastDayVisit ?? '',
    }))
    setEditModal({ open: true, row, activeWeek: week, primaryGoal: raw, visitList })
  }

  const closeEdit = () => setEditModal({ open: false, row: null, activeWeek: 1, primaryGoal: '', visitList: [] })

  const updateVisitRow = (index, field, value) => {
    setEditModal((prev) => ({
      ...prev,
      visitList: prev.visitList.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  const addVisitRow = () => {
    setEditModal((prev) => ({
      ...prev,
      visitList: [...prev.visitList, { date: '', distributorName: '', bitName: '', lastDayVisit: '' }],
    }))
  }

  const removeVisitRow = (index) => {
    setEditModal((prev) => ({
      ...prev,
      visitList: prev.visitList.filter((_, i) => i !== index),
    }))
  }

  const saveEdit = async () => {
    if (!editModal.row || !isFirebaseConfigured || !db) return
    setSaving(true)
    try {
      const plan = plans.find((p) => p.id === editModal.row.id)
      const rawDetails = plan ? normalizeDetails(plan) : []
      const detailsFieldName = plan ? getDetailsFieldName(plan) : 'details'
      const otherWeeksDetails = rawDetails.filter((d) => getWeekOfMonthFromDate(d.date || d.dateVal) !== editModal.activeWeek)
      const editedAsRaw = editModal.visitList
        .filter((v) => (v.date || '').trim() || (v.distributorName || '').trim())
        .map((v) => ({
          date: (v.date || '').trim(),
          distributorName: (v.distributorName || '').trim(),
          bitName: (v.bitName || '').trim(),
          lastVisitDay: (v.lastDayVisit || '').trim(),
        }))
      const mergedDetails = [...otherWeeksDetails, ...editedAsRaw]
      await setDoc(
        doc(db, WEEKLY_PLANS_COLLECTION, editModal.row.id),
        { [detailsFieldName]: mergedDetails, primaryGoal: (editModal.primaryGoal || '').trim() },
        { merge: true }
      )
      closeEdit()
    } catch (e) {
      console.error('saveEdit failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const getDetailsFromObject = (obj) => {
    if (!obj || typeof obj !== 'object') return []
    if (Array.isArray(obj)) return obj
    const numericKeys = Object.keys(obj).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length) return numericKeys.map((k) => obj[k]).filter(Boolean)
    return Object.values(obj).filter((v) => v && typeof v === 'object' && (v.distributor || v.distributorName || v.bitName))
  }

  const getDetailsFieldName = (docObj) => {
    if (!docObj || typeof docObj !== 'object') return 'details'
    const fieldOrder = ['details', 'plans', 'distributors', 'data', 'planData', 'weekPlans']
    for (const key of fieldOrder) {
      const raw = docObj[key]
      const arr = getDetailsFromObject(raw)
      if (arr.length || (raw != null && Array.isArray(raw))) return key
    }
    const numericKeys = Object.keys(docObj).filter((k) => k !== 'id' && /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length) return 'details'
    for (const key of Object.keys(docObj)) {
      if (key === 'id') continue
      const arr = getDetailsFromObject(docObj[key])
      if (arr.length && arr.some((x) => x && (x.distributor || x.distributorName || x.bitName))) return key
    }
    return 'details'
  }

  const normalizeDetails = (docObj) => {
    if (!docObj || typeof docObj !== 'object') return []
    const raw = docObj.details || docObj.plans || docObj.distributors || docObj.data || docObj.planData || docObj.weekPlans
    const fromField = getDetailsFromObject(raw)
    if (fromField.length) return fromField
    const numericKeys = Object.keys(docObj).filter((k) => k !== 'id' && /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    if (numericKeys.length) return numericKeys.map((k) => docObj[k]).filter(Boolean)
    for (const key of Object.keys(docObj)) {
      if (key === 'id') continue
      const arr = getDetailsFromObject(docObj[key])
      if (arr.length && arr.some((x) => x && (x.distributor || x.distributorName || x.bitName))) return arr
    }
    return []
  }

  const tableData = useMemo(() => {
    const search = (searchQuery || '').toLowerCase().trim()
    const monthLower = (month || '').toLowerCase()
    const yearStr = String(year || '')

    let rows = plans.map((docObj) => {
      const employeeName = docObj.employeeName || docObj.employee_name || docObj.employeeEmail || docObj.employee_email || docObj.employeeId || docObj.email || '—'
      const planEmployeeId = docObj.employeeId || docObj.employee_id || null
      const matchedEmployee = planEmployeeId
        ? employees.find((e) => e.id === planEmployeeId)
        : employees.find(
            (e) =>
              (e.salesPersonName || e.name || '').trim() === (employeeName || '').trim() ||
              (e.email || '').trim().toLowerCase() === (employeeName || '').trim().toLowerCase()
          )
      const employeeId = matchedEmployee?.id || planEmployeeId || null
      const role = docObj.role || docObj.employeeRole || 'Sales Rep'
      const dateVal = docObj.date || docObj.weekStart || docObj.timestamp
      let dateLabel = '—'
      if (dateVal) {
        if (typeof dateVal.toDate === 'function') dateLabel = dateVal.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
        else if (typeof dateVal === 'string') dateLabel = dateVal
        else dateLabel = String(dateVal)
      }
      const primaryGoal = docObj.primaryGoal ?? docObj.primary_goal ?? '—'
      const primaryGoalStr = typeof primaryGoal === 'number'
        ? `${primaryGoal} kgs`
        : String(primaryGoal).toLowerCase().includes('kg') ? primaryGoal : `${primaryGoal} kgs`

      const rawDetails = normalizeDetails(docObj)
      const firstDetail = rawDetails[0] && typeof rawDetails[0] === 'object' ? rawDetails[0] : null
      const rowDateLabel = dateLabel === '—' && firstDetail ? (firstDetail.date || dateLabel) : dateLabel
      const rawRowGoal = primaryGoalStr === '— kgs' && firstDetail
        ? (firstDetail.primaryGoal ?? firstDetail.primary_goal ?? '—')
        : primaryGoalStr
      const rowPrimaryGoal = (typeof rawRowGoal === 'number' || (typeof rawRowGoal === 'string' && rawRowGoal !== '—' && !String(rawRowGoal).toLowerCase().includes('kg')))
        ? `${rawRowGoal} kgs` : rawRowGoal

      const mapDetails = (arr) => arr.map((d) => {
        if (!d || typeof d !== 'object') return null
        const distName = d.distributorName || d.distributor_name || d.distributor || '—'
        const initials = getInitials(distName)
        const colors = getDistributorColors(initials)
        return {
          date: d.date || rowDateLabel,
          distributor: { name: distName, location: d.location || d.distributorLocation || '', initials, bgColor: colors.bg, textColor: colors.text },
          bitName: d.bitName ?? d.bit_name ?? d.bit ?? '—',
          lastDayVisit: d.lastVisitDay ?? d.lastDayVisit ?? d.last_day_visit ?? d.date ?? rowDateLabel,
          primaryTargetPending: d.primaryTargetPending ?? d.primary_target_pending ?? '—',
          primaryGoal: d.primaryGoal ?? d.primary_goal ?? rowPrimaryGoal,
        }
      }).filter(Boolean)

      const byWeek = { 1: [], 2: [], 3: [], 4: [] }
      rawDetails.forEach((d) => {
        const w = getWeekOfMonthFromDate(d.date || d.dateVal)
        if (w >= 1 && w <= 4) byWeek[w].push(d)
        else byWeek[1].push(d)
      })

      const allMapped = mapDetails(rawDetails)

      // Sum all detail-level PRIMARY GOAL values for the month total
      const totalPrimaryGoal = allMapped.reduce((sum, d) => {
        const val = parseFloat(String(d.primaryGoal).replace(/[^\d.]/g, ''))
        return sum + (isNaN(val) ? 0 : val)
      }, 0)
      const totalPrimaryGoalStr = totalPrimaryGoal > 0 ? `${totalPrimaryGoal} kgs` : rowPrimaryGoal

      return {
        id: docObj.id,
        employeeId,
        date: rowDateLabel,
        employee: { name: employeeName, role, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&background=6b7280&color=fff` },
        primaryGoal: totalPrimaryGoalStr,
        rowStatus: docObj.status || null,
        details: allMapped,
        detailsByWeek: { 1: mapDetails(byWeek[1]), 2: mapDetails(byWeek[2]), 3: mapDetails(byWeek[3]), 4: mapDetails(byWeek[4]) },
      }
    })

    if (search) {
      rows = rows.filter((r) => r.employee.name.toLowerCase().includes(search) || r.details.some((d) => (d.distributor.name || '').toLowerCase().includes(search)))
    }
    if (monthLower || yearStr) {
      rows = rows.filter((r) => {
        const dStr = (r.date || '').toLowerCase()
        return (!monthLower || dStr.includes(monthLower.slice(0, 3))) && (!yearStr || dStr.includes(yearStr.slice(-2)) || dStr.includes(yearStr))
      })
    }
    return rows
  }, [plans, employees, year, month, searchQuery])

  const assignedDistributorsForModal = useMemo(() => {
    if (!editModal.row?.employeeId) return []
    const emp = employees.find((e) => e.id === editModal.row.employeeId)
    if (!emp) return []
    const fromEmployee = (emp.assignedDistributorIds || []).map((id) => distributors.find((d) => d.id === id)).filter(Boolean)
    const fromDistributors = distributors.filter((d) => (d.assignedEmployeeIds || []).includes(emp.id))
    const byId = new Map()
    fromEmployee.forEach((d) => byId.set(d.id, d))
    fromDistributors.forEach((d) => byId.set(d.id, d))
    return Array.from(byId.values())
  }, [editModal.row?.employeeId, employees, distributors])

  const toggleRow = (id) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="weekly-approvals-table-container">
      <div className="table-wrapper">
        <table className="weekly-approvals-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>EMPLOYEE</th>
              <th>PRIMARY GOAL FOR THE MONTH</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={4} className="weekly-approvals-empty">
                  {isFirebaseConfigured && db ? 'No weekly plans yet. Data from Firebase will appear here.' : 'Connect Firebase to load weekly plans.'}
                </td>
              </tr>
            ) : tableData.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td>{row.date}</td>
                  <td>
                    <div className="employee-cell">
                      <img src={row.employee.avatar} alt={row.employee.name} className="employee-avatar" />
                      <div className="employee-info">
                        <div className="employee-name">{row.employee.name}</div>
                        <div className="employee-role">{row.employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{row.primaryGoal}</td>
                  <td>
                    <div className="wa-row-end">
                      {row.rowStatus && (
                        <span className={`wa-status-badge wa-status-${row.rowStatus}`}>
                          {row.rowStatus === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      )}
                      <button type="button" className="expand-button" onClick={() => toggleRow(row.id)}>
                        <img src="/drop-down-icon.png" alt="" className={`expand-arrow ${expandedRows[row.id] ? 'expanded' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[row.id] && (
                  <tr>
                    <td colSpan="4" className="expanded-row-cell">
                      <div className="expanded-content">
                        <div className="week-tabs-and-actions">
                          <div className="week-tabs">
                            {[1, 2, 3, 4].map((week) => {
                              const detailsForWeek = row.detailsByWeek?.[week] ?? row.details
                              const hasContent = Array.isArray(detailsForWeek) && detailsForWeek.length > 0
                              return (
                                <button key={week} type="button" className={`week-tab ${activeWeek === week ? 'active' : ''}`} onClick={() => setActiveWeek(week)}>
                                  Week {week}
                                  {hasContent && <span className="week-tab-dot" aria-hidden="true" />}
                                </button>
                              )
                            })}
                          </div>
                          <div className="action-buttons">
                            <button type="button" className={`action-btn approve ${row.rowStatus === 'approved' ? 'action-btn-active-approve' : ''}`} title="Approve" onClick={(e) => { e.stopPropagation(); setRowStatus(row.id, 'approved') }}>✓</button>
                            <button type="button" className={`action-btn reject ${row.rowStatus === 'rejected' ? 'action-btn-active-reject' : ''}`} title="Reject" onClick={(e) => { e.stopPropagation(); setRowStatus(row.id, 'rejected') }}>✕</button>
                            <button type="button" className="action-btn action-btn-pen" title="Edit" onClick={(e) => { e.stopPropagation(); openEdit(row, activeWeek) }}>
                              <img src="/pen-icon.png" alt="Edit" className="pen-icon-img" />
                            </button>
                          </div>
                        </div>
                        <div className="detail-table-wrapper">
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>DATE</th>
                                <th>DISTRIBUTOR NAME</th>
                                <th>BIT NAME</th>
                                <th>LAST DAY VISIT</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const dd = row.detailsByWeek?.[activeWeek] ?? row.details
                                if (!dd.length) return <tr><td colSpan={4} className="no-details">No plan details</td></tr>
                                return dd.map((detail, idx) => (
                                  <tr key={idx}>
                                    <td>{detail.date}</td>
                                    <td>
                                      <div className="distributor-cell">
                                        <div className="distributor-initials-box" style={{ backgroundColor: detail.distributor.bgColor, color: detail.distributor.textColor }}>
                                          {detail.distributor.initials}
                                        </div>
                                        <div className="distributor-info">
                                          <div className="distributor-name">{detail.distributor.name}</div>
                                          <div className="distributor-location">{detail.distributor.location}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td>{detail.bitName}</td>
                                    <td>{detail.lastDayVisit}</td>
                                  </tr>
                                ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {editModal.open && (
        <div className="wa-modal-overlay" onClick={closeEdit}>
          <div className="wa-modal wa-modal-edit-visits" onClick={(e) => e.stopPropagation()}>
            <h3 className="wa-modal-title">Edit — {editModal.row?.employee?.name} (Week {editModal.activeWeek})</h3>
            <p className="wa-modal-subtitle">Which date the employee is visiting which distributor and which bit. Edit the list below.</p>
            <label className="wa-modal-label">
              Primary Goal for the month (kgs)
              <input
                type="text"
                className="wa-modal-input"
                value={editModal.primaryGoal}
                onChange={(e) => setEditModal((p) => ({ ...p, primaryGoal: e.target.value }))}
                placeholder="e.g. 120"
              />
            </label>
            <div className="wa-edit-visits-table-wrap">
              <table className="wa-edit-visits-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DISTRIBUTOR NAME</th>
                    <th>BIT NAME</th>
                    <th>LAST DAY VISIT</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {editModal.visitList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="wa-edit-no-rows">No visits for this week. Add a row below.</td>
                    </tr>
                  ) : (
                    editModal.visitList.map((visit, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            type="text"
                            className="wa-edit-input"
                            value={visit.date}
                            onChange={(e) => updateVisitRow(idx, 'date', e.target.value)}
                            placeholder="e.g. 09 / 03 / 2026"
                          />
                        </td>
                        <td>
                          <select
                            className="wa-edit-select"
                            value={visit.distributorName}
                            onChange={(e) => {
                              const name = e.target.value
                              setEditModal((prev) => ({
                                ...prev,
                                visitList: prev.visitList.map((v, i) =>
                                  i === idx ? { ...v, distributorName: name, bitName: '' } : v
                                ),
                              }))
                            }}
                            aria-label="Select distributor"
                          >
                            <option value="">Select distributor</option>
                            {assignedDistributorsForModal.map((d) => {
                              const name = (d.distributorName || d.name || '').trim()
                              if (!name) return null
                              return (
                                <option key={d.id} value={name}>{name}</option>
                              )
                            })}
                          </select>
                        </td>
                        <td>
                          <select
                            className="wa-edit-select"
                            value={visit.bitName}
                            onChange={(e) => updateVisitRow(idx, 'bitName', e.target.value)}
                            aria-label="Select bit"
                            disabled={!(visit.distributorName || '').trim()}
                          >
                            <option value="">
                              {(visit.distributorName || '').trim() ? 'Select bit' : 'Select distributor first'}
                            </option>
                            {getBitsForDistributor(visit.distributorName).map((bit) => (
                              <option key={bit} value={bit}>{bit}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="wa-edit-input"
                            value={visit.lastDayVisit}
                            onChange={(e) => updateVisitRow(idx, 'lastDayVisit', e.target.value)}
                            placeholder="Last visit date"
                          />
                        </td>
                        <td>
                          <button type="button" className="wa-edit-remove-row" onClick={() => removeVisitRow(idx)} title="Remove row" aria-label="Remove row">×</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button type="button" className="wa-edit-add-row" onClick={addVisitRow}>+ Add visit row</button>
            <div className="wa-modal-actions">
              <button type="button" className="wa-modal-cancel" onClick={closeEdit}>Cancel</button>
              <button type="button" className="wa-modal-save" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WeeklyApprovalsTable
