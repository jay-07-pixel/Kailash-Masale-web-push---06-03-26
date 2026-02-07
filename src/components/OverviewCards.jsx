import React from 'react'
import './OverviewCards.css'

const OverviewCards = () => {
  const cards = [
    {
      icon: '👥',
      title: 'Total Employees',
      value: '248',
      change: '+12%',
      changeType: 'positive',
    },
    {
      icon: '📦',
      title: 'Active Orders',
      value: '843',
      change: '+5%',
      changeType: 'positive',
    },
    {
      icon: '🚩',
      title: 'Pending Tasks',
      value: '38',
      change: '-2%',
      changeType: 'negative',
    },
    {
      icon: '⏰',
      title: 'Check-ins / Check-Outs',
      value: '102 / 100',
      change: 'Today',
      changeType: 'neutral',
    },
  ]

  return (
    <div className="overview-cards">
      {cards.map((card, index) => {
        const isTotalEmployees = card.title === 'Total Employees'
        const isActiveOrders = card.title === 'Active Orders'
        const isPendingTasks = card.title === 'Pending Tasks'
        const isCheckInOut = card.title === 'Check-ins / Check-Outs'
        return (
          <div key={index} className="overview-card">
            <div className="card-header">
              {isTotalEmployees ? (
                <div className="card-icon-wrapper card-icon-wrapper-blue">
                  <img 
                    src="/tot-empl-icon.png" 
                    alt="Total Employees" 
                    className="card-icon-image card-icon-total-empl"
                  />
                </div>
              ) : isActiveOrders ? (
                <div className="card-icon-wrapper card-icon-wrapper-purple">
                  <img 
                    src="/active-orders-icon.png" 
                    alt="Active Orders" 
                    className="card-icon-image card-icon-active-orders"
                  />
                </div>
              ) : isPendingTasks ? (
                <div className="card-icon-wrapper card-icon-wrapper-orange">
                  <img 
                    src="/pending-task-card-icon.png" 
                    alt="Pending Tasks" 
                    className="card-icon-image card-icon-pending-tasks"
                  />
                </div>
              ) : isCheckInOut ? (
                <div className="card-icon-wrapper card-icon-wrapper-green">
                  <img 
                    src="/checkin-out-card-icon.png" 
                    alt="Check-ins / Check-Outs" 
                    className="card-icon-image card-icon-checkin-out"
                  />
                </div>
              ) : (
                <span className="card-icon">{card.icon}</span>
              )}
              <span
                className={`card-change ${
                  card.changeType === 'positive'
                    ? 'positive'
                    : card.changeType === 'negative'
                    ? 'negative'
                    : 'neutral'
                }`}
              >
                {card.change}
              </span>
            </div>
            <div className="card-title">{card.title}</div>
            <div className="card-value">{card.value}</div>
          </div>
        )
      })}
    </div>
  )
}

export default OverviewCards
