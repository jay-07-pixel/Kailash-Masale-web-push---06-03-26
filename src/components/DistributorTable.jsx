import React, { useMemo, useState } from 'react'
import './DistributorTable.css'

const AVATAR_COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#6366f1', '#8b5cf6']

const zoneSortOrder = (z) => {
  const lower = (z || '').toLowerCase().trim()
  if (lower === 'akola') return 0
  if (lower === 'nagpur') return 1
  return 2
}

const staffSortOrder = (staffName) => {
  const n = (staffName || '').toLowerCase().trim()
  if (!n) return 0
  if (n.includes('agrawal')) return 1
  if (n.includes('gajanan')) return 2
  if (n.includes('sagar')) return 3
  if (n.includes('taufiq')) return 4
  if (n.includes('yogesh')) return 5
  return 6
}

const DistributorTable = ({ distributors: firestoreDistributors = [], employees = [], onAssignStaff, onEdit, onDelete, onSaveNote }) => {
  const [expandedNotesId, setExpandedNotesId] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')

  const distributors = useMemo(() => {
    const withNames = (firestoreDistributors || []).filter(
      (doc) => (doc.distributorName || '').trim() !== ''
    )
    const list = withNames.map((doc, index) => {
      const name = doc.distributorName || 'Distributor'
      const initial = name.trim().charAt(0).toUpperCase() || 'D'
      const assignedIds = Array.isArray(doc.assignedEmployeeIds)
        ? doc.assignedEmployeeIds
        : doc.assignedEmployeeId
          ? [doc.assignedEmployeeId]
          : []
      const staff = assignedIds
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean)
        .map((emp) => ({
          name: emp.salesPersonName || emp.email || 'Staff',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent((emp.salesPersonName || emp.email || 'S').replace(/\s+/g, '+'))}&background=4a90e2&color=fff`,
        }))
      return {
        docId: doc.id,
        name,
        assignedEmployeeIds: assignedIds,
        avatar: initial,
        avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
        bits: Array.isArray(doc.bits) && doc.bits.length
          ? doc.bits.filter(Boolean)
          : doc.bitName || doc.area
            ? [doc.bitName || doc.area]
            : [],
        bitName: doc.bitName || doc.area || (Array.isArray(doc.bits) && doc.bits[0]) || '—',
        zone: doc.zone || doc.area || '—',
        target: doc.target != null ? doc.target : 0,
        achieved: doc.achieved != null ? doc.achieved : 0,
        staff,
        note: doc.note || doc.notes || '',
      }
    })
    return list.sort((a, b) => {
      const zoneDiff = zoneSortOrder(a.zone) - zoneSortOrder(b.zone)
      if (zoneDiff !== 0) return zoneDiff
      const staffA = (a.staff && a.staff[0]?.name) || ''
      const staffB = (b.staff && b.staff[0]?.name) || ''
      const orderA = staffSortOrder(staffA)
      const orderB = staffSortOrder(staffB)
      if (orderA !== orderB) return orderA - orderB
      return String(staffA).localeCompare(String(staffB), undefined, { sensitivity: 'base' })
    })
  }, [firestoreDistributors, employees])

  const getProgressPercentage = (achieved, target) => {
    if (target === 0) return 0
    return (achieved / target) * 100
  }

  const getAchievementColor = (progress) => {
    if (progress < 75) return { fill: '#ef4444', text: '#dc2626' }
    if (progress <= 100) return { fill: '#10b981', text: '#059669' }
    return { fill: '#2563eb', text: '#1d4ed8' }
  }

  return (
    <div className="distributor-table-container">
      <div className="table-header-section">
        <h3 className="table-title">Distributors</h3>
        <button type="button" className="download-button" aria-label="Download">
          <img src="/download-icon.png" alt="Download" className="download-icon-img" />
        </button>
      </div>
      <div className="table-wrapper">
        {distributors.length === 0 ? (
          <div className="distributor-table-empty">
            <p className="distributor-table-empty-text">No distributors yet. Create one using the button above.</p>
          </div>
        ) : (
        <table className="distributor-table">
          <thead>
            <tr>
              <th>DISTRIBUTOR NAME</th>
              <th>BIT NAME</th>
              <th>ZONE</th>
              <th>TARGET</th>
              <th>ASSIGN STAFF</th>
              <th>ACTIONS</th>
              <th>NOTES</th>
            </tr>
          </thead>
          <tbody>
            {distributors.map((distributor, index) => {
              const progress = getProgressPercentage(distributor.achieved, distributor.target)
              return (
                <React.Fragment key={distributor.docId || index}>
                <tr>
                  <td>
                    <div className="distributor-name-cell">
                      <div
                        className="distributor-avatar"
                        style={{ backgroundColor: distributor.avatarColor }}
                      >
                        {distributor.avatar}
                      </div>
                      <div className="distributor-info">
                        <div className="distributor-name">{distributor.name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {(() => {
                      const bitList = distributor.bits && distributor.bits.length > 0
                        ? distributor.bits
                        : (distributor.bitName && distributor.bitName !== '—' ? [distributor.bitName] : [])
                      return bitList.length > 0 ? (
                        <div className="bit-chips-wrap">
                          {bitList.map((bit, i) => (
                            <div key={i} className="bit-name-chip">
                              <span className="location-icon">📍</span>
                              <span>{bit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="empty-cell">—</span>
                      )
                    })()}
                  </td>
                  <td>
                    <span className="zone-text">{distributor.zone || ''}</span>
                  </td>
                  <td>
                    <div className="target-cell">
                      <div className="target-progress-bar">
                        <div
                          className="target-progress-fill"
                          style={{
                            width: `${distributor.target > 0 ? Math.min(progress, 100) : 0}%`,
                            backgroundColor: getAchievementColor(progress).fill,
                          }}
                        ></div>
                      </div>
                      <div className="target-values">
                        <span className="target-total">{String(distributor.target).padStart(2, '0')}kg</span>
                        <span
                          className="target-achieved"
                          style={{
                            color: getAchievementColor(progress).text,
                          }}
                        >
                          {String(distributor.achieved).padStart(2, '0')}kg
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="assign-staff-cell">
                      {distributor.staff.map((member, idx) => (
                        <div key={idx} className="staff-avatar" title={member.name}>
                          <img src={member.avatar} alt={member.name} />
                        </div>
                      ))}
                      <button
                        type="button"
                        className="add-staff-button"
                        aria-label="Add staff"
                        onClick={(e) => { e.stopPropagation(); onAssignStaff?.(distributor) }}
                      >
                        <span className="plus-icon">+</span>
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="distributor-action-icons">
                      <button
                        type="button"
                        className="distributor-action-btn distributor-action-btn-edit"
                        onClick={(e) => { e.stopPropagation(); onEdit?.(distributor) }}
                        title="Edit"
                        aria-label="Edit distributor"
                      >
                        <img src="/pencil-icon.png" alt="Edit" className="distributor-action-icon" />
                      </button>
                      <button
                        type="button"
                        className="distributor-action-btn distributor-action-btn-delete"
                        onClick={(e) => { e.stopPropagation(); onDelete?.(distributor) }}
                        title="Delete"
                        aria-label="Delete distributor"
                      >
                        <img src="/delete-icon.png" alt="Delete" className="distributor-action-icon" />
                      </button>
                    </div>
                  </td>
                  <td className="distributor-notes-cell">
                    <button
                      type="button"
                      className="distributor-notes-preview-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedNotesId(distributor.docId)
                        setNoteDraft(distributor.note || '')
                      }}
                      title={distributor.note ? 'Click to view or edit note' : 'Add note'}
                      aria-label="Open notes"
                    >
                      <span className={`distributor-notes-preview-box ${distributor.note ? 'has-note' : ''}`}>
                        {distributor.note
                          ? (distributor.note.length > 40
                              ? distributor.note.trim().slice(0, 40) + '…'
                              : distributor.note.trim())
                          : '—'}
                      </span>
                    </button>
                  </td>
                </tr>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
        )}
      </div>

      {expandedNotesId && (() => {
        const distributorForNote = distributors.find((d) => d.docId === expandedNotesId)
        const name = distributorForNote?.name || 'Distributor'
        return (
          <div
            className="distributor-notes-overlay"
            onClick={() => { setExpandedNotesId(null); setNoteDraft('') }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-modal-title"
          >
            <div className="distributor-notes-modal" onClick={(e) => e.stopPropagation()}>
              <div className="distributor-notes-modal-header">
                <h2 id="notes-modal-title" className="distributor-notes-modal-title">Note for {name}</h2>
                <button
                  type="button"
                  className="distributor-notes-modal-close"
                  onClick={() => { setExpandedNotesId(null); setNoteDraft('') }}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="distributor-notes-modal-body">
                <textarea
                  className="distributor-notes-textarea"
                  placeholder="Write a note for this distributor..."
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="distributor-notes-modal-actions">
                <button
                  type="button"
                  className="distributor-notes-cancel-btn"
                  onClick={() => { setExpandedNotesId(null); setNoteDraft('') }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="distributor-notes-save-btn"
                  onClick={() => {
                    onSaveNote?.(expandedNotesId, noteDraft.trim())
                    setExpandedNotesId(null)
                    setNoteDraft('')
                  }}
                >
                  Save note
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default DistributorTable
