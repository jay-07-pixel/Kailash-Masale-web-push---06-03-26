import React, { useState } from 'react'
import StockSheetsTable from './StockSheetsTable'
import './StockSheetsFilters.css'

const StockSheetsFilters = () => {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('Jan')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="stock-sheets-filters-container">
      <div className="filters-row">
        <div className="filter-group">
          <label className="filter-label">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
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
              placeholder="Search Employee"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input search-input"
            />
          </div>
        </div>
      </div>
      
      <StockSheetsTable />
    </div>
  )
}

export default StockSheetsFilters
