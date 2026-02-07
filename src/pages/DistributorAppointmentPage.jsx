import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import DistributorAppointmentSummaryCards from '../components/DistributorAppointmentSummaryCards'
import DistributorAppointmentFilters from '../components/DistributorAppointmentFilters'
import './DistributorAppointmentPage.css'

function DistributorAppointmentPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Monthly" />
      <div className="content-wrapper">
        <DistributorAppointmentSummaryCards />
        <DistributorAppointmentFilters />
      </div>
    </div>
  )
}

export default DistributorAppointmentPage
