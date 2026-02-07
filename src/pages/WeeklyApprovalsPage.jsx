import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import WeeklyApprovalsFilters from '../components/WeeklyApprovalsFilters'
import './WeeklyApprovalsPage.css'

function WeeklyApprovalsPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Weekly Approvals" />
      <div className="content-wrapper">
        <WeeklyApprovalsFilters />
      </div>
    </div>
  )
}

export default WeeklyApprovalsPage
