import React, { useState, useEffect, useMemo } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { ref, getBlob } from 'firebase/storage'
import { db, storage, isFirebaseConfigured } from '../firebase'
import './StockSheetsTable.css'

const EMPLOYEES_COLLECTION = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const STOCK_SHEETS_COLLECTION = 'stock_sheets'

const MONTH_TO_NUM = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 }

function parseStockSheetDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim().replace(/\//g, '-')
  const parts = s.split('-')
  if (parts.length !== 3) return null
  const p0 = parseInt(parts[0], 10)
  const p1 = parseInt(parts[1], 10)
  const p2 = parseInt(parts[2], 10)
  if (parts[2].length === 4) {
    return { day: p0, month: p1, year: p2 }
  }
  return { day: p1, month: p0, year: p2 }
}

const StockSheetsTable = ({ year = '2026', month = 'Jan', searchQuery = '' }) => {
  const [expandedRows, setExpandedRows] = useState({})
  const [employees, setEmployees] = useState([])
  const [distributors, setDistributors] = useState([])
  const [stockSheets, setStockSheets] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
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
    const unsub = onSnapshot(collection(db, STOCK_SHEETS_COLLECTION), (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data()
        return { id: d.id, ...data }
      })
      setStockSheets(list)
      snapshot.docs.forEach((d) => {
        const data = d.data()
        const hasUrl = !!(data.downloadUrl || data.downloadurl)
        if (hasUrl && data.status !== 'Received') {
          updateDoc(doc(db, STOCK_SHEETS_COLLECTION, d.id), { status: 'Received' }).catch(() => {})
        }
      })
    })
    return () => unsub()
  }, [])

  const monthNum = MONTH_TO_NUM[month] != null ? MONTH_TO_NUM[month] : 1
  const yearNum = parseInt(year, 10) || new Date().getFullYear()

  const tableData = useMemo(() => {
    const distById = {}
    distributors.forEach((d) => { distById[d.id] = d })
    const receivedByKey = {}
    const norm = (str) => (str || '').toString().trim().toLowerCase().replace(/\s+/g, ' ')
    stockSheets.forEach((s) => {
      const hasUrl = !!(s.downloadUrl || s.downloadurl)
      const url = s.downloadUrl || s.downloadurl
      if (!hasUrl) return
      let m = s.month != null ? Number(s.month) : null
      let y = s.year != null ? Number(s.year) : null
      if (m == null || y == null) {
        const parsed = parseStockSheetDate(s.date)
        if (parsed) {
          m = parsed.month
          y = parsed.year
        }
      }
      if (m == null || y == null) return
      const distKey = norm(s.distributor || s.distributorId || '').replace(/\s+/g, ' ') || ''
      if (!distKey) return
      const empEm = norm(s.employeeEmail || '')
      const empNm = norm(s.employeeName || '')
      const empId = (s.employeeId || '').toString().trim().toLowerCase()
      const val = { downloadUrl: url }
      const add = (empKey) => {
        if (empKey) receivedByKey[`${empKey}|${distKey}|${y}|${m}`] = val
      }
      add(empEm)
      add(empNm)
      if (empId) add(empId)
    })

    const rows = []
    employees.forEach((emp) => {
      const assignedIds = emp.assignedDistributorIds || []
      if (assignedIds.length === 0) return
      const search = (searchQuery || '').toLowerCase().trim()
      const empName = (emp.salesPersonName || emp.name || emp.email || '').toLowerCase()
      if (search && !empName.includes(search)) return

      const primaryDistId = assignedIds[0]
      const primaryDist = distById[primaryDistId]
      const empKeysToTry = [
        emp.email,
        emp.employeeEmail,
        emp.salesPersonName,
        emp.name,
        emp.id,
      ].filter(Boolean).map((x) => norm(x))
      const details = assignedIds
        .map((distId) => {
          const d = distById[distId]
          const name = d?.distributorName || d?.name || '—'
          const location = d?.zone || d?.location || ''
          const initial = name.trim().length >= 2 ? name.trim().slice(0, 2).toUpperCase() : name.slice(0, 2).toUpperCase()
          const distKeyLookup = norm(name)
          let received = null
          for (const ek of empKeysToTry) {
            const key = `${ek}|${distKeyLookup}|${yearNum}|${monthNum}`
            received = receivedByKey[key]
            if (received) break
          }
          const status = received ? 'Received' : 'Pending'
          return {
            distributorId: distId,
            distributor: { name, location, icon: initial },
            status,
            downloadUrl: received?.downloadUrl || null,
          }
        })
        .filter((detail) => {
          const n = (detail.distributor?.name || '').trim()
          return n !== '' && n !== '—'
        })

      const empNameDisplay = emp.salesPersonName || emp.name || emp.email || '—'
      const role = emp.designation || emp.role || 'Sales Rep'
      const dateLabel = `${month} ${year}`

      rows.push({
        id: emp.id,
        date: dateLabel,
        employee: {
          name: empNameDisplay,
          role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(empNameDisplay)}&background=6b7280&color=fff`,
        },
        distributor: {
          name: primaryDist?.distributorName || primaryDist?.name || '—',
          location: primaryDist?.zone || primaryDist?.location || '',
          icon: primaryDist ? ((primaryDist.distributorName || primaryDist.name || '').trim().slice(0, 2).toUpperCase()) : '—',
        },
        details,
      })
    })
    return rows
  }, [employees, distributors, stockSheets, yearNum, monthNum, month, year, searchQuery])

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const getIconStyles = (role) => {
    if (role === 'Regional Mgr') {
      return { backgroundColor: '#FFF4E8', color: '#f97316' }
    }
    return { backgroundColor: '#EFF6FF', color: '#3b82f6' }
  }

  const triggerBlobDownload = (blob, filename) => {
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  }

  const handleDownload = async (url, distributorName = 'stock-sheet') => {
    if (!url || typeof url !== 'string') return
    const ext = url.split(/[#?]/)[0].match(/\.(jpe?g|png|gif|pdf|webp)$/i)?.[1] || 'jpg'
    const safeName = (distributorName || 'stock-sheet').replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 50)
    const filename = `${safeName}.${ext}`
    let blob = null

    // 1) Prefer fetch so we get a blob and trigger direct download (works with Firebase Storage download URLs when CORS allows)
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
      if (res.ok) {
        blob = await res.blob()
        triggerBlobDownload(blob, filename)
        return
      }
    } catch (_) {}

    // 2) Firebase Storage: try getBlob by path if URL is a full Firebase Storage URL
    if (isFirebaseConfigured && storage && url.startsWith('http')) {
      try {
        const u = new URL(url)
        const pathMatch = u.pathname.match(/\/o\/(.+)$/)
        const path = pathMatch ? decodeURIComponent(pathMatch[1]) : null
        if (path) {
          const storageRef = ref(storage, path)
          blob = await getBlob(storageRef)
          if (blob) {
            triggerBlobDownload(blob, filename)
            return
          }
        }
      } catch (_) {}
    } else if (isFirebaseConfigured && storage && !url.startsWith('http')) {
      try {
        const storageRef = ref(storage, url)
        blob = await getBlob(storageRef)
        if (blob) {
          triggerBlobDownload(blob, filename)
          return
        }
      } catch (_) {}
    }

    // 3) Fallback when CORS blocks fetch/getBlob (e.g. deployed site): open in new tab so user can view/save
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (_) {}
  }

  return (
    <div className="stock-sheets-table-container">
      <div className="table-wrapper">
        <table className="stock-sheets-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>EMPLOYEE</th>
              <th>RECEIVED / PENDING</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={4} className="stock-sheets-empty">
                  {isFirebaseConfigured && db
                    ? 'No employees with assigned distributors. Assign distributors to employees on the Distributor page.'
                    : 'Connect Firebase to load data.'}
                </td>
              </tr>
            ) : (
              tableData.map((row) => (
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
                    <td>
                      <span className="received-pending-count">
                        {(row.details.filter((d) => d.status === 'Received').length)} / {(row.details.filter((d) => d.status === 'Pending').length)}
                      </span>
                    </td>
                    <td>
                      <button className="expand-button" onClick={() => toggleRow(row.id)}>
                        <img
                          src="/drop-down-icon.png"
                          alt=""
                          className={`expand-arrow ${expandedRows[row.id] ? 'expanded' : ''}`}
                        />
                      </button>
                    </td>
                  </tr>
                  {expandedRows[row.id] && row.details && row.details.length > 0 && (
                    <tr className="expanded-row">
                      <td colSpan="4" className="expanded-cell">
                        <div className="expanded-content">
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>DISTRIBUTOR</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.details.map((detail, index) => (
                                <tr key={`${detail.distributorId}-${index}`}>
                                  <td>
                                    <div className="distributor-cell">
                                      <div className="distributor-info">
                                        <div className="distributor-name">{detail.distributor.name}</div>
                                        <div className="distributor-location">{detail.distributor.location}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`status-badge ${detail.status.toLowerCase()}`}>
                                      {detail.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="action-icons">
                                      {detail.downloadUrl ? (
                                        <>
                                          <button
                                            type="button"
                                            className="action-icon-btn view"
                                            aria-label="View"
                                            onClick={() => window.open(detail.downloadUrl, '_blank', 'noopener,noreferrer')}
                                          >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                              <circle cx="12" cy="12" r="3" />
                                            </svg>
                                          </button>
                                          <button
                                            type="button"
                                            className="action-icon-btn download"
                                            aria-label="Download"
                                            onClick={() => handleDownload(detail.downloadUrl, detail.distributor?.name)}
                                          >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                              <polyline points="7 10 12 15 17 10" />
                                              <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                          </button>
                                        </>
                                      ) : (
                                        <span className="action-placeholder">—</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StockSheetsTable
