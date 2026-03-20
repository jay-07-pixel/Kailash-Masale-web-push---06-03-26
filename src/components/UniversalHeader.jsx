import React, { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase'
import './UniversalHeader.css'

const UniversalHeader = ({ title }) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
    }
    if (settingsOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [settingsOpen])

  const handleLogout = async () => {
    setSettingsOpen(false)
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth)
      } catch (err) {
        console.warn('Logout error:', err)
      }
    }
  }

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
        <div className="settings-dropdown-wrap" ref={settingsRef}>
          <button
            type="button"
            className="settings-trigger"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-expanded={settingsOpen}
            aria-haspopup="true"
          >
            <img
              src="/settings-icon.png"
              alt="Settings"
              className="header-icon settings-icon"
            />
          </button>
          {settingsOpen && (
            <div className="settings-dropdown">
              <button type="button" className="settings-dropdown-item settings-dropdown-item-logout" onClick={handleLogout}>
                <svg className="logout-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Log out
              </button>
            </div>
          )}
        </div>
        <div className="user-info-header">
          <img
            src="https://ui-avatars.com/api/?name=Shlok+Thakral&background=4a90e2&color=fff"
            alt="User"
            className="user-avatar-header"
          />
          <div className="user-details-header">
            <div className="user-name-header">Shlok Thakral</div>
            <div className="user-role-header">Kailash Masale</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UniversalHeader
