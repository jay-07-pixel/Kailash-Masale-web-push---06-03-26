import React from 'react'
import './CheckInOutSummaryCards.css'

const CheckInOutSummaryCards = () => {
  const cards = [
    {
      title: 'Total Visits',
      value: '1,284',
      trend: '↑ 12% vs last week',
      trendType: 'positive',
      iconSrc: '/lov-icon.png',
      iconBg: '#dbeafe',
    },
    {
      title: 'Productive Calls',
      value: '856',
      trend: '↑ 8% vs last week',
      trendType: 'positive',
      iconSrc: '/call-icon.png',
      iconBg: '#dcfce7',
    },
    {
      title: 'Avg Working Hours',
      value: '8.5h',
      description: 'Daily Average',
      iconSrc: '/purple-clock.png',
      iconBg: '#ede9fe',
    },
    {
      title: 'Total Primary Sales',
      value: '4,250 kg',
      trend: '↑ 5% vs last week',
      trendType: 'positive',
      iconSrc: '/orange-bag.png',
      iconBg: '#ffedd5',
    },
    {
      title: 'Total Secondary Sales',
      value: '4,250 kg',
      trend: '↑ 5% vs last week',
      trendType: 'positive',
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
            {card.trend ? (
              <div className={`card-trend ${card.trendType}`}>
                {card.trend}
              </div>
            ) : (
              <div className="card-description">{card.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CheckInOutSummaryCards
