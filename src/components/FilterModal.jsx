import React, { useState } from 'react'
import './FilterModal.css'

const FilterModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('Distributor')

  if (!isOpen) return null

  const filterCategories = ['Distributor', 'Area', 'Year', 'Month']
  
  const distributorOptions = [
    'Alex Supplies Ltd.',
    'Alex Supplies',
    'Alen Supplies Ltd.',
    'Apex Supplies Ltd.',
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'Distributor':
        return distributorOptions.map((distributor, index) => (
          <div key={index} className="filter-option">
            <input type="checkbox" id={`dist-${index}`} />
            <label htmlFor={`dist-${index}`}>{distributor}</label>
          </div>
        ))
      case 'Area':
        return <div className="filter-option">Area options...</div>
      case 'Year':
        return <div className="filter-option">Year options...</div>
      case 'Month':
        return <div className="filter-option">Month options...</div>
      default:
        return null
    }
  }

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="filter-sidebar">
          {filterCategories.map((category) => (
            <div
              key={category}
              className={`filter-category ${activeTab === category ? 'active' : ''}`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </div>
          ))}
        </div>
        <div className="filter-content">
          {renderContent()}
        </div>
        <button className="apply-filters-button" onClick={onClose}>
          Apply Filters
        </button>
      </div>
    </div>
  )
}

export default FilterModal
