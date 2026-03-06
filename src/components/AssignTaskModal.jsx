import React, { useState } from 'react'
import './AssignTaskModal.css'

const AssignTaskModal = ({ isOpen, onClose, employees = [], onSave, onSubmit }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [pendingTask, setPendingTask] = useState('')

  const resetForm = () => {
    setSelectedEmployee('')
    setPendingTask('')
  }

  const handleSave = () => {
    if (!selectedEmployee || !pendingTask.trim()) return
    if (onSave) onSave(selectedEmployee, pendingTask.trim(), 'pending')
    else onClose()
    resetForm()
  }

  const handleSubmit = () => {
    if (!selectedEmployee || !pendingTask.trim()) return
    if (onSubmit) onSubmit(selectedEmployee, pendingTask.trim(), 'pending')
    else onClose()
    resetForm()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="assign-task-overlay" onClick={handleClose}>
      <div className="assign-task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-button" onClick={handleClose}>
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
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.salesPersonName || emp.email || emp.id}
                  </option>
                ))}
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
          <button className="save-button" onClick={handleSave} disabled={!selectedEmployee || !pendingTask.trim()}>
            Save
          </button>
          <button className="submit-button" onClick={handleSubmit} disabled={!selectedEmployee || !pendingTask.trim()}>
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignTaskModal
