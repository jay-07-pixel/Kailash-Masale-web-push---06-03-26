import React from 'react'
import './EmployeeAttendance.css'

const EmployeeAttendance = () => {
  const employees = [
    {
      name: 'Sarah Jenkins',
      department: 'Sales',
      checkIn: '08:58 AM',
      checkOut: '---',
      status: 'Active',
      statusType: 'active',
      avatar: 'https://ui-avatars.com/api/?name=Sarah+Jenkins&background=4a90e2&color=fff',
    },
    {
      name: 'Michael Chen',
      department: 'Logistics',
      checkIn: '09:15 AM',
      checkOut: '05:30 PM',
      status: 'Checked Out',
      statusType: 'checked-out',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=10b981&color=fff',
    },
  ]

  return (
    <div className="employee-attendance-card">
      <div className="card-header-section">
        <div>
          <h3 className="card-title">Employee Attendance</h3>
          <p className="card-subtitle">Real-time check-in/out history</p>
        </div>
        <div className="card-actions">
          <input type="date" className="date-picker" />
          <button className="export-button">Export</button>
        </div>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DEPARTMENT</th>
              <th>CHECK IN</th>
              <th>CHECK OUT</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr key={index}>
                <td>
                  <div className="employee-cell">
                    <img
                      src={employee.avatar}
                      alt={employee.name}
                      className="employee-avatar"
                    />
                    <span>{employee.name}</span>
                  </div>
                </td>
                <td>{employee.department}</td>
                <td>{employee.checkIn}</td>
                <td>{employee.checkOut}</td>
                <td>
                  <span
                    className={`status-badge ${
                      employee.statusType === 'active' ? 'active' : 'checked-out'
                    }`}
                  >
                    {employee.status}
                  </span>
                </td>
                <td>
                  <div className="action-icons">
                    <img 
                      src="/eye-icon.png" 
                      alt="View" 
                      className="action-icon"
                    />
                    <img 
                      src="/pencil-icon.png" 
                      alt="Edit" 
                      className="action-icon"
                    />
                    <img 
                      src="/delete-icon.png" 
                      alt="Delete" 
                      className="action-icon"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EmployeeAttendance
