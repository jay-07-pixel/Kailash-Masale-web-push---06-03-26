import React, { useState } from 'react'
import UniversalHeader from '../components/UniversalHeader'
import OrdersSummaryCards from '../components/OrdersSummaryCards'
import OrdersFilters from '../components/OrdersFilters'
import OrdersTable from '../components/OrdersTable'
import './OrdersPage.css'

const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => MONTH_OPTIONS[new Date().getMonth()])
  const [statusFilter, setStatusFilter] = useState('All')

  return (
    <div className="main-content">
      <UniversalHeader title="Orders" />
      <div className="content-wrapper">
        <OrdersSummaryCards year={year} month={month} />
        <div className="orders-card">
          <OrdersFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            year={year}
            setYear={setYear}
            month={month}
            setMonth={setMonth}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <OrdersTable searchQuery={searchQuery} year={year} month={month} statusFilter={statusFilter} />
        </div>
      </div>
    </div>
  )
}

export default OrdersPage
