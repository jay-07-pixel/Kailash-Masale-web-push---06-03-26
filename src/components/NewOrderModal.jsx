import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import AddItemModal from './AddItemModal'
import './NewOrderModal.css'

const DISTRIBUTORS_COLLECTION = 'distributors'
const EMPLOYEES_COLLECTION = 'employees'
const ORDERS_COLLECTION = 'orders'

const NewOrderModal = ({ isOpen, onClose }) => {
  const [selectedDistributor, setSelectedDistributor] = useState('')
  const [distributors, setDistributors] = useState([])
  const [employees, setEmployees] = useState([])
  const MAX_ITEMS = 10
  const [items, setItems] = useState([{ id: 1 }])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [addItemForIndex, setAddItemForIndex] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsubD = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      setDistributors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsubE = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => {
      unsubD()
      unsubE()
    }
  }, [])

  const selectedDistributorDoc = selectedDistributor
    ? distributors.find((d) => d.id === selectedDistributor)
    : null
  const assignedEmployeeIds = selectedDistributorDoc
    ? (Array.isArray(selectedDistributorDoc.assignedEmployeeIds)
        ? selectedDistributorDoc.assignedEmployeeIds
        : selectedDistributorDoc.assignedEmployeeId
          ? [selectedDistributorDoc.assignedEmployeeId]
          : [])
    : []
  const assignedEmployeeObjects = assignedEmployeeIds
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean)
  const assignedEmployees = assignedEmployeeObjects.map(
    (emp) => emp.salesPersonName || emp.name || emp.email || '—'
  )
  const primaryEmployee = assignedEmployeeObjects[0] || null

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleAddItem = (slotIndex) => {
    if (slotIndex < 0 || slotIndex >= MAX_ITEMS) return
    setAddItemForIndex(slotIndex)
    setIsAddItemModalOpen(true)
  }

  const handleSaveItem = (itemData) => {
    const idx = addItemForIndex
    setAddItemForIndex(null)
    if (idx == null || idx < 0) return
    setItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], id: next[idx].id || idx + 1, ...itemData }
      if (idx === next.length - 1 && next.length < MAX_ITEMS) {
        next.push({ id: next.length + 1 })
      }
      return next
    })
    setIsAddItemModalOpen(false)
  }

  const handleRemoveItem = (slotIndex) => {
    setItems((prev) => {
      if (prev.length <= 1) return prev
      const next = prev.filter((_, i) => i !== slotIndex)
      return next.map((item, i) => ({ ...item, id: i + 1 }))
    })
  }

  const handleSubmit = async () => {
    setSubmitError('')
    if (!selectedDistributor || !selectedDistributorDoc) {
      setSubmitError('Please select a distributor.')
      return
    }
    if (!primaryEmployee) {
      setSubmitError('This distributor has no assigned employee. Assign an employee on the Distributor page first.')
      return
    }
    const filledItems = items.filter((item) => item.sku && item.kg && item.scheme)
    if (filledItems.length === 0) {
      setSubmitError('Please add at least one item (SKU, KG, SCHEME).')
      return
    }
    if (!isFirebaseConfigured || !db) {
      setSubmitError('Firebase is not connected.')
      return
    }
    setSubmitting(true)
    try {
      const distributorName = selectedDistributorDoc.distributorName || selectedDistributorDoc.name || '—'
      const employeeName = primaryEmployee.salesPersonName || primaryEmployee.name || primaryEmployee.email || '—'
      const employeeEmail = primaryEmployee.email || primaryEmployee.emailId || ''
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
      for (let i = 0; i < filledItems.length; i++) {
        const item = filledItems[i]
        await addDoc(collection(db, ORDERS_COLLECTION), {
          employeeId: primaryEmployee.id,
          employeeEmail: employeeEmail.trim() || primaryEmployee.id,
          employeeName,
          distributor: distributorName,
          date: dateStr,
          sku: String(item.sku).trim() || '—',
          totalKg: String(item.kg).trim() || '0',
          scheme: String(item.scheme).trim() || '—',
          status: 'Pending',
          timestamp: serverTimestamp(),
          orderNumber: 1,
          subOrderIndex: i + 1,
          submitted: true,
          submittedAt: now.toLocaleString(),
        })
      }
      onClose()
      setSelectedDistributor('')
      setItems([{ id: 1 }])
    } catch (err) {
      console.error('Failed to create order:', err)
      setSubmitError(err?.message || 'Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="back-button" onClick={onClose}>
            <span className="back-arrow">←</span>
          </button>
          <h2 className="modal-title">Select Distributor</h2>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Select Distributor</label>
            <div className="select-wrapper">
              <select
                value={selectedDistributor}
                onChange={(e) => setSelectedDistributor(e.target.value)}
                className="distributor-select"
              >
                <option value="">Select Distributor</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.distributorName || d.name || d.id}
                  </option>
                ))}
              </select>
              <img src="/drop-down-icon.png" alt="" className="drop-down-icon-img" />
            </div>
            {selectedDistributor && (
              <div className="assigned-employees-display">
                <span className="assigned-employees-label">Assigned employee(s):</span>
                <span className="assigned-employees-value">
                  {assignedEmployees.length > 0 ? assignedEmployees.join(', ') : 'None assigned'}
                </span>
              </div>
            )}
          </div>

          <div className="add-items-section">
            <div className="section-label">Add Item (1–{MAX_ITEMS})</div>
            {items.map((item, index) => (
              <div key={`slot-${index}-${item.id}`} className="item-row">
                <span className="item-number">{index + 1}.</span>
                {item.sku && item.kg && item.scheme ? (
                  <div className="item-details-inline">
                    <div className="item-field-display">
                      <span className="field-label-small">SKU</span>
                      <span className="field-value">{item.sku}</span>
                    </div>
                    <div className="item-field-display">
                      <span className="field-label-small">KG</span>
                      <span className="field-value">{item.kg}</span>
                    </div>
                    <div className="item-field-display">
                      <span className="field-label-small">SCHEME</span>
                      <span className="field-value">{item.scheme}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-item-button"
                      onClick={() => handleRemoveItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="add-item-button"
                    onClick={() => handleAddItem(index)}
                  >
                    <span className="add-icon">+</span>
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>

          {submitError && (
            <div className="new-order-submit-error" role="alert">
              {submitError}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="save-button" onClick={onClose} disabled={submitting}>
            Save
          </button>
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => { setAddItemForIndex(null); setIsAddItemModalOpen(false) }}
        onSave={handleSaveItem}
      />
    </div>
  )
}

export default NewOrderModal
