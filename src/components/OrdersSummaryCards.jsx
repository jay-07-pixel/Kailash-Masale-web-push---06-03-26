import React from 'react'
import './OrdersSummaryCards.css'

const OrdersSummaryCards = () => {
  const cards = [
    {
      title: 'Total Orders',
      value: '1,248',
      trend: '+12.5% this month',
      trendType: 'positive',
      iconBg: '#dbeafe',
      icon: '📁',
    },
    {
      title: 'Pending Approval',
      value: '45',
      status: 'Action required',
      statusType: 'warning',
      iconBg: '#fef3c7',
      icon: '⚠️',
    },
    {
      title: 'Total Volume (Kg)',
      value: '8,450 kg',
      subtitle: 'Across all SRAs',
      iconBg: '#ede9fe',
      icon: '🔔',
    },
  ]

  return (
    <div className="orders-summary-cards">
      {cards.map((card, index) => {
        const isTotalOrders = card.title === 'Total Orders'
        const isPendingApproval = card.title === 'Pending Approval'
        const isTotalVolume = card.title === 'Total Volume (Kg)'
        return (
          <div key={index} className="orders-summary-card">
            <div className="card-content-wrapper">
              <div className="card-title">{card.title}</div>
              <div className="card-value">{card.value}</div>
              {card.trend ? (
                <div className={`card-trend ${card.trendType}`}>
                  <span className="trend-arrow">↑</span>
                  {card.trend}
                </div>
              ) : card.status ? (
                <div className={`card-status ${card.statusType}`}>
                  {card.status}
                </div>
              ) : (
                <div className="card-subtitle">{card.subtitle}</div>
              )}
            </div>
            <div
              className={`card-icon-wrapper ${
                isTotalOrders
                  ? 'total-orders-wrapper'
                  : isPendingApproval
                  ? 'pending-approval-wrapper'
                  : isTotalVolume
                  ? 'total-volume-wrapper'
                  : ''
              }`}
              style={{ backgroundColor: card.iconBg }}
            >
              {isTotalOrders ? (
                <img
                  src="/total-orders-icon.png"
                  alt="Total Orders"
                  className="card-icon-image total-orders-icon"
                />
              ) : isPendingApproval ? (
                <img
                  src="/pending-approval-icon.png"
                  alt="Pending Approval"
                  className="card-icon-image pending-approval-icon"
                />
              ) : isTotalVolume ? (
                <img
                  src="/total-volume-icon.png"
                  alt="Total Volume"
                  className="card-icon-image total-volume-icon"
                />
              ) : (
                <span className="card-icon">{card.icon}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OrdersSummaryCards
