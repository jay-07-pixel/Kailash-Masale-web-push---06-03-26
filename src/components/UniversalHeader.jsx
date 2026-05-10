import React, { useState, useRef, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase'
import './UniversalHeader.css'

const UniversalHeader = ({ title }) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const settingsRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationOpen(false)
      }
    }
    if (settingsOpen || notificationOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [settingsOpen, notificationOpen])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const email = String(auth?.currentUser?.email || '').trim().toLowerCase()
    if (!email) {
      setNotifications([])
      return
    }
    const q = query(collection(db, 'notifications'), where('userEmail', '==', email))
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = typeof a?.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : 0
          const tb = typeof b?.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : 0
          return tb - ta
        })
      setNotifications(list.slice(0, 10))
    })
    return () => unsub()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

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

  const toggleNotifications = async () => {
    const nextOpen = !notificationOpen
    setNotificationOpen(nextOpen)
    if (!nextOpen || !db) return
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return
    unread.forEach((n) => {
      updateDoc(doc(db, 'notifications', n.id), { read: true }).catch(() => {})
    })
  }

  const formatNotificationTime = (ts) => {
    const d = typeof ts?.toDate === 'function' ? ts.toDate() : null
    if (!d) return ''
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    })
  }

  return (
    <div className="universal-header">
      <div className="header-left">
        {title && <h1 className="header-title">{title}</h1>}
      </div>
      <div className="header-right">
        <div className="notification-wrap" ref={notificationRef}>
          <button
            type="button"
            className="notification-trigger"
            onClick={toggleNotifications}
            aria-expanded={notificationOpen}
            aria-haspopup="true"
            aria-label="Notifications"
          >
            <img
              src="/bell-icon.png"
              alt="Notifications"
              className="header-icon notification-icon"
            />
            {unreadCount > 0 ? <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
          </button>
          {notificationOpen && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                    <div className="notification-title">{n.title || 'Notification'}</div>
                    <div className="notification-body">{n.body || ''}</div>
                    <div className="notification-time">{formatNotificationTime(n.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
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
