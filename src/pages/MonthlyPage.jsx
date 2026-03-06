import React, { useState, useEffect, useMemo } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import UniversalHeader from '../components/UniversalHeader'
import MonthlySummaryCards from '../components/MonthlySummaryCards'
import MonthlyFilters from '../components/MonthlyFilters'
import { db, isFirebaseConfigured } from '../firebase'
import './MonthlyPage.css'

const ORDERS_COLLECTION = 'orders'
const MONTHLY_DATA_COLLECTION = 'monthlyData'
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getOrderDate(doc) {
  if (doc.timestamp) {
    const d = typeof doc.timestamp?.toDate === 'function' ? doc.timestamp.toDate() : new Date(doc.timestamp)
    if (!isNaN(d.getTime())) return d
  }
  if (doc.date) return parseOrderDate(doc.date)
  return null
}

function parseOrderDate(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim().replace(/\//g, '-')
  const parts = s.split('-')
  if (parts.length !== 3) return null
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const year = parseInt(parts[2], 10)
  if (year < 100) return new Date(year + 2000, month, day)
  return new Date(year, month, day)
}

function MonthlyPage() {
  const now = new Date()
  const [year, setYear] = useState(String(now.getFullYear()))
  const [month, setMonth] = useState(MONTH_LABELS[now.getMonth()])
  const [orders, setOrders] = useState([])
  const [monthlyDataList, setMonthlyDataList] = useState([])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const periodKey = `${year}_${month}`
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !periodKey) return
    const q = query(
      collection(db, MONTHLY_DATA_COLLECTION),
      where('period', '==', periodKey)
    )
    const unsub = onSnapshot(q, (snapshot) => {
      setMonthlyDataList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [periodKey])

  const kpiStats = useMemo(() => {
    const targetYear = Number(year)
    const targetMonthIndex = MONTH_LABELS.indexOf(String(month))

    const filteredOrders = orders.filter((doc) => {
      const d = getOrderDate(doc)
      if (!d) return false
      if (d.getFullYear() !== targetYear) return false
      if (d.getMonth() !== targetMonthIndex) return false
      return true
    })

    const totalOrders = filteredOrders.length
    const totalVolumeKg = filteredOrders.reduce((sum, o) => sum + (parseFloat(o.totalKg) || parseFloat(o.kg) || 0), 0)
    const pendingApproval = monthlyDataList.filter(
      (d) => d.status !== 'approved' && d.status !== 'rejected'
    ).length

    return {
      totalOrders,
      pendingApproval,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
    }
  }, [orders, monthlyDataList, year, month])

  return (
    <div className="main-content">
      <UniversalHeader title="Monthly Employee Record" />
      <div className="content-wrapper">
        <MonthlySummaryCards
          totalOrders={kpiStats.totalOrders}
          pendingApproval={kpiStats.pendingApproval}
          totalVolumeKg={kpiStats.totalVolumeKg}
          month={month}
          year={year}
        />
        <MonthlyFilters
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </div>
    </div>
  )
}

export default MonthlyPage
