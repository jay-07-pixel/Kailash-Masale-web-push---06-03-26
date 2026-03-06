import React from 'react'
import './DistributorAppointmentTable.css'

const DistributorAppointmentTable = () => {
  const tableData = [
    {
      id: 1,
      newTown: 'Michael Scott',
      employeeAssigned: 'Ramesh, Mohanlal',
      distributor: {
        name: 'Dunder Supply Co.',
        location: 'Scranton, PA',
        icon: 'DS',
      },
    },
    {
      id: 2,
      newTown: 'Pam Beesly',
      employeeAssigned: 'Suresh',
      distributor: {
        name: 'Vance Partners',
        location: 'Nashua, NH',
        icon: 'VP',
      },
    },
    {
      id: 3,
      newTown: 'Jim Halpert',
      employeeAssigned: 'Rajkumar',
      distributor: {
        name: 'Stamford Branch',
        location: 'Stamford, CT',
        icon: 'SB',
      },
    },
  ]

  return (
    <div className="distributor-appointment-table-container">
      <div className="table-wrapper">
        <table className="distributor-appointment-table">
          <thead>
            <tr>
              <th className="da-th-new-town">NEW TOWN</th>
              <th className="da-th-employee">EMPLOYEE ASSIGNED</th>
              <th className="da-th-distributor">DISTRIBUTOR</th>
              <th className="da-th-actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td className="da-td-new-town">{row.newTown}</td>
                <td className="da-td-employee">{row.employeeAssigned}</td>
                <td className="da-td-distributor">
                  <div className="da-distributor-cell">
                    <div className="da-distributor-info">
                      <div className="da-distributor-name">{row.distributor.name}</div>
                      <div className="da-distributor-location">{row.distributor.location}</div>
                    </div>
                  </div>
                </td>
                <td className="da-td-actions">
                  <button type="button" className="da-action-menu-btn" aria-label="Actions">
                    <span className="da-action-dots">⋮</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DistributorAppointmentTable
