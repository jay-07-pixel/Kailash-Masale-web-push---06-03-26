import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from './firebase'
import Sidebar from './components/Sidebar'
import LoginModal from './components/LoginModal'
import Dashboard from './pages/Dashboard'
import PendingTaskPage from './pages/PendingTaskPage'
import DistributorPage from './pages/DistributorPage'
import CheckInOutPage from './pages/CheckInOutPage'
import OrdersPage from './pages/OrdersPage'
import DisbursementPage from './pages/DisbursementPage'
import ApprovalsPage from './pages/ApprovalsPage'
import LeavesPage from './pages/LeavesPage'
import MonthlyPage from './pages/MonthlyPage'
import StockSheetsPage from './pages/StockSheetsPage'
import WeeklyApprovalsPage from './pages/WeeklyApprovalsPage'
import MyTeamPage from './pages/MyTeamPage'
import MasterSheetPage from './pages/MasterSheetPage'
import CreateLocationPage from './pages/CreateLocationPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthenticated(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

  if (!isFirebaseConfigured) {
    return (
      <div className="app app-loading">
        <div className="app-config-error">
          <h2 className="app-config-error-title">Firebase not configured</h2>
          <p className="app-config-error-text">
            Add environment variables in Netlify: <strong>Site settings → Environment variables</strong>.
          </p>
          <p className="app-config-error-text">
            Required: <code>VITE_FIREBASE_API_KEY</code>, <code>VITE_FIREBASE_AUTH_DOMAIN</code>, <code>VITE_FIREBASE_PROJECT_ID</code>, <code>VITE_FIREBASE_STORAGE_BUCKET</code>, <code>VITE_FIREBASE_MESSAGING_SENDER_ID</code>, <code>VITE_FIREBASE_APP_ID</code>.
          </p>
          <p className="app-config-error-text">Copy from your local <code>.env</code> or <code>.env.example</code>, then trigger a new deploy.</p>
        </div>
      </div>
    )
  }

  if (authenticated === null) {
    return (
      <div className="app app-loading">
        <div className="app-loading-spinner" aria-hidden />
        <span className="app-loading-text">Loading…</span>
      </div>
    )
  }

  return (
    <Router>
      {!authenticated && (
        <LoginModal onSuccess={() => setAuthenticated(true)} />
      )}
      <div className={`app ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <button
          type="button"
          className="hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
          <span className="hamburger-icon" />
        </button>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/check-in-out" element={<CheckInOutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/pending-task" element={<PendingTaskPage />} />
          <Route path="/weekly-approvals" element={<WeeklyApprovalsPage />} />
          <Route path="/my-team" element={<MyTeamPage />} />
          <Route path="/my-team/master-sheet/:employeeId" element={<MasterSheetPage />} />
          <Route path="/my-team/create-location" element={<CreateLocationPage />} />
          <Route path="/distributor" element={<DistributorPage />} />
          <Route path="/disbursement" element={<DisbursementPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/leaves" element={<LeavesPage />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/monthly/stock-sheets" element={<StockSheetsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
