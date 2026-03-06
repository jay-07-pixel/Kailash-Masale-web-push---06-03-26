import React, { useMemo } from 'react'
import './LeavesCards.css'

const LeavesCards = ({ leaveApplications = [], employees = [], onApprove, onReject, savingId = null }) => {
  const leavesData = useMemo(() => {
    return leaveApplications.map((doc) => {
      const emp = employees.find((e) => e.id === doc.employeeId)
      const name = doc.name || emp?.salesPersonName || doc.employeeEmail || '—'
      const role = emp?.designation || '—'
      const from = doc.leaveFromDate || '—'
      const to = doc.leaveToDate || '—'
      const dateRange = from !== '—' && to !== '—' ? `${from} TO ${to}` : from
      const status = doc.status || 'pending'
      return {
        id: doc.id,
        status,
        employee: {
          name,
          role,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(String(name).replace(/\s+/g, '+'))}&background=6b7280&color=fff`,
        },
        dateRange,
        subject: doc.subject || '—',
        reason: doc.reason || '—',
      }
    })
  }, [leaveApplications, employees])

  return (
    <div className="leaves-cards-container">
      {leavesData.length === 0 ? (
        <div className="leaves-empty">
          <p className="leaves-empty-text">No leave applications yet. Data will appear here from Firebase.</p>
        </div>
      ) : (
        leavesData.map((leave) => (
          <div key={leave.id} className="leave-card">
            <div className="card-header">
              <img
                src={leave.employee.avatar}
                alt={leave.employee.name}
                className="employee-avatar"
              />
              <div className="employee-info">
                <div className="employee-name">{leave.employee.name}</div>
                <div className="employee-role">{leave.employee.role}</div>
              </div>
              <div className="date-range">{leave.dateRange}</div>
            </div>
            <div className="card-body">
              <div className="subject-title">{leave.subject}</div>
              <div className="reason-text">{leave.reason}</div>
              {leave.status !== 'pending' && (
                <div className={`leave-status-badge leave-status-${leave.status}`}>
                  {leave.status === 'approved' ? '✓ Approved' : '✕ Rejected'}
                </div>
              )}
            </div>
            <div className="card-actions">
              <button
                type="button"
                className="reject-button"
                onClick={() => onReject?.(leave.id)}
                disabled={leave.status !== 'pending' || savingId === leave.id}
              >
                <span className="x-icon">✕</span>
                {savingId === leave.id ? '…' : 'Reject'}
              </button>
              <button
                type="button"
                className="approve-button"
                onClick={() => onApprove?.(leave.id)}
                disabled={leave.status !== 'pending' || savingId === leave.id}
              >
                <span className="check-icon">✓</span>
                {savingId === leave.id ? '…' : 'Approve'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default LeavesCards
