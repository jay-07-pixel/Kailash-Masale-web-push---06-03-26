import React from 'react'
import './DistributorHeader.css'

const DistributorHeader = () => {
  return (
    <div className="distributor-header">
      <h2 className="header-title">Distributor Management</h2>
      <div className="header-actions">
        <div className="header-search-bar">
          <img 
            src="/search-icon.png" 
            alt="Search" 
            className="search-icon"
          />
          <input
            type="text"
            placeholder="Search Distributor"
            className="search-input"
          />
        </div>
        <img 
          src="/bell-icon.png" 
          alt="Notifications" 
          className="notification-icon header-icon"
        />
        <img 
          src="/settings-icon.png" 
          alt="Settings" 
          className="settings-icon header-icon"
        />
        <div className="user-profile">
          <div className="profile-avatar">
            <img
              src="https://ui-avatars.com/api/?name=Alex+Morgan&background=4a90e2&color=fff"
              alt="Alex Morgan"
            />
          </div>
          <div className="profile-info">
            <div className="profile-name">Alex Morgan</div>
            <div className="profile-role">Regional Manager</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributorHeader
