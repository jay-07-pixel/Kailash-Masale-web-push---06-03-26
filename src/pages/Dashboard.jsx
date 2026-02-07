import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import OverviewCards from '../components/OverviewCards'
import Charts from '../components/Charts'
import EmployeeAttendance from '../components/EmployeeAttendance'
import RecentOrders from '../components/RecentOrders'
import PendingTasks from '../components/PendingTasks'

function Dashboard() {
  return (
    <div className="main-content">
      <UniversalHeader title="Dashboard" />
      <div className="content-wrapper">
        <OverviewCards />
        <Charts />
        <EmployeeAttendance />
        <RecentOrders />
        <PendingTasks />
      </div>
    </div>
  )
}

export default Dashboard
