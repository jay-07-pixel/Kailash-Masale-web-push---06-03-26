import React, { useState } from 'react'
import UniversalHeader from '../components/UniversalHeader'
import AssignTaskModal from '../components/AssignTaskModal'
import TaskSummaryCards from '../components/TaskSummaryCards'
import TaskFilterTabs from '../components/TaskFilterTabs'
import SearchBar from '../components/SearchBar'
import TaskList from '../components/TaskList'
import './PendingTaskPage.css'

function PendingTaskPage() {
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false)

  return (
    <div className="main-content">
      <UniversalHeader title="Pending Task" />

      <div className="content-wrapper">
        <div className="page-actions">
          <button
            className="assign-task-button"
            onClick={() => setIsAssignTaskModalOpen(true)}
          >
            <img 
              src="/assign-task-icon.png" 
              alt="Assign Task" 
              className="button-icon"
            />
            Assign Task
          </button>
        </div>

        <TaskSummaryCards />
        
        <div className="task-controls">
          <TaskFilterTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>

        <TaskList activeTab={activeTab} searchQuery={searchQuery} />
      </div>
      <AssignTaskModal
        isOpen={isAssignTaskModalOpen}
        onClose={() => setIsAssignTaskModalOpen(false)}
      />
    </div>
  )
}

export default PendingTaskPage
