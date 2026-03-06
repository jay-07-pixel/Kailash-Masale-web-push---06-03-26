import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './ApprovalsTable.css'

const LEAVE_COLLECTION     = 'leave_applications'
const EMPLOYEES_COLLECTION = 'employees'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Parse "dd/mm/yyyy" or Firebase Timestamp
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

function formatDisplayDate(v) {
  const d = parseDate(v)
  if (!d) return v || '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const ApprovalsTable = () => {
  const now = new Date()
  const [applications, setApplications] = useState([])
  const [employees, setEmployees]       = useState([])
  const [search, setSearch]             = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedYear, setSelectedYear]   = useState(String(now.getFullYear()))
  const [selectedMonth, setSelectedMonth] = useState(MONTH_LABELS[now.getMonth()])
  const [saving, setSaving] = useState({})

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u1 = onSnapshot(collection(db, LEAVE_COLLECTION), s =>
      setApplications(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    const u2 = onSnapshot(collection(db, EMPLOYEES_COLLECTION), s =>
      setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { u1(); u2() }
  }, [])

  const yearOptions = [0, 1, 2].map(i => String(now.getFullYear() - i))
  const monthIndex  = MONTH_LABELS.indexOf(selectedMonth) // 0-based

  const cards = useMemo(() => {
    return applications
      .filter(a => a.type === 'sunday_work')
      .filter(a => {
        const d = parseDate(a.workOnSundayDate || a.leaveFromDate || a.timestamp)
        if (!d) return false
        return d.getFullYear() === Number(selectedYear) && d.getMonth() === monthIndex
      })
      .filter(a => {
        if (filterStatus === 'all') return true
        return (a.status || 'pending') === filterStatus
      })
      .filter(a => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (a.name || '').toLowerCase().includes(q)
      })
      .map(a => {
        const emp = employees.find(
          e => e.id === a.employeeId || e.email === a.employeeEmail
        )
        const role   = emp?.designation || emp?.role || '—'
        const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent((a.name || 'U').replace(/\s+/g, '+'))}&background=6b7280&color=fff`
        return { ...a, role, avatar }
      })
      .sort((a, b) => {
        const da = parseDate(a.timestamp || a.workOnSundayDate)
        const db_ = parseDate(b.timestamp || b.workOnSundayDate)
        return (db_ || 0) - (da || 0)  // newest first
      })
  }, [applications, employees, selectedYear, monthIndex, filterStatus, search])

  const setStatus = async (appId, status) => {
    if (!isFirebaseConfigured || !db) return
    setSaving(prev => ({ ...prev, [appId]: true }))
    try {
      await setDoc(
        doc(db, LEAVE_COLLECTION, appId),
        { status, [`${status}At`]: serverTimestamp() },
        { merge: true }
      )
    } catch (e) {
      console.error('setStatus failed:', e)
    }
    setSaving(prev => ({ ...prev, [appId]: false }))
  }

  return (
    <div className="approvals-wrapper">
      {/* ── Filters ── */}
      <div className="approvals-filter-bar">
        <div className="approvals-filter-group">
          <select className="approvals-select" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="approvals-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {MONTH_LABELS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="approvals-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div className="approvals-search-wrap">
          <span className="approvals-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="approvals-search-input"
          />
        </div>
      </div>

      {/* ── Cards grid ── */}
      <div className="leaves-cards-container">
        {cards.length === 0 ? (
          <div className="leaves-empty">
            <p className="leaves-empty-text">
              No Sunday work applications for {selectedMonth} {selectedYear}.
            </p>
          </div>
        ) : (
          cards.map(card => {
            const status    = card.status || 'pending'
            const isSaving  = saving[card.id]
            const sundayDate = card.workOnSundayDate || card.leaveFromDate

            return (
              <div key={card.id} className={`leave-card sunday-card ${status !== 'pending' ? `card-${status}` : ''}`}>
                {/* Status badge */}
                {status !== 'pending' && (
                  <div className={`sunday-status-badge badge-${status}`}>
                    {status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                  </div>
                )}

                <div className="card-header">
                  <img src={card.avatar} alt={card.name} className="employee-avatar" />
                  <div className="employee-info">
                    <div className="employee-name">{card.name || '—'}</div>
                    <div className="employee-role">{card.role}</div>
                  </div>
                  <div className="date-range">{formatDisplayDate(sundayDate)}</div>
                </div>

                <div className="card-body">
                  <div className="subject-title">{card.subject || '—'}</div>
                  <div className="reason-text">{card.reason || '—'}</div>
                  {card.applicationDate && (
                    <div className="sunday-applied-on">Applied: {card.applicationDate}</div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    type="button"
                    className={`reject-button ${status === 'rejected' ? 'btn-active-reject' : ''}`}
                    onClick={() => setStatus(card.id, 'rejected')}
                    disabled={isSaving || status === 'rejected'}
                  >
                    <span className="x-icon">✕</span>
                    Reject
                  </button>
                  <button
                    type="button"
                    className={`approve-button ${status === 'approved' ? 'btn-active-approve' : ''}`}
                    onClick={() => setStatus(card.id, 'approved')}
                    disabled={isSaving || status === 'approved'}
                  >
                    <span className="check-icon">✓</span>
                    Approve
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ApprovalsTable
