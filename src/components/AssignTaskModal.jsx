import React, { useState } from 'react'
import './AssignTaskModal.css'

const AssignTaskModal = ({ isOpen, onClose }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [pendingTask, setPendingTask] = useState('')

  const handleSave = () => {
    // Handle save logic here
    onClose()
  }

  const handleSubmit = () => {
    // Handle submit logic here
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="assign-task-overlay" onClick={onClose}>
      <div className="assign-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            <span className="back-arrow">←</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select employee</label>
            <div className="select-wrapper">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="employee-select"
              >
                <option value="">Select employee</option>
                <option value="employee1">John Doe</option>
                <option value="employee2">Jane Smith</option>
                <option value="employee3">Mike Johnson</option>
                <option value="employee4">Sarah Williams</option>
              </select>
              <img src="/drop-down-icon.png" alt="" className="drop-down-icon-img" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Enter Pending Tasks</label>
            <textarea
              value={pendingTask}
              onChange={(e) => setPendingTask(e.target.value)}
              placeholder="Order to be placed"
              className="task-textarea"
              rows="4"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignTaskModal
