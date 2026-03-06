import React, { useState, useEffect, useMemo, useRef } from 'react'
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import './CreateLocationPage.css'

const LOCATIONS_COLLECTION = 'locations'
const EMPLOYEES_COLLECTION = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'

const CARD_AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6']

function parseNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function CreateLocationPage() {
  const [distributors, setDistributors] = useState([])
  const [locations, setLocations] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedDistributor, setSelectedDistributor] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [name, setName] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radius, setRadius] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const locationSyncDone = useRef(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLatitude, setEditLatitude] = useState('')
  const [editLongitude, setEditLongitude] = useState('')
  const [editRadius, setEditRadius] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      setDistributors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const locationsForDistributor = useMemo(() => {
    if (!selectedDistributor) return []
    return locations.filter((loc) => loc.distributorId === selectedDistributor.id)
  }, [locations, selectedDistributor])

  const filteredDistributors = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim()
    if (!q) return distributors
    return distributors.filter((d) => {
      const name = (d.distributorName || d.name || '').toLowerCase()
      const zone = (d.zone || '').toLowerCase()
      const bits = Array.isArray(d.bits) ? d.bits : (d.bitName ? [d.bitName] : [])
      const bitMatch = bits.some((b) => (b || '').toLowerCase().includes(q))
      return name.includes(q) || zone.includes(q) || bitMatch
    })
  }, [distributors, searchQuery])

  const employeesForDistributor = useMemo(() => {
    if (!selectedDistributor) return []
    return employees.filter((emp) => (emp.assignedDistributorIds || []).includes(selectedDistributor.id))
  }, [employees, selectedDistributor])

  // For each employee of this distributor, which of this distributor's locations are assigned to them
  const employeesWithLocations = useMemo(() => {
    if (!selectedDistributor) return []
    const locIds = new Set(locationsForDistributor.map((l) => l.id))
    return employeesForDistributor.map((emp) => {
      const assignedIds = emp.assignedLocationIds || []
      const locationNames = locationsForDistributor
        .filter((loc) => assignedIds.includes(loc.id))
        .map((loc) => loc.name || loc.id)
      return {
        id: emp.id,
        name: emp.salesPersonName || emp.name || emp.email || '—',
        designation: emp.designation || emp.role || '—',
        locationNames,
      }
    })
  }, [selectedDistributor, employeesForDistributor, locationsForDistributor])

  // Auto-assign every distributor's locations to all employees of that distributor (once when page has data)
  useEffect(() => {
    if (!db || distributors.length === 0 || locations.length === 0 || employees.length === 0) return
    if (locationSyncDone.current) return
    locationSyncDone.current = true
    const run = async () => {
      const locsByDist = new Map()
      for (const loc of locations) {
        const did = loc.distributorId
        if (!did) continue
        if (!locsByDist.has(did)) locsByDist.set(did, [])
        locsByDist.get(did).push(loc.id)
      }
      for (const emp of employees) {
        const distIds = emp.assignedDistributorIds || []
        if (distIds.length === 0) continue
        const current = new Set(emp.assignedLocationIds || [])
        let added = false
        for (const distId of distIds) {
          const locIds = locsByDist.get(distId) || []
          for (const locId of locIds) {
            if (!current.has(locId)) {
              current.add(locId)
              added = true
            }
          }
        }
        if (!added) continue
        try {
          await updateDoc(doc(db, EMPLOYEES_COLLECTION, emp.id), {
            assignedLocationIds: [...current],
          })
        } catch (e) {
          console.warn('Sync locations to employee failed:', emp.id, e?.message)
        }
      }
    }
    run()
  }, [distributors, locations, employees])

  const resetForm = () => {
    setName('')
    setLatitude('')
    setLongitude('')
    setRadius('')
    setMessage(null)
  }

  const openEdit = (loc) => {
    setMessage(null)
    setEditingLocation(loc)
    setEditName(loc.name || '')
    setEditLatitude(String(loc.latitude ?? ''))
    setEditLongitude(String(loc.longitude ?? ''))
    setEditRadius(String(loc.radius ?? ''))
  }

  const closeEdit = () => {
    setEditingLocation(null)
    setEditName('')
    setEditLatitude('')
    setEditLongitude('')
    setEditRadius('')
  }

  const saveEdit = async () => {
    if (!db || !editingLocation) return
    const trimmedName = (editName || '').trim()
    if (!trimmedName) {
      setMessage('Location name is required.')
      return
    }
    const lat = parseNumber(editLatitude, null)
    const lng = parseNumber(editLongitude, null)
    const rad = parseNumber(editRadius, null)
    if (lat == null || lng == null || rad == null) {
      setMessage('Please enter valid numbers for latitude, longitude, and radius.')
      return
    }
    if (rad <= 0) {
      setMessage('Radius must be greater than 0.')
      return
    }
    setSavingEdit(true)
    setMessage(null)
    try {
      await updateDoc(doc(db, LOCATIONS_COLLECTION, editingLocation.id), {
        name: trimmedName,
        latitude: lat,
        longitude: lng,
        radius: rad,
        updatedAt: new Date().toISOString(),
      })
      setMessage('Location updated.')
      setTimeout(() => setMessage(null), 3000)
      closeEdit()
    } catch (err) {
      setMessage(err?.message || 'Failed to update location.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteClick = (loc) => {
    setMessage(null)
    setDeleteConfirmLocation(loc)
  }
  const cancelDelete = () => setDeleteConfirmLocation(null)

  const confirmDelete = async () => {
    if (!db || !deleteConfirmLocation) return
    setDeleting(true)
    try {
      const locId = deleteConfirmLocation.id
      const employeesWithLoc = employees.filter((emp) => (emp.assignedLocationIds || []).includes(locId))
      for (const emp of employeesWithLoc) {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, emp.id), {
          assignedLocationIds: arrayRemove(locId),
        })
      }
      await deleteDoc(doc(db, LOCATIONS_COLLECTION, locId))
      setMessage('Location deleted.')
      setTimeout(() => setMessage(null), 3000)
      cancelDelete()
    } catch (err) {
      setMessage(err?.message || 'Failed to delete location.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    const trimmedName = (name || '').trim()
    if (!trimmedName) {
      setMessage('Please enter a location name.')
      return
    }
    const lat = parseNumber(latitude, null)
    const lng = parseNumber(longitude, null)
    const rad = parseNumber(radius, null)
    if (lat == null || lng == null || rad == null) {
      setMessage('Please enter valid numbers for latitude, longitude, and radius.')
      return
    }
    if (rad <= 0) {
      setMessage('Radius must be greater than 0.')
      return
    }
    if (!db || !selectedDistributor) {
      setMessage('Database or distributor not available.')
      return
    }
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, LOCATIONS_COLLECTION), {
        name: trimmedName,
        latitude: lat,
        longitude: lng,
        radius: rad,
        distributorId: selectedDistributor.id,
        distributorName: selectedDistributor.distributorName || selectedDistributor.name || '',
        createdAt: new Date().toISOString(),
      })
      const allLocationIdsForDistributor = [
        ...(locationsForDistributor || []).map((l) => l.id),
        ref.id,
      ]
      for (const emp of employeesForDistributor || []) {
        const current = emp.assignedLocationIds || []
        const merged = [...new Set([...current, ...allLocationIdsForDistributor])]
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, emp.id), {
          assignedLocationIds: merged,
        })
      }
      const empCount = (employeesForDistributor || []).length
      setMessage(
        empCount > 0
          ? `Location created. All ${allLocationIdsForDistributor.length} location(s) for this distributor are now assigned to ${empCount} employee(s).`
          : 'Location created. No employees assigned to this distributor yet.'
      )
      resetForm()
      setTimeout(() => setMessage(null), 5000)
    } catch (err) {
      setMessage(err?.message || 'Failed to create location.')
    } finally {
      setSaving(false)
    }
  }

  const handleBackToDistributors = () => {
    setSelectedDistributor(null)
    resetForm()
  }

  if (selectedDistributor) {
    const distName = selectedDistributor.distributorName || selectedDistributor.name || 'Distributor'
    return (
      <div className="main-content">
        <UniversalHeader title="Create Location" />
        <div className="content-wrapper create-location-page">
          <button
            type="button"
            className="create-location-back-btn"
            onClick={handleBackToDistributors}
            aria-label="Back to distributors"
          >
            <span className="create-location-back-arrow" aria-hidden>←</span>
            Back to distributors
          </button>

          <div className="create-location-distributor-banner">
            <div className="create-location-distributor-banner-inner">
              <div
                className="create-location-distributor-banner-avatar"
                style={{ backgroundColor: '#6366f1' }}
                aria-hidden
              >
                {(distName || 'D').trim().charAt(0).toUpperCase()}
              </div>
              <div className="create-location-distributor-banner-text">
                <span className="create-location-distributor-badge">Distributor</span>
                <h2 className="create-location-distributor-name">{distName}</h2>
                <p className="create-location-distributor-meta">
                  <span className="create-location-banner-stat">{locationsForDistributor.length} locations</span>
                  <span className="create-location-banner-dot" aria-hidden>·</span>
                  <span className="create-location-banner-stat">{employeesForDistributor.length} employees</span>
                </p>
                <p className="create-location-auto-assign-hint">
                  New locations are automatically assigned to all employees assigned to this distributor.
                </p>
              </div>
            </div>
          </div>

          <div className="create-location-layout">
            <div className="create-location-left">
              <div className="create-location-form-header">
                <span className="create-location-form-icon" aria-hidden>📍</span>
                <div>
                  <h2 className="create-location-form-title">New location</h2>
                  <p className="create-location-intro">
                    Add a place with name, coordinates, and radius (in meters) for check-in boundaries.
                  </p>
                </div>
              </div>

              <form className="create-location-form" onSubmit={handleSubmit}>
                <div className="create-location-field">
                  <label className="create-location-label" htmlFor="location-name">Location name</label>
                  <input
                    id="location-name"
                    type="text"
                    className="create-location-input"
                    placeholder="e.g. Main Office, Warehouse A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-label="Location name"
                  />
                </div>
                <div className="create-location-row">
                  <div className="create-location-field">
                    <label className="create-location-label" htmlFor="location-lat">Latitude</label>
                    <input
                      id="location-lat"
                      type="text"
                      inputMode="decimal"
                      className="create-location-input"
                      placeholder="e.g. 18.5204"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      aria-label="Latitude"
                    />
                  </div>
                  <div className="create-location-field">
                    <label className="create-location-label" htmlFor="location-lng">Longitude</label>
                    <input
                      id="location-lng"
                      type="text"
                      inputMode="decimal"
                      className="create-location-input"
                      placeholder="e.g. 73.8567"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      aria-label="Longitude"
                    />
                  </div>
                </div>
                <div className="create-location-field">
                  <label className="create-location-label" htmlFor="location-radius">Radius (meters)</label>
                  <input
                    id="location-radius"
                    type="text"
                    inputMode="decimal"
                    className="create-location-input"
                    placeholder="e.g. 100"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    aria-label="Radius in meters"
                  />
                  <span className="create-location-hint">Distance from the point that counts as “at location”</span>
                </div>
                {message && (
                  <div className={`create-location-message ${message.includes('created') || message.includes('assigned') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}
                <div className="create-location-actions">
                  <button type="button" className="create-location-btn secondary" onClick={resetForm}>
                    Clear form
                  </button>
                  <button type="submit" className="create-location-btn primary" disabled={saving}>
                    {saving ? 'Creating…' : 'Create location'}
                  </button>
                </div>
              </form>
            </div>

            <div className="create-location-right">
              <section className="create-location-list-section">
                <div className="create-location-list-header">
                  <h2 className="create-location-list-title">Saved locations</h2>
                  {locationsForDistributor.length > 0 && (
                    <span className="create-location-list-count">{locationsForDistributor.length}</span>
                  )}
                </div>
                {locationsForDistributor.length === 0 ? (
                  <div className="create-location-empty">
                    <span className="create-location-empty-icon" aria-hidden>🗺️</span>
                    <p className="create-location-empty-title">No locations yet for this distributor</p>
                    <p className="create-location-empty-text">Create your first location using the form on the left. It will be auto-assigned to all employees assigned to this distributor.</p>
                  </div>
                ) : (
                  <ul className="create-location-list">
                    {locationsForDistributor.map((loc) => {
                      const assignedCount = employees.filter((emp) => (emp.assignedLocationIds || []).includes(loc.id)).length
                      return (
                        <li key={loc.id} className="create-location-card create-location-saved-card">
                          <div className="create-location-card-main">
                            <div className="create-location-card-icon-wrap" aria-hidden>
                              <span className="create-location-card-icon">📍</span>
                            </div>
                            <div className="create-location-card-body">
                              <div className="create-location-card-name">{loc.name}</div>
                              <div className="create-location-card-meta">
                                <span className="create-location-meta-pill">{loc.latitude}, {loc.longitude}</span>
                                <span className="create-location-meta-pill">{loc.radius} m</span>
                                <span className="create-location-meta-pill assign-pill">✓ {assignedCount} employee(s)</span>
                              </div>
                            </div>
                          </div>
                          <div className="create-location-card-actions">
                            <button
                              type="button"
                              className="create-location-card-btn edit"
                              onClick={() => openEdit(loc)}
                              aria-label={`Edit ${loc.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="create-location-card-btn delete"
                              onClick={() => handleDeleteClick(loc)}
                              aria-label={`Delete ${loc.name}`}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="create-location-employees-section">
                <div className="create-location-employees-header">
                  <h2 className="create-location-employees-title">Employees with locations</h2>
                  <span className="create-location-employees-subtitle">
                    Assigned to this distributor · locations they can check in at
                  </span>
                </div>
                {employeesForDistributor.length === 0 ? (
                  <div className="create-location-employees-empty">
                    <span className="create-location-employees-empty-icon" aria-hidden>👤</span>
                    <p className="create-location-employees-empty-text">No employees assigned to this distributor yet. Assign staff from the Distributor page.</p>
                  </div>
                ) : (
                  <ul className="create-location-employees-list">
                    {employeesWithLocations.map((emp) => (
                      <li key={emp.id} className="create-location-employee-card">
                        <div className="create-location-employee-card-avatar" aria-hidden>
                          {(emp.name || 'E').trim().slice(0, 2).toUpperCase()}
                        </div>
                        <div className="create-location-employee-card-body">
                          <div className="create-location-employee-card-name">{emp.name}</div>
                          <div className="create-location-employee-card-designation">{emp.designation}</div>
                          <div className="create-location-employee-card-locations">
                            {emp.locationNames.length === 0 ? (
                              <span className="create-location-employee-no-locs">No locations assigned</span>
                            ) : (
                              <>
                                <span className="create-location-employee-locs-label">Locations:</span>
                                <span className="create-location-employee-locs-list">{emp.locationNames.join(', ')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          {/* Edit location modal */}
          {editingLocation && (
            <div className="create-location-overlay create-location-modal-overlay" onClick={closeEdit} role="dialog" aria-modal="true" aria-labelledby="edit-location-title">
              <div className="create-location-modal create-location-modal-form" onClick={(e) => e.stopPropagation()}>
                <h2 id="edit-location-title" className="create-location-modal-title">Edit location</h2>
                <div className="create-location-field">
                  <label className="create-location-label" htmlFor="edit-location-name">Location name</label>
                  <input
                    id="edit-location-name"
                    type="text"
                    className="create-location-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Main Office"
                  />
                </div>
                <div className="create-location-modal-row">
                  <div className="create-location-field">
                    <label className="create-location-label" htmlFor="edit-location-lat">Latitude</label>
                    <input
                      id="edit-location-lat"
                      type="text"
                      inputMode="decimal"
                      className="create-location-input"
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(e.target.value)}
                    />
                  </div>
                  <div className="create-location-field">
                    <label className="create-location-label" htmlFor="edit-location-lng">Longitude</label>
                    <input
                      id="edit-location-lng"
                      type="text"
                      inputMode="decimal"
                      className="create-location-input"
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(e.target.value)}
                    />
                  </div>
                </div>
                <div className="create-location-field">
                  <label className="create-location-label" htmlFor="edit-location-radius">Radius (meters)</label>
                  <input
                    id="edit-location-radius"
                    type="text"
                    inputMode="decimal"
                    className="create-location-input"
                    value={editRadius}
                    onChange={(e) => setEditRadius(e.target.value)}
                  />
                </div>
                {message && (
                  <div className={`create-location-message ${message.includes('updated') ? 'success' : 'error'}`}>{message}</div>
                )}
                <div className="create-location-modal-actions">
                  <button type="button" className="create-location-btn secondary" onClick={closeEdit}>Cancel</button>
                  <button type="button" className="create-location-btn primary" onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation modal */}
          {deleteConfirmLocation && (
            <div className="create-location-overlay create-location-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-location-title">
              <div className="create-location-modal create-location-modal-sm" onClick={(e) => e.stopPropagation()}>
                <h2 id="delete-location-title" className="create-location-modal-title">Delete location?</h2>
                <p className="create-location-modal-text">
                  “{deleteConfirmLocation.name}” will be removed and unassigned from all employees. This cannot be undone.
                </p>
                {message && <div className="create-location-message error">{message}</div>}
                <div className="create-location-modal-actions">
                  <button type="button" className="create-location-btn secondary" onClick={cancelDelete} disabled={deleting}>
                    Cancel
                  </button>
                  <button type="button" className="create-location-btn primary delete" onClick={confirmDelete} disabled={deleting}>
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <UniversalHeader title="Locations" />
      <div className="content-wrapper create-location-page">
        <div className="create-location-intro-block">
          <div className="create-location-kpis">
            <div className="create-location-kpi-card">
              <span className="create-location-kpi-label">Total Distributor</span>
              <span className="create-location-kpi-value">{distributors.length}</span>
            </div>
            <div className="create-location-kpi-card">
              <span className="create-location-kpi-label">Total Locations</span>
              <span className="create-location-kpi-value">{locations.length}</span>
            </div>
          </div>
          <div className="create-location-search-wrap">
            <img src="/search-icon.png" alt="" className="create-location-search-icon" aria-hidden />
            <input
              type="text"
              placeholder="Search by distributor name, zone or bit..."
              className="create-location-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search distributors"
            />
          </div>
        </div>

        {distributors.length === 0 ? (
          <div className="create-location-empty create-location-empty-full">
            <span className="create-location-empty-icon" aria-hidden>🏢</span>
            <p className="create-location-empty-title">No distributors yet</p>
            <p className="create-location-empty-text">Create distributors from the Distributor page first, then return here to add locations for each.</p>
          </div>
        ) : filteredDistributors.length === 0 ? (
          <div className="create-location-empty create-location-empty-full">
            <span className="create-location-empty-icon" aria-hidden>🔍</span>
            <p className="create-location-empty-title">No matching distributors</p>
            <p className="create-location-empty-text">Try a different search term (name, zone or bit).</p>
          </div>
        ) : (
          <ul className="create-location-distributor-grid">
            {filteredDistributors.map((dist, index) => {
              const locCount = locations.filter((loc) => loc.distributorId === dist.id).length
              const empCount = employees.filter((emp) => (emp.assignedDistributorIds || []).includes(dist.id)).length
              const name = dist.distributorName || dist.name || 'Distributor'
              const initial = name.trim().charAt(0).toUpperCase() || 'D'
              const zoneVal = (dist.zone || '').trim()
              const zoneStr = zoneVal && zoneVal !== '—' && zoneVal !== '--' ? `Zone: ${zoneVal}` : ''
              const bitVal = Array.isArray(dist.bits) && dist.bits.length
                ? dist.bits.filter(Boolean).join(', ')
                : (dist.bitName || '').trim()
              const bitStr = bitVal && bitVal !== '—' && bitVal !== '--' ? `Bit: ${bitVal}` : ''
              const subtitle = [zoneStr, bitStr].filter(Boolean).join(' · ') || '—'
              const avatarColor = CARD_AVATAR_COLORS[index % CARD_AVATAR_COLORS.length]
              return (
                <li key={dist.id} className="create-location-distributor-card">
                  <button
                    type="button"
                    className="create-location-distributor-card-btn"
                    onClick={() => setSelectedDistributor(dist)}
                  >
                    <div
                      className="create-location-distributor-card-avatar"
                      style={{ backgroundColor: avatarColor }}
                      aria-hidden
                    >
                      {initial}
                    </div>
                    <div className="create-location-distributor-card-body">
                      <h3 className="create-location-distributor-card-name">{name}</h3>
                      <p className="create-location-distributor-card-subtitle">{subtitle}</p>
                      <div className="create-location-distributor-card-stats">
                        <span className="create-location-stat-pill">
                          <span className="create-location-stat-icon" aria-hidden>📍</span>
                          {locCount}
                        </span>
                        <span className="create-location-stat-pill">
                          <span className="create-location-stat-icon" aria-hidden>👤</span>
                          {empCount}
                        </span>
                      </div>
                    </div>
                    <span className="create-location-distributor-card-arrow" aria-hidden>→</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default CreateLocationPage
