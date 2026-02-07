import React from 'react'
import './DisbursementHeader.css'

const DisbursementHeader = () => {
  return (
    <div className="disbursement-header">
      <h1 className="page-title">Expenditure</h1>
      <div className="header-actions">
        <div className="search-bar">
          <img
            src="/search-icon.png"
            alt="Search"
            className="search-icon"
          />
          <input
            type="text"
            placeholder="Search orders, tasks..."
            className="search-input"
          />
        </div>
        <img
          src="/bell-icon.png"
          alt="Notifications"
          className="notification-icon header-icon"
        />
        <div className="user-avatar-small">
          <img
            src="https://ui-avatars.com/api/?name=Alex+Morgan&background=4a90e2&color=fff"
            alt="User"
          />
        </div>
      </div>
    </div>
  )
}

export default DisbursementHeader
