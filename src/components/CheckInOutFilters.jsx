import React from 'react'
import './CheckInOutFilters.css'

const CheckInOutFilters = ({
  selectedDate = '',
  setSelectedDate,
  searchQuery = '',
  setSearchQuery,
}) => {
  return (
    <div className="checkinout-filters">
      <div className="filter-row">
        <div className="filter-group filter-group-date">
          <label className="filter-label">DATE</label>
          <div className="date-picker-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="filter-input date-picker-input"
              aria-label="Select date"
            />
          </div>
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
