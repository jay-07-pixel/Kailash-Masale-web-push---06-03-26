import React, { useState, useMemo, useEffect } from 'react'
import UniversalHeader from '../components/UniversalHeader'
import './MyTeamPage.css'

const INITIAL_EMPLOYEES = [
  { sr: 1, salesPersonName: 'Rajesh Kumar', email: 'rajesh.kumar@kailashmasale.com', address: '12 MG Road, Pune - 411001', designation: 'Senior Sales Executive', salary: '₹ 45,000', daHeadQuarter: '₹ 200', daUpCountry: '₹ 350', daNightHault: '₹ 400', owTaPerKm: '₹ 8', pw: 'As Actual' },
  { sr: 2, salesPersonName: 'Priya Sharma', email: 'priya.sharma@kailashmasale.com', address: 'Block A, Andheri East, Mumbai - 400069', designation: 'Sales Manager', salary: '₹ 55,000', daHeadQuarter: '₹ 250', daUpCountry: '₹ 400', daNightHault: '₹ 450', owTaPerKm: '₹ 10', pw: 'As Actual' },
  { sr: 3, salesPersonName: 'Amit Patel', email: 'amit.patel@kailashmasale.com', address: 'Sector 15, Gandhinagar - 382016', designation: 'Regional Sales Officer', salary: '₹ 52,000', daHeadQuarter: '₹ 220', daUpCountry: '₹ 380', daNightHault: '₹ 420', owTaPerKm: '₹ 9', pw: 'As Actual' },
  { sr: 4, salesPersonName: 'Sneha Reddy', email: 'sneha.reddy@kailashmasale.com', address: 'Jubilee Hills, Hyderabad - 500033', designation: 'Sales Executive', salary: '₹ 42,000', daHeadQuarter: '₹ 180', daUpCountry: '₹ 320', daNightHault: '₹ 380', owTaPerKm: '₹ 7', pw: 'As Actual' },
  { sr: 5, salesPersonName: 'Vikram Singh', email: 'vikram.singh@kailashmasale.com', address: 'Connaught Place, New Delhi - 110001', designation: 'Area Sales Head', salary: '₹ 62,000', daHeadQuarter: '₹ 280', daUpCountry: '₹ 450', daNightHault: '₹ 500', owTaPerKm: '₹ 12', pw: 'As Actual' },
  { sr: 6, salesPersonName: 'Kavita Nair', email: 'kavita.nair@kailashmasale.com', address: 'Koramangala, Bengaluru - 560034', designation: 'Sales Executive', salary: '₹ 40,000', daHeadQuarter: '₹ 170', daUpCountry: '₹ 300', daNightHault: '₹ 360', owTaPerKm: '₹ 7', pw: 'As Actual' },
]

const emptyForm = () => ({
  salesPersonName: '',
  email: '',
  address: '',
  designation: '',
  salary: '',
  daHeadQuarter: '',
  daUpCountry: '',
  daNightHault: '',
  owTaPerKm: '',
  pw: 'As Actual',
})

