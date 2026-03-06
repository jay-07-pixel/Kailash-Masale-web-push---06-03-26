import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import './MasterSheetPage.css'

const MASTER_SHEETS_COLLECTION = 'master_sheets'
const EMPLOYEES_COLLECTION = 'employees'

const emptyRow = () => ({ from: '', to: '', oneWayTA: '', da: '', nighthault: '' })

function MasterSheetPage() {
  const { employeeId } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [addingNew, setAddingNew] = useState(false)
  const [newRow, setNewRow] = useState(emptyRow())
  const [savingNew, setSavingNew] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [editRow, setEditRow] = useState(emptyRow())
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!employeeId || !isFirebaseConfigured || !db) {
      setLoading(false)
      return
    }
    const unsubEmp = onSnapshot(doc(db, EMPLOYEES_COLLECTION, employeeId), (snap) => {
      setEmployee(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    }, () => setEmployee(null))
    const unsubSheet = onSnapshot(doc(db, MASTER_SHEETS_COLLECTION, employeeId), (snap) => {
      const data = snap.exists() ? snap.data() : {}
      setRows(Array.isArray(data.rows) ? data.rows : [])
      setLoading(false)
    }, () => { setRows([]); setLoading(false) })
    return () => { unsubEmp(); unsubSheet() }
  }, [employeeId])

  const updateNewRow = (field, value) => setNewRow((r) => ({ ...r, [field]: value }))
  const updateEditRow = (field, value) => setEditRow((r) => ({ ...r, [field]: value }))

  const handleAddRow = async () => {
    const row = {
      from: (newRow.from || '').trim(),
      to: (newRow.to || '').trim(),
      oneWayTA: newRow.oneWayTA === '' ? '' : Number(newRow.oneWayTA),
      da: (newRow.da || '').trim(),
      nighthault: (newRow.nighthault || '').trim(),
    }
    if (!row.from && !row.to) return
    setSaveError(null)
    setSavingNew(true)
    try {
      const nextRows = [...rows, row]
      await setDoc(doc(db, MASTER_SHEETS_COLLECTION, employeeId), { rows: nextRows })
      setRows(nextRows)
      setNewRow(emptyRow())
      setAddingNew(false)
    } catch (err) {
      console.error(err)
      setSaveError(err?.message || 'Failed to save')
    } finally {
      setSavingNew(false)
    }
  }

  const startEdit = (index) => {
    setEditingIndex(index)
    setEditRow({ ...rows[index] })
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditRow(emptyRow())
  }

  const handleSaveEdit = async () => {
    if (editingIndex == null) return
    const row = {
      from: (editRow.from || '').trim(),
      to: (editRow.to || '').trim(),
      oneWayTA: editRow.oneWayTA === '' ? '' : Number(editRow.oneWayTA),
      da: (editRow.da || '').trim(),
      nighthault: (editRow.nighthault || '').trim(),
    }
    setSaveError(null)
    try {
      const nextRows = rows.map((r, i) => (i === editingIndex ? row : r))
      await setDoc(doc(db, MASTER_SHEETS_COLLECTION, employeeId), { rows: nextRows })
      setRows(nextRows)
      setEditingIndex(null)
    } catch (err) {
      console.error(err)
      setSaveError(err?.message || 'Failed to save')
    }
  }

  const handleDelete = async (index) => {
    const nextRows = rows.filter((_, i) => i !== index)
    setSaveError(null)
    try {
      await setDoc(doc(db, MASTER_SHEETS_COLLECTION, employeeId), { rows: nextRows })
      setRows(nextRows)
      if (editingIndex === index) setEditingIndex(null)
      else if (editingIndex != null && editingIndex > index) setEditingIndex(editingIndex - 1)
    } catch (err) {
      console.error(err)
      setSaveError(err?.message || 'Failed to delete')
    }
  }

  if (loading) {
    return (
      <div className="main-content">
        <UniversalHeader title="Master Sheet" />
        <div className="content-wrapper">
          <p className="master-sheet-loading">Loading…</p>
        </div>
      </div>
    )
  }

  if (!employeeId || !employee) {
    return (
      <div className="main-content">
        <UniversalHeader title="Master Sheet" />
        <div className="content-wrapper">
          <p className="master-sheet-empty-msg">Employee not found.</p>
          <button type="button" className="master-sheet-back-btn" onClick={() => navigate('/my-team')}>Back to My Team</button>
        </div>
      </div>
    )
  }

  const employeeName = employee.salesPersonName || employee.email || 'Employee'

  return (
    <div className="main-content">
      <UniversalHeader title={`Master Sheet — ${employeeName}`} />
      <div className="content-wrapper">
        <div className="master-sheet-toolbar">
          <button type="button" className="master-sheet-back-btn" onClick={() => navigate('/my-team')}>
            ← Back to My Team
          </button>
          {!addingNew && (
            <button type="button" className="master-sheet-add-btn" onClick={() => setAddingNew(true)}>
              + Add row
            </button>
          )}
        </div>
        {saveError && <p className="master-sheet-error" role="alert">{saveError}</p>}
        <div className="master-sheet-card">
          <div className="master-sheet-table-wrap">
            <table className="master-sheet-table">
              <thead>
                <tr>
                  <th className="master-sheet-th master-sheet-th-from">From</th>
                  <th className="master-sheet-th master-sheet-th-to">TO</th>
                  <th className="master-sheet-th master-sheet-th-num">One way TA</th>
                  <th className="master-sheet-th master-sheet-th-num">DA</th>
                  <th className="master-sheet-th master-sheet-th-num">Nighthault</th>
                  <th className="master-sheet-th master-sheet-th-actions">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="master-sheet-row">
                    {editingIndex === i ? (
                      <>
                        <td className="master-sheet-td">
                          <input type="text" className="master-sheet-input" value={editRow.from} onChange={(e) => updateEditRow('from', e.target.value)} placeholder="From" />
                        </td>
                        <td className="master-sheet-td">
                          <input type="text" className="master-sheet-input" value={editRow.to} onChange={(e) => updateEditRow('to', e.target.value)} placeholder="To" />
                        </td>
                        <td className="master-sheet-td master-sheet-td-num">
                          <input type="number" step="any" className="master-sheet-input master-sheet-input-num" value={editRow.oneWayTA} onChange={(e) => updateEditRow('oneWayTA', e.target.value)} placeholder="—" />
                        </td>
                        <td className="master-sheet-td master-sheet-td-num">
                          <input type="text" className="master-sheet-input master-sheet-input-num" value={editRow.da} onChange={(e) => updateEditRow('da', e.target.value)} placeholder="—" />
                        </td>
                        <td className="master-sheet-td master-sheet-td-num">
                          <input type="text" className="master-sheet-input master-sheet-input-num" value={editRow.nighthault} onChange={(e) => updateEditRow('nighthault', e.target.value)} placeholder="—" />
                        </td>
                        <td className="master-sheet-td master-sheet-td-actions">
                          <button type="button" className="master-sheet-btn-inline" onClick={handleSaveEdit}>Save</button>
                          <button type="button" className="master-sheet-btn-inline master-sheet-btn-cancel" onClick={cancelEdit}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="master-sheet-td master-sheet-td-from">{row.from || '—'}</td>
                        <td className="master-sheet-td master-sheet-td-to">{row.to || '—'}</td>
                        <td className="master-sheet-td master-sheet-td-num">{row.oneWayTA !== '' && row.oneWayTA != null ? row.oneWayTA : '—'}</td>
                        <td className="master-sheet-td master-sheet-td-num">{row.da || '—'}</td>
                        <td className="master-sheet-td master-sheet-td-num">{row.nighthault || '—'}</td>
                        <td className="master-sheet-td master-sheet-td-actions">
                          <div className="master-sheet-action-btns">
                            <button type="button" className="master-sheet-action-btn master-sheet-action-edit" onClick={() => startEdit(i)} aria-label="Edit">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button type="button" className="master-sheet-action-btn master-sheet-action-delete" onClick={() => handleDelete(i)} aria-label="Delete">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {addingNew && (
                  <tr className="master-sheet-row master-sheet-row-new">
                    <td className="master-sheet-td">
                      <input type="text" className="master-sheet-input" value={newRow.from} onChange={(e) => updateNewRow('from', e.target.value)} placeholder="From" />
                    </td>
                    <td className="master-sheet-td">
                      <input type="text" className="master-sheet-input" value={newRow.to} onChange={(e) => updateNewRow('to', e.target.value)} placeholder="To" />
                    </td>
                    <td className="master-sheet-td master-sheet-td-num">
                      <input type="number" step="any" className="master-sheet-input master-sheet-input-num" value={newRow.oneWayTA} onChange={(e) => updateNewRow('oneWayTA', e.target.value)} placeholder="—" />
                    </td>
                    <td className="master-sheet-td master-sheet-td-num">
                      <input type="text" className="master-sheet-input master-sheet-input-num" value={newRow.da} onChange={(e) => updateNewRow('da', e.target.value)} placeholder="—" />
                    </td>
                    <td className="master-sheet-td master-sheet-td-num">
                      <input type="text" className="master-sheet-input master-sheet-input-num" value={newRow.nighthault} onChange={(e) => updateNewRow('nighthault', e.target.value)} placeholder="—" />
                    </td>
                    <td className="master-sheet-td master-sheet-td-actions">
                      <button type="button" className="master-sheet-btn-inline" onClick={handleAddRow} disabled={savingNew}>{savingNew ? 'Saving…' : 'Save'}</button>
                      <button type="button" className="master-sheet-btn-inline master-sheet-btn-cancel" onClick={() => { setAddingNew(false); setNewRow(emptyRow()) }} disabled={savingNew}>Cancel</button>
                    </td>
                  </tr>
                )}
                {rows.length === 0 && !addingNew && (
                  <tr>
                    <td colSpan={6} className="master-sheet-empty">No rows yet. Click “Add row” to add From / TO / One way TA / DA / Nighthault for this employee.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterSheetPage
