import React, { useState } from 'react'
import NewOrderModal from './NewOrderModal'
import ManageSKUsModal from './ManageSKUsModal'
import './OrdersFilters.css'

const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const getDefaultYear = () => new Date().getFullYear()
const getDefaultMonth = () => MONTH_OPTIONS[new Date().getMonth()]

const YEAR_OPTIONS = (() => {
  const current = new Date().getFullYear()
  return [current, current - 1, current - 2]
})()

const OrdersFilters = ({ searchQuery = '', setSearchQuery, year: yearProp, setYear: setYearProp, month: monthProp, setMonth: setMonthProp }) => {
  const [internalYear, setInternalYear] = useState(() => getDefaultYear())
  const [internalMonth, setInternalMonth] = useState(() => getDefaultMonth())
  const year = yearProp !== undefined ? yearProp : internalYear
  const setYear = setYearProp || setInternalYear
  const month = monthProp !== undefined ? monthProp : internalMonth
  const setMonth = setMonthProp || setInternalMonth
  const [internalSearch, setInternalSearch] = useState('')
  const q = setSearchQuery != null ? searchQuery : internalSearch
  const setQ = setSearchQuery != null ? setSearchQuery : setInternalSearch
  const [activeTab, setActiveTab] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isManageSKUsOpen, setIsManageSKUsOpen] = useState(false)

  const tabs = ['All', 'Pending', 'Placed', 'Declined']

  return (
    <div className="orders-filters">
      <div className="filters-row">
        <div className="filters-left">
          <div className="filter-inline">
            <span className="filter-inline-label">Year:-</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="filter-select"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
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
              value={q}
              onChange={(e) => setQ(e.target.value)}
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
            type="button"
            className="manage-skus-button"
            onClick={() => setIsManageSKUsOpen(true)}
          >
            Manage SKUs
          </button>
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
      <ManageSKUsModal
        isOpen={isManageSKUsOpen}
        onClose={() => setIsManageSKUsOpen(false)}
      />
    </div>
  )
}

export default OrdersFilters
