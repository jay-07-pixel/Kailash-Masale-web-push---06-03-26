import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import UniversalHeader from '../components/UniversalHeader'
import CheckInOutSummaryCards from '../components/CheckInOutSummaryCards'
import CheckInOutFilters from '../components/CheckInOutFilters'
import CheckInOutTable from '../components/CheckInOutTable'
import './CheckInOutPage.css'

const CHECK_INS_COLLECTION = 'check_ins'
const CHECK_OUTS_COLLECTION = 'check_outs'
const EMPLOYEES_COLLECTION = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const LOCATIONS_COLLECTION = 'locations'

// Haversine: distance in meters between two lat/lng points
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toDate(v) {
  if (!v) return null
  if (v && typeof v.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

function formatWorkTime(checkInTs, checkOutTs) {
  const start = toDate(checkInTs)
  const end = toDate(checkOutTs)
  if (!start || !end || end <= start) return null
  const diffMs = end - start
  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  return `${hours}hrs:${mins.toString().padStart(2, '0')}mins`
}

function formatDateLabel(ts) {
  const d = toDate(ts)
  if (!d) return { day: '—', date: '—' }
  const days = ['S', 'M', 'T', 'W', 'Th', 'F', 'Sa']
  const day = days[d.getDay()]
  const date = d.getDate()
  const suffix = date === 1 || date === 21 || date === 31 ? 'st' : date === 2 || date === 22 ? 'nd' : date === 3 || date === 23 ? 'rd' : 'th'
  const month = d.toLocaleString('en', { month: 'short' })
  return { day, date: `${date}${suffix} ${month}` }
}

function getTodayDateStr() {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

function getCheckInDateStr(ci) {
  const d = toDate(ci.timestamp)
  if (d) return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  if (ci.date) {
    const s = String(ci.date).trim()
    const parts = s.split(/[-/]/).map((p) => p.trim())
    if (parts.length === 3) {
      const y = parts.find((x) => x.length === 4)
      const dm = parts.filter((x) => x.length !== 4)
      if (y) {
        const yearFirst = parts[0] === y
        const m = yearFirst ? (dm[0] || '01') : (dm[1] || '01')
        const day = yearFirst ? (dm[1] || '01') : (dm[0] || '01')
        return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
      return `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`
    }
  }
  return null
}

function CheckInOutPage() {
  const [checkIns, setCheckIns] = useState([])
  const [checkOuts, setCheckOuts] = useState([])
  const [employees, setEmployees] = useState([])
  const [distributors, setDistributors] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateStr())
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, CHECK_INS_COLLECTION), (snapshot) => {
      setCheckIns(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
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

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, EMPLOYEES_COLLECTION), (snapshot) => {
      setEmployees(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), (snapshot) => {
      setDistributors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, LOCATIONS_COLLECTION), (snapshot) => {
      setLocations(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const tableRows = useMemo(() => {
    // Link check_out to check_in by checkInId (web) OR by employeeEmail + date (app schema)
    const checkOutByKey = {}
    checkOuts.forEach((co) => {
      if (co.checkInId) {
        checkOutByKey[co.checkInId] = co
      } else if (co.employeeEmail != null && co.date != null) {
        const key = `${co.employeeEmail}|${co.date}`
        checkOutByKey[key] = co
      }
    })

    const ciMatchesEmployee = (ci, emp) =>
      ci.employeeId === emp.id || (ci.employeeEmail && emp.email && ci.employeeEmail === emp.email)

    const isCheckInOnDate = (ci, dateStr) => {
      const ciDate = getCheckInDateStr(ci)
      return ciDate === dateStr
    }

    const buildRowFromCheckIn = (ci, co) => {
      const workTime = formatWorkTime(ci.timestamp, co?.timestamp)
      const employeeName = ci.employeeName || (ci.employeeId ? (employees.find((e) => e.id === ci.employeeId)?.salesPersonName || employees.find((e) => e.id === ci.employeeId)?.email || ci.employeeId) : null) || ci.employeeEmail || '—'
      const distName = typeof ci.distributor === 'string' ? ci.distributor : (ci.distributorId ? (distributors.find((d) => d.id === ci.distributorId)?.distributorName || distributors.find((d) => d.id === ci.distributorId)?.name) : null) || (ci.isOnLeave ? 'No Visit' : '—')
      const distInitial = distName && distName !== 'No Visit' ? distName.trim().charAt(0).toUpperCase() : null
      const bitName = ci.bit != null ? ci.bit : (ci.bitName || (ci.isOnLeave ? 'Reason Of Leave.........' : '—'))
      let primaryIn = null
      if (ci.primaryInCurrent != null && ci.primaryInTotal != null) {
        primaryIn = { current: ci.primaryInCurrent, total: ci.primaryInTotal }
      } else if (ci.primaryTarget) {
        const match = String(ci.primaryTarget).match(/(\d+)\s*\/\s*(\d+)/)
        if (match) primaryIn = { current: parseInt(match[1], 10), total: parseInt(match[2], 10) }
      }
      const primaryAchievedVal = co?.achievedPrimary ?? ci.primaryAchieved
      const secondaryAchievedVal = co?.achievedSecondary ?? ci.secondaryAchieved
      const productiveCallVal = co?.productiveCalls ?? co?.productiveCall ?? ci.productiveCall ?? ci.totalCall
      const notesVal = co?.additionalNotes ?? ci.notes ?? ''
      const parseCoord = (v) => {
        if (v == null) return null
        if (typeof v === 'number' && !isNaN(v)) return v
        if (typeof v === 'object' && (v.latitude != null || v.lat != null)) return Number(v.latitude ?? v.lat)
        if (typeof v === 'object' && (v.longitude != null || v.lng != null)) return Number(v.longitude ?? v.lng)
        const s = String(v).replace(/°\s*[NSEW]/gi, '').trim()
        const n = parseFloat(s)
        return isNaN(n) ? null : n
      }
      const extractCoords = (doc, preferField) => {
        if (!doc) return null
        const checkIn = doc.checkInLocation ?? doc.check_in_location ?? doc.checkinLocation
        const checkOut = doc.checkOutLocation ?? doc.check_out_location ?? doc.checkoutLocation ?? doc.outLocation
        const raw = preferField === 'checkOut' ? (checkOut ?? checkIn) : (checkIn ?? checkOut)
        if (Array.isArray(raw) && raw.length >= 2) {
          const a = parseCoord(raw[0])
          const b = parseCoord(raw[1])
          if (a != null && b != null) return { lat: a, lng: b }
        }
        if (raw && typeof raw === 'object') {
          const lat = raw.latitude ?? raw.lat ?? raw._lat
          const lng = raw.longitude ?? raw.lng ?? raw._long
          if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) }
        }
        const lat = doc.latitude ?? doc.lat
        const lng = doc.longitude ?? doc.lng
        if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) }
        const str = doc.location ?? doc.address ?? doc.coordinates
        if (typeof str === 'string') {
          const parts = str.split(/[,\s]+/).map((p) => parseCoord(p.trim())).filter((n) => n != null)
          if (parts.length >= 2) return { lat: parts[0], lng: parts[1] }
        }
        return null
      }
      const resolveToLocationName = (lat, lng) => {
        if (lat == null || lng == null || !locations.length) return null
        for (const loc of locations) {
          const locLat = loc.latitude ?? loc.lat
          const locLng = loc.longitude ?? loc.lng
          const radius = loc.radius != null ? Number(loc.radius) : 100
          if (locLat != null && locLng != null && haversineMeters(lat, lng, locLat, locLng) <= radius) {
            return loc.name || loc.locationName || null
          }
        }
        return null
      }
      const formatLoc = (doc, preferField) => {
        if (!doc) return null
        const str = (v) => (v != null && v !== '' && typeof v === 'string' ? String(v).trim() : '')
        const coords = extractCoords(doc, preferField)
        if (coords) {
          const name = resolveToLocationName(coords.lat, coords.lng)
          if (name) return name
          return `${coords.lat}, ${coords.lng}`
        }
        const ciStr = str(doc.checkInLocation) || str(doc.check_in_location) || str(doc.checkinLocation)
        const coStr = str(doc.checkOutLocation) || str(doc.check_out_location) || str(doc.checkoutLocation) || str(doc.outLocation)
        const locStr = preferField === 'checkOut' ? (coStr || ciStr) : (ciStr || coStr) || str(doc.address)
        if (locStr) return locStr
        if (doc.location && typeof doc.location === 'string') return doc.location.trim()
        const nest = doc.location && typeof doc.location === 'object'
        if (nest) {
          if (nest.address && typeof nest.address === 'string') return nest.address.trim()
          if (nest.latitude != null && nest.longitude != null) return `${nest.latitude}, ${nest.longitude}`
        }
        return null
      }
      const checkInLocation = formatLoc(ci, 'checkIn') ?? formatLoc(co, 'checkIn')
      const checkOutLocation = co ? (formatLoc(co, 'checkOut') || '—') : '—'
      return {
        id: ci.id,
        date: formatDateLabel(ci.timestamp),
        employeeName,
        employeeId: ci.employeeId,
        distributor: { initial: distInitial, name: distName },
        bitName,
        primaryIn,
        workTime: workTime || '',
        totalCall: ci.totalCall ?? co?.productiveCalls ?? null,
        productiveCall: productiveCallVal ?? null,
        primaryAchieved: primaryAchievedVal != null ? (typeof primaryAchievedVal === 'number' ? `${primaryAchievedVal}kg` : String(primaryAchievedVal) + (String(primaryAchievedVal).endsWith('kg') ? '' : 'kg')) : null,
        secondaryAchieved: secondaryAchievedVal != null ? (typeof secondaryAchievedVal === 'number' ? `${secondaryAchievedVal}kg` : String(secondaryAchievedVal) + (String(secondaryAchievedVal).endsWith('kg') ? '' : 'kg')) : null,
        notes: notesVal || '',
        checkInLocation: checkInLocation || '—',
        checkOutLocation: checkOutLocation || '—',
        isOnLeave: !!ci.isOnLeave,
        checkInTs: ci.timestamp,
        checkOutTs: co?.timestamp,
        ciDate: ci.date,
      }
    }

    const emptyRow = (emp) => ({
      id: `emp-${emp.id}`,
      date: { day: '—', date: '—' },
      employeeName: emp.salesPersonName || emp.email || emp.id || '—',
      employeeId: emp.id,
      distributor: { initial: null, name: '—' },
      bitName: '—',
      primaryIn: null,
      workTime: '',
      totalCall: null,
      productiveCall: null,
      primaryAchieved: null,
      secondaryAchieved: null,
      notes: '',
      checkInLocation: '—',
      checkOutLocation: '—',
      isOnLeave: false,
      checkInTs: null,
      checkOutTs: null,
      ciDate: null,
    })

    // One row per employee; show check-in/check-out for selected date only
    return employees.map((emp) => {
      const forEmp = checkIns.filter((ci) => ciMatchesEmployee(ci, emp))
      const onSelectedDay = forEmp.filter((ci) => isCheckInOnDate(ci, selectedDate))
      const sorted = [...onSelectedDay].sort((a, b) => {
        const ta = toDate(a.timestamp)?.getTime() ?? 0
        const tb = toDate(b.timestamp)?.getTime() ?? 0
        return tb - ta
      })
      const latest = sorted[0]
      if (!latest) {
        return emptyRow(emp)
      }
      const co = checkOutByKey[latest.id] || (latest.employeeEmail != null && latest.date != null ? checkOutByKey[`${latest.employeeEmail}|${latest.date}`] : null)
      const row = buildRowFromCheckIn(latest, co)
      return {
        ...row,
        id: `emp-${emp.id}`,
        employeeName: emp.salesPersonName || emp.email || emp.id || '—',
        employeeId: emp.id,
      }
    })
  }, [checkIns, checkOuts, employees, distributors, locations, selectedDate])

  const filteredRows = useMemo(() => {
    let rows = [...tableRows]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      rows = rows.filter((r) => r.employeeName.toLowerCase().includes(q))
    }
    return rows.sort((a, b) => {
      const ta = toDate(a.checkInTs)?.getTime() || 0
      const tb = toDate(b.checkInTs)?.getTime() || 0
      if (ta !== tb) return tb - ta
      return (a.employeeName || '').localeCompare(b.employeeName || '', undefined, { sensitivity: 'base' })
    })
  }, [tableRows, searchQuery])

  const summary = useMemo(() => {
    // Only count rows that have an actual check-in on the selected date (calendar filter)
    const rowsWithVisit = filteredRows.filter((r) => !r.isOnLeave && r.checkInTs != null)
    const totalVisits = rowsWithVisit.length
    const totalProductiveCalls = rowsWithVisit.reduce((s, r) => s + (Number(r.productiveCall) || 0), 0)
    const workTimesMs = rowsWithVisit
      .map((r) => {
        const start = toDate(r.checkInTs)
        const end = toDate(r.checkOutTs)
        if (!start || !end) return 0
        return end - start
      })
      .filter((ms) => ms > 0)
    const avgWorkingHours = workTimesMs.length
      ? (workTimesMs.reduce((a, b) => a + b, 0) / workTimesMs.length / 3600000).toFixed(1)
      : '0'
    const totalPrimary = rowsWithVisit.reduce((s, r) => {
      const v = typeof r.primaryAchieved === 'string' ? parseFloat(r.primaryAchieved) : (r.primaryAchieved || 0)
      return s + (isNaN(v) ? 0 : v)
    }, 0)
    const totalSecondary = rowsWithVisit.reduce((s, r) => {
      const v = typeof r.secondaryAchieved === 'string' ? parseFloat(r.secondaryAchieved) : (r.secondaryAchieved || 0)
      return s + (isNaN(v) ? 0 : v)
    }, 0)
    return {
      totalVisits: totalVisits.toLocaleString(),
      productiveCalls: totalProductiveCalls.toLocaleString(),
      avgWorkingHours: `${avgWorkingHours}h`,
      totalPrimarySales: `${totalPrimary.toLocaleString()} kg`,
      totalSecondarySales: `${totalSecondary.toLocaleString()} kg`,
    }
  }, [filteredRows])

  return (
    <div className="main-content">
      <UniversalHeader title="Attendance & Daily Sales Reports" />
      <div className="content-wrapper">
        <CheckInOutSummaryCards summary={summary} />
        <CheckInOutFilters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <CheckInOutTable tableData={filteredRows} />
      </div>
    </div>
  )
}

export default CheckInOutPage
