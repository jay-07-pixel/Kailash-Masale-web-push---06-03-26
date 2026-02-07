import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import CheckInOutSummaryCards from '../components/CheckInOutSummaryCards'
import CheckInOutFilters from '../components/CheckInOutFilters'
import CheckInOutTable from '../components/CheckInOutTable'
import './CheckInOutPage.css'

function CheckInOutPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Attendance & Daily Sales Reports" />
      <div className="content-wrapper">
        <CheckInOutSummaryCards />
        <CheckInOutFilters />
        <CheckInOutTable />
      </div>
    </div>
  )
}

export default CheckInOutPage