function MyTeamPage() {
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm())

  const getNextSr = () => (employees.length === 0 ? 1 : Math.max(...employees.map((e) => e.sr)) + 1)

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

  const getInitials = (name) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()

  const handleAddMember = () => {
    const sr = getNextSr()
    const newEmp = { sr, ...addForm }
    if (!newEmp.salesPersonName.trim() || !newEmp.email.trim()) return
    setEmployees((prev) => [...prev, newEmp])
    setAddForm(emptyForm())
    setIsAddModalOpen(false)
  }

  const handleUpdateMember = () => {
    if (!selectedEmployee || !editForm.salesPersonName.trim() || !editForm.email.trim()) return
    const updated = { ...selectedEmployee, ...editForm }
    setEmployees((prev) => prev.map((e) => (e.sr === selectedEmployee.sr ? updated : e)))
    setSelectedEmployee(updated)
    setIsEditMode(false)
  }

  const handleDeleteMember = () => {
    if (!selectedEmployee) return
    if (!window.confirm(`Delete ${selectedEmployee.salesPersonName} from the team?`)) return
    setEmployees((prev) => prev.filter((e) => e.sr !== selectedEmployee.sr))
    setSelectedEmployee(null)
    setIsEditMode(false)
  }

  const openEditMode = () => {
    if (!selectedEmployee) return
    setEditForm({
      salesPersonName: selectedEmployee.salesPersonName,
      email: selectedEmployee.email,
      address: selectedEmployee.address || '',
      designation: selectedEmployee.designation || '',
      salary: selectedEmployee.salary || '',
      daHeadQuarter: selectedEmployee.daHeadQuarter || '',
      daUpCountry: selectedEmployee.daUpCountry || '',
      daNightHault: selectedEmployee.daNightHault || '',
      owTaPerKm: selectedEmployee.owTaPerKm || '',
      pw: selectedEmployee.pw || 'As Actual',
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

  const renderFormField = (label, name, value, onChange, placeholder = '') => (
    <div key={name} className="my-team-form-group">
      <label className="my-team-form-label">{label}</label>
      <input
        type="text"
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
          {renderFormField('Address', 'address', addForm.address, updateAddForm, 'Full address')}
          {renderFormField('Designation', 'designation', addForm.designation, updateAddForm, 'e.g. Sales Executive')}
        </div>
      </div>
      <div className="my-team-add-form-section">
        <h4 className="my-team-detail-section-title">Compensation</h4>
        <div className="my-team-add-form-fields">
          {renderFormField('Salary', 'salary', addForm.salary, updateAddForm, 'e.g. ₹ 45,000')}
          {renderFormField('PW', 'pw', addForm.pw, updateAddForm)}
        </div>
      </div>
      <div className="my-team-add-form-section">
        <h4 className="my-team-detail-section-title">Allowances</h4>
        <div className="my-team-add-form-fields">
          {renderFormField('DA Head Quarter', 'daHeadQuarter', addForm.daHeadQuarter, updateAddForm, 'e.g. ₹ 200')}
          {renderFormField('DA Up Country', 'daUpCountry', addForm.daUpCountry, updateAddForm, 'e.g. ₹ 350')}
          {renderFormField('DA Night Hault', 'daNightHault', addForm.daNightHault, updateAddForm, 'e.g. ₹ 400')}
          {renderFormField('OW TA / KM', 'owTaPerKm', addForm.owTaPerKm, updateAddForm, 'e.g. ₹ 8')}
        </div>
      </div>
    </div>
  )

  const renderEditForm = () => (
    <div className="my-team-form-grid">
      {renderFormField('Sales Person Name', 'salesPersonName', editForm.salesPersonName, updateEditForm)}
      {renderFormField('Email (For Login / District)', 'email', editForm.email, updateEditForm)}
      {renderFormField('Address', 'address', editForm.address, updateEditForm)}
      {renderFormField('Designation', 'designation', editForm.designation, updateEditForm)}
      {renderFormField('Salary', 'salary', editForm.salary, updateEditForm)}
      {renderFormField('PW', 'pw', editForm.pw, updateEditForm)}
      {renderFormField('DA Head Quarter', 'daHeadQuarter', editForm.daHeadQuarter, updateEditForm)}
      {renderFormField('DA Up Country', 'daUpCountry', editForm.daUpCountry, updateEditForm)}
      {renderFormField('DA Night Hault', 'daNightHault', editForm.daNightHault, updateEditForm)}
      {renderFormField('OW TA / KM', 'owTaPerKm', editForm.owTaPerKm, updateEditForm)}
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
              <h3 className="my-team-empty-title">No matches found</h3>
              <p className="my-team-empty-text">Try a different search term or clear the search to see all team members.</p>
              <button type="button" className="my-team-empty-btn" onClick={() => setSearchQuery('')}>Clear search</button>
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <article
                key={emp.sr}
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
                  <p className="my-team-card-designation">{emp.designation}</p>
                  <p className="my-team-card-email">{emp.email}</p>
                </div>
                <span className="my-team-card-cta">View profile</span>
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
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Address</span><span className="my-team-detail-value">{selectedEmployee.address}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Designation</span><span className="my-team-detail-value">{selectedEmployee.designation}</span></div>
                      </div>
                    </div>
                    <div className="my-team-detail-section">
                      <h4 className="my-team-detail-section-title">Compensation</h4>
                      <div className="my-team-detail-list">
                        <div className="my-team-detail-item"><span className="my-team-detail-label">Salary</span><span className="my-team-detail-value my-team-detail-value-accent">{selectedEmployee.salary}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">PW</span><span className="my-team-detail-value">{selectedEmployee.pw}</span></div>
                      </div>
                    </div>
                    <div className="my-team-detail-section">
                      <h4 className="my-team-detail-section-title">Allowances</h4>
                      <div className="my-team-detail-list">
                        <div className="my-team-detail-item"><span className="my-team-detail-label">DA Head Quarter</span><span className="my-team-detail-value">{selectedEmployee.daHeadQuarter}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">DA Up Country</span><span className="my-team-detail-value">{selectedEmployee.daUpCountry}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">DA Night Hault</span><span className="my-team-detail-value">{selectedEmployee.daNightHault}</span></div>
                        <div className="my-team-detail-item"><span className="my-team-detail-label">OW TA / KM</span><span className="my-team-detail-value">{selectedEmployee.owTaPerKm}</span></div>
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
    </div>
  )
}

export default MyTeamPage
