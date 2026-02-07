import React, { useState } from 'react'
import MonthlyTable from './MonthlyTable'
import DistributorAppointmentModal from './DistributorAppointmentModal'
import './MonthlyFilters.css'

const MonthlyFilters = () => {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('Jan')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDistributorModalOpen, setIsDistributorModalOpen] = useState(false)

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
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="monthly-filter-inline">
            <span className="monthly-filter-label">Month:</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="monthly-filter-select"
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

        <div className="monthly-filters-right">
          <button
            type="button"
            className="monthly-distributor-btn"
            onClick={() => setIsDistributorModalOpen(true)}
          >
            Distributor Appointment
          </button>
        </div>
      </div>

      <MonthlyTable />

      <DistributorAppointmentModal
        isOpen={isDistributorModalOpen}
        onClose={() => setIsDistributorModalOpen(false)}
      />
    </div>
  )
}

export default MonthlyFilters
