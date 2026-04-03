import React from 'react'
import './DisbursementSummaryCards.css'

function formatInr(n) {
  if (n == null || Number.isNaN(n)) return '₹0'
  const rounded = Math.round(Number(n))
  return `₹${rounded.toLocaleString('en-IN')}`
}

const DisbursementSummaryCards = ({ summary, year, month }) => {
  const s = summary ?? { salary: 0, da: 0, ta: 0, nh: 0, incentives: 0 }

  const cards = [
    {
      title: 'SALARY',
      value: formatInr(s.salary),
      iconBg: '#E0F2FE',
    },
    {
      title: 'DA',
      value: formatInr(s.da),
      iconBg: '#E0F2FE',
    },
    {
      title: 'TA',
      value: formatInr(s.ta),
      iconBg: '#E0F2FE',
    },
    {
      title: 'NIGHT HAULT',
      value: formatInr(s.nh),
      iconBg: '#E0F2FE',
    },
    {
      title: 'INCENTIVES',
      value: formatInr(s.incentives),
      iconBg: '#E0F2FE',
    },
  ]

  return (
    <div className="disbursement-summary-cards">
      <p className="disbursement-summary-period" aria-live="polite">
        Totals for <strong>{month}</strong> <strong>{year}</strong> (live from your data)
      </p>
      <div className="disbursement-summary-cards-row">
        {cards.map((card, index) => (
          <div key={index} className="disbursement-summary-card">
            <div className="card-content-wrapper">
              <div className="card-title">{card.title}</div>
              <div className="card-value">{card.value}</div>
            </div>
            <div className="card-icon-wrapper" style={{ backgroundColor: card.iconBg }}>
              <img src="/dollar-icon.png" alt="" className="card-icon-image" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DisbursementSummaryCards
