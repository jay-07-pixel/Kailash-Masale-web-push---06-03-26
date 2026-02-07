import React, { useState } from 'react'
import './OrdersTable.css'

const OrdersTable = () => {
  const [expandedRows, setExpandedRows] = useState({})

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const getDistributorBadgeColors = (initial) => {
    const colors = {
      SB: { bg: '#DBEAFE', text: '#3B82F6' },
      DS: { bg: '#F3F4F6', text: '#6B7280' },
      VP: { bg: '#FED7AA', text: '#EA580C' },
    }
    return colors[initial] || { bg: '#F3F4F6', text: '#6B7280' }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      Pending: 'pending',
      Placed: 'placed',
      Declined: 'declined',
    }
    return classes[status] || ''
  }

  const ordersData = [
    {
      id: 1,
      employee: {
        name: 'Jim Halpert',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Jim+Halpert&background=3b82f6&color=fff',
      },
      distributor: {
        initial: 'SB',
        name: 'Stamford Branch',
        location: 'Stamford, CT',
      },
      orderDetails: '250 Kg',
      status: 'Pending',
    },
    {
      id: 2,
      employee: {
        name: 'Michael Scott',
        role: 'Sales Rep',
        avatar: 'https://ui-avatars.com/api/?name=Michael+Scott&background=6b7280&color=fff',
      },
      distributor: {
        initial: 'DS',
        name: 'Dunder Supply Co.',
        location: 'Scranton, PA',
      },
      orderDetails: '250 Kg',
      status: 'Declined',
    },
    {
      id: 3,
      employee: {
        name: 'Pam Beesly',
        role: 'Regional Mgr',
        avatar: 'https://ui-avatars.com/api/?name=Pam+Beesly&background=f59e0b&color=fff',
      },
      distributor: {
        initial: 'VP',
        name: 'Vance Partners',
        location: 'Nashua, NH',
      },
      orderDetails: '250 Kg',
      status: 'Placed',
    },
  ]

  return (
    <div className="orders-table-container">
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th>ORDER DETAILS KG</th>
              <th>STATUS</th>
              <th>
                DETAILED
                <img src="/drop-down-icon.png" alt="" className="dropdown-icon-img" />
              </th>
            </tr>
          </thead>
          <tbody>
            {ordersData.map((order) => (
              <tr key={order.id}>
                <td>
                  <div className="employee-cell">
                    <img
                      src={order.employee.avatar}
                      alt={order.employee.name}
                      className="employee-avatar"
                    />
                    <div className="employee-info">
                      <div className="employee-name">{order.employee.name}</div>
                      <div className="employee-role">{order.employee.role}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="distributor-cell">
                    <span
                      className="distributor-badge"
                      style={{
                        backgroundColor: getDistributorBadgeColors(
                          order.distributor.initial
                        ).bg,
                        color: getDistributorBadgeColors(
                          order.distributor.initial
                        ).text,
                      }}
                    >
                      {order.distributor.initial}
                    </span>
                    <div className="distributor-info">
                      <div className="distributor-name">
                        {order.distributor.name}
                      </div>
                      <div className="distributor-location">
                        {order.distributor.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="order-details">{order.orderDetails}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <button
                    className="detailed-button"
                    onClick={() => toggleRow(order.id)}
                  >
                    <img
                      src="/drop-down-icon.png"
                      alt=""
                      className={`detailed-arrow ${
                        expandedRows[order.id] ? 'expanded' : ''
                      }`}
                    />
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

export default OrdersTable
