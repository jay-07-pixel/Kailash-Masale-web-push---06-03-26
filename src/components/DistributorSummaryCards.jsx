import React, { useMemo, useState, useEffect } from 'react'
import { TOTAL_MONTH_OPTION, MONTH_LABELS } from '../utils/employeeRecordRollup'
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

const R = 42
const CIRC = 2 * Math.PI * R

const DistributorSummaryCards = ({
  distributors = [],
  allDistributorsForTrend,
  totalTargetKg = 0,
  achievedPrimaryKg = 0,
  achievementPercent = 0,
  achievementYear,
  achievementMonth,
  onAchievementYearChange,
  onAchievementMonthChange,
  achievementYearOptions = [],
}) => {
  const totalCount = Array.isArray(distributors) ? distributors.length : 0
  const listForTrend = allDistributorsForTrend ?? distributors
  const monthTrend = useMemo(() => getMonthTrend(Array.isArray(listForTrend) ? listForTrend : []), [listForTrend])

  const clampedPct = Math.min(100, Math.max(0, achievementPercent))
  const displayPct = Math.round(clampedPct)
  const [ringPct, setRingPct] = useState(0)

  useEffect(() => {
    setRingPct(0)
    const t = window.setTimeout(() => setRingPct(clampedPct), 80)
    return () => clearTimeout(t)
  }, [clampedPct, achievementYear, achievementMonth])

  const dashOffset = CIRC * (1 - ringPct / 100)

  const periodSub =
    achievementMonth === TOTAL_MONTH_OPTION
      ? `Employee Record · ${achievementYear} · Year total`
      : `Employee Record · ${achievementMonth} ${achievementYear}`

  const fmtKg = (n) => `${Number(n || 0).toLocaleString()} kg`

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
          <div className="target-achievement-header-row">
            <div className="card-title">Overall Target Achievement</div>
            <div className="achievement-period-filters">
              <select
                className="achievement-period-select"
                value={achievementYear}
                onChange={(e) => onAchievementYearChange?.(e.target.value)}
                aria-label="Year for target achievement"
              >
                {achievementYearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                className="achievement-period-select"
                value={achievementMonth}
                onChange={(e) => onAchievementMonthChange?.(e.target.value)}
                aria-label="Month for target achievement"
              >
                <option value={TOTAL_MONTH_OPTION}>{TOTAL_MONTH_OPTION}</option>
                {MONTH_LABELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <span className="target-achievement-icon" aria-hidden>
              🎯
            </span>
          </div>
          <div className="achievement-content">
            <div className="achievement-value">{displayPct}%</div>
            <div className="circular-progress">
              <svg className="progress-ring" width="100" height="100" viewBox="0 0 100 100">
                <circle className="progress-ring-background" cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="6" />
                <circle
                  className="progress-ring-progress"
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="6"
                  strokeDasharray={String(CIRC)}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="progress-text">{displayPct}%</div>
            </div>
            <div className="target-details">
              <div className="target-info">
                <span className="target-label">Target:</span>
                <span className="target-value">{fmtKg(totalTargetKg)}</span>
              </div>
              <div className="target-info">
                <span className="target-label">Achieved:</span>
                <span className="achieved-value">{fmtKg(achievedPrimaryKg)}</span>
              </div>
              <div className="achievement-period-sub">{periodSub}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributorSummaryCards
