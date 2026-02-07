import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import DisbursementSummaryCards from '../components/DisbursementSummaryCards'
import DisbursementFilters from '../components/DisbursementFilters'
import './DisbursementPage.css'

function DisbursementPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Expenditure" />
      <div className="content-wrapper">
        <DisbursementSummaryCards />
        <DisbursementFilters />
      </div>
    </div>
  )
}

export default DisbursementPage
