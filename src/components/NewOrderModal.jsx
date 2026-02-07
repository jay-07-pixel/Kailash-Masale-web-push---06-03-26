import React, { useState } from 'react'
import AddItemModal from './AddItemModal'
import './NewOrderModal.css'

const NewOrderModal = ({ isOpen, onClose }) => {
  const [selectedDistributor, setSelectedDistributor] = useState('')
  const [items, setItems] = useState([{ id: 1 }])
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)

  const handleAddItem = () => {
    setIsAddItemModalOpen(true)
  }

  const handleSaveItem = (itemData) => {
    // Find the first empty item and fill it, or add a new one
    const emptyItemIndex = items.findIndex(
      (item) => !item.sku && !item.kg && !item.scheme
    )
    
    if (emptyItemIndex !== -1) {
      // Update existing empty item
      const updatedItems = [...items]
      updatedItems[emptyItemIndex] = { ...updatedItems[emptyItemIndex], ...itemData }
      setItems(updatedItems)
    } else {
      // Add new item
      setItems([...items, { id: items.length + 1, ...itemData }])
    }
    // Add a new empty item for the next entry
    setItems((prev) => [...prev, { id: prev.length + 1 }])
  }

  const handleRemoveItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
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
                <option value="stamford">Stamford Branch</option>
                <option value="dunder">Dunder Supply Co.</option>
                <option value="vance">Vance Partners</option>
                <option value="metro">M Metro Trades</option>
                <option value="shakti">S Shakti Trades</option>
                <option value="global">G Global Mart</option>
              </select>
              <img src="/drop-down-icon.png" alt="" className="drop-down-icon-img" />
            </div>
          </div>

          <div className="add-items-section">
            <div className="section-label">Add Item</div>
            {items.map((item, index) => (
              <div key={item.id} className="item-row">
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
                      className="remove-item-button"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button className="add-item-button" onClick={handleAddItem}>
                    <span className="add-icon">+</span>
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="save-button" onClick={onClose}>
            Save
          </button>
          <button className="submit-button">Submit</button>
        </div>
      </div>
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  )
}

export default NewOrderModal
