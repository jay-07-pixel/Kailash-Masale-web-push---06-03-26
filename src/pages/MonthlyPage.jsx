import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import MonthlySummaryCards from '../components/MonthlySummaryCards'
import MonthlyFilters from '../components/MonthlyFilters'
import './MonthlyPage.css'

function MonthlyPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Monthly" />
      <div className="content-wrapper">
        <MonthlySummaryCards />
        <MonthlyFilters />
      </div>
    </div>
  )
}

export default MonthlyPage
