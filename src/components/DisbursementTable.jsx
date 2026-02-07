import React, { useState } from 'react'
import './DisbursementTable.css'

const DisbursementTable = () => {
  const [expandedRows, setExpandedRows] = useState({})

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const tableData = [
    {
      id: 1,
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      totalSecondary: '350kg',
      totalWorkDays: 40,
      totalProductiveCalls: 25,
      totalTA: 300,
      totalDA: 205,
      totalNH: 25,
      salary: 280,
      details: [
        {
          distributorName: 'Stamford Branch',
          location: 'Stamford, CT',
          bitName: 'chandrapur',
          secondary: '250 kgs',
          workDays: 25,
          totalCalls: 25,
          productiveCalls: 25,
          ta: 25,
          da: 25,
          nh: 25,
        },
        {
          distributorName: 'Stamford Branch',
          location: 'Stamford, CT',
          bitName: 'chandrapur',
          secondary: '240 kgs',
          workDays: 24,
          totalCalls: 24,
          productiveCalls: 24,
          ta: 24,
          da: 24,
          nh: 24,
        },
      ],
    },
    {
      id: 2,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      totalSecondary: '350kg',
      totalWorkDays: 40,
      totalProductiveCalls: 25,
      totalTA: 300,
      totalDA: 205,
      totalNH: 25,
      salary: 255,
      details: [
        {
          distributorName: 'Scranton Branch',
          location: 'Scranton, PA',
          bitName: 'downtown',
          secondary: '200 kgs',
          workDays: 22,
          totalCalls: 22,
          productiveCalls: 22,
          ta: 22,
          da: 22,
          nh: 22,
        },
      ],
    },
    {
      id: 3,
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      totalSecondary: '350kg',
      totalWorkDays: 40,
      totalProductiveCalls: 25,
      totalTA: 300,
      totalDA: 205,
      totalNH: 25,
      salary: 259,
      details: [
        {
          distributorName: 'Nashua Branch',
          location: 'Nashua, NH',
          bitName: 'central',
          secondary: '180 kgs',
          workDays: 20,
          totalCalls: 20,
          productiveCalls: 20,
          ta: 20,
          da: 20,
          nh: 20,
        },
      ],
    },
  ]

  return (
    <div className="disbursement-table-container">
      <div className="table-wrapper">
        <table className="disbursement-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>TOTAL SECONDARY (KG)</th>
              <th>TOTAL WORK DAYS</th>
              <th>TOTAL PRODUCTIVE CALLS</th>
              <th>TOTAL TA</th>
              <th>TOTAL DA</th>
              <th>TOTAL N/H</th>
              <th>SALARY</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
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
                  <td>{row.totalSecondary}</td>
                  <td>{row.totalWorkDays}</td>
                  <td>{row.totalProductiveCalls}</td>
                  <td>{row.totalTA}</td>
                  <td>{row.totalDA}</td>
                  <td>{row.totalNH}</td>
                  <td className="salary-cell">{row.salary}</td>
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
                {expandedRows[row.id] && (
                  <tr className="expanded-row">
                    <td colSpan="9" className="expanded-cell">
                      <div className="expanded-content">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>DISTRIBUTOR NAME</th>
                              <th>BIT NAME</th>
                              <th>SECONDARY (KG)</th>
                              <th>WORK DAYS</th>
                              <th>TOTAL CALLS</th>
                              <th>PRODUCTIVE CALLS</th>
                              <th>TA</th>
                              <th>DA</th>
                              <th>N/H</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details.map((detail, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="distributor-cell">
                                    <div className="distributor-icon">SB</div>
                                    <div className="distributor-info">
                                      <div className="distributor-name">
                                        {detail.distributorName}
                                      </div>
                                      <div className="distributor-location">
                                        {detail.location}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td>{detail.bitName}</td>
                                <td>{detail.secondary}</td>
                                <td>{detail.workDays}</td>
                                <td>{detail.totalCalls}</td>
                                <td>{detail.productiveCalls}</td>
                                <td>{detail.ta}</td>
                                <td>{detail.da}</td>
                                <td>{detail.nh}</td>
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

export default DisbursementTable
