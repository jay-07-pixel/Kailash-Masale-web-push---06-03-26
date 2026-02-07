import React, { useState } from 'react'
import './StockSheetsTable.css'

const StockSheetsTable = () => {
  const [expandedRows, setExpandedRows] = useState({})

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getIconStyles = (role) => {
    if (role === 'Regional Mgr') {
      return {
        backgroundColor: '#FFF4E8',
        color: '#f97316',
      }
    }
    return {
      backgroundColor: '#EFF6FF',
      color: '#3b82f6',
    }
  }

  const tableData = [
    {
      id: 1,
      date: '27ᵗʰOct',
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      distributor: {
        name: 'Dunder Supply Co.',
        location: 'Scranton, PA',
        icon: 'DS',
      },
      details: [
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Pending',
        },
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Received',
        },
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Received',
        },
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Pending',
        },
      ],
    },
    {
      id: 2,
      date: '27ᵗʰOct',
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      distributor: {
        name: 'Vance Partners',
        location: 'Nashua, NH',
        icon: 'VP',
      },
      details: [
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Pending',
        },
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Received',
        },
      ],
    },
    {
      id: 3,
      date: '27ᵗʰOct',
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      distributor: {
        name: 'Stamford Branch',
        location: 'Stamford, CT',
        icon: 'SB',
      },
      details: [
        {
          date: '12/04/2025',
          distributor: { name: 'Stamford Branch', location: 'Stamford, CT', icon: 'SB' },
          status: 'Received',
        },
        {
          date: '12/04/2025',
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          status: 'Pending',
        },
      ],
    },
  ]

  return (
    <div className="stock-sheets-table-container">
      <div className="table-wrapper">
        <table className="stock-sheets-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td>{row.date}</td>
                  <td>
                    <div className="employee-cell">
                      <img
                        src={row.employee.avatar}
                        alt={row.employee.name}
                        className="employee-avatar"
                      />
                      <div className="employee-info">
                        <div className="employee-name">{row.employee.name}</div>
                        <div className="employee-role">{row.employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="distributor-cell">
                      <div 
                        className="distributor-icon"
                        style={getIconStyles(row.employee.role)}
                      >
                        {row.distributor.icon}
                      </div>
                      <div className="distributor-info">
                        <div className="distributor-name">
                          {row.distributor.name}
                        </div>
                        <div className="distributor-location">
                          {row.distributor.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      className="expand-button"
                      onClick={() => toggleRow(row.id)}
                    >
                      <img
                        src="/drop-down-icon.png"
                        alt=""
                        className={`expand-arrow ${
                          expandedRows[row.id] ? 'expanded' : ''
                        }`}
                      />
                    </button>
                  </td>
                </tr>
                {expandedRows[row.id] && row.details && (
                  <tr className="expanded-row">
                    <td colSpan="4" className="expanded-cell">
                      <div className="expanded-content">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>Distributor</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details.map((detail, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="distributor-cell">
                                    <div 
                                      className="distributor-icon small"
                                      style={getIconStyles(row.employee.role)}
                                    >
                                      {detail.distributor.icon}
                                    </div>
                                    <div className="distributor-info">
                                      <div className="distributor-name">
                                        {detail.distributor.name}
                                      </div>
                                      <div className="distributor-location">
                                        {detail.distributor.location}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`status-badge ${detail.status.toLowerCase()}`}>
                                    {detail.status}
                                  </span>
                                </td>
                                <td>
                                  <div className="action-icons">
                                    <button className="action-icon-btn view">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                      </svg>
                                    </button>
                                    <button className="action-icon-btn download">
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StockSheetsTable
