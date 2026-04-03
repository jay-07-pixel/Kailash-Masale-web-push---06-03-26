import React, { useState } from 'react'
import DisbursementTable from './DisbursementTable'
import ExpenditureRulesIndex from './ExpenditureRulesIndex'
import { useExpenditureAdmin } from '../hooks/useExpenditureAdmin'
import './DisbursementFilters.css'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const DisbursementFilters = ({ year, month, onYearChange, onMonthChange, onSummaryChange }) => {
  const now = new Date()
  const isExpenditureAdmin = useExpenditureAdmin()
  const [searchQuery, setSearchQuery] = useState('')
  const [showOverrideControls, setShowOverrideControls] = useState(false)

  return (
    <div className="disbursement-filters-container">
      <div className="disb-filters-row">
        <div className="disb-filters-left">
          <div className="disb-filter-inline">
            <span className="disb-filter-label">Year:-</span>
            <select
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              className="disb-filter-select"
            >
              {[0, 1, 2].map((i) => {
                const y = String(now.getFullYear() - i)
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="disb-filter-inline">
            <span className="disb-filter-label">Month:-</span>
            <select
              value={month}
              onChange={(e) => onMonthChange(e.target.value)}
              className="disb-filter-select"
            >
              {MONTH_LABELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
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
          {isExpenditureAdmin && (
            <button
              type="button"
              className={`disb-edit-button ${showOverrideControls ? 'disb-edit-button-active' : ''}`}
              aria-label={showOverrideControls ? 'Hide TA and DA color options' : 'Edit TA and DA colors'}
              aria-pressed={showOverrideControls}
              onClick={() => setShowOverrideControls((v) => !v)}
            >
              <img src="/pen-icon.png" alt="" className="disb-edit-icon" />
            </button>
          )}
        </div>
      </div>

      <ExpenditureRulesIndex />

      <DisbursementTable
        year={year}
        month={month}
        searchQuery={searchQuery}
        showOverrideControls={showOverrideControls}
        onSummaryChange={onSummaryChange}
      />
    </div>
  )
}

export default DisbursementFilters
