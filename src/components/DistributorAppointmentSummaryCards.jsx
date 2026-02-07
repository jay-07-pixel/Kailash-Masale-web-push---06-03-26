import React from 'react'
import './DistributorAppointmentSummaryCards.css'

const DistributorAppointmentSummaryCards = () => {
  const cards = [
    {
      title: 'Total Orders',
      value: '1,248',
      subtitle: '+12% this month',
      subtitleType: 'positive',
      iconBg: '#DBEAFE',
      iconSrc: '/tot-order-blue.png',
    },
    {
      title: 'Pending Approval',
      value: '45',
      subtitle: 'Action required',
      subtitleType: 'warning',
      iconBg: '#FEF3C7',
      iconSrc: '/pending-approval-card.png',
    },
    {
      title: 'Total Volume (kg)',
      value: '8,450 kg',
      subtitle: 'Across all SKUs',
      subtitleType: 'neutral',
      iconBg: '#E9D5FF',
      iconSrc: '/total-volume-card.png',
    },
  ]

  return (
    <div className="distributor-appointment-summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="distributor-appointment-summary-card">
          <div className="card-content">
            <div className="card-title">{card.title}</div>
            <div className="card-value">{card.value}</div>
            <div className={`card-subtitle ${card.subtitleType}`}>
              {card.subtitle}
            </div>
          </div>
          <div
            className="card-icon-wrapper"
            style={{ backgroundColor: card.iconBg }}
          >
            <img
              src={card.iconSrc}
              alt={card.title}
              className="da-summary-card-icon-img"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default DistributorAppointmentSummaryCards
