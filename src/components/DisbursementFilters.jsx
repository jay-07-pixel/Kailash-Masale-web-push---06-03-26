import React, { useState } from 'react'
import DisbursementTable from './DisbursementTable'
import './DisbursementFilters.css'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const DisbursementFilters = () => {
  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(MONTH_LABELS[now.getMonth()])
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
              {[0,1,2].map(i => { const y = String(now.getFullYear()-i); return <option key={y} value={y}>{y}</option> })}
            </select>
          </div>
          <div className="disb-filter-inline">
            <span className="disb-filter-label">Month:-</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="disb-filter-select"
            >
              {MONTH_LABELS.map(m => <option key={m} value={m}>{m}</option>)}
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
      
      <DisbursementTable year={year} month={month} searchQuery={searchQuery} />
    </div>
  )
}

export default DisbursementFilters
