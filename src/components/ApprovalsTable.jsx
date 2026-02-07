import React from 'react'
import './LeavesCards.css'

const reasonPlaceholder =
  'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason'

const ApprovalsTable = () => {
  const approvalCards = [
    {
      id: 1,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
    {
      id: 2,
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
    {
      id: 3,
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
    {
      id: 4,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
    {
      id: 5,
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
    {
      id: 6,
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: reasonPlaceholder,
    },
  ]

  return (
    <div className="leaves-cards-container">
      {approvalCards.map((card) => (
        <div key={card.id} className="leave-card">
          <div className="card-header">
            <img
              src={card.employee.avatar}
              alt={card.employee.name}
              className="employee-avatar"
            />
            <div className="employee-info">
              <div className="employee-name">{card.employee.name}</div>
              <div className="employee-role">{card.employee.role}</div>
            </div>
            <div className="date-range">{card.dateRange}</div>
          </div>

          <div className="card-body">
            <div className="subject-title">{card.subject}</div>
            <div className="reason-text">{card.reason}</div>
          </div>

          <div className="card-actions">
            <button type="button" className="reject-button">
              <span className="x-icon">✕</span>
              Reject
            </button>
            <button type="button" className="approve-button">
              <span className="check-icon">✓</span>
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ApprovalsTable
