import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const [approvalsExpanded, setApprovalsExpanded] = useState(true)
  const [monthlyExpanded, setMonthlyExpanded] = useState(true)
  const [myTeamExpanded, setMyTeamExpanded] = useState(true)

  const navItems = [
    { icon: '📊', label: 'DASHBOARD', path: '/' },
    {
      icon: '👥',
      label: 'MY TEAM',
      path: '/my-team',
      hasSubmenu: true,
      submenu: [
        { label: 'Team Members', path: '/my-team' },
        { label: 'Create Location', path: '/my-team/create-location' },
      ]
    },
    { icon: '⏰', label: 'CHECKIN/OUT', path: '/check-in-out' },
    { icon: '📦', label: 'ORDERS', path: '/orders' },
    { icon: '📋', label: 'PENDING TASK', path: '/pending-task' },
    { 
      icon: '📅', 
      label: 'Monthly', 
      path: '/monthly',
      hasSubmenu: true,
      submenu: [
        { label: 'Employee Record', path: '/monthly' },
        { label: 'Stock Sheets', path: '/monthly/stock-sheets' },
      ]
    },
    { icon: '✅', label: 'WEEKLY APPROVAL', path: '/weekly-approvals' },
    { icon: '🏢', label: 'DISTRIBUTOR', path: '/distributor' },
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
    { icon: '💰', label: 'Disburment', path: '/disbursement' },
    { icon: '📈', label: 'report', path: '/reports' },
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
            if (item.path === '/') return '/dashboard-icon.png'
            if (item.path === '/check-in-out') return '/check-in-out-icon.png'
            if (item.path === '/orders') return '/orders-icon.png'
            if (item.path === '/pending-task') return '/pending-task-icon.png'
            if (item.path === '/weekly-approvals') return '/weekly-approvals-icon.png'
            if (item.path === '/monthly') return '/monthly-icon.png'
            if (item.path === '/distributor') return '/distributor-icon.png'
            if (item.path === '/approvals') return '/approvals-icon.png'
            if (item.path === '/reports') return '/reports-icon.png'
            if (item.path === '/disbursement') return '/dollar-icon.png'
            if (item.path === '/my-team') return null
            return null
          }
          const iconSrc = getIconSrc()
          
          if (item.hasSubmenu) {
            const isSubmenuActive = item.submenu.some(subItem => location.pathname === subItem.path)
            const isParentActive = isActive || isSubmenuActive
            const isExpanded = item.path === '/monthly' ? monthlyExpanded : item.path === '/my-team' ? myTeamExpanded : approvalsExpanded
            const toggleExpanded = item.path === '/monthly'
              ? () => setMonthlyExpanded(!monthlyExpanded)
              : item.path === '/my-team'
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
            <img src="https://ui-avatars.com/api/?name=Shlok+Thakral&background=4a90e2&color=fff" alt="Shlok Thakral" />
          </div>
          <div className="user-details">
            <div className="user-name">Shlok Thakral</div>
            <div className="user-role">Kailash Masale</div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Sidebar
