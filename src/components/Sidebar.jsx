import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const [approvalsExpanded, setApprovalsExpanded] = useState(true)
  const [monthlyExpanded, setMonthlyExpanded] = useState(true)
  const [myTeamExpanded, setMyTeamExpanded] = useState(true)

  const navItems = [
    { icon: '📊', label: 'Dashboard', path: '/' },
    { icon: '⏰', label: 'Check In / Out', path: '/check-in-out' },
    { icon: '📦', label: 'Orders', path: '/orders' },
    { icon: '📋', label: 'Pending Task', path: '/pending-task' },
    { icon: '✅', label: 'Weekly Approvals', path: '/weekly-approvals' },
    {
      icon: '👥',
      label: 'My Team',
      path: '/my-team',
      hasSubmenu: true,
      submenu: [
        { label: 'Team Members', path: '/my-team' },
        { label: 'Master Sheet', path: '/my-team/master-sheet' },
      ]
    },
    { icon: '🏢', label: 'Distributor', path: '/distributor' },
    { icon: '📈', label: 'Reports', path: '/reports' },
    { icon: '💰', label: 'Disbursement', path: '/disbursement' },
    { 
      icon: '📅', 
      label: 'Monthly', 
      path: '/monthly',
      hasSubmenu: true,
      submenu: [
        { label: 'Employee Record', path: '/monthly' },
        { label: 'Distributor Appointment', path: '/monthly/distributor-appointment' },
        { label: 'Stock Sheets', path: '/monthly/stock-sheets' },
      ]
    },
    { 
      icon: '✓', 
      label: 'Approvals', 
      path: '/approvals',
      hasSubmenu: true,
      submenu: [
        { label: 'leaves', path: '/approvals/leaves' },
        { label: 'Sunday approval', path: '/approvals' },
      ]
    },
  ]

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname)
    if (currentItem) return currentItem.label.toLowerCase()
    const parentWithSub = navItems.find(item => item.submenu?.some(s => s.path === location.pathname))
    if (parentWithSub) {
      const sub = parentWithSub.submenu.find(s => s.path === location.pathname)
      return sub ? sub.label.toLowerCase() : parentWithSub.label.toLowerCase()
    }
    return 'dashboard'
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} aria-hidden="true" />
      )}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
          <div className="logo">
          <div className="logo-circle">KM</div>
          <div className="logo-text">Kailash Masale</div>
        </div>
        <div className="sidebar-title">{getPageTitle()}</div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const getIconSrc = () => {
            if (item.label === 'Dashboard') return '/dashboard-icon.png'
            if (item.label === 'Check In / Out') return '/check-in-out-icon.png'
            if (item.label === 'Orders') return '/orders-icon.png'
            if (item.label === 'Pending Task') return '/pending-task-icon.png'
            if (item.label === 'Weekly Approvals') return '/weekly-approvals-icon.png'
            if (item.label === 'Monthly') return '/monthly-icon.png'
            if (item.label === 'Distributor') return '/distributor-icon.png'
            if (item.label === 'Approvals') return '/approvals-icon.png'
            if (item.label === 'Reports') return '/reports-icon.png'
            if (item.label === 'Disbursement') return '/dollar-icon.png'
            return null
          }
          const iconSrc = getIconSrc()
          
          if (item.hasSubmenu) {
            const isSubmenuActive = item.submenu.some(subItem => location.pathname === subItem.path)
            const isParentActive = isActive || isSubmenuActive
            const isExpanded = item.label === 'Monthly' ? monthlyExpanded : item.label === 'My Team' ? myTeamExpanded : approvalsExpanded
            const toggleExpanded = item.label === 'Monthly'
              ? () => setMonthlyExpanded(!monthlyExpanded)
              : item.label === 'My Team'
              ? () => setMyTeamExpanded(!myTeamExpanded)
              : () => setApprovalsExpanded(!approvalsExpanded)
            
            return (
              <div key={index} className="nav-item-group">
                <div
                  className={`nav-item ${isParentActive ? 'active' : ''}`}
                  onClick={toggleExpanded}
                >
                  {iconSrc ? (
                    <img 
                      src={iconSrc} 
                      alt={item.label} 
                      className="nav-icon-image"
                    />
                  ) : (
                    <span className="nav-icon">{item.icon}</span>
                  )}
                  <span className="nav-label">{item.label}</span>
                </div>
                {isExpanded && (
                  <div className="submenu">
                    {item.submenu.map((subItem, subIndex) => {
                      const isSubActive = location.pathname === subItem.path
                      return (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`submenu-item ${isSubActive ? 'active' : ''}`}
                          onClick={onClose}
                        >
                          <span className="submenu-label">{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              {iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt={item.label} 
                  className="nav-icon-image"
                />
              ) : (
                <span className="nav-icon">{item.icon}</span>
              )}
              <span className="nav-label">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <img src="https://ui-avatars.com/api/?name=Alex+Morgan&background=4a90e2&color=fff" alt="Alex Morgan" />
          </div>
          <div className="user-details">
            <div className="user-name">Alex Morgan</div>
            <div className="user-role">Regional Manager</div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Sidebar
