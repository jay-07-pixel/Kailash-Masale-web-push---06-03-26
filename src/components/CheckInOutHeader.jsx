import React from 'react'
import './CheckInOutHeader.css'

const CheckInOutHeader = () => {
  return (
    <div className="checkinout-header">
      <h1 className="page-title">Check In/Out</h1>
      <div className="header-actions">
        <button className="export-button">
          <span className="export-icon">↑</span>
          Export
        </button>
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

export default CheckInOutHeader
