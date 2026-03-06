import React from 'react'
import './TaskFilterTabs.css'

const TaskFilterTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'resolved', label: 'Resolved' },
  ]

  return (
    <div className="task-filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`filter-tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TaskFilterTabs
