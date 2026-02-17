import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
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
import DistributorAppointmentPage from './pages/DistributorAppointmentPage'
import StockSheetsPage from './pages/StockSheetsPage'
import WeeklyApprovalsPage from './pages/WeeklyApprovalsPage'
import MyTeamPage from './pages/MyTeamPage'
import MasterSheetPage from './pages/MasterSheetPage'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

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
          <Route path="/my-team/master-sheet" element={<MasterSheetPage />} />
          <Route path="/distributor" element={<DistributorPage />} />
          <Route path="/disbursement" element={<DisbursementPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/approvals/leaves" element={<LeavesPage />} />
          <Route path="/monthly" element={<MonthlyPage />} />
          <Route path="/monthly/distributor-appointment" element={<DistributorAppointmentPage />} />
          <Route path="/monthly/stock-sheets" element={<StockSheetsPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
