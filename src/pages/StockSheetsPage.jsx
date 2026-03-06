import React from 'react'
import UniversalHeader from '../components/UniversalHeader'
import StockSheetsFilters from '../components/StockSheetsFilters'
import './StockSheetsPage.css'

function StockSheetsPage() {
  return (
    <div className="main-content">
      <UniversalHeader title="Stock Sheets" />
      <div className="content-wrapper">
        <StockSheetsFilters />
      </div>
    </div>
  )
}

export default StockSheetsPage
