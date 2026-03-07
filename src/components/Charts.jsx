import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import './Charts.css'

const TASKS_COLLECTION = 'tasks'
const ORDERS_COLLECTION = 'orders'
const CHECK_OUTS_COLLECTION = 'check_outs'
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

function orderToDate(o) {
  if (o.timestamp != null) {
    if (typeof o.timestamp.toDate === 'function') return o.timestamp.toDate()
    const d = new Date(o.timestamp)
    return isNaN(d.getTime()) ? null : d
  }
  if (o.date) return parseOrderDate(o.date)
  return null
}

const Charts = () => {
  const now = new Date()
  const [tasks, setTasks] = useState([])
  const [orders, setOrders] = useState([])
  const [checkOuts, setCheckOuts] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())   // 0-based
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear())

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, TASKS_COLLECTION), (snapshot) => {
      setTasks(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, ORDERS_COLLECTION), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, CHECK_OUTS_COLLECTION), (snapshot) => {
      setCheckOuts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // Build list of available year+month combos from order data
  const availableMonths = useMemo(() => {
    const seen = new Set()
    orders.forEach((o) => {
      const d = orderToDate(o)
      if (!d || isNaN(d.getTime())) return
      seen.add(`${d.getFullYear()}-${d.getMonth()}`)
    })
    // Always include current month
    seen.add(`${now.getFullYear()}-${now.getMonth()}`)
    return [...seen]
      .sort()
      .map((key) => {
        const [y, m] = key.split('-').map(Number)
        return { year: y, month: m, label: `${MONTH_LABELS[m]} ${y}` }
      })
  }, [orders])

  // Week-wise volumes for the selected month: Week 1 (1-7), Week 2 (8-15), Week 3 (16-22), Week 4 (23-31)
  const orderVolumeData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
    const weekRanges = [
      { week: 1, label: 'Week 1 (1-7)', start: 1, end: 7 },
      { week: 2, label: 'Week 2 (8-15)', start: 8, end: 15 },
      { week: 3, label: 'Week 3 (16-22)', start: 16, end: 22 },
      { week: 4, label: `Week 4 (23-${daysInMonth})`, start: 23, end: daysInMonth },
    ]
    const weekTotals = weekRanges.map((w) => ({ ...w, volume: 0 }))
    orders.forEach((o) => {
      const d = orderToDate(o)
      if (!d || isNaN(d.getTime())) return
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return
      const day = d.getDate()
      const kg = parseFloat(o.totalKg) || parseFloat(o.kg) || 0
      const weekIdx = day <= 7 ? 0 : day <= 15 ? 1 : day <= 22 ? 2 : 3
      weekTotals[weekIdx].volume = Math.round((weekTotals[weekIdx].volume + kg) * 10) / 10
    })
    return weekTotals
  }, [orders, selectedMonth, selectedYear])

  const taskDistributionData = useMemo(() => {
    const ongoing = tasks.filter((t) => (t.status || 'pending') !== 'resolved').length
    const completed = tasks.filter((t) => t.status === 'resolved').length
    return [
      { name: 'Ongoing', value: ongoing, color: '#f59e0b' },
      { name: 'Completed', value: completed, color: '#10b981' },
    ]
  }, [tasks])

  const productivityData = useMemo(() => {
    // Same logic as Admin KPIs: sum directly from checkout collection, all-time
    let totalCalls = 0
    let productiveCalls = 0
    checkOuts.forEach((co) => {
      totalCalls      += Number(co.totalCall ?? co.totalCalls ?? 0) || 0
      productiveCalls += Number(co.productiveCalls ?? co.productiveCall ?? 0) || 0
    })
    return [
      { name: 'Total calls', value: totalCalls, color: '#10b981' },
      { name: 'Productive Calls', value: productiveCalls, color: '#f59e0b' },
    ]
  }, [checkOuts])

  return (
    <div className="charts-container">
      <div className="chart-card">
        <div className="chart-card-header">
          <h3 className="chart-title">Order Volume Trends</h3>
          <select
            className="chart-month-select"
            value={`${selectedYear}-${selectedMonth}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-').map(Number)
              setSelectedYear(y)
              setSelectedMonth(m)
            }}
          >
            {availableMonths.map((opt) => (
              <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={orderVolumeData} margin={{ top: 4, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#718096"
              tick={{ fontSize: 10 }}
              tickLine={false}
              label={{ value: 'Week', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#718096', fontWeight: 500 }}
            />
            <YAxis
              stroke="#718096"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Kgs', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#718096' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: 12 }}
              formatter={(value) => [`${value} Kg`, 'Volume']}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="volume"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
              activeDot={{ r: 5, fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Link to="/pending-task" className="chart-card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <h3 className="chart-title">Task Distribution</h3>
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={taskDistributionData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {taskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [`${value} tasks`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {taskDistributionData.map((item, index) => (
              <div key={index} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      <div className="chart-card">
        <h3 className="chart-title">Productivity</h3>
        <div className="pie-chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={productivityData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {productivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [`${value}`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend">
            {productivityData.map((item, index) => (
              <div key={index} className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="legend-label">{item.name}</span>
                <span className="legend-value">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts
