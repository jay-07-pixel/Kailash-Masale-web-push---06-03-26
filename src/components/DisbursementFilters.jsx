import React, { useState } from 'react'
import DisbursementTable from './DisbursementTable'
import './DisbursementFilters.css'

const DisbursementFilters = () => {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('Jan')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="disbursement-filters-container">
      <div className="disb-filters-row">
        <div className="disb-filters-left">
          <div className="disb-filter-inline">
            <span className="disb-filter-label">Year:-</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="disb-filter-select"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="disb-filter-inline">
            <span className="disb-filter-label">Month:-</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="disb-filter-select"
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
        </div>

        <div className="disb-filters-center">
          <div className="disb-search-wrapper">
            <img src="/search-icon.png" alt="Search" className="disb-search-icon" />
            <input
              type="text"
              placeholder="Search Employee or Distributor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="disb-search-input"
            />
          </div>
        </div>

        <div className="disb-filters-right">
          <button type="button" className="disb-edit-button" aria-label="Edit">
            <img src="/pen-icon.png" alt="Edit" className="disb-edit-icon" />
          </button>
        </div>
      </div>
      
      <DisbursementTable />
    </div>
  )
}

export default DisbursementFilters
