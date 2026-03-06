import React from 'react'
import './TaskCard.css'

const TaskCard = ({ task, onMarkComplete, onEdit, onDelete }) => {
  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>
      case 'ongoing':
        return <span className="status-badge ongoing">Ongoing</span>
      case 'resolved':
        return <span className="status-badge resolved">Resolved</span>
      default:
        return null
    }
  }

  return (
    <div className="task-card">
      <div className="task-card-header">
        <div className="task-user-info">
          <img src={task.avatar} alt={task.name} className="task-avatar" />
          <div className="task-user-details">
            <div className="task-user-name">{task.name}</div>
            <div className="task-user-role">{task.role}</div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="task-description">{task.task}</div>

      <div className="task-card-footer">
        <div className="task-date-info">
          {task.completedDate ? (
            <span className="task-date completed">{task.completedDate}</span>
          ) : (
            <span className="task-date">{task.dueDate}</span>
          )}
        </div>
        <div className="task-actions">
          {task.status !== 'resolved' && (
            <button
              type="button"
              className="action-button action-button-complete"
              onClick={() => onMarkComplete?.(task.id)}
              title="Mark as completed"
              aria-label="Mark task as completed"
            >
              <svg className="task-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className="action-button action-button-edit"
            onClick={() => onEdit?.(task.id, task.task)}
            title="Edit task"
            aria-label="Edit task"
          >
            <svg className="task-action-svg task-action-pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="action-button action-button-delete"
            onClick={() => onDelete?.(task.id)}
            title="Delete task"
            aria-label="Delete task"
          >
            <svg className="task-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
