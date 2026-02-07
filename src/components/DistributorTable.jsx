import React from 'react'
import './DistributorTable.css'

const DistributorTable = () => {
  const distributors = [
    {
      id: 'DST-9621',
      name: 'Global Traders Inc.',
      avatar: 'G',
      avatarColor: '#f59e0b',
      bitName: 'Downtown Core',
      zone: 'Dharampeth',
      target: 1000,
      achieved: 42,
      workDays: 'All Days',
      workDaysType: 'all',
      staff: [
        { name: 'Mike R.', avatar: 'https://ui-avatars.com/api/?name=Mike+R&background=10b981&color=fff' },
        { name: 'Lisa K.', avatar: 'https://ui-avatars.com/api/?name=Lisa+K&background=f59e0b&color=fff' },
      ],
    },
    {
      id: 'DST-8832',
      name: 'Apex Supplies Ltd.',
      avatar: 'A',
      avatarColor: '#3b82f6',
      bitName: 'North-East Sector',
      zone: 'Dharampeth',
      target: 1000,
      achieved: 850,
      workDays: '4 days',
      workDaysType: 'limited',
      staff: [
        { name: 'Sarah M.', avatar: 'https://ui-avatars.com/api/?name=Sarah+M&background=4a90e2&color=fff' },
      ],
    },
    {
      id: 'DST-1044',
      name: 'Rapid Retailers',
      avatar: 'R',
      avatarColor: '#ec4899',
      bitName: 'West Sector',
      zone: 'Dharampeth',
      target: 1000,
      achieved: 1200,
      workDays: 'All Days',
      workDaysType: 'all',
      staff: [
        { name: 'John D.', avatar: 'https://ui-avatars.com/api/?name=John+D&background=6366f1&color=fff' },
      ],
    },
  ]

  const getProgressPercentage = (achieved, target) => {
    if (target === 0) return 0
    return (achieved / target) * 100
  }

  const getAchievementColor = (progress) => {
    if (progress < 75) return { fill: '#ef4444', text: '#dc2626' }
    if (progress <= 100) return { fill: '#10b981', text: '#059669' }
    return { fill: '#2563eb', text: '#1d4ed8' }
  }

  return (
    <div className="distributor-table-container">
      <div className="table-header-section">
        <h3 className="table-title">Distributors</h3>
        <button type="button" className="download-button" aria-label="Download">
          <img src="/download-icon.png" alt="Download" className="download-icon-img" />
        </button>
      </div>
      <div className="table-wrapper">
        <table className="distributor-table">
          <thead>
            <tr>
              <th>DISTRIBUTOR NAME</th>
              <th>BIT NAME</th>
              <th>ZONE</th>
              <th>TARGET</th>
              <th>WORK DAYS</th>
              <th>ASSIGN STAFF</th>
            </tr>
          </thead>
          <tbody>
            {distributors.map((distributor, index) => {
              const progress = getProgressPercentage(distributor.achieved, distributor.target)
              return (
                <tr key={index}>
                  <td>
                    <div className="distributor-name-cell">
                      <div
                        className="distributor-avatar"
                        style={{ backgroundColor: distributor.avatarColor }}
                      >
                        {distributor.avatar}
                      </div>
                      <div className="distributor-info">
                        <div className="distributor-name">{distributor.name}</div>
                        <div className="distributor-id">ID: #{distributor.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {distributor.bitName && (
                      <div className="bit-name-chip">
                        <span className="location-icon">📍</span>
                        <span>{distributor.bitName}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="zone-text">{distributor.zone || ''}</span>
                  </td>
                  <td>
                    {distributor.target > 0 ? (
                      <div className="target-cell">
                        <div className="target-progress-bar">
                          <div
                            className="target-progress-fill"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: getAchievementColor(progress).fill,
                            }}
                          ></div>
                        </div>
                        <div className="target-values">
                          <span className="target-total">{distributor.target}kg</span>
                          <span
                            className="target-achieved"
                            style={{
                              color: getAchievementColor(progress).text,
                            }}
                          >
                            {distributor.achieved}kg
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="empty-cell">—</span>
                    )}
                  </td>
                  <td>
                    {distributor.workDays && (
                      <span
                        className={`work-days-link ${
                          distributor.workDaysType === 'all' ? 'all-days' : 'limited-days'
                        }`}
                      >
                        {distributor.workDays}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="assign-staff-cell">
                      {distributor.staff.map((member, idx) => (
                        <div key={idx} className="staff-avatar">
                          <img src={member.avatar} alt={member.name} />
                        </div>
                      ))}
                      <button className="add-staff-button">
                        <span className="plus-icon">+</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DistributorTable
