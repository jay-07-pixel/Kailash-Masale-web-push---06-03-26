import React, { useState } from 'react'
import './DistributorAppointmentModal.css'

const DistributorAppointmentModal = ({ isOpen, onClose }) => {
  const [area, setArea] = useState('')
  const [employee, setEmployee] = useState('')
  const [distributor, setDistributor] = useState('')
  const [target, setTarget] = useState('')
  const [workingDays, setWorkingDays] = useState('')

  if (!isOpen) return null

  return (
    <div className="da-modal-overlay" onClick={onClose}>
      <div className="da-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="da-modal-header">
          <button type="button" className="da-modal-back" onClick={onClose} aria-label="Back">
            <span className="da-modal-back-arrow">←</span>
          </button>
        </div>

        <div className="da-modal-body">
          <div className="da-form-group">
            <label className="da-form-label">Area</label>
            <div className="da-select-wrapper">
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="da-form-select"
              >
                <option value="">Select Area</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
              <img src="/drop-down-icon.png" alt="" className="da-drop-down-icon-img" />
            </div>
          </div>

          <div className="da-form-group">
            <label className="da-form-label">Select Employee(s) To Assign</label>
            <div className="da-select-wrapper">
              <select
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                className="da-form-select"
              >
                <option value="">Select Employee</option>
                <option value="michael">Michael Scott</option>
                <option value="pam">Pam Beesly</option>
                <option value="jim">Jim Halpert</option>
              </select>
              <img src="/drop-down-icon.png" alt="" className="da-drop-down-icon-img" />
            </div>
          </div>

          <div className="da-form-group">
            <label className="da-form-label">Enter Distributor</label>
            <input
              type="text"
              value={distributor}
              onChange={(e) => setDistributor(e.target.value)}
              placeholder="Enter Distributors Name"
              className="da-form-input"
            />
          </div>

          <div className="da-form-row">
            <div className="da-form-group da-form-group-half">
              <label className="da-form-label">Target</label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter Target"
                className="da-form-input"
              />
            </div>
            <div className="da-form-group da-form-group-half">
              <label className="da-form-label">Working Days</label>
              <input
                type="text"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                placeholder="Enter Working Days"
                className="da-form-input"
              />
            </div>
          </div>

          <div className="da-modal-footer">
            <button type="button" className="da-btn-save" onClick={onClose}>
              Save
            </button>
            <button type="button" className="da-btn-submit">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DistributorAppointmentModal
