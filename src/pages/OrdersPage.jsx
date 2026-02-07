import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import OrdersSummaryCards from '../components/OrdersSummaryCards'
import OrdersFilters from '../components/OrdersFilters'
import OrdersTable from '../components/OrdersTable'
import './OrdersPage.css'

function OrdersPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Orders" />
      <div className="content-wrapper">
        <OrdersSummaryCards />
        <div className="orders-card">
          <OrdersFilters />
          <OrdersTable />
        </div>
      </div>
    </div>
  )
}

export default OrdersPage
