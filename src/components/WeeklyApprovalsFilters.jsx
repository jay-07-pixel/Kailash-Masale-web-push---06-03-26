import React, { useState } from 'react'
import WeeklyApprovalsTable from './WeeklyApprovalsTable'
import './WeeklyApprovalsFilters.css'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const getCurrentYear = () => String(new Date().getFullYear())
const getCurrentMonth = () => MONTH_NAMES[new Date().getMonth()]

const WeeklyApprovalsFilters = () => {
  const [year, setYear] = useState(getCurrentYear)
  const [month, setMonth] = useState(getCurrentMonth)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="weekly-approvals-filters-container">
      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            {[0, 1, 2, 3].map((i) => {
              const y = new Date().getFullYear() - i
              return <option key={y} value={String(y)}>{y}</option>
            })}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">Month:</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="filter-select"
          >
            <option value="Jan">Jan</option>
            <option value="Feb">Feb</option>
            <option value="Mar">Mar</option>
            <option value="Apr">Apr</option>
            <option value="May">May</option>
            <option value="Jun">Jun</option>
            <option value="Jul">Jul</option>
            <option value="Aug">Aug</option>
            <option value="Sep">Sep</option>
            <option value="Oct">Oct</option>
            <option value="Nov">Nov</option>
            <option value="Dec">Dec</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <div className="search-input-wrapper">
            <img
              src="/search-icon.png"
              alt="Search"
              className="search-icon"
            />
            <input
              type="text"
              placeholder="Search Employee/Distributor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input search-input"
            />
          </div>
        </div>
      </div>
      
      <WeeklyApprovalsTable year={year} month={month} searchQuery={searchQuery} />
    </div>
  )
}

export default WeeklyApprovalsFilters
