import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import './MyTeamPage.css'

const EMPLOYEES_COLLECTION = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const LOCATIONS_COLLECTION = 'locations'

const emptyForm = () => ({
  salesPersonName: '',
  email: '',
  defaultPassword: '',
  address: '',
  designation: '',
  salary: '',
  headQuarter: '',
  daHeadquarter: '',
  daOutstation: '',
  nh: '',
  taOwnVehicle: '',
  taLocalTransport: '',
})

function MyTeamPage() {
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm())
  const [distributors, setDistributors] = useState([])
  const [locations, setLocations] = useState([])
  const [assignLocationModal, setAssignLocationModal] = useState(false)
  const [assignLocationId, setAssignLocationId] = useState('')
  const [assignLocationSaving, setAssignLocationSaving] = useState(false)
  const [assignLocationError, setAssignLocationError] = useState(null)

  const getNextSr = () => (employees.length === 0 ? 1 : Math.max(...employees.map((e) => e.sr || 0)) + 1)

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setEmployees(list)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setDistributors(list)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, LOCATIONS_COLLECTION), (snapshot) => {
      setLocations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees
    const q = searchQuery.toLowerCase().trim()
    return employees.filter(
      (e) =>
        e.salesPersonName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q) ||
        e.address.toLowerCase().includes(q)
    )
  }, [employees, searchQuery])

  // Remove orphan location IDs from employee when viewing details (locations that no longer exist)
  useEffect(() => {
    if (!db || !selectedEmployee?.id || selectedEmployee.id.startsWith('local-') || locations.length === 0) return
    const ids = selectedEmployee.assignedLocationIds || []
    const validIds = ids.filter((locId) => locations.some((l) => l.id === locId))
    if (validIds.length >= ids.length) return
    const run = async () => {
      try {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, selectedEmployee.id), { assignedLocationIds: validIds })
        setSelectedEmployee((prev) => ({ ...prev, assignedLocationIds: validIds }))
      } catch (e) {
        console.warn('Cleanup orphan location IDs failed:', e?.message)
      }
    }
    run()
  }, [selectedEmployee?.id, selectedEmployee?.assignedLocationIds, locations])

  const getInitials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const handleAddMember = async () => {
    const sr = getNextSr()
    const payload = { sr, ...addForm }
    if (!payload.salesPersonName.trim() || !payload.email.trim()) return
    if (db) {
      try {
        await addDoc(collection(db, EMPLOYEES_COLLECTION), payload)
        setAddForm(emptyForm())
        setIsAddModalOpen(false)
      } catch (err) {
        console.error('Failed to add employee:', err)
      }
    } else {
      setEmployees((prev) => [...prev, { ...payload, id: `local-${Date.now()}` }])
      setAddForm(emptyForm())
      setIsAddModalOpen(false)
    }
  }

  const handleUpdateMember = async () => {
    if (!selectedEmployee || !editForm.salesPersonName.trim() || !editForm.email.trim()) return
    const updated = { ...selectedEmployee, ...editForm }
    if (db && selectedEmployee.id && !selectedEmployee.id.startsWith('local-')) {
      try {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, selectedEmployee.id), editForm)
        setSelectedEmployee(updated)
        setIsEditMode(false)
      } catch (err) {
        console.error('Failed to update employee:', err)
      }
    } else {
      setEmployees((prev) => prev.map((e) => (e.id === selectedEmployee.id || e.sr === selectedEmployee.sr ? updated : e)))
      setSelectedEmployee(updated)
      setIsEditMode(false)
    }
  }

  const handleAssignLocation = async () => {
    if (!selectedEmployee || !assignLocationId || !db || selectedEmployee.id?.startsWith('local-')) return
    setAssignLocationError(null)
    setAssignLocationSaving(true)
    try {
      await updateDoc(doc(db, EMPLOYEES_COLLECTION, selectedEmployee.id), {
        assignedLocationIds: arrayUnion(assignLocationId),
      })
      setSelectedEmployee((prev) => ({
        ...prev,
        assignedLocationIds: [...(prev.assignedLocationIds || []), assignLocationId],
      }))
      setAssignLocationModal(false)
      setAssignLocationId('')
    } catch (err) {
      console.error('Failed to assign location:', err)
      setAssignLocationError(err?.message || 'Failed to save to Firebase. Check connection and try again.')
    } finally {
      setAssignLocationSaving(false)
    }
  }

  const handleRemoveLocation = async (locationId) => {
    if (!selectedEmployee || !db || selectedEmployee.id?.startsWith('local-')) return
    try {
      await updateDoc(doc(db, EMPLOYEES_COLLECTION, selectedEmployee.id), {
        assignedLocationIds: arrayRemove(locationId),
      })
      setSelectedEmployee((prev) => ({
        ...prev,
        assignedLocationIds: (prev.assignedLocationIds || []).filter((id) => id !== locationId),
      }))
    } catch (err) {
      console.error('Failed to remove location:', err)
    }
  }

  const handleDeleteMember = async () => {
    if (!selectedEmployee) return
    if (!window.confirm(`Delete ${selectedEmployee.salesPersonName} from the team?`)) return
    if (db && selectedEmployee.id && !selectedEmployee.id.startsWith('local-')) {
      try {
        await deleteDoc(doc(db, EMPLOYEES_COLLECTION, selectedEmployee.id))
        setSelectedEmployee(null)
        setIsEditMode(false)
      } catch (err) {
        console.error('Failed to delete employee:', err)
      }
    } else {
      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id && e.sr !== selectedEmployee.sr))
      setSelectedEmployee(null)
      setIsEditMode(false)
    }
  }

  const openEditMode = () => {
    if (!selectedEmployee) return
    setEditForm({
      salesPersonName: selectedEmployee.salesPersonName,
      email: selectedEmployee.email,
      defaultPassword: selectedEmployee.defaultPassword || '',
      address: selectedEmployee.address || '',
      designation: selectedEmployee.designation || '',
      salary: selectedEmployee.salary || '',
      headQuarter: selectedEmployee.headQuarter || '',
      daHeadquarter: selectedEmployee.daHeadquarter || '',
      daOutstation: selectedEmployee.daOutstation || '',
      nh: selectedEmployee.nh || '',
      taOwnVehicle: selectedEmployee.taOwnVehicle || '',
      taLocalTransport: selectedEmployee.taLocalTransport || '',
    })
    setIsEditMode(true)
  }

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (isEditMode) setIsEditMode(false)
        else if (isAddModalOpen) setIsAddModalOpen(false)
        else setSelectedEmployee(null)
      }
    }
    if (selectedEmployee || isAddModalOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [selectedEmployee, isEditMode, isAddModalOpen])

  const updateAddForm = (field, value) => setAddForm((f) => ({ ...f, [field]: value }))
  const updateEditForm = (field, value) => setEditForm((f) => ({ ...f, [field]: value }))

  const renderFormField = (label, name, value, onChange, placeholder = '', type = 'text') => (
    <div key={name} className="my-team-form-group">
      <label className="my-team-form-label">{label}</label>
      <input
        type={type}
        className="my-team-form-input"
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )

  const renderAddForm = () => (
    <div className="my-team-add-form-row">
      <div className="my-team-add-form-section">
        <h4 className="my-team-detail-section-title">Profile</h4>
        <div className="my-team-add-form-fields">
          {renderFormField('Sales Person Name', 'salesPersonName', addForm.salesPersonName, updateAddForm, 'Full name')}
          {renderFormField('Email (For Login / District)', 'email', addForm.email, updateAddForm, 'email@example.com')}
          {renderFormField('Default Password', 'defaultPassword', addForm.defaultPassword, updateAddForm, 'Enter default password', 'password')}
          {renderFormField('Address', 'address', addForm.address, updateAddForm, 'Full address')}
          {renderFormField('Designation', 'designation', addForm.designation, updateAddForm, 'e.g. Sales Executive')}
        </div>
      </div>
      <div className="my-team-add-form-section">
        <h4 className="my-team-detail-section-title">Compensation</h4>
        <div className="my-team-add-form-fields">
          {renderFormField('Salary', 'salary', addForm.salary, updateAddForm, 'e.g. ₹ 45,000')}
          <div className="my-team-headquarter-spacer" />
          <h4 className="my-team-detail-section-title my-team-subsection-title">Head Quarter</h4>
          {renderFormField('Place', 'headQuarter', addForm.headQuarter, updateAddForm, 'e.g. Mumbai, Nagpur')}
        </div>
      </div>
      <div className="my-team-add-form-section">
        <h4 className="my-team-detail-section-title">Allowances</h4>
        <div className="my-team-add-form-fields">
          {renderFormField('DA Headquarter', 'daHeadquarter', addForm.daHeadquarter, updateAddForm, 'e.g. ₹ 200')}
          {renderFormField('DA Outstation', 'daOutstation', addForm.daOutstation, updateAddForm, 'e.g. ₹ 350')}
          {renderFormField('N/H', 'nh', addForm.nh, updateAddForm, 'e.g. ₹ 400')}
          {renderFormField('TA Own Vehicle', 'taOwnVehicle', addForm.taOwnVehicle, updateAddForm, 'e.g. ₹ 8')}
          {renderFormField('TA Local Transport', 'taLocalTransport', addForm.taLocalTransport, updateAddForm, 'e.g. ₹ 5')}
        </div>
      </div>
    </div>
  )

  const renderEditForm = () => (
    <div className="my-team-form-grid">
      {renderFormField('Sales Person Name', 'salesPersonName', editForm.salesPersonName, updateEditForm)}
      {renderFormField('Email (For Login / District)', 'email', editForm.email, updateEditForm)}
      {renderFormField('Default Password', 'defaultPassword', editForm.defaultPassword, updateEditForm, 'Enter default password', 'password')}
      {renderFormField('Address', 'address', editForm.address, updateEditForm)}
      {renderFormField('Designation', 'designation', editForm.designation, updateEditForm)}
      {renderFormField('Salary', 'salary', editForm.salary, updateEditForm)}
      {renderFormField('Head Quarter (Place)', 'headQuarter', editForm.headQuarter, updateEditForm)}
      {renderFormField('DA Headquarter', 'daHeadquarter', editForm.daHeadquarter, updateEditForm)}
      {renderFormField('DA Outstation', 'daOutstation', editForm.daOutstation, updateEditForm)}
      {renderFormField('N/H', 'nh', editForm.nh, updateEditForm)}
      {renderFormField('TA Own Vehicle', 'taOwnVehicle', editForm.taOwnVehicle, updateEditForm)}
      {renderFormField('TA Local Transport', 'taLocalTransport', editForm.taLocalTransport, updateEditForm)}
    </div>
  )

  return (
    <div className="main-content">
      <UniversalHeader title="My Team" />
      <div className="content-wrapper my-team-page">
        <header className="my-team-hero">
          <p className="my-team-subtitle">View and search your sales team</p>
          <div className="my-team-toolbar">
            <div className="my-team-search-wrap">
              <img src="/search-icon.png" alt="" className="my-team-search-icon" aria-hidden />
              <input
                type="search"
                placeholder="Search by name, email, designation or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="my-team-search-input"
                aria-label="Search employees"
              />
              {searchQuery ? (
                <>
                  <span className="my-team-result-badge">
                    {filteredEmployees.length} of {employees.length}
                  </span>
                  <button type="button" className="my-team-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear search">×</button>
                </>
              ) : (
                <span className="my-team-count-text">
                  {employees.length} team {employees.length === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>
            <button type="button" className="my-team-add-btn" onClick={() => setIsAddModalOpen(true)}>
              + Add Member
            </button>
          </div>
        </header>

        <section className="my-team-cards" aria-label="Team members">
          {filteredEmployees.length === 0 ? (
            <div className="my-team-empty">
              <div className="my-team-empty-icon" aria-hidden />
              <h3 className="my-team-empty-title">{employees.length === 0 ? 'No team members yet' : 'No matches found'}</h3>
              <p className="my-team-empty-text">
                {employees.length === 0 ? 'Add your first team member to get started.' : 'Try a different search term or clear the search to see all team members.'}
              </p>
              {employees.length === 0 ? (
                <button type="button" className="my-team-empty-btn" onClick={() => setIsAddModalOpen(true)}>Add Member</button>
              ) : (
                <button type="button" className="my-team-empty-btn" onClick={() => setSearchQuery('')}>Clear search</button>
              )}
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <article
                key={emp.id || emp.sr}
                className="my-team-card"
                onClick={() => setSelectedEmployee(emp)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEmployee(emp) } }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${emp.salesPersonName}, ${emp.designation}`}
              >
                <div className="my-team-card-avatar">{getInitials(emp.salesPersonName)}</div>
                <div className="my-team-card-info">
                  <h3 className="my-team-card-name">{emp.salesPersonName}</h3>
                  <p className="my-team-card-designation">{emp.designation || '—'}</p>
                  <p className="my-team-card-headquarter">{emp.headQuarter || '—'}</p>
                </div>
                <div className="my-team-card-actions">
                  <button type="button" className="my-team-card-cta" onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp) }}>View profile</button>
                  <button type="button" className="my-team-card-cta" onClick={(e) => { e.stopPropagation(); navigate(`/my-team/master-sheet/${emp.id}`) }}>View master</button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {/* Add Member Modal */}
      {isAddModalOpen && (
        <div className="my-team-modal-overlay" onClick={() => setIsAddModalOpen(false)} role="dialog" aria-modal="true" aria-labelledby="my-team-add-title">
          <div className="my-team-modal-content my-team-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-team-modal-header">
              <h2 id="my-team-add-title" className="my-team-modal-title">Add New Member</h2>
              <button type="button" className="my-team-modal-close" onClick={() => setIsAddModalOpen(false)} aria-label="Close"><span aria-hidden>×</span></button>
            </div>
            <div className="my-team-modal-body my-team-form-body">
              {renderAddForm()}
            </div>
            <div className="my-team-modal-footer">
              <button type="button" className="my-team-btn my-team-btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button type="button" className="my-team-btn my-team-btn-primary" onClick={handleAddMember}>Create New</button>
            </div>
          </div>
        </div>
      )}

      {/* View / Edit Detail Modal */}
      {selectedEmployee && (
        <div className="my-team-modal-overlay" onClick={() => !isEditMode && setSelectedEmployee(null)} role="dialog" aria-modal="true" aria-labelledby="my-team-modal-title">
          <div className="my-team-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="my-team-modal-header">
              <h2 id="my-team-modal-title" className="my-team-modal-title">{isEditMode ? 'Edit Member' : 'Employee Details'}</h2>
              <button type="button" className="my-team-modal-close" onClick={() => isEditMode ? setIsEditMode(false) : setSelectedEmployee(null)} aria-label="Close"><span aria-hidden>×</span></button>
            </div>
            <div className="my-team-modal-body">
              {isEditMode ? (
                renderEditForm()
              ) : (
                <>
                  <div className="my-team-modal-hero">
                    <div className="my-team-modal-avatar">{getInitials(selectedEmployee.salesPersonName)}</div>
                    <div className="my-team-modal-hero-text">
                      <div className="my-team-modal-name">{selectedEmployee.salesPersonName}</div>
                      <div className="my-team-modal-designation">{selectedEmployee.designation}</div>
                    </div>
                  </div>
                  <div className="my-team-detail-sections">
                    <div className="my-team-detail-section">
                      <h4 className="my-team-detail-section-title">Profile</h4>
                      <div className="my-team-detail-list">
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Sr</span><span className="my-team-detail-value">{selectedEmployee.sr}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Sales Person Name</span><span className="my-team-detail-value">{selectedEmployee.salesPersonName}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Email (For Login / District)</span><span className="my-team-detail-value">{selectedEmployee.email}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Default Password</span><span className="my-team-detail-value">{selectedEmployee.defaultPassword ? '••••••••' : '—'}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Address</span><span className="my-team-detail-value">{selectedEmployee.address}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Designation</span><span className="my-team-detail-value">{selectedEmployee.designation}</span></div>
                        <div className="my-team-detail-item">
                          <span className="my-team-detail-label">Assigned Distributors</span>
                          <span className="my-team-detail-value">
                            {(selectedEmployee.assignedDistributorIds?.length > 0)
                              ? (selectedEmployee.assignedDistributorIds || [])
                                  .map((distId) => {
                                    const d = distributors.find((dist) => dist.id === distId)
                                    return d?.distributorName || d?.name || '—'
                                  })
                                  .filter((name) => name !== '—')
                                  .join(', ') || '—'
                              : '—'}
                          </span>
                        </div>
                        <div className="my-team-detail-item my-team-detail-item-locations">
                          <span className="my-team-detail-label">Assigned Locations</span>
                          <span className="my-team-detail-value">
                            {(selectedEmployee.assignedLocationIds?.length > 0) ? (
                              (() => {
                                const validIds = (selectedEmployee.assignedLocationIds || []).filter(
                                  (locId) => locations.find((l) => l.id === locId)?.name
                                )
                                return validIds.length > 0 ? (
                                  <ul className="my-team-location-tags">
                                    {validIds.map((locId) => {
                                      const loc = locations.find((l) => l.id === locId)
                                      const name = loc?.name || ''
                                      return (
                                        <li key={locId} className="my-team-location-tag">
                                          <span>{name}</span>
                                          {db && !selectedEmployee.id?.startsWith('local-') && (
                                            <button
                                              type="button"
                                              className="my-team-location-remove"
                                              onClick={(e) => { e.stopPropagation(); handleRemoveLocation(locId) }}
                                              aria-label={`Remove ${name}`}
                                            >
                                              ×
                                            </button>
                                          )}
                                        </li>
                                      )
                                    })}
                                  </ul>
                                ) : '—'
                              })()
                            ) : '—'}
                            {db && !selectedEmployee.id?.startsWith('local-') && (
                              <button
                                type="button"
                                className="my-team-assign-location-btn"
                                onClick={() => setAssignLocationModal(true)}
                              >
                                + Assign location
                              </button>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="my-team-detail-section">
                      <h4 className="my-team-detail-section-title">Compensation</h4>
                      <div className="my-team-detail-list">
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Salary</span><span className="my-team-detail-value my-team-detail-value-accent">{selectedEmployee.salary}</span></div>
                        <h4 className="my-team-detail-section-title my-team-subsection-title">Head Quarter</h4>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Place</span><span className="my-team-detail-value">{selectedEmployee.headQuarter || '—'}</span></div>
                      </div>
                    </div>
                    <div className="my-team-detail-section">
                      <h4 className="my-team-detail-section-title">Allowances</h4>
                      <div className="my-team-detail-list">
                        <div className="my-team-detail-item"><span className="my-team-detail-label">DA Headquarter</span><span className="my-team-detail-value">{selectedEmployee.daHeadquarter}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">DA Outstation</span><span className="my-team-detail-value">{selectedEmployee.daOutstation}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">N/H</span><span className="my-team-detail-value">{selectedEmployee.nh}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">TA Own Vehicle</span><span className="my-team-detail-value">{selectedEmployee.taOwnVehicle}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">TA Local Transport</span><span className="my-team-detail-value">{selectedEmployee.taLocalTransport}</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!isEditMode ? (
              <div className="my-team-modal-footer">
                <button type="button" className="my-team-btn my-team-btn-danger" onClick={handleDeleteMember}>Delete</button>
                <div className="my-team-modal-footer-right">
                  <button type="button" className="my-team-btn my-team-btn-secondary" onClick={() => setSelectedEmployee(null)}>Close</button>
                  <button type="button" className="my-team-btn my-team-btn-primary" onClick={openEditMode}>Edit</button>
                </div>
              </div>
            ) : (
              <div className="my-team-modal-footer">
                <button type="button" className="my-team-btn my-team-btn-secondary" onClick={() => setIsEditMode(false)}>Cancel</button>
                <button type="button" className="my-team-btn my-team-btn-primary" onClick={handleUpdateMember}>Save</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Location modal */}
      {assignLocationModal && selectedEmployee && (
        <div className="my-team-modal-overlay" onClick={() => { setAssignLocationModal(false); setAssignLocationId(''); setAssignLocationError(null) }} role="dialog" aria-modal="true" aria-labelledby="assign-location-title">
          <div className="my-team-modal-content my-team-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-team-modal-header">
              <h2 id="assign-location-title" className="my-team-modal-title">Assign location to {selectedEmployee.salesPersonName}</h2>
              <button type="button" className="my-team-modal-close" onClick={() => { setAssignLocationModal(false); setAssignLocationId(''); setAssignLocationError(null) }} aria-label="Close"><span aria-hidden>×</span></button>
            </div>
            <div className="my-team-modal-body my-team-form-body">
              <label className="my-team-detail-label" style={{ display: 'block', marginBottom: 8 }}>Select location</label>
              <select
                className="my-team-form-input"
                style={{ width: '100%' }}
                value={assignLocationId}
                onChange={(e) => { setAssignLocationId(e.target.value); setAssignLocationError(null) }}
                aria-label="Select location"
                disabled={assignLocationSaving}
              >
                <option value="">Choose a location…</option>
                {locations
                  .filter((loc) => !(selectedEmployee.assignedLocationIds || []).includes(loc.id))
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
              </select>
              {locations.filter((loc) => !(selectedEmployee.assignedLocationIds || []).includes(loc.id)).length === 0 && (
                <p className="my-team-empty-text" style={{ marginTop: 12 }}>No more locations to assign. Create locations from My Team → Create Location.</p>
              )}
              {assignLocationError && (
                <p className="my-team-assign-location-error" role="alert">{assignLocationError}</p>
              )}
            </div>
            <div className="my-team-modal-footer">
              <button type="button" className="my-team-btn my-team-btn-secondary" onClick={() => { setAssignLocationModal(false); setAssignLocationId(''); setAssignLocationError(null) }} disabled={assignLocationSaving}>Cancel</button>
              <button type="button" className="my-team-btn my-team-btn-primary" onClick={handleAssignLocation} disabled={!assignLocationId || assignLocationSaving}>
                {assignLocationSaving ? 'Saving to Firebase…' : 'Assign & save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyTeamPage
