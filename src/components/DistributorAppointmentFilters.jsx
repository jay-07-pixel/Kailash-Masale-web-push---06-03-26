import React, { useState } from 'react'
import DistributorAppointmentTable from './DistributorAppointmentTable'
import DistributorAppointmentModal from './DistributorAppointmentModal'
import './DistributorAppointmentFilters.css'

const DistributorAppointmentFilters = () => {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('Jan')
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="distributor-appointment-filters-container">
      <div className="da-filters-row">
        <div className="da-filters-left">
          <div className="da-filter-inline">
            <span className="da-filter-label">Year:-</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="da-filter-select"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="da-filter-inline">
            <span className="da-filter-label">Month:-</span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="da-filter-select"
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

        <div className="da-filters-center">
          <div className="da-search-wrapper">
            <img src="/search-icon.png" alt="Search" className="da-search-icon" />
            <input
              type="text"
              placeholder="Search Employee"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="da-search-input"
            />
          </div>
        </div>

        <div className="da-filters-right">
          <button
            type="button"
            className="da-add-button"
            onClick={() => setIsModalOpen(true)}
          >
            <span className="da-add-icon">+</span>
            Distributor Appointment
          </button>
        </div>
      </div>

      <div className="da-target-row">
        <div className="da-target-badge">TARGET:- 15</div>
      </div>

      <DistributorAppointmentTable />

      <DistributorAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default DistributorAppointmentFilters
