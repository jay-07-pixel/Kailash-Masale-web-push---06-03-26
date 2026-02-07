import React, { useState } from 'react'
import './WeeklyApprovalsTable.css'

const WeeklyApprovalsTable = () => {
  const [expandedRows, setExpandedRows] = useState({})
  const [activeWeek, setActiveWeek] = useState(1)

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const tableData = [
    {
      id: 1,
      date: "12ᵗʰJAN'26",
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      primaryGoal: '900 kgs',
      details: [
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
      ],
    },
    {
      id: 2,
      date: "12ᵗʰJAN'26",
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      primaryGoal: '900 kgs',
      details: [
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
      ],
    },
    {
      id: 3,
      date: "12ᵗʰJAN'26",
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      primaryGoal: '900 kgs',
      details: [
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
        {
          date: "12ᵗʰJAN'26",
          distributor: {
            name: 'Dunder Supply Co.',
            location: 'Scranton, PA',
            initials: 'DS',
            bgColor: '#EEF2FF',
            textColor: '#6366F1',
          },
          bitName: 'Bit name',
          lastDayVisit: "12ᵗʰJAN'26",
          primaryTargetPending: '₹ 900',
          primaryGoal: '₹ 900',
        },
      ],
    },
  ]

  return (
    <div className="weekly-approvals-table-container">
      <div className="table-wrapper">
        <table className="weekly-approvals-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>EMPLOYEE</th>
              <th>PRIMARY GOAL FOR THE MONTH</th>
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
                  <td>{row.primaryGoal}</td>
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
                  <tr>
                    <td colSpan="4" className="expanded-row-cell">
                      <div className="expanded-content">
                        <div className="week-tabs-and-actions">
                          <div className="week-tabs">
                            {[1, 2, 3, 4].map((week) => (
                              <button
                                key={week}
                                className={`week-tab ${
                                  activeWeek === week ? 'active' : ''
                                }`}
                                onClick={() => setActiveWeek(week)}
                              >
                                Week {week}
                              </button>
                            ))}
                          </div>
                          <div className="action-buttons">
                            <button className="action-btn approve">✓</button>
                            <button className="action-btn reject">✕</button>
                            <button className="action-btn action-btn-pen" title="Edit">
                              <img src="/pen-icon.png" alt="Edit" className="pen-icon-img" />
                            </button>
                          </div>
                        </div>

                        <div className="detail-table-wrapper">
                          <table className="detail-table">
                            <thead>
                              <tr>
                                <th>DATE</th>
                                <th>DISTRIBUTOR NAME</th>
                                <th>BIT NAME</th>
                                <th>LAST DAY VISIT</th>
                                <th>PRIMARY TARGET PENDING</th>
                                <th>PRIMARY GOAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.details.map((detail, idx) => (
                                <tr key={idx}>
                                  <td>{detail.date}</td>
                                  <td>
                                    <div className="distributor-cell">
                                      <div
                                        className="distributor-initials-box"
                                        style={{
                                          backgroundColor: detail.distributor.bgColor,
                                          color: detail.distributor.textColor,
                                        }}
                                      >
                                        {detail.distributor.initials}
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
                                  <td>{detail.bitName}</td>
                                  <td>{detail.lastDayVisit}</td>
                                  <td>{detail.primaryTargetPending}</td>
                                  <td>{detail.primaryGoal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
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

export default WeeklyApprovalsTable
