import React, { useState } from 'react'
import NewOrderModal from './NewOrderModal'
import './OrdersFilters.css'

const OrdersFilters = () => {
  const [year, setYear] = useState('2026')
  const [month, setMonth] = useState('Jan')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const tabs = ['All', 'Pending', 'Placed', 'Declined']

  return (
    <div className="orders-filters">
      <div className="filters-row">
        <div className="filters-left">
          <div className="filter-inline">
            <span className="filter-inline-label">Year:-</span>
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
          <div className="filter-inline">
            <span className="filter-inline-label">Month:-</span>
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
        </div>

        <div className="filters-center">
          <div className="search-input-wrapper">
            <img src="/search-icon.png" alt="Search" className="search-icon" />
            <input
              type="text"
              placeholder="Search Employee or Distributor"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input search-input"
            />
          </div>
        </div>

        <div className="filters-right">
          <div className="order-status-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`status-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            className="new-order-button"
            onClick={() => setIsModalOpen(true)}
          >
            + New Order
          </button>
        </div>
      </div>
      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default OrdersFilters
