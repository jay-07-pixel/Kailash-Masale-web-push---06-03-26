import React, { useState } from 'react'
import './CheckInOutTable.css'

const isEmpty = (v) => v == null || v === '' || v === '—'

const isAchievedEmpty = (v) =>
  isEmpty(v) || v === 'kg' || v === '0kg' || (typeof v === 'string' && v.trim() === 'kg')

const locationsSubmitted = (row) =>
  !row.isOnLeave &&
  row.checkInTs != null &&
  row.checkOutTs != null &&
  row.checkInLocation &&
  row.checkInLocation !== '—' &&
  row.checkOutLocation &&
  row.checkOutLocation !== '—'

const showRnsFor = (row, fieldEmpty) => locationsSubmitted(row) && fieldEmpty

const CheckInOutTable = ({ tableData = [] }) => {
  const [expandedNotes, setExpandedNotes] = useState({})

  const toggleNotes = (id) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getDayBadgeColor = (day) => {
    const colors = {
      F: '#ef4444',
      Sa: '#f59e0b',
      S: '#9ca3af',
      M: '#ef4444',
      T: '#ef4444',
      W: '#3b82f6',
      Th: '#10b981',
    }
    return colors[day] || '#6b7280'
  }

  const getDistributorBadgeColor = (initial) => {
    const colors = {
      M: '#9ca3af',
      S: '#f59e0b',
      G: '#3b82f6',
    }
    return colors[initial] || '#6b7280'
  }

  return (
    <div className="checkinout-table-container">
      <div className="table-wrapper">
        {tableData.length === 0 ? (
          <div className="checkinout-table-empty">
            <p className="checkinout-table-empty-text">No employees yet. Add employees in My Team; check-in/check-out data will appear here when they record it.</p>
          </div>
        ) : (
        <table className="checkinout-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee Name</th>
              <th>Distributor</th>
              <th>Bit Name</th>
              <th>Primary in (kg)</th>
              <th>Work Time</th>
              <th>Total call</th>
              <th>Produc. call</th>
              <th>Primary Achieved</th>
              <th>Secondary Achieved</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <React.Fragment key={row.id}>
              <tr>
                <td>
                  <div className="date-cell">
                    <span
                      className="day-badge"
                      style={{
                        backgroundColor: getDayBadgeColor(row.date?.day),
                      }}
                    >
                      {row.date?.day ?? '—'}
                    </span>
                    <span className="date-text">{row.date?.date ?? '—'}</span>
                  </div>
                </td>
                <td className="employee-name">{row.employeeName}</td>
                <td>
                  {row.isOnLeave ? (
                    <span className="on-leave-badge">On Leave</span>
                  ) : showRnsFor(row, !row.distributor?.name || row.distributor?.name === '—') ? (
                    <span className="checkinout-rns">RNS</span>
                  ) : (
                    <div className="distributor-cell">
                      {row.distributor?.initial && (
                        <span
                          className="distributor-badge"
                          style={{
                            backgroundColor: getDistributorBadgeColor(row.distributor.initial),
                          }}
                        >
                          {row.distributor.initial}
                        </span>
                      )}
                      <span>{row.distributor?.name ?? '—'}</span>
                    </div>
                  )}
                </td>
                <td>
                  {showRnsFor(row, !row.bitName || row.bitName === '—') ? (
                    <span className="checkinout-rns">RNS</span>
                  ) : (
                    row.bitName ?? '—'
                  )}
                </td>
                {row.isOnLeave ? (
                  <>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>
                      <button
                        type="button"
                        className="detail-dropdown-trigger"
                        onClick={() => toggleNotes(row.id)}
                        aria-expanded={!!expandedNotes[row.id]}
                        aria-label="Toggle detail"
                      >
                        <img src="/drop-down-icon.png" alt="" className={`detail-dropdown-icon ${expandedNotes[row.id] ? 'expanded' : ''}`} />
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="primary-in">
                      {showRnsFor(row, !row.primaryIn) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        row.primaryIn ? `${row.primaryIn.current}/${row.primaryIn.total}` : '—'
                      )}
                    </td>
                    <td>
                      {showRnsFor(row, !(row.workTime && String(row.workTime).trim())) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        <span className="work-time">{row.workTime || '—'}</span>
                      )}
                    </td>
                    <td>
                      {showRnsFor(row, isEmpty(row.totalCall)) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        row.totalCall ?? '—'
                      )}
                    </td>
                    <td>
                      {showRnsFor(row, isEmpty(row.productiveCall)) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        row.productiveCall ?? '—'
                      )}
                    </td>
                    <td>
                      {showRnsFor(row, isAchievedEmpty(row.primaryAchieved)) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        row.primaryAchieved ?? '—'
                      )}
                    </td>
                    <td>
                      {showRnsFor(row, isAchievedEmpty(row.secondaryAchieved)) ? (
                        <span className="checkinout-rns">RNS</span>
                      ) : (
                        row.secondaryAchieved ?? '—'
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="detail-dropdown-trigger"
                        onClick={() => toggleNotes(row.id)}
                        aria-expanded={!!expandedNotes[row.id]}
                        aria-label="Toggle detail"
                      >
                        <img src="/drop-down-icon.png" alt="" className={`detail-dropdown-icon ${expandedNotes[row.id] ? 'expanded' : ''}`} />
                      </button>
                    </td>
                  </>
                )}
              </tr>
              {expandedNotes[row.id] && (
                <tr className="detail-expanded-row">
                  <td colSpan={11} className="detail-expanded-cell">
                    <div className="detail-panel">
                      <div className="detail-panel-section">
                        <h4 className="detail-panel-title">Notes</h4>
                        <p className="detail-panel-content">{row.notes || '—'}</p>
                      </div>
                      <div className="detail-panel-section">
                        <h4 className="detail-panel-title">Check-in location</h4>
                        <p className="detail-panel-content">{row.checkInLocation ?? '—'}</p>
                      </div>
                      <div className="detail-panel-section">
                        <h4 className="detail-panel-title">Check-out location</h4>
                        <p className="detail-panel-content">{row.checkOutLocation ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  )
}

export default CheckInOutTable
