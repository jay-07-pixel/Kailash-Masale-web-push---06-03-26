import React from 'react'
import './TaskCard.css'

const TaskCard = ({ task }) => {
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
            <button className="action-button edit">
              <img 
                src="/pencil-icon.png" 
                alt="Edit" 
                className="action-icon"
              />
            </button>
          )}
          <button className="action-button delete">
            <img 
              src="/delete-icon.png" 
              alt="Delete" 
              className="action-icon"
            />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
