import React from 'react'
import './LeavesHeader.css'

const LeavesHeader = () => {
  return (
    <div className="leaves-header">
      <h1 className="page-title">Leaves</h1>
      <div className="header-actions">
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

export default LeavesHeader
