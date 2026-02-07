import React from 'react'
import './TaskSummaryCards.css'

const TaskSummaryCards = () => {
  const summaryCards = [
    {
      title: 'Pending Tasks',
      count: '12',
      icon: '⏳',
      borderColor: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      title: 'Ongoing',
      count: '8',
      icon: '🔄',
      borderColor: '#3b82f6',
      bgColor: '#dbeafe',
    },
    {
      title: 'Resolved',
      count: '45',
      icon: '✅',
      borderColor: '#10b981',
      bgColor: '#d1fae5',
    },
  ]

  return (
    <div className="task-summary-cards">
      {summaryCards.map((card, index) => {
        const isPendingTasks = card.title === 'Pending Tasks'
        const isOngoing = card.title === 'Ongoing'
        const isResolved = card.title === 'Resolved'
        return (
          <div key={index} className="task-summary-card">
            <div className="summary-card-header">
              <div className="summary-card-body">
                <div className="summary-title">{card.title}</div>
                <div className="summary-count">{card.count}</div>
              </div>
              <div 
                className="summary-icon-wrapper"
                style={{ backgroundColor: card.bgColor }}
              >
                {isPendingTasks ? (
                  <img 
                    src="/loading-icon.png" 
                    alt="Pending Tasks" 
                    className="summary-icon-image"
                  />
                ) : isOngoing ? (
                  <img 
                    src="/ongoing-icon.png" 
                    alt="Ongoing" 
                    className="summary-icon-image"
                  />
                ) : isResolved ? (
                  <img 
                    src="/resolved-icon.png" 
                    alt="Resolved" 
                    className="summary-icon-image"
                  />
                ) : (
                  <span className="summary-icon">{card.icon}</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TaskSummaryCards
