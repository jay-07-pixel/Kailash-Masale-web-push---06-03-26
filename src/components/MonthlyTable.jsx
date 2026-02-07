import React, { useState } from 'react'
import './MonthlyTable.css'

const MonthlyTable = () => {
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
      workingDays: 250,
      daysWorked: '250 Kg',
      lma: '250 Kg',
      target: 250,
      incentive: '250 Kg',
      primary: '250 Kg',
      secondary: '250 Kg',
      details: [
        {
          distributor: { name: 'Dunder Supply Co.', location: 'Scranton, PA', icon: 'DS' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Stamford Branch', location: 'Stamford, CT', icon: 'SB' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
      ],
    },
    {
      id: 2,
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      distributor: {
        name: 'Vance Partners',
        location: 'Carbondale, PA',
        icon: 'VP',
      },
      workingDays: 250,
      daysWorked: '250 Kg',
      lma: '250 Kg',
      target: 250,
      incentive: '250 Kg',
      primary: '250 Kg',
      secondary: '250 Kg',
      details: [
        {
          distributor: { name: 'Dunder Supply Co.', location: 'Scranton, PA', icon: 'DS' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Stamford Branch', location: 'Stamford, CT', icon: 'SB' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
      ],
    },
    {
      id: 3,
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
      workingDays: 250,
      daysWorked: '250 Kg',
      lma: '250 Kg',
      target: 250,
      incentive: '250 Kg',
      primary: '250 Kg',
      secondary: '250 Kg',
      details: [
        {
          distributor: { name: 'Dunder Supply Co.', location: 'Scranton, PA', icon: 'DS' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Vance Partners', location: 'Nashua, NH', icon: 'VP' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
        {
          distributor: { name: 'Stamford Branch', location: 'Stamford, CT', icon: 'SB' },
          workingDays: 4,
          lma: '250 Kg',
          target: '250 Kg',
          incentive: 250,
          periods: [
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
            { sec: '250 Kg', primary: '250 Kg' },
          ],
          daysWorked: 2,
          targetSec: '250 Kg',
          targetPrimary: '250 Kg',
          shortfall: 250,
          achieved: 250,
        },
      ],
    },
  ]

  return (
    <div className="monthly-table-container">
      <div className="table-wrapper">
        <table className="monthly-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th>WORKING DAYS</th>
              <th>ACHIEVED</th>
              <th>TARGET</th>
              <th>INCENTIVE</th>
              <th>PRIMARY (KG)</th>
              <th>SECONDARY (KG)</th>
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
                  <td>{row.workingDays}</td>
                  <td>{row.daysWorked}</td>
                  <td>{row.target}</td>
                  <td>{row.incentive}</td>
                  <td>{row.primary}</td>
                  <td>{row.secondary}</td>
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
                {expandedRows[row.id] && row.details.length > 0 && (
                  <tr className="expanded-row">
                    <td colSpan="9" className="expanded-cell">
                      <div className="expanded-content">
                        <div className="action-buttons-container">
                          <button className="action-btn approve">✓</button>
                          <button className="action-btn reject">✕</button>
                          <button className="action-btn action-btn-pen" title="Edit">
                            <img src="/pen-icon.png" alt="Edit" className="pen-icon-img" />
                          </button>
                        </div>
                        <table className="detail-table">
                          <thead>
                            <tr className="header-row-1">
                              <th rowSpan="2" className="group-header">DISTRIBUTOR</th>
                              <th rowSpan="2" className="group-header">
                                <div className="two-line-header">
                                  <div>WORKING</div>
                                  <div>DAYS</div>
                                </div>
                              </th>
                              <th rowSpan="2" className="group-header">LMA</th>
                              <th rowSpan="2" className="group-header">TARGET</th>
                              <th rowSpan="2" className="group-header">INCENTIVE</th>
                              <th colSpan="2" className="period-header">
                                <div className="period-header-content">
                                  <span className="tracking-label">Tracking :-</span>
                                  <span className="period-range">1ˢᵗ - 7ᵗʰ</span>
                                </div>
                              </th>
                              <th colSpan="2" className="period-header">8ᵗʰ - 15ᵗʰ</th>
                              <th colSpan="2" className="period-header">16ᵗʰ - 22ⁿᵈ</th>
                              <th colSpan="2" className="period-header">23ʳᵈ - 31ˢᵗ</th>
                              <th colSpan="3" className="period-header target-achieved-header">
                                Target Achieved
                              </th>
                              <th rowSpan="2" className="group-header">SHORTFALL</th>
                              <th rowSpan="2" className="group-header">ACHIEVED %</th>
                            </tr>
                            <tr className="header-row-2">
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header">PRIMARY (KG)</th>
                              <th className="sub-header">DAYS WORKED</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header">PRIMARY (KG)</th>
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
                                <td>{detail.workingDays}</td>
                                <td>{detail.lma}</td>
                                <td>{detail.target}</td>
                                <td>{detail.incentive}</td>
                                <td>{detail.periods[0].sec}</td>
                                <td>{detail.periods[0].primary}</td>
                                <td>{detail.periods[1].sec}</td>
                                <td>{detail.periods[1].primary}</td>
                                <td>{detail.periods[2].sec}</td>
                                <td>{detail.periods[2].primary}</td>
                                <td>{detail.periods[3].sec}</td>
                                <td>{detail.periods[3].primary}</td>
                                <td>{detail.daysWorked}</td>
                                <td>{detail.targetSec}</td>
                                <td>{detail.targetPrimary}</td>
                                <td>{detail.shortfall}</td>
                                <td>{detail.achieved}</td>
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

export default MonthlyTable
