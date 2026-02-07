import React from 'react'
import './DisbursementSummaryCards.css'

const DisbursementSummaryCards = () => {
  const cards = [
    {
      title: 'SALARY',
      value: '₹45,200',
      trend: '+8% this month',
      trendType: 'positive',
      iconBg: '#E0F2FE',
    },
    {
      title: 'DA',
      value: '₹8,900',
      iconBg: '#E0F2FE',
    },
    {
      title: 'TA',
      value: '₹11,248',
      trend: '+12% this month',
      trendType: 'positive',
      iconBg: '#E0F2FE',
    },
    {
      title: 'NIGHT HAULT',
      value: '₹2,450',
      iconBg: '#E0F2FE',
    },
    {
      title: 'INCENTIVES',
      value: '₹5,600',
      trend: '+5% this month',
      trendType: 'positive',
      iconBg: '#E0F2FE',
    },
  ]

  return (
    <div className="disbursement-summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="disbursement-summary-card">
          <div className="card-content-wrapper">
            <div className="card-title">{card.title}</div>
            <div className="card-value">{card.value}</div>
            {card.trend && (
              <div className={`card-trend ${card.trendType}`}>
                {card.trend}
              </div>
            )}
          </div>
          <div className="card-icon-wrapper" style={{ backgroundColor: card.iconBg }}>
            <img
              src="/dollar-icon.png"
              alt="Dollar"
              className="card-icon-image"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default DisbursementSummaryCards
