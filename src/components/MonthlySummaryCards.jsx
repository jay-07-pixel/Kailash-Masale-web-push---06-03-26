import React from 'react'
import './MonthlySummaryCards.css'

const MonthlySummaryCards = ({
  totalOrders = 0,
  pendingApproval = 0,
  totalVolumeKg = 0,
  month = '',
  year = '',
}) => {
  const periodLabel = month && year ? `${month} ${year}` : ''
  const cards = [
    {
      title: 'Total Orders',
      value: typeof totalOrders === 'number' ? totalOrders.toLocaleString() : '0',
      subtitle: periodLabel ? `For ${periodLabel}` : 'Select period',
      subtitleType: 'positive',
      iconBg: '#DBEAFE',
      iconSrc: '/tot-order-blue.png',
    },
    {
      title: 'Pending Approval',
      value: typeof pendingApproval === 'number' ? pendingApproval.toLocaleString() : '0',
      subtitle: pendingApproval > 0 ? 'Action required' : 'All caught up',
      subtitleType: pendingApproval > 0 ? 'warning' : 'neutral',
      iconBg: '#FEF3C7',
      iconSrc: '/pending-approval-card.png',
    },
    {
      title: 'Total Volume (kg)',
      value: typeof totalVolumeKg === 'number' ? `${totalVolumeKg.toLocaleString()} kg` : '0 kg',
      subtitle: 'Across all SKUs',
      subtitleType: 'neutral',
      iconBg: '#E9D5FF',
      iconSrc: '/total-volume-card.png',
    },
  ]

  return (
    <div className="monthly-summary-cards">
      {cards.map((card, index) => (
        <div key={index} className="monthly-summary-card">
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
              className="monthly-card-icon-img"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default MonthlySummaryCards
