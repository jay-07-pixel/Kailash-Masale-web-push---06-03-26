import React, { useState, useCallback } from 'react'
import UniversalHeader from '../components/UniversalHeader'
import DisbursementSummaryCards from '../components/DisbursementSummaryCards'
import DisbursementFilters from '../components/DisbursementFilters'
import './DisbursementPage.css'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function DisbursementPage() {
  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(MONTH_LABELS[now.getMonth()])
  const [summary, setSummary] = useState({ salary: 0, da: 0, ta: 0, nh: 0, incentives: 0 })

  const handleSummaryChange = useCallback((totals) => {
    setSummary(totals)
  }, [])

  return (
    <div className="main-content">
      <UniversalHeader title="Expenditure" />
      <div className="content-wrapper">
        <DisbursementSummaryCards summary={summary} year={year} month={month} />
        <DisbursementFilters
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onSummaryChange={handleSummaryChange}
        />
      </div>
    </div>
  )
}

export default DisbursementPage
