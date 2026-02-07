import React from 'react'
import './DistributorSummaryCards.css'

const DistributorSummaryCards = () => {
  return (
    <div className="distributor-summary-cards">
      <div className="summary-card total-distributors">
        <div className="card-content">
          <div className="card-title">Total Distributors</div>
          <div className="card-value">1,248</div>
          <div className="card-trend positive">
            <span className="trend-icon">↑</span>
            <span>+12% this month</span>
          </div>
        </div>
      </div>

      <div className="summary-card target-achievement">
        <div className="card-content">
          <div className="card-title">Overall Target Achievement</div>
          <img
            src="/target-icon.png"
            alt="Target"
            className="target-icon"
          />
          <div className="achievement-content">
            <div className="achievement-value">84%</div>
            <div className="circular-progress">
              <svg className="progress-ring" width="100" height="100">
                <circle
                  className="progress-ring-background"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="6"
                />
                <circle
                  className="progress-ring-progress"
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - 0.84)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="progress-text">84%</div>
            </div>
            <div className="target-details">
              <div className="target-info">
                <span className="target-label">Target:</span>
                <span className="target-value">$2.4M</span>
              </div>
              <div className="target-info">
                <span className="target-label">Achieved:</span>
                <span className="achieved-value">$2.01M</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributorSummaryCards
