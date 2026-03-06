import React, { useState, useEffect, useRef, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './AddItemModal.css'

const SKUS_COLLECTION = 'skus'

/** Product prefix = first word (e.g. "SM 200g" → "SM"). Used to group SKUs. */
function getSkuPrefix(name) {
  const part = (name || '').trim().split(/\s+/)[0]
  return part || (name || '').trim()
}

/** Sort SKUs by product prefix, then by full name within each group (SM 50g, SM 100g, SM 200g, then JP...) */
function sortSkusByProduct(list) {
  return [...list].sort((a, b) => {
    const prefixA = getSkuPrefix(a.name)
    const prefixB = getSkuPrefix(b.name)
    const byPrefix = (prefixA || '').localeCompare(prefixB || '', undefined, { sensitivity: 'base' })
    if (byPrefix !== 0) return byPrefix
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  })
}

const AddItemModal = ({ isOpen, onClose, onSave }) => {
  const [skus, setSkus] = useState([])
  const [sku, setSku] = useState('') // selected SKU name
  const [kg, setKg] = useState('')
  const [scheme, setScheme] = useState('')
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isOpen || !isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, SKUS_COLLECTION), (snapshot) => {
      setSkus(snapshot.docs.map((d) => ({ id: d.id, name: (d.data().name || '').trim() })).filter((s) => s.name))
    })
    return () => unsub()
  }, [isOpen])

  const filteredSkus = useMemo(() => {
    const list = searchQuery.trim()
      ? skus.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
      : skus
    return sortSkusByProduct(list)
  }, [skus, searchQuery])

  useEffect(() => {
    if (!dropdownOpen) setSearchQuery('')
  }, [dropdownOpen])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

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
    setDropdownOpen(false)
    if (typeof onClose === 'function') onClose()
  }

  const handleClose = () => {
    setSku('')
    setKg('')
    setScheme('')
    setDropdownOpen(false)
    setSearchQuery('')
    onClose()
  }

  const handleSelectSku = (name) => {
    setSku(name)
    setDropdownOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="add-item-overlay" onClick={handleClose}>
      <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
        <form className="add-item-form" onSubmit={handleSave}>
          <div className="form-field">
            <label className="field-label">SKU</label>
            <div className="add-item-sku-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="add-item-sku-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-label="Select SKU"
              >
                <span className={sku ? 'add-item-sku-trigger-value' : 'add-item-sku-trigger-placeholder'}>
                  {sku || 'Select SKU'}
                </span>
                <img src="/drop-down-icon.png" alt="" className="add-item-sku-chevron" aria-hidden />
              </button>
              {dropdownOpen && (
                <div className="add-item-sku-panel" role="listbox">
                  <div className="add-item-sku-search-wrap">
                    <input
                      type="text"
                      className="add-item-sku-search"
                      placeholder="Search SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      autoFocus
                      aria-label="Search SKUs"
                    />
                  </div>
                  <div className="add-item-sku-list">
                    {filteredSkus.length === 0 ? (
                      <div className="add-item-sku-empty">
                        {skus.length === 0 ? 'No SKUs in database. Add them in Manage SKUs.' : 'No matching SKUs.'}
                      </div>
                    ) : (
                      filteredSkus.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`add-item-sku-option ${s.name === sku ? 'selected' : ''}`}
                          onClick={() => handleSelectSku(s.name)}
                          role="option"
                          aria-selected={s.name === sku}
                        >
                          {s.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
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

          {error && <p className="add-item-error" role="alert">{error}</p>}
          <button type="submit" className="save-item-button">
            Save
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddItemModal
