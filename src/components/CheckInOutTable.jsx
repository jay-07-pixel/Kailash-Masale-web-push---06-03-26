import React, { useState } from 'react'
import './CheckInOutTable.css'

const CheckInOutTable = () => {
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

  const tableData = [
    {
      id: 1,
      date: { day: 'F', date: '24th Oct' },
      employeeName: 'Akash Gupta',
      distributor: { initial: 'M', name: 'M Metro Trades' },
      bitName: 'Wardhaman nagar',
      primaryIn: { current: 350, total: 500 },
      workTime: '7hrs:30mins',
      totalCall: 42,
      productiveCall: 42,
      primaryAchieved: '200kg',
      secondaryAchieved: '200kg',
      notes:
        'Here will be the notes, which where on hover will see the full notes content...',
    },
    {
      id: 2,
      date: { day: 'Sa', date: '25th Oct' },
      employeeName: 'Akash Gupta',
      distributor: { initial: 'S', name: 'S Shakti Trades' },
      bitName: 'Wardhaman nagar',
      primaryIn: { current: 230, total: 500 },
      workTime: '8hrs:15mins',
      totalCall: 38,
      productiveCall: 35,
      primaryAchieved: '180kg',
      secondaryAchieved: '150kg',
      notes: 'Follow up required with distributor regarding next order.',
    },
    {
      id: 3,
      date: { day: 'S', date: '26th Oct' },
      employeeName: 'Akash Gupta',
      distributor: { initial: null, name: 'No Visit' },
      bitName: 'Reason Of Leave...........',
      isOnLeave: true,
    },
    {
      id: 4,
      date: { day: 'M', date: '27th Oct' },
      employeeName: 'Akash Gupta',
      distributor: { initial: 'G', name: 'G Global Mart' },
      bitName: 'Wardhaman nagar',
      primaryIn: { current: 400, total: 500 },
      workTime: '7hrs:45mins',
      totalCall: 45,
      productiveCall: 42,
      primaryAchieved: '220kg',
      secondaryAchieved: '210kg',
      notes: 'All targets met for the day. Excellent performance.',
    },
    {
      id: 5,
      date: { day: 'T', date: '28th Oct' },
      employeeName: 'Akash Gupta',
      distributor: { initial: 'M', name: 'M Metro Trades' },
      bitName: 'Wardhaman nagar',
      primaryIn: { current: 380, total: 500 },
      workTime: '8hrs:00mins',
      totalCall: 40,
      productiveCall: 38,
      primaryAchieved: '210kg',
      secondaryAchieved: '190kg',
      notes: 'Need to discuss pricing strategy with distributor.',
    },
  ]

  return (
    <div className="checkinout-table-container">
      <div className="table-wrapper">
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
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="date-cell">
                    <span
                      className="day-badge"
                      style={{
                        backgroundColor: getDayBadgeColor(row.date.day),
                      }}
                    >
                      {row.date.day}
                    </span>
                    <span className="date-text">{row.date.date}</span>
                  </div>
                </td>
                <td className="employee-name">{row.employeeName}</td>
                <td>
                  {row.isOnLeave ? (
                    <span className="on-leave-badge">On Leave</span>
                  ) : (
                    <div className="distributor-cell">
                      {row.distributor.initial && (
                        <span
                          className="distributor-badge"
                          style={{
                            backgroundColor: getDistributorBadgeColor(
                              row.distributor.initial
                            ),
                          }}
                        >
                          {row.distributor.initial}
                        </span>
                      )}
                      <span>{row.distributor.name}</span>
                    </div>
                  )}
                </td>
                <td>{row.bitName}</td>
                {row.isOnLeave ? (
                  <>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                  </>
                ) : (
                  <>
                    <td className="primary-in">
                      {row.primaryIn.current}/{row.primaryIn.total}
                    </td>
                    <td>
                      <span className="work-time">{row.workTime}</span>
                    </td>
                    <td>{row.totalCall}</td>
                    <td>{row.productiveCall}</td>
                    <td>{row.primaryAchieved}</td>
                    <td>{row.secondaryAchieved}</td>
                    <td>
                      <div
                        className="notes-cell"
                        onClick={() => toggleNotes(row.id)}
                      >
                        <div
                          className={`notes-content ${
                            expandedNotes[row.id] ? 'expanded' : ''
                          }`}
                        >
                          {row.notes}
                        </div>
                        <img src="/drop-down-icon.png" alt="" className={`notes-arrow-img ${expandedNotes[row.id] ? 'expanded' : ''}`} />
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CheckInOutTable
