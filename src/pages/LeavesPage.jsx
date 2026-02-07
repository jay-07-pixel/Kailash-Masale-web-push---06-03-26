import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import LeavesCards from '../components/LeavesCards'
import './LeavesPage.css'

function LeavesPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Leaves" />
      <div className="content-wrapper">
        <LeavesCards />
      </div>
    </div>
  )
}

export default LeavesPage
