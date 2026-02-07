import React from 'react'
import './Header.css'

const Header = () => {
  return (
    <div className="header">
      <h1 className="header-title">Dashboard Overview</h1>
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
        <div className="header-icons">
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
        </div>
      </div>
    </div>
  )
}

export default Header
