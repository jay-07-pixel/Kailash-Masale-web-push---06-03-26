import React, { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import DistributorSummaryCards from '../components/DistributorSummaryCards'
import DistributorTable from '../components/DistributorTable'
import './DistributorPage.css'

const EMPLOYEES_COLLECTION = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'

function DistributorPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [employeesFromFirebase, setEmployeesFromFirebase] = useState([])
  const [distributorsFromFirebase, setDistributorsFromFirebase] = useState([])
  const [assignStaffModal, setAssignStaffModal] = useState(null)
  const [assignStaffEmployeeId, setAssignStaffEmployeeId] = useState('')
  const [createForm, setCreateForm] = useState({
    employeeIds: [],
    distributorName: '',
    bits: [],
    zone: '',
  })
  const [bitInput, setBitInput] = useState('')
  const [createEmployeeSelect, setCreateEmployeeSelect] = useState('')
  const [editDistributor, setEditDistributor] = useState(null)
  const [editForm, setEditForm] = useState({ employeeIds: [], distributorName: '', bits: [], zone: '' })
  const [editBitInput, setEditBitInput] = useState('')
  const [editEmployeeSelect, setEditEmployeeSelect] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setEmployeesFromFirebase(list)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setDistributorsFromFirebase(list)
    })
    return () => unsub()
  }, [])

  const updateCreateForm = (field, value) => setCreateForm((f) => ({ ...f, [field]: value }))

  const buildDistributorPayload = (status) => ({
    assignedEmployeeIds: Array.isArray(createForm.employeeIds) ? createForm.employeeIds : [],
    distributorName: (createForm.distributorName || '').trim(),
    bits: Array.isArray(createForm.bits) ? createForm.bits.filter((b) => (b || '').trim()) : [],
    zone: (createForm.zone || '').trim(),
    status,
    createdAt: serverTimestamp(),
  })

  const handleCreateSave = async () => {
    if (!createForm.distributorName.trim()) return
    if (db) {
      try {
        const ref = await addDoc(collection(db, DISTRIBUTORS_COLLECTION), buildDistributorPayload('draft'))
        const ids = createForm.employeeIds || []
        for (const empId of ids) {
          await updateDoc(doc(db, EMPLOYEES_COLLECTION, empId), {
            assignedDistributorIds: arrayUnion(ref.id),
          })
        }
        setCreateForm({ employeeIds: [], distributorName: '', bits: [], zone: '' })
        setBitInput('')
        setCreateEmployeeSelect('')
        setIsCreateModalOpen(false)
      } catch (err) {
        console.error('Failed to save distributor:', err)
      }
    } else {
      setCreateForm({ employeeIds: [], distributorName: '', bits: [], zone: '' })
      setBitInput('')
      setCreateEmployeeSelect('')
      setIsCreateModalOpen(false)
    }
  }

  const handleCreateSubmit = async () => {
    if (!createForm.distributorName.trim()) return
    if (db) {
      try {
        const ref = await addDoc(collection(db, DISTRIBUTORS_COLLECTION), buildDistributorPayload('active'))
        const ids = createForm.employeeIds || []
        for (const empId of ids) {
          await updateDoc(doc(db, EMPLOYEES_COLLECTION, empId), {
            assignedDistributorIds: arrayUnion(ref.id),
          })
        }
        setCreateForm({ employeeIds: [], distributorName: '', bits: [], zone: '' })
        setBitInput('')
        setCreateEmployeeSelect('')
        setIsCreateModalOpen(false)
      } catch (err) {
        console.error('Failed to submit distributor:', err)
      }
    } else {
      setCreateForm({ employeeIds: [], distributorName: '', bits: [], zone: '' })
      setBitInput('')
      setCreateEmployeeSelect('')
      setIsCreateModalOpen(false)
    }
  }

  const handleAssignStaff = async () => {
    if (!assignStaffModal || !assignStaffEmployeeId || !db) return
    const currentIds = assignStaffModal.assignedEmployeeIds || []
    if (currentIds.includes(assignStaffEmployeeId)) {
      setAssignStaffEmployeeId('')
      return
    }
    const mergedIds = [...currentIds, assignStaffEmployeeId]
    try {
      await updateDoc(doc(db, DISTRIBUTORS_COLLECTION, assignStaffModal.docId), {
        assignedEmployeeIds: mergedIds,
      })
      await updateDoc(doc(db, EMPLOYEES_COLLECTION, assignStaffEmployeeId), {
        assignedDistributorIds: arrayUnion(assignStaffModal.docId),
      })
      setAssignStaffEmployeeId('')
      setAssignStaffModal(null)
    } catch (err) {
      console.error('Failed to assign staff:', err)
    }
  }

  const handleEdit = (distributor) => {
    const firestoreDoc = distributorsFromFirebase.find((d) => d.id === distributor.docId)
    if (!firestoreDoc) return
    setEditDistributor(firestoreDoc)
    setEditForm({
      distributorName: firestoreDoc.distributorName || '',
      bits: Array.isArray(firestoreDoc.bits) ? [...firestoreDoc.bits] : firestoreDoc.bitName ? [firestoreDoc.bitName] : [],
      zone: firestoreDoc.zone || '',
      employeeIds: Array.isArray(firestoreDoc.assignedEmployeeIds) ? [...firestoreDoc.assignedEmployeeIds] : [],
    })
    setEditBitInput('')
    setEditEmployeeSelect('')
  }

  const updateEditForm = (field, value) => setEditForm((f) => ({ ...f, [field]: value }))

  const buildEditPayload = () => ({
    distributorName: (editForm.distributorName || '').trim(),
    bits: Array.isArray(editForm.bits) ? editForm.bits.filter((b) => (b || '').trim()) : [],
    zone: (editForm.zone || '').trim(),
    assignedEmployeeIds: Array.isArray(editForm.employeeIds) ? editForm.employeeIds : [],
  })

  const handleEditSave = async () => {
    if (!editDistributor || !editForm.distributorName.trim()) return
    if (!db) {
      alert('Firebase is not connected. Edit could not be saved.')
      return
    }
    const previousIds = editDistributor.assignedEmployeeIds || []
    const newIds = editForm.employeeIds || []
    try {
      await updateDoc(doc(db, DISTRIBUTORS_COLLECTION, editDistributor.id), buildEditPayload())
      for (const empId of previousIds) {
        if (!newIds.includes(empId)) {
          await updateDoc(doc(db, EMPLOYEES_COLLECTION, empId), {
            assignedDistributorIds: arrayRemove(editDistributor.id),
          })
        }
      }
      for (const empId of newIds) {
        if (!previousIds.includes(empId)) {
          await updateDoc(doc(db, EMPLOYEES_COLLECTION, empId), {
            assignedDistributorIds: arrayUnion(editDistributor.id),
          })
        }
      }
      setEditDistributor(null)
    } catch (err) {
      console.error('Failed to update distributor:', err)
      alert('Failed to save changes to Firebase. Please try again.')
    }
  }

  const handleDelete = async (distributor) => {
    if (!window.confirm(`Delete distributor "${distributor.name}"? This cannot be undone.`)) return
    if (!db) {
      alert('Firebase is not connected. Delete could not be performed.')
      return
    }
    try {
      const firestoreDoc = distributorsFromFirebase.find((d) => d.id === distributor.docId)
      const assignedIds = (firestoreDoc && firestoreDoc.assignedEmployeeIds) || []
      await deleteDoc(doc(db, DISTRIBUTORS_COLLECTION, distributor.docId))
      for (const empId of assignedIds) {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, empId), {
          assignedDistributorIds: arrayRemove(distributor.docId),
        })
      }
    } catch (err) {
      console.error('Failed to delete distributor:', err)
      alert('Failed to delete from Firebase. Please try again.')
    }
  }

  const handleSaveNote = async (docId, noteText) => {
    if (!db) {
      alert('Firebase is not connected. Note could not be saved.')
      return
    }
    try {
      await updateDoc(doc(db, DISTRIBUTORS_COLLECTION, docId), { note: noteText || '' })
    } catch (err) {
      console.error('Failed to save note:', err)
      alert('Failed to save note to Firebase. Please try again.')
    }
  }

  const filteredDistributors = React.useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim()
    if (!q) return distributorsFromFirebase
    return distributorsFromFirebase.filter((d) => {
      const name = (d.distributorName || '').toLowerCase()
      const zone = (d.zone || '').toLowerCase()
      const bits = Array.isArray(d.bits) ? d.bits : (d.bitName ? [d.bitName] : [])
      const bitMatch = bits.some((b) => (b || '').toLowerCase().includes(q))
      if (name.includes(q) || zone.includes(q) || bitMatch) return true
      const assignedIds = d.assignedEmployeeIds || []
      const staffMatch = assignedIds.some((id) => {
        const emp = employeesFromFirebase.find((e) => e.id === id)
        if (!emp) return false
        const empName = (emp.salesPersonName || emp.email || '').toLowerCase()
        return empName.includes(q)
      })
      return staffMatch
    })
  }, [distributorsFromFirebase, employeesFromFirebase, searchQuery])

  return (
    <div className="main-content">
      <UniversalHeader title="Distributor" />
      <div className="content-wrapper">
        <div className="distributor-page-header">
          <div className="page-header-left">
            <div className="header-controls">
              <div className="search-bar-container">
                <img 
                  src="/search-icon.png" 
                  alt="Search" 
                  className="search-icon"
                />
                <input
                  type="text"
                  placeholder="Search Employee or Distributor"
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search Employee or Distributor"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="add-distributor-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="plus-icon">+</span>
            Create a Distributor
          </button>
        </div>

        <DistributorSummaryCards distributors={filteredDistributors} allDistributorsForTrend={distributorsFromFirebase} />
        <DistributorTable
          distributors={filteredDistributors}
          employees={employeesFromFirebase}
          onAssignStaff={(distributor) => setAssignStaffModal({ docId: distributor.docId, name: distributor.name, assignedEmployeeIds: distributor.assignedEmployeeIds || [] })}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSaveNote={handleSaveNote}
        />
      </div>
      
      {isCreateModalOpen && (
        <div
          className="create-distributor-overlay"
          onClick={() => setIsCreateModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-distributor-title"
        >
          <div className="create-distributor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-distributor-modal-header">
              <button
                type="button"
                className="create-distributor-back"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close"
              >
                ←
              </button>
              <div>
                <h2 id="create-distributor-title" className="create-distributor-title">Create Distributor</h2>
                <p className="create-distributor-subtitle">Add a new distributor and optionally assign a team member.</p>
              </div>
            </div>
            <div className="create-distributor-form">
              <div className="create-distributor-field">
                <label className="create-distributor-label" htmlFor="create-dist-name">Distributor Name</label>
                <input
                  id="create-dist-name"
                  type="text"
                  className="create-distributor-input"
                  placeholder="e.g. ABC Wholesale"
                  value={createForm.distributorName}
                  onChange={(e) => updateCreateForm('distributorName', e.target.value)}
                  aria-label="Distributor name"
                />
              </div>
              <div className="create-distributor-form-row">
                <div className="create-distributor-field">
                  <label className="create-distributor-label" htmlFor="create-dist-bit">Bit Name (optional)</label>
                  <input
                    id="create-dist-bit"
                    type="text"
                    className="create-distributor-input"
                    placeholder="Type a bit and press Enter to add"
                    value={bitInput}
                    onChange={(e) => setBitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target.value || '').trim()
                        if (val) {
                          setCreateForm((f) => ({ ...f, bits: [...(f.bits || []), val] }))
                          setBitInput('')
                        }
                      }
                    }}
                    aria-label="Bit name"
                  />
                  {createForm.bits && createForm.bits.length > 0 && (
                    <div className="bits-chips">
                      {createForm.bits.map((bit, idx) => (
                        <span key={`${bit}-${idx}`} className="bit-chip">
                          <span>{bit}</span>
                          <button
                            type="button"
                            className="bit-chip-remove"
                            onClick={() => setCreateForm((f) => ({ ...f, bits: f.bits.filter((_, i) => i !== idx) }))}
                            aria-label={`Remove ${bit}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="create-distributor-field">
                  <label className="create-distributor-label" htmlFor="create-dist-zone">Zone</label>
                  <input
                    id="create-dist-zone"
                    type="text"
                    className="create-distributor-input"
                    placeholder="e.g. Zone A"
                    value={createForm.zone}
                    onChange={(e) => updateCreateForm('zone', e.target.value)}
                    aria-label="Zone"
                  />
                </div>
              </div>
              <div className="create-distributor-field">
                <label className="create-distributor-label" htmlFor="create-dist-employee">Assign Employees</label>
                <select
                  id="create-dist-employee"
                  className="create-distributor-select"
                  value={createEmployeeSelect}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id && !(createForm.employeeIds || []).includes(id)) {
                      updateCreateForm('employeeIds', [...(createForm.employeeIds || []), id])
                      setCreateEmployeeSelect('')
                    }
                  }}
                  aria-label="Add employee"
                >
                  <option value="">Add an employee (optional)</option>
                  {employeesFromFirebase
                    .filter((emp) => !(createForm.employeeIds || []).includes(emp.id))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.salesPersonName || emp.email || emp.id}
                      </option>
                    ))}
                </select>
                {(createForm.employeeIds || []).length > 0 && (
                  <div className="bits-chips employee-chips">
                    {(createForm.employeeIds || []).map((empId) => {
                      const emp = employeesFromFirebase.find((e) => e.id === empId)
                      const label = emp ? (emp.salesPersonName || emp.email || emp.id) : empId
                      return (
                        <span key={empId} className="bit-chip">
                          <span>{label}</span>
                          <button
                            type="button"
                            className="bit-chip-remove"
                            onClick={() => setCreateForm((f) => ({ ...f, employeeIds: (f.employeeIds || []).filter((id) => id !== empId) }))}
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="create-distributor-actions">
              <button type="button" className="create-distributor-btn create-distributor-btn-secondary" onClick={handleCreateSave}>
                Save as draft
              </button>
              <button type="button" className="create-distributor-btn create-distributor-btn-primary" onClick={handleCreateSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {editDistributor && (
        <div
          className="create-distributor-overlay"
          onClick={() => setEditDistributor(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-distributor-title"
        >
          <div className="create-distributor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-distributor-modal-header">
              <button
                type="button"
                className="create-distributor-back"
                onClick={() => setEditDistributor(null)}
                aria-label="Close"
              >
                ←
              </button>
              <div>
                <h2 id="edit-distributor-title" className="create-distributor-title">Edit Distributor</h2>
                <p className="create-distributor-subtitle">Update distributor details.</p>
              </div>
            </div>
            <div className="create-distributor-form">
              <div className="create-distributor-field">
                <label className="create-distributor-label" htmlFor="edit-dist-name">Distributor Name</label>
                <input
                  id="edit-dist-name"
                  type="text"
                  className="create-distributor-input"
                  placeholder="e.g. ABC Wholesale"
                  value={editForm.distributorName}
                  onChange={(e) => updateEditForm('distributorName', e.target.value)}
                  aria-label="Distributor name"
                />
              </div>
              <div className="create-distributor-form-row">
                <div className="create-distributor-field">
                  <label className="create-distributor-label" htmlFor="edit-dist-bit">Bit Name (optional)</label>
                  <input
                    id="edit-dist-bit"
                    type="text"
                    className="create-distributor-input"
                    placeholder="Type a bit and press Enter to add"
                    value={editBitInput}
                    onChange={(e) => setEditBitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const val = (e.target.value || '').trim()
                        if (val) {
                          updateEditForm('bits', [...(editForm.bits || []), val])
                          setEditBitInput('')
                        }
                      }
                    }}
                    aria-label="Bit name"
                  />
                  {editForm.bits && editForm.bits.length > 0 && (
                    <div className="bits-chips">
                      {editForm.bits.map((bit, idx) => (
                        <span key={`${bit}-${idx}`} className="bit-chip">
                          <span>{bit}</span>
                          <button
                            type="button"
                            className="bit-chip-remove"
                            onClick={() => updateEditForm('bits', editForm.bits.filter((_, i) => i !== idx))}
                            aria-label={`Remove ${bit}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="create-distributor-field">
                  <label className="create-distributor-label" htmlFor="edit-dist-zone">Zone</label>
                  <input
                    id="edit-dist-zone"
                    type="text"
                    className="create-distributor-input"
                    placeholder="e.g. Zone A"
                    value={editForm.zone}
                    onChange={(e) => updateEditForm('zone', e.target.value)}
                    aria-label="Zone"
                  />
                </div>
              </div>
              <div className="create-distributor-field">
                <label className="create-distributor-label" htmlFor="edit-dist-employee">Assign Employees</label>
                <select
                  id="edit-dist-employee"
                  className="create-distributor-select"
                  value={editEmployeeSelect}
                  onChange={(e) => {
                    const id = e.target.value
                    if (id && !(editForm.employeeIds || []).includes(id)) {
                      updateEditForm('employeeIds', [...(editForm.employeeIds || []), id])
                      setEditEmployeeSelect('')
                    }
                  }}
                  aria-label="Add employee"
                >
                  <option value="">Add an employee (optional)</option>
                  {employeesFromFirebase
                    .filter((emp) => !(editForm.employeeIds || []).includes(emp.id))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.salesPersonName || emp.email || emp.id}
                      </option>
                    ))}
                </select>
                {(editForm.employeeIds || []).length > 0 && (
                  <div className="bits-chips employee-chips">
                    {(editForm.employeeIds || []).map((empId) => {
                      const emp = employeesFromFirebase.find((e) => e.id === empId)
                      const label = emp ? (emp.salesPersonName || emp.email || emp.id) : empId
                      return (
                        <span key={empId} className="bit-chip">
                          <span>{label}</span>
                          <button
                            type="button"
                            className="bit-chip-remove"
                            onClick={() => updateEditForm('employeeIds', editForm.employeeIds.filter((id) => id !== empId))}
                            aria-label={`Remove ${label}`}
                          >
                            ×
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="create-distributor-actions">
              <button type="button" className="create-distributor-btn create-distributor-btn-secondary" onClick={() => setEditDistributor(null)}>
                Cancel
              </button>
              <button type="button" className="create-distributor-btn create-distributor-btn-primary" onClick={handleEditSave}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {assignStaffModal && (
        <div
          className="create-distributor-overlay"
          onClick={() => { setAssignStaffModal(null); setAssignStaffEmployeeId('') }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-staff-title"
        >
          <div className="create-distributor-modal assign-staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-distributor-modal-header">
              <button
                type="button"
                className="create-distributor-back"
                onClick={() => { setAssignStaffModal(null); setAssignStaffEmployeeId('') }}
                aria-label="Close"
              >
                ←
              </button>
              <h2 id="assign-staff-title" className="create-distributor-title">Assign Staff</h2>
            </div>
            <p className="assign-staff-subtitle">Assign an employee to <strong>{assignStaffModal.name}</strong></p>
            <div className="create-distributor-form">
              <div className="create-distributor-field">
                <label className="create-distributor-label">Select Employee</label>
                <select
                  className="create-distributor-select"
                  value={assignStaffEmployeeId}
                  onChange={(e) => setAssignStaffEmployeeId(e.target.value)}
                  aria-label="Select Employee"
                >
                  <option value="">Select Employee</option>
                  {employeesFromFirebase
                    .filter((emp) => !(assignStaffModal.assignedEmployeeIds || []).includes(emp.id))
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.salesPersonName || emp.email || emp.id}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="create-distributor-actions">
              <button
                type="button"
                className="create-distributor-btn create-distributor-btn-secondary"
                onClick={() => { setAssignStaffModal(null); setAssignStaffEmployeeId('') }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="create-distributor-btn create-distributor-btn-primary"
                onClick={handleAssignStaff}
                disabled={!assignStaffEmployeeId}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DistributorPage
