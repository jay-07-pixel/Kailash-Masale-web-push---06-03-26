import React from 'react'
import './RecentOrders.css'

const RecentOrders = () => {
  const orders = [
    {
      orderId: 'ORD-2649',
      employee: 'David Ross',
      distributor: 'Apex Retailers',
      distributorIcon: '🏢',
      skuDetails: 'Bio-Feed X200 Batch: B-902',
      volume: '500 KG',
      scheme: 'Bulk Discount',
      schemeType: 'bulk',
    },
    {
      orderId: 'ORD-2868',
      employee: 'Emma Wilson',
      distributor: 'Green Valley Supplies',
      distributorIcon: '🌿',
      skuDetails: 'Nutri-Mix Standard BA-104',
      volume: '120 KG',
      scheme: 'Standard',
      schemeType: 'standard',
    },
  ]

  return (
    <div className="recent-orders-card">
      <div className="card-header-section">
        <div>
          <h3 className="card-title">Recent Orders</h3>
          <p className="card-subtitle">Manage distributor orders and schemes</p>
        </div>
        <button className="new-order-button">+ New Order</button>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ORDER ID</th>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th>SKU DETAILS</th>
              <th>VOLUME [KG]</th>
              <th>SCHEME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td>
                  <span className="order-id">{order.orderId}</span>
                </td>
                <td>{order.employee}</td>
                <td>
                  <div className="distributor-cell">
                    <img 
                      src="/db-box-icon.png" 
                      alt="Distributor" 
                      className="distributor-icon"
                    />
                    <span>{order.distributor}</span>
                  </div>
                </td>
                <td>{order.skuDetails}</td>
                <td>{order.volume}</td>
                <td>
                  <span
                    className={`scheme-badge ${
                      order.schemeType === 'bulk' ? 'bulk' : 'standard'
                    }`}
                  >
                    {order.scheme}
                  </span>
                </td>
                <td>
                  <div className="action-icons">
                    <img 
                      src="/eye-icon.png" 
                      alt="View" 
                      className="action-icon"
                    />
                    <img 
                      src="/pencil-icon.png" 
                      alt="Edit" 
                      className="action-icon"
                    />
                    <img 
                      src="/delete-icon.png" 
                      alt="Delete" 
                      className="action-icon"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentOrders
