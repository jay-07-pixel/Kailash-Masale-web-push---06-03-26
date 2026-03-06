import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './ManageSKUsModal.css'

const SKUS_COLLECTION = 'skus'

/** Product prefix = first word (e.g. "SM 200g" → "SM"). Used to group SKUs. */
function getSkuPrefix(name) {
  const part = (name || '').trim().split(/\s+/)[0]
  return part || (name || '').trim()
}

/** Sort SKUs by product prefix, then by full name (SM 50g, SM 100g, then JP...) */
function sortSkusByProduct(list) {
  return [...list].sort((a, b) => {
    const prefixA = getSkuPrefix(a.name)
    const prefixB = getSkuPrefix(b.name)
    const byPrefix = (prefixA || '').localeCompare(prefixB || '', undefined, { sensitivity: 'base' })
    if (byPrefix !== 0) return byPrefix
    return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  })
}

const ManageSKUsModal = ({ isOpen, onClose }) => {
  const [skus, setSkus] = useState([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState(null) // null | 'add' | { type: 'edit', id }
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    if (!isFirebaseConfigured || !db) {
      setLoading(false)
      return
    }
    setLoading(true)
    const unsub = onSnapshot(collection(db, SKUS_COLLECTION), (snapshot) => {
      setSkus(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [isOpen])

  const sortedSkus = useMemo(() => sortSkusByProduct(skus), [skus])

  const resetForm = () => {
    setFormMode(null)
    setName('')
    setError('')
  }

  const openAdd = () => {
    resetForm()
    setFormMode('add')
  }

  const openEdit = (sku) => {
    setName(sku.name || '')
    setFormMode({ type: 'edit', id: sku.id })
    setError('')
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    setError('')
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      setError('SKU name is required.')
      return
    }
    if (!db) {
      setError('Firebase is not configured.')
      return
    }
    setSaving(true)
    try {
      if (formMode === 'add') {
        await addDoc(collection(db, SKUS_COLLECTION), {
          name: trimmedName,
          createdAt: serverTimestamp(),
        })
        resetForm()
      } else if (formMode?.type === 'edit' && formMode?.id) {
        await updateDoc(doc(db, SKUS_COLLECTION, formMode.id), {
          name: trimmedName,
          updatedAt: serverTimestamp(),
        })
        resetForm()
      }
    } catch (err) {
      setError(err?.message || 'Failed to save SKU.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (skuId) => {
    if (!db || !skuId) return
    setSaving(true)
    setError('')
    try {
      await deleteDoc(doc(db, SKUS_COLLECTION, skuId))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err?.message || 'Failed to delete SKU.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="manage-skus-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="manage-skus-title">
      <div className="manage-skus-modal" onClick={(e) => e.stopPropagation()}>
        <div className="manage-skus-header">
          <h2 id="manage-skus-title" className="manage-skus-title">Manage SKUs</h2>
          <button type="button" className="manage-skus-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="manage-skus-body">
          {!isFirebaseConfigured || !db ? (
            <p className="manage-skus-message">Firebase is not configured. Add environment variables to save SKUs.</p>
          ) : (
            <>
              <div className="manage-skus-actions">
                <button type="button" className="manage-skus-add-btn" onClick={openAdd}>
                  + Add SKU
                </button>
              </div>

              {(formMode === 'add' || formMode?.type === 'edit') && (
                <form className="manage-skus-form" onSubmit={handleSave}>
                  <h3 className="manage-skus-form-title">{formMode === 'add' ? 'New SKU' : 'Edit SKU'}</h3>
                  <div className="manage-skus-form-row">
                    <label className="manage-skus-label">Name</label>
                    <input
                      type="text"
                      className="manage-skus-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Red Chilli Powder 500g"
                      required
                      autoFocus
                    />
                  </div>
                  {error && <p className="manage-skus-error" role="alert">{error}</p>}
                  <div className="manage-skus-form-actions">
                    <button type="button" className="manage-skus-btn manage-skus-btn-secondary" onClick={resetForm}>
                      Cancel
                    </button>
                    <button type="submit" className="manage-skus-btn manage-skus-btn-primary" disabled={saving}>
                      {saving ? 'Saving…' : formMode === 'add' ? 'Add SKU' : 'Save'}
                    </button>
                  </div>
                </form>
              )}

              <div className="manage-skus-list-wrap">
                <h3 className="manage-skus-list-title">SKUs ({skus.length})</h3>
                {loading ? (
                  <p className="manage-skus-message">Loading SKUs…</p>
                ) : skus.length === 0 ? (
                  <p className="manage-skus-message">No SKUs yet. Add one above.</p>
                ) : (
                  <ul className="manage-skus-list">
                    {sortedSkus.map((sku) => (
                      <li key={sku.id} className="manage-skus-item">
                        <div className="manage-skus-item-main">
                          <span className="manage-skus-item-name">{sku.name || '—'}</span>
                        </div>
                        <div className="manage-skus-item-actions">
                          <button
                            type="button"
                            className="manage-skus-item-btn manage-skus-edit"
                            onClick={() => openEdit(sku)}
                            aria-label="Edit"
                          >
                            Edit
                          </button>
                          {deleteConfirm === sku.id ? (
                            <>
                              <span className="manage-skus-confirm-text">Delete?</span>
                              <button
                                type="button"
                                className="manage-skus-item-btn manage-skus-delete-confirm"
                                onClick={() => handleDelete(sku.id)}
                                disabled={saving}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                className="manage-skus-item-btn manage-skus-cancel"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="manage-skus-item-btn manage-skus-delete"
                              onClick={() => setDeleteConfirm(sku.id)}
                              aria-label="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageSKUsModal
