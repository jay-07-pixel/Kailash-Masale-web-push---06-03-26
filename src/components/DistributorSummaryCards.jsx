import React, { useMemo } from 'react'
import './DistributorSummaryCards.css'

function getDateFromCreatedAt(createdAt) {
  if (!createdAt) return null
  if (typeof createdAt.toDate === 'function') return createdAt.toDate()
  if (createdAt instanceof Date) return createdAt
  const t = typeof createdAt?.seconds === 'number' ? createdAt.seconds * 1000 : Date.parse(createdAt)
  return isNaN(t) ? null : new Date(t)
}

function getMonthTrend(distributors) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const thisMonthStart = new Date(thisYear, thisMonth, 1)
  const thisMonthEnd = new Date(thisYear, thisMonth + 1, 0, 23, 59, 59, 999)
  const lastMonthStart = new Date(thisYear, thisMonth - 1, 1)
  const lastMonthEnd = new Date(thisYear, thisMonth, 0, 23, 59, 59, 999)

  let countThisMonth = 0
  let countLastMonth = 0
  for (const d of distributors) {
    const date = getDateFromCreatedAt(d.createdAt)
    if (!date) continue
    if (date >= thisMonthStart && date <= thisMonthEnd) countThisMonth++
    else if (date >= lastMonthStart && date <= lastMonthEnd) countLastMonth++
  }

  if (countLastMonth === 0) {
    if (countThisMonth > 0) return { text: `↑ +${countThisMonth} this month`, positive: true }
    return { text: '0% this month', positive: true }
  }
  const pct = Math.round(((countThisMonth - countLastMonth) / countLastMonth) * 100)
  const positive = pct >= 0
  const text = pct >= 0 ? `↑ +${pct}% this month` : `↓ ${pct}% this month`
  return { text, positive }
}

const DistributorSummaryCards = ({ distributors = [], allDistributorsForTrend }) => {
  const totalCount = Array.isArray(distributors) ? distributors.length : 0
  const listForTrend = allDistributorsForTrend ?? distributors
  const monthTrend = useMemo(() => getMonthTrend(Array.isArray(listForTrend) ? listForTrend : []), [listForTrend])

  return (
    <div className="distributor-summary-cards">
      <div className="summary-card total-distributors">
        <div className="card-content">
          <div className="card-title">Total Distributors</div>
          <div className="card-value">{totalCount.toLocaleString()}</div>
          <div className={`card-trend ${monthTrend.positive ? 'positive' : 'negative'}`}>
            <span className="trend-icon">{monthTrend.positive ? '↑' : '↓'}</span>
            <span>{monthTrend.text}</span>
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
