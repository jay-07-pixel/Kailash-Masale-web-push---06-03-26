import React from 'react'
import './LeavesCards.css'

const LeavesCards = () => {
  const leavesData = [
    {
      id: 1,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 2,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 3,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
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
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 5,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 6,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 7,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 8,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 9,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 10,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 11,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
    {
      id: 12,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      dateRange: "12ᵗʰ TO 16ᵗʰ Mar'26",
      subject: 'Subject Regarding',
      reason: 'reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason reason',
    },
  ]

  return (
    <div className="leaves-cards-container">
      {leavesData.map((leave) => (
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
          </div>
          
          <div className="card-actions">
            <button className="reject-button">
              <span className="x-icon">✕</span>
              Reject
            </button>
            <button className="approve-button">
              <span className="check-icon">✓</span>
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeavesCards
