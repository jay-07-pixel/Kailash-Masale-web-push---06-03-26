import React from 'react'
import './CheckInOutSummaryCards.css'

const CheckInOutSummaryCards = ({ summary = {} }) => {
  const cards = [
    {
      title: 'Total Visits',
      value: summary.totalVisits ?? '0',
      description: 'From check-ins',
      iconSrc: '/lov-icon.png',
      iconBg: '#dbeafe',
    },
    {
      title: 'Productive Calls',
      value: summary.productiveCalls ?? '0',
      description: 'Total productive',
      iconSrc: '/call-icon.png',
      iconBg: '#dcfce7',
    },
    {
      title: 'Avg Working Hours',
      value: summary.avgWorkingHours ?? '0h',
      description: 'Daily Average',
      iconSrc: '/purple-clock.png',
      iconBg: '#ede9fe',
    },
    {
      title: 'Total Primary Sales',
      value: summary.totalPrimarySales ?? '0 kg',
      description: 'From records',
      iconSrc: '/orange-bag.png',
      iconBg: '#ffedd5',
    },
    {
      title: 'Total Secondary Sales',
      value: summary.totalSecondarySales ?? '0 kg',
      description: 'From records',
      iconSrc: '/orange-bag.png',
      iconBg: '#ffedd5',
    },
  ]

  return (
    <div className="checkinout-summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="checkinout-summary-card">
          <div
            className="checkinout-card-icon-wrapper"
            style={{ backgroundColor: card.iconBg }}
          >
            <img
              src={card.iconSrc}
              alt=""
              className="checkinout-card-icon-img"
            />
          </div>
          <div className="card-content-wrapper">
            <div className="card-title">{card.title}</div>
            <div className="card-value">{card.value}</div>
            <div className="card-description">{card.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default CheckInOutSummaryCards
