import React, { useState } from 'react'
import './AddItemModal.css'

const AddItemModal = ({ isOpen, onClose, onSave }) => {
  const [sku, setSku] = useState('')
  const [kg, setKg] = useState('')
  const [scheme, setScheme] = useState('')
  const [error, setError] = useState('')

  const handleSave = (e) => {
    e?.preventDefault()
    setError('')
    if (!sku || !kg?.trim() || !scheme?.trim()) {
      setError('Please select SKU and fill KG and Scheme.')
      return
    }
    if (typeof onSave === 'function') {
      onSave({ sku, kg: kg.trim(), scheme: scheme.trim() })
    }
    setSku('')
    setKg('')
    setScheme('')
    if (typeof onClose === 'function') onClose()
  }

  const handleClose = () => {
    setSku('')
    setKg('')
    setScheme('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="add-item-overlay" onClick={handleClose}>
      <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
        <form className="add-item-form" onSubmit={handleSave}>
          <div className="form-field">
            <label className="field-label">SKU</label>
            <div className="select-wrapper">
              <select
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="sku-select"
              >
                <option value="">Select SKU</option>
                <option value="sku-001">SKU-001</option>
                <option value="sku-002">SKU-002</option>
                <option value="sku-003">SKU-003</option>
                <option value="sku-004">SKU-004</option>
                <option value="sku-005">SKU-005</option>
              </select>
              <img src="/drop-down-icon.png" alt="" className="drop-down-icon-img" />
            </div>
          </div>

          <div className="form-field">
            <label className="field-label">KG</label>
            <input
              type="text"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder="Total KG"
              className="kg-input"
            />
          </div>

          <div className="form-field">
            <label className="field-label">Scheme</label>
            <input
              type="text"
              value={scheme}
              onChange={(e) => setScheme(e.target.value)}
              placeholder="Enter Scheme"
              className="scheme-input"
            />
          </div>

          {error && <p className="add-item-error">{error}</p>}
          <button type="submit" className="save-item-button">
            Save
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddItemModal
