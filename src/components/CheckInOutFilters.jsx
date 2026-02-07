import React, { useState } from 'react'
import './CheckInOutFilters.css'

const CheckInOutFilters = () => {
  const [dateRange, setDateRange] = useState('Oct 01 - Oct 31')
  const [year, setYear] = useState('2025')
  const [distributor, setDistributor] = useState('All Distributors')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="checkinout-filters">
      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label">DATE RANGE</label>
          <div className="date-range-input">
            <span className="calendar-icon">📅</span>
            <input
              type="text"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">YEAR</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label">DISTRIBUTOR</label>
          <select
            value={distributor}
            onChange={(e) => setDistributor(e.target.value)}
            className="filter-select"
          >
            <option value="All Distributors">All Distributors</option>
            <option value="M Metro Trades">M Metro Trades</option>
            <option value="S Shakti Trades">S Shakti Trades</option>
            <option value="G Global Mart">G Global Mart</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label className="filter-label filter-label-spacer" aria-hidden="true"> </label>
          <div className="search-input-wrapper">
            <img
              src="/search-icon.png"
              alt="Search"
              className="search-icon"
            />
            <input
              type="text"
              placeholder="Search Employee Name Here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input search-input"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckInOutFilters
