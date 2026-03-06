import React, { useState } from 'react'
import MonthlyTable from './MonthlyTable'
import './MonthlyFilters.css'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const now = new Date()

const MonthlyFilters = ({
  year: controlledYear,
  month: controlledMonth,
  onYearChange,
  onMonthChange,
}) => {
  const isControlled = controlledYear != null && controlledMonth != null && onYearChange && onMonthChange
  const [internalYear, setInternalYear] = useState(String(now.getFullYear()))
  const [internalMonth, setInternalMonth] = useState(MONTH_LABELS[now.getMonth()])
  const [searchQuery, setSearchQuery] = useState('')

  const year = isControlled ? controlledYear : internalYear
  const month = isControlled ? controlledMonth : internalMonth
  const setYear = isControlled ? onYearChange : setInternalYear
  const setMonth = isControlled ? onMonthChange : setInternalMonth

  return (
    <div className="monthly-filters-container">
      <div className="monthly-filters-row">
        <div className="monthly-filters-left">
          <div className="monthly-filter-inline">
            <span className="monthly-filter-label">Year:</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="monthly-filter-select"
            >
              {[0, 1, 2].map(i => {
                const y = String(now.getFullYear() - i)
                return <option key={y} value={y}>{y}</option>
              })}
            </select>
          </div>
          <div className="monthly-filter-inline">
            <span className="monthly-filter-label">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="monthly-filter-select"
            >
              {MONTH_LABELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="monthly-filters-center">
          <div className="monthly-search-wrapper">
            <img src="/search-icon.png" alt="Search" className="monthly-search-icon" />
            <input
              type="text"
              placeholder="Search Employee"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="monthly-search-input"
            />
          </div>
        </div>
      </div>

      <MonthlyTable year={year} month={month} searchQuery={searchQuery} />
    </div>
  )
}

export default MonthlyFilters
