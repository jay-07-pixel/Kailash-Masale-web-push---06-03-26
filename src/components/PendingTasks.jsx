import React, { useState } from 'react'
import './PendingTasks.css'

const PendingTasks = () => {
  const [activeTab, setActiveTab] = useState('ongoing')

  const tasks = [
    {
      name: 'John Mitchell',
      title: 'Sales Executive',
      status: 'Ongoing',
      statusType: 'ongoing',
      description:
        'Follow up with Green Valley Supplies regarding pending order confirmation and delivery schedule.',
      dueDate: 'Due: Dec 5',
      timeLeft: '2 days left',
      avatar: 'https://ui-avatars.com/api/?name=John+Mitchell&background=f59e0b&color=fff',
    },
    {
      name: 'Lisa Anderson',
      title: 'Operations Manager',
      status: 'On Hold',
      statusType: 'on-hold',
      description:
        'Warehouse inventory audit pending approval from regional manager before proceeding.',
      dueDate: 'Due: Dec 8',
      timeLeft: '5 days left',
      avatar: 'https://ui-avatars.com/api/?name=Lisa+Anderson&background=6b7280&color=fff',
    },
    {
      name: 'Robert Taylor',
      title: 'Logistics Coordinator',
      status: 'Resolved',
      statusType: 'resolved',
      description:
        'Complete shipment documentation for Apex Retailers order #ORD-28-49.',
      completedDate: 'Completed: Dec 2',
      avatar: 'https://ui-avatars.com/api/?name=Robert+Taylor&background=10b981&color=fff',
    },
  ]

  const filteredTasks =
    activeTab === 'ongoing'
      ? tasks.filter((t) => t.statusType !== 'resolved')
      : tasks.filter((t) => t.statusType === 'resolved')

  return (
    <div className="pending-tasks-card">
      <div className="card-header-section">
        <div>
          <h3 className="card-title">Pending Tasks</h3>
          <p className="card-subtitle">Track and manage employee assignments</p>
        </div>
        <div className="task-tabs">
          <button
            className={`tab-button ${activeTab === 'ongoing' ? 'active' : ''}`}
            onClick={() => setActiveTab('ongoing')}
          >
            Ongoing
          </button>
          <button
            className={`tab-button ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>
      <div className="tasks-grid">
        {filteredTasks.map((task, index) => (
          <div key={index} className="task-card">
            <div className="task-header">
              <div className="task-user">
                <img
                  src={task.avatar}
                  alt={task.name}
                  className="task-avatar"
                />
                <div>
                  <div className="task-name">{task.name}</div>
                  <div className="task-title">{task.title}</div>
                </div>
              </div>
              <span
                className={`task-status-badge ${
                  task.statusType === 'ongoing'
                    ? 'ongoing'
                    : task.statusType === 'on-hold'
                    ? 'on-hold'
                    : 'resolved'
                }`}
              >
                {task.status}
              </span>
            </div>
            <p className="task-description">{task.description}</p>
            <div className="task-footer">
              {task.completedDate ? (
                <span className="task-date completed">
                  {task.completedDate}
                </span>
              ) : (
                <>
                  <span className="task-date">{task.dueDate}</span>
                  <span className="task-time-left">{task.timeLeft}</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PendingTasks
