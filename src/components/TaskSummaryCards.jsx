import React from 'react'
import './TaskSummaryCards.css'

const TaskSummaryCards = ({ pendingCount = 0, resolvedCount = 0 }) => {
  const summaryCards = [
    {
      title: 'Pending Tasks',
      count: pendingCount,
      icon: '⏳',
      borderColor: '#f59e0b',
      bgColor: '#fef3c7',
    },
    {
      title: 'Resolved',
      count: resolvedCount,
      icon: '✅',
      borderColor: '#10b981',
      bgColor: '#d1fae5',
    },
  ]

  return (
    <div className="task-summary-cards">
      {summaryCards.map((card, index) => {
        const isPendingTasks = card.title === 'Pending Tasks'
        const isResolved = card.title === 'Resolved'
        return (
          <div key={index} className="task-summary-card">
            <div className="summary-card-header">
              <div className="summary-card-body">
                <div className="summary-title">{card.title}</div>
                <div className="summary-count">{String(card.count)}</div>
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
