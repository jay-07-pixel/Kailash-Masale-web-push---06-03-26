import React, { useState } from 'react'
import './OrdersTable.css'

const OrdersTable = () => {
  const [expandedRows, setExpandedRows] = useState({})
  const [activeOrderTab, setActiveOrderTab] = useState({})

  const setOrderTab = (rowId, tabIndex) => {
    setActiveOrderTab((prev) => ({ ...prev, [rowId]: tabIndex }))
  }

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
      orders: [
        { date: '12/01/2026', sku: 'SKU', kg: 100, scheme: 'Scheme' },
        { date: '13/01/2026', sku: 'SKU-002', kg: 150, scheme: 'Scheme A' },
        { date: '14/01/2026', sku: 'SKU-003', kg: 200, scheme: 'Scheme B' },
        { date: '15/01/2026', sku: 'SKU-004', kg: 180, scheme: 'Scheme C' },
      ],
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
      orders: [
        { date: '10/01/2026', sku: 'SKU', kg: 80, scheme: 'Scheme' },
        { date: '11/01/2026', sku: 'SKU-002', kg: 120, scheme: 'Scheme A' },
      ],
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
      orders: [
        { date: '14/01/2026', sku: 'SKU', kg: 100, scheme: 'Scheme' },
        { date: '15/01/2026', sku: 'SKU-002', kg: 90, scheme: 'Scheme A' },
        { date: '16/01/2026', sku: 'SKU-003', kg: 110, scheme: 'Scheme B' },
      ],
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
              <React.Fragment key={order.id}>
              <tr>
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
              {expandedRows[order.id] && order.orders && order.orders.length > 0 && (
                <tr className="orders-expanded-row">
                  <td colSpan="5" className="orders-expanded-cell">
                    <div className="orders-expanded-content">
                      <div className="order-tabs">
                        {order.orders.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className={`order-tab ${(activeOrderTab[order.id] ?? 0) === idx ? 'active' : ''}`}
                            onClick={() => setOrderTab(order.id, idx)}
                          >
                            Order {idx + 1}
                          </button>
                        ))}
                      </div>
                      <div className="orders-detail-table-wrap">
                        <table className="orders-detail-table">
                          <thead>
                            <tr>
                              <th>DATE</th>
                              <th>SKU</th>
                              <th>KG</th>
                              <th>SCHEME</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>{order.orders[activeOrderTab[order.id] ?? 0].date}</td>
                              <td>{order.orders[activeOrderTab[order.id] ?? 0].sku}</td>
                              <td className="kg-cell">{order.orders[activeOrderTab[order.id] ?? 0].kg}</td>
                              <td>{order.orders[activeOrderTab[order.id] ?? 0].scheme}</td>
                            </tr>
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

export default OrdersTable
