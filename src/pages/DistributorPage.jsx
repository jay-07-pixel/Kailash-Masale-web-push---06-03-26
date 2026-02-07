import React, { useState } from 'react'
import UniversalHeader from '../components/UniversalHeader'
import DistributorSummaryCards from '../components/DistributorSummaryCards'
import DistributorTable from '../components/DistributorTable'
import FilterModal from '../components/FilterModal'
import './DistributorPage.css'

function DistributorPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="main-content">
      <UniversalHeader title="Distributor" />
      <div className="content-wrapper">
        <div className="distributor-page-header">
          <div className="page-header-left">
            <div className="header-controls">
              <button 
                className="filter-button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <img
                  src="/filter-icon.png"
                  alt="Filter"
                  className="filter-icon-image"
                />
                <span>Filter</span>
              </button>
              <div className="search-bar-container">
                <img 
                  src="/search-icon.png" 
                  alt="Search" 
                  className="search-icon"
                />
                <input
                  type="text"
                  placeholder="Search Employee or Distributor"
                  className="search-input"
                />
              </div>
            </div>
          </div>
        </div>

        <DistributorSummaryCards />
        <DistributorTable />
      </div>
      
      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
      />
    </div>
  )
}

export default DistributorPage
