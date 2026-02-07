import React from 'react'
import './UniversalHeader.css'

const UniversalHeader = ({ title }) => {
  return (
    <div className="universal-header">
      <div className="header-left">
        {title && <h1 className="header-title">{title}</h1>}
      </div>
      <div className="header-right">
        <img
          src="/bell-icon.png"
          alt="Notifications"
          className="header-icon notification-icon"
        />
        <img
          src="/settings-icon.png"
          alt="Settings"
          className="header-icon settings-icon"
        />
        <div className="user-info-header">
          <img
            src="https://ui-avatars.com/api/?name=Alex+Morgan&background=4a90e2&color=fff"
            alt="User"
            className="user-avatar-header"
          />
          <div className="user-details-header">
            <div className="user-name-header">Alex Morgan</div>
            <div className="user-role-header">Regional Manager</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UniversalHeader
