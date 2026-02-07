import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import ApprovalsTable from '../components/ApprovalsTable'
import './ApprovalsPage.css'

function ApprovalsPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Sunday approval" />
      <div className="content-wrapper">
        <ApprovalsTable />
      </div>
    </div>
  )
}

export default ApprovalsPage
