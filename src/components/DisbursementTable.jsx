import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { collection, onSnapshot, doc, setDoc, serverTimestamp, deleteField } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import { useExpenditureAdmin } from '../hooks/useExpenditureAdmin'
import { applyOverridesToRows, buildTaDaFirestorePresentation } from '../utils/disbursementOverrideTiers'
import './DisbursementTable.css'

const CHECK_INS_COLLECTION     = 'check_ins'
const CHECK_OUTS_COLLECTION   = 'check_outs'
const EMPLOYEES_COLLECTION    = 'employees'
const DISTRIBUTORS_COLLECTION = 'distributors'
const MASTER_SHEETS_COLLECTION = 'master_sheets'
const LOCATIONS_COLLECTION    = 'locations'
const EXPENDITURE_COLLECTION  = 'Expenditure'
const MONTHLY_DATA_COLLECTION = 'monthlyData'
const DISBURSEMENT_OVERRIDES_COLLECTION = 'disbursementOverrides'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// Always parse as dd/mm/yyyy (Indian format)
function parseDate(v) {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const clean = String(v).trim().replace(/\s/g, '')
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const [day, mon, yr] = clean.split(/[\/\-]/).map(Number)
    const d = new Date(yr, mon - 1, day)
    return isNaN(d.getTime()) ? null : d
  }
  const p = new Date(v)
  return isNaN(p.getTime()) ? null : p
}

function toN(v) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function fmt(v) {
  return v > 0 ? v : '—'
}

/** Calendar days in month that are not Sunday (denominator for salary formula). */
function countNonSundayDaysInMonth(yr, monthIndex0) {
  const lastDay = new Date(yr, monthIndex0 + 1, 0).getDate()
  let n = 0
  for (let day = 1; day <= lastDay; day++) {
    if (new Date(yr, monthIndex0, day).getDay() !== 0) n++
  }
  return n
}

function dateKeyYMD(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/** Non-Sunday days in month with no check-in and no check-out = leave. */
function countLeavesNonSunday(yr, monthIndex0, presentDateKeys) {
  const lastDay = new Date(yr, monthIndex0 + 1, 0).getDate()
  let leaves = 0
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(yr, monthIndex0, day)
    if (d.getDay() === 0) continue
    if (!presentDateKeys.has(dateKeyYMD(d))) leaves++
  }
  return leaves
}

/** Gross / base salary from employee doc. */
function getGrossSalary(emp) {
  if (!emp) return 0
  const v = emp.grossSalary ?? emp.gross_salary ?? emp.salary ?? emp.baseSalary
  return toN(v)
}

/**
 * Monthly salary = Gross - (Leaves × Gross ÷ Working days in month)
 * Working days = days in that month excluding Sundays.
 */
function computeNetMonthlySalary(gross, leaves, workingDaysInMonth) {
  const g = Number(gross) || 0
  if (g <= 0 || workingDaysInMonth <= 0) return null
  const net = g - leaves * (g / workingDaysInMonth)
  return Math.round(net)
}

function mergeAttendanceSets(attendanceByKey, empKey, emp) {
  const merged = new Set()
  const keys = [empKey, emp?.id, emp?.email, emp?.employeeEmail].filter(Boolean)
  keys.forEach((k) => {
    const s = attendanceByKey[k]
    if (s) s.forEach((d) => merged.add(d))
  })
  return merged
}

/** Target achievement % from monthlyData distributorDetails (same shape as Monthly table save). */
function parseAchievementPctFromDistributorDetail(dd) {
  if (!dd) return null
  const a = dd.achieved
  if (a != null && a !== '' && a !== '—') {
    const s = String(a).trim()
    if (/%/.test(s)) {
      const n = parseFloat(s.replace(/[^\d.]/g, ''))
      if (!Number.isNaN(n)) return n
    }
  }
  const target = toN(dd.target)
  if (target <= 0) return null
  const p1 = toN(dd.primary1to7) + toN(dd.primary8to15) + toN(dd.primary16to22) + toN(dd.primary23to31)
  return Math.round((p1 / target) * 1000) / 10
}

/** Styling from monthlyData target achieved % — does not change TA/DA values. */
function taDaStyleClasses(pct) {
  if (pct == null || Number.isNaN(pct)) return { taClass: '', daClass: '' }
  if (pct < 50) return { taClass: 'disb-tada-bold-red', daClass: 'disb-tada-bold-red' }
  if (pct <= 70) return { taClass: '', daClass: 'disb-da-red' }
  return { taClass: 'disb-tada-bold-blue', daClass: 'disb-tada-bold-blue' }
}

/** Doc id like 3gXEWzN8VYini2gO8Pg4_2026_Mar → { empId, year, month } */
function parseMonthlyDataDocumentId(id) {
  if (!id || typeof id !== 'string') return null
  const parts = id.split('_')
  if (parts.length < 3) return null
  const monthLabel = parts[parts.length - 1]
  const yearPart = parts[parts.length - 2]
  if (!MONTH_LABELS.includes(monthLabel)) return null
  const empId = parts.slice(0, -2).join('_')
  if (!empId || !/^\d{4}$/.test(yearPart)) return null
  return { empId, year: yearPart, month: monthLabel }
}

function monthlyDataDocMatchesPeriod(doc, periodKey) {
  if (doc.period === periodKey) return true
  const p = parseMonthlyDataDocumentId(doc.id)
  if (!p) return false
  return `${p.year}_${p.month}` === periodKey
}

function findMonthlyDataForEmployee(monthlyDataForPeriod, emp, empKey, periodKey) {
  const ids = new Set(
    [emp?.id, empKey, emp?.email, emp?.employeeEmail].filter(Boolean).map((x) => String(x))
  )
  return monthlyDataForPeriod.find((m) => {
    if (!monthlyDataDocMatchesPeriod(m, periodKey)) return false
    const mid = m.employeeId != null ? String(m.employeeId) : ''
    if (mid && ids.has(mid)) return true
    const parsed = parseMonthlyDataDocumentId(m.id)
    return !!(parsed && ids.has(parsed.empId))
  })
}

function resolveDistributorDetail(mdDoc, distributorId, co, distributors) {
  if (!mdDoc?.distributorDetails) return null
  const details = mdDoc.distributorDetails
  if (distributorId && details[distributorId]) return details[distributorId]
  const name = (co.distributorName || co.distributor || '').trim()
  if (!name) return null
  const norm = (s) => String(s || '').trim().toLowerCase()
  const n = norm(name.split(',')[0])
  for (const d of distributors) {
    const id = d.id
    if (!id || !details[id]) continue
    const dn = norm(d.distributorName || d.name || '')
    if (dn && (n.includes(dn) || dn.includes(n) || norm(name) === dn)) return details[id]
  }
  return null
}

function normalizeOverrideEntry(e) {
  if (!e || typeof e !== 'object') return {}
  const out = { ...e }
  delete out.taAmount
  delete out.daAmount
  if (out.taTier === 'auto') delete out.taTier
  if (out.daTier === 'auto') delete out.daTier
  return out
}

const DisbursementDetailRow = memo(function DisbursementDetailRow({ detail, ov, showControls, onPatch }) {
  const taTier = ov?.taTier || 'auto'
  const daTier = ov?.daTier || 'auto'
  return (
    <tr>
      <td className="disb-date-cell">{detail.dateLabel}</td>
      <td>
        <div className="distributor-cell">
          <div className="distributor-info">
            <div className="distributor-name">{detail.distName}</div>
            <div className="distributor-location">{detail.location}</div>
          </div>
        </div>
      </td>
      <td>{detail.bitName}</td>
      <td>{fmt(detail.secondary)}</td>
      <td>{fmt(detail.totalCalls)}</td>
      <td>{fmt(detail.productiveCalls)}</td>
      <td
        className={['disb-override-cell', detail.taClass || ''].filter(Boolean).join(' ')}
      >
        <div className="disb-cell-stack">
          <span>{fmt(detail.ta)}</span>
          {showControls && (
            <select
              className="disb-override-select"
              value={taTier}
              onChange={(e) => onPatch(detail.id, { taTier: e.target.value })}
              aria-label="TA color override"
            >
              <option value="auto">TA: Auto</option>
              <option value="red">TA: Red</option>
              <option value="blue">TA: Blue</option>
              <option value="none">TA: Plain</option>
            </select>
          )}
        </div>
      </td>
      <td
        className={['disb-override-cell', detail.daClass || ''].filter(Boolean).join(' ')}
      >
        <div className="disb-cell-stack">
          <span>{detail.daDisplay > 0 ? detail.daDisplay : '—'}</span>
          {showControls && (
            <select
              className="disb-override-select"
              value={daTier}
              onChange={(e) => onPatch(detail.id, { daTier: e.target.value })}
              aria-label="DA color override"
            >
              <option value="auto">DA: Auto</option>
              <option value="redBold">DA: Red bold</option>
              <option value="blueBold">DA: Blue bold</option>
              <option value="midRed">DA: Red (50–70%)</option>
              <option value="withheld">DA: Withheld style</option>
              <option value="none">DA: Plain</option>
            </select>
          )}
        </div>
      </td>
      <td>{fmt(detail.nh)}</td>
    </tr>
  )
})

const DisbursementTable = ({
  year = '2026',
  month = 'Jan',
  searchQuery = '',
  showOverrideControls = false,
  onSummaryChange,
}) => {
  const isExpenditureAdmin = useExpenditureAdmin()
  const showOverrideDropdowns = isExpenditureAdmin && showOverrideControls
  const [expandedRows, setExpandedRows] = useState({})
  const [checkIns, setCheckIns]         = useState([])
  const [checkOuts, setCheckOuts]       = useState([])
  const [employees, setEmployees]       = useState([])
  const [distributors, setDistributors] = useState([])
  const [masterSheets, setMasterSheets] = useState([])
  const [locationList, setLocationList] = useState([])
  const [monthlyDataRaw, setMonthlyDataRaw] = useState([])
  const [disbursementOverrideEntries, setDisbursementOverrideEntries] = useState({})
  const overrideEntriesRef = useRef({})
  const debounceTimers = useRef({})

  useEffect(() => {
    overrideEntriesRef.current = disbursementOverrideEntries
  }, [disbursementOverrideEntries])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, MONTHLY_DATA_COLLECTION), (snapshot) => {
      setMonthlyDataRaw(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const docId = `${year}_${month}`
    const unsub = onSnapshot(doc(db, DISBURSEMENT_OVERRIDES_COLLECTION, docId), (snap) => {
      setDisbursementOverrideEntries(snap.exists() ? snap.data().entries || {} : {})
    })
    return () => unsub()
  }, [year, month])

  const flushOverrideToFirestore = useCallback(
    async (checkoutId, entry) => {
      if (!isFirebaseConfigured || !db) return
      const docRef = doc(db, DISBURSEMENT_OVERRIDES_COLLECTION, `${year}_${month}`)
      const cleaned = normalizeOverrideEntry(entry)
      if (Object.keys(cleaned).length === 0) {
        await setDoc(
          docRef,
          { [`entries.${checkoutId}`]: deleteField(), updatedAt: serverTimestamp() },
          { merge: true }
        )
      } else {
        await setDoc(
          docRef,
          { [`entries.${checkoutId}`]: cleaned, updatedAt: serverTimestamp() },
          { merge: true }
        )
      }
    },
    [year, month]
  )

  const patchDisbursementOverride = useCallback(
    (checkoutId, patch) => {
      const merged = { ...(overrideEntriesRef.current[checkoutId] || {}), ...patch }
      const cleaned = normalizeOverrideEntry(merged)
      window.clearTimeout(debounceTimers.current[checkoutId])
      debounceTimers.current[checkoutId] = window.setTimeout(() => {
        void flushOverrideToFirestore(checkoutId, cleaned)
        delete debounceTimers.current[checkoutId]
      }, 420)
    },
    [flushOverrideToFirestore]
  )

  useEffect(
    () => () => {
      Object.keys(debounceTimers.current).forEach((k) => {
        window.clearTimeout(debounceTimers.current[k])
      })
    },
    []
  )

  const periodKey = `${year}_${month}`
  const monthlyDataForPeriod = useMemo(
    () => monthlyDataRaw.filter((m) => monthlyDataDocMatchesPeriod(m, periodKey)),
    [monthlyDataRaw, periodKey]
  )

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const u1 = onSnapshot(collection(db, CHECK_INS_COLLECTION),     s => setCheckIns(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u2 = onSnapshot(collection(db, CHECK_OUTS_COLLECTION),    s => setCheckOuts(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u3 = onSnapshot(collection(db, EMPLOYEES_COLLECTION),     s => setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u4 = onSnapshot(collection(db, DISTRIBUTORS_COLLECTION), s => setDistributors(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u5 = onSnapshot(collection(db, MASTER_SHEETS_COLLECTION), s => setMasterSheets(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    const u6 = onSnapshot(collection(db, LOCATIONS_COLLECTION),    s => setLocationList(s.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => { u1(); u2(); u3(); u4(); u5(); u6() }
  }, [])

  const toggleRow = (id) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))

  // Build master sheet lookup: employeeId → rows [{ from, to, oneWayTA, da, nighthault }]
  const masterSheetLookup = useMemo(() => {
    const lookup = {}
    masterSheets.forEach(doc => {
      lookup[doc.id] = Array.isArray(doc.rows) ? doc.rows : []
    })
    return lookup
  }, [masterSheets])

  // Find matching master sheet row for route From=Nagpur to destination; returns row or null
  const getMasterRowForRoute = (rows, toDestination) => {
    if (!rows?.length || !toDestination) return null
    const toNorm = String(toDestination).trim().toLowerCase()
    if (!toNorm) return null
    return rows.find(r => {
      const from = String(r.from || '').trim().toLowerCase()
      const to = String(r.to || '').trim().toLowerCase()
      if (from !== 'nagpur') return false
      return to === toNorm || to.includes(toNorm) || toNorm.includes(to)
    }) || null
  }

  const getOneWayTAForRoute = (rows, toDestination) => {
    const row = getMasterRowForRoute(rows, toDestination)
    const ta = row?.oneWayTA
    return ta != null && ta !== '' ? Number(ta) : null
  }

  const getNighthaultForRoute = (rows, toDestination) => {
    const row = getMasterRowForRoute(rows, toDestination)
    const nh = row?.nighthault
    return nh != null && nh !== '' ? Number(nh) : null
  }

  /** DA from master_sheets row for route (same matching as TA); null if cell empty / no row */
  const getDAForRoute = (rows, toDestination) => {
    const row = getMasterRowForRoute(rows, toDestination)
    if (!row) return null
    const d = row.da
    if (d == null || (typeof d === 'string' && !String(d).trim())) return null
    const n = toN(d)
    return Number.isFinite(n) ? n : null
  }

  // Build bits lookup: normalised date-key → empKey → distKey → bits string
  const bitsLookup = useMemo(() => {
    const lookup = {}
    checkIns.forEach(ci => {
      const empKeys = [ci.employeeId, ci.employeeEmail, ci.employee_email].filter(Boolean)
      const distKeys = [ci.distributorId, ci.distributor, ci.distributorName].filter(Boolean)
      const bits = ci.bits || ci.bitName || ci.bit || ''
      const dateRaw = ci.date || ci.timestamp
      if (empKeys.length === 0 || distKeys.length === 0 || !bits || !dateRaw) return
      const d = parseDate(dateRaw)
      if (!d) return
      const dateKey = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`
      if (!lookup[dateKey]) lookup[dateKey] = {}
      empKeys.forEach(ek => {
        if (!lookup[dateKey][ek]) lookup[dateKey][ek] = {}
        distKeys.forEach(dk => { lookup[dateKey][ek][dk] = bits })
      })
    })
    return lookup
  }, [checkIns])

  // Resolve raw location (string or coords) to place name for TA route matching
  const resolvePlaceName = useCallback((raw) => {
    if (!raw) return ''
    const parseCoord = (v) => {
      if (v == null) return null
      if (typeof v === 'number' && !isNaN(v)) return v
      if (typeof v === 'object' && (v.latitude != null || v.lat != null)) return Number(v.latitude ?? v.lat)
      if (typeof v === 'object' && (v.longitude != null || v.lng != null)) return Number(v.longitude ?? v.lng)
      const s = String(v).replace(/°\s*[NSEW]/gi, '').trim()
      const n = parseFloat(s)
      return isNaN(n) ? null : n
    }
    let lat, lng
    if (Array.isArray(raw) && raw.length >= 2) {
      lat = parseCoord(raw[0])
      lng = parseCoord(raw[1])
    } else if (raw && typeof raw === 'object') {
      lat = raw.latitude ?? raw.lat ?? raw._lat
      lng = raw.longitude ?? raw.lng ?? raw._long
      if (lat != null && lng != null) {
        lat = Number(lat)
        lng = Number(lng)
      }
    }
    if (lat != null && lng != null && locationList?.length) {
      for (const loc of locationList) {
        const locLat = loc.latitude ?? loc.lat
        const locLng = loc.longitude ?? loc.lng
        const radius = loc.radius != null ? Number(loc.radius) : 100
        if (locLat != null && locLng != null && haversineMeters(lat, lng, locLat, locLng) <= radius) {
          return loc.name || loc.locationName || ''
        }
      }
    }
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
    return ''
  }, [locationList])

  // Build location lookup: actual place name (e.g. Kopargaon) from check_ins/check_outs for TA route matching
  // Master sheet uses place names like "Kopargaon", not bit names like "Wardha Interior"
  const locationLookup = useMemo(() => {
    const lookup = {}
    const add = (rec, loc) => {
      const placeName = resolvePlaceName(loc)
      if (!placeName || placeName === '—') return
      const empKeys = [rec.employeeId, rec.employeeEmail, rec.employee_email].filter(Boolean)
      const distKeys = [rec.distributorId, rec.distributor, rec.distributorName].filter(Boolean)
      const dateRaw = rec.date || rec.timestamp
      if (empKeys.length === 0 || distKeys.length === 0 || !dateRaw) return
      const d = parseDate(dateRaw)
      if (!d) return
      const dateKey = `${d.getDate()}/${d.getMonth()}/${d.getFullYear()}`
      if (!lookup[dateKey]) lookup[dateKey] = {}
      empKeys.forEach(ek => {
        if (!lookup[dateKey][ek]) lookup[dateKey][ek] = {}
        distKeys.forEach(dk => { lookup[dateKey][ek][dk] = placeName })
      })
    }
    checkIns.forEach(ci => {
      const loc = ci.checkInLocation || ci.check_in_location || ci.checkinLocation || ci.location
      add(ci, loc)
    })
    checkOuts.forEach(co => {
      const loc = co.checkOutLocation || co.check_out_location || co.checkoutLocation || co.location
      add(co, loc)
    })
    return lookup
  }, [checkIns, checkOuts, resolvePlaceName])

  const baseTableData = useMemo(() => {
    const monthIndex = MONTH_LABELS.indexOf(month)  // 0-based
    const yr = Number(year)
    const workingDaysInMonth = countNonSundayDaysInMonth(yr, monthIndex)

    // Any day with check-in OR check-out counts as present (not a leave)
    const attendanceByKey = {}
    const addAttendance = (rec) => {
      const d = parseDate(rec.date || rec.timestamp)
      if (!d || d.getFullYear() !== yr || d.getMonth() !== monthIndex) return
      const ek = rec.employeeId || rec.employeeEmail || rec.employee_email
      if (!ek) return
      const dk = dateKeyYMD(d)
      if (!attendanceByKey[ek]) attendanceByKey[ek] = new Set()
      attendanceByKey[ek].add(dk)
    }
    checkIns.forEach(addAttendance)
    checkOuts.forEach(addAttendance)

    // Filter checkouts to selected month/year
    const filtered = checkOuts.filter(co => {
      const d = parseDate(co.date || co.timestamp)
      if (!d) return false
      return d.getFullYear() === yr && d.getMonth() === monthIndex
    })

    // Group: empKey → [checkout records]
    const empMap = {}
    filtered.forEach(co => {
      const empKey = co.employeeId || co.employeeEmail || co.employee_email || ''
      if (!empKey) return
      if (!empMap[empKey]) empMap[empKey] = []
      empMap[empKey].push(co)
    })

    // Build row per employee
    const rows = Object.entries(empMap).map(([empKey, records]) => {
      const emp = employees.find(
        e => e.id === empKey || e.email === empKey || e.employeeEmail === empKey
      )
      const name   = emp?.salesPersonName || emp?.name || emp?.email || empKey
      const role   = emp?.designation || emp?.role || '—'
      const presentDates = mergeAttendanceSets(attendanceByKey, empKey, emp)
      const leaves = countLeavesNonSunday(yr, monthIndex, presentDates)
      const gross = getGrossSalary(emp)
      const salaryNum = computeNetMonthlySalary(gross, leaves, workingDaysInMonth)
      const salary = salaryNum != null ? salaryNum : '—'
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name.replace(/\s+/g, '+'))}&background=6b7280&color=fff`

      // One detail row per checkout record (sorted by date ascending)
      const details = records
        .slice()
        .sort((a, b) => {
          const da = parseDate(a.date || a.timestamp)
          const db_ = parseDate(b.date || b.timestamp)
          return (da || 0) - (db_ || 0)
        })
        .map(co => {
          const distKey  = co.distributorId || co.distributor || co.distributorName || ''
          const dist     = distributors.find(d => d.id === distKey || d.distributorName === distKey || d.name === distKey)
          const distName = dist?.distributorName || dist?.name || co.distributorName || distKey || '—'
          const location = dist?.zone || dist?.area || dist?.location || '—'
          const icon     = distName.slice(0, 2).toUpperCase()

          // Format date as "1 Mar 2026"
          const dateObj = parseDate(co.date || co.timestamp)
          const dateLabel = dateObj
            ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : (co.date || '—')

          // Resolve bits from check_ins: try multiple emp/dist key combos (check_in and check_out may use different field names)
          const dateObj2 = parseDate(co.date || co.timestamp)
          const dateKey  = dateObj2 ? `${dateObj2.getDate()}/${dateObj2.getMonth()}/${dateObj2.getFullYear()}` : ''
          const empKeysToTry = [empKey, emp?.id, emp?.email].filter(Boolean)
          const distKeysToTry = [co.distributorId, co.distributor, co.distributorName, dist?.id, dist?.distributorName, dist?.name, distName].filter(Boolean)
          let bitsFromCI = ''
          for (const ek of empKeysToTry) {
            for (const dk of distKeysToTry) {
              bitsFromCI = bitsLookup[dateKey]?.[ek]?.[dk] || ''
              if (bitsFromCI) break
            }
            if (bitsFromCI) break
          }
          const bitName = bitsFromCI || co.bits || co.bitName || co.bit || '—'

          // Resolve actual place name (e.g. Kopargaon) from check_in/check_out - master sheet uses this, not bit name (Wardha Interior)
          let placeName = ''
          for (const ek of empKeysToTry) {
            for (const dk of distKeysToTry) {
              placeName = locationLookup[dateKey]?.[ek]?.[dk] || ''
              if (placeName) break
            }
            if (placeName) break
          }
          if (!placeName) {
            const rawLoc = co.checkInLocation || co.checkOutLocation || co.check_in_location || co.check_out_location || co.location
            placeName = resolvePlaceName(rawLoc) || ''
          }

          // Night halt: check boolean (nightHoult typo in Firebase) or numeric value
          const isNightHalt = !!(co.nightHoult ?? co.nightHalt ?? (toN(co.nh ?? co.NH) > 0))
          let nhVal = toN(co.nh ?? co.NH ?? co.nightHalt)
          let taVal = toN(co.ta ?? co.TA ?? co.travelAllowance)

          const sheetRows = masterSheetLookup[emp?.id] || masterSheetLookup[empKey] || []
          const toCandidates = [placeName, bitName, location, distName].filter(t => t && t !== '—')

          if (isNightHalt) {
            // Night halt true: TA = oneWayTA * 1, N/H = nighthault amount from master sheet
            for (const toDest of toCandidates) {
              const row = getMasterRowForRoute(sheetRows, toDest)
              if (row) {
                const oneWay = row.oneWayTA != null && row.oneWayTA !== '' ? Number(row.oneWayTA) : 0
                const nighthaultAmt = row.nighthault != null && row.nighthault !== '' ? Number(row.nighthault) : null
                taVal = taVal > 0 ? taVal : oneWay * 1
                nhVal = nighthaultAmt ?? nhVal
                break
              }
            }
          } else if (taVal === 0 && nhVal === 0) {
            // No night halt: TA = oneWayTA * 2 from master sheet
            for (const toDest of toCandidates) {
              const oneWay = getOneWayTAForRoute(sheetRows, toDest)
              if (oneWay != null && oneWay > 0) {
                taVal = oneWay * 2
                break
              }
            }
          }

          let distributorId = dist?.id || (typeof distKey === 'string' && distKey.length > 0 ? distKey : '')
          const mdDoc = findMonthlyDataForEmployee(monthlyDataForPeriod, emp, empKey, periodKey)
          if (mdDoc?.distributorDetails && distributorId && !mdDoc.distributorDetails[distributorId]) {
            const byName = distributors.find(
              (d) =>
                (d.distributorName && co.distributorName && d.distributorName === co.distributorName) ||
                (d.name && co.distributorName && d.name === co.distributorName)
            )
            if (byName?.id) distributorId = byName.id
          }
          const distDetail = resolveDistributorDetail(mdDoc, distributorId, co, distributors)
          const achievementPct = parseAchievementPctFromDistributorDetail(distDetail)
          const { taClass, daClass: daClassFromPct } = taDaStyleClasses(achievementPct)
          const totalCalls = toN(co.totalCall ?? co.totalCalls)

          let daFromMaster = null
          for (const toDest of toCandidates) {
            const n = getDAForRoute(sheetRows, toDest)
            if (n != null) {
              daFromMaster = n
              break
            }
          }
          const daCheckout = toN(co.da ?? co.DA ?? co.dailyAllowance)
          const daResolved = daFromMaster != null ? daFromMaster : daCheckout
          const daPaid = totalCalls < 30 ? 0 : daResolved
          const daClass =
            totalCalls < 30 && daResolved > 0
              ? 'disb-da-withheld'
              : totalCalls < 30
                ? ''
                : daClassFromPct

          return {
            id:
              co.id ||
              `${empKey}_${dateLabel}_${String(co.distributorId || co.distributorName || '').slice(0, 48)}`,
            dateLabel,
            distName, location, icon,
            bitName,
            distributorId,
            achievementPct,
            taClass,
            daClass,
            secondary:      toN(co.achievedSecondary ?? co.secondaryAchieved),
            totalCalls,
            productiveCalls:toN(co.productiveCalls ?? co.productiveCall),
            ta:             taVal,
            da:             daPaid,
            daDisplay:      daResolved,
            nh:             nhVal,
          }
        })

      // Unique work days = distinct dates across all checkout records
      const uniqueDates = new Set(
        records.map(co => {
          const d = parseDate(co.date || co.timestamp)
          return d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : null
        }).filter(Boolean)
      )

      // Employee-level totals: `da` = paid DA (0 when calls <30); `daSumDisplay` = sum of master/checkout DA shown per row
      const totals = details.reduce(
        (acc, d) => ({
          secondary:       acc.secondary        + d.secondary,
          productiveCalls: acc.productiveCalls   + d.productiveCalls,
          ta:              acc.ta                + d.ta,
          da:              acc.da                + d.da,
          daSumDisplay:    acc.daSumDisplay      + (d.daDisplay ?? 0),
          nh:              acc.nh                + d.nh,
        }),
        { secondary: 0, productiveCalls: 0, ta: 0, da: 0, daSumDisplay: 0, nh: 0 }
      )

      const workDays = uniqueDates.size

      return {
        empKey,
        employee: { name, role, avatar },
        salary,
        grossSalary: gross,
        leaves,
        workingDaysInMonth,
        details,
        workDays,
        ...totals,
      }
    })

    return rows
  }, [checkIns, checkOuts, employees, distributors, bitsLookup, locationLookup, masterSheetLookup, resolvePlaceName, year, month, monthlyDataForPeriod, periodKey])

  const tableData = useMemo(
    () => applyOverridesToRows(baseTableData, disbursementOverrideEntries),
    [baseTableData, disbursementOverrideEntries]
  )

  // Filter by search for display
  const displayRows = useMemo(() => {
    if (!searchQuery.trim()) return tableData
    const q = searchQuery.toLowerCase().trim()
    return tableData.filter(r =>
      r.employee.name.toLowerCase().includes(q) ||
      r.details.some(d => d.distName.toLowerCase().includes(q))
    )
  }, [tableData, searchQuery])

  const pageSummary = useMemo(() => {
    let incentives = 0
    monthlyDataForPeriod.forEach((m) => {
      const dd = m.distributorDetails || {}
      Object.values(dd).forEach((row) => {
        if (row && typeof row === 'object') incentives += toN(row.incentive)
      })
    })
    const salary = tableData.reduce((s, r) => s + (typeof r.salary === 'number' ? r.salary : 0), 0)
    const da = tableData.reduce((s, r) => s + (r.daSumDisplay ?? 0), 0)
    const ta = tableData.reduce((s, r) => s + (r.ta || 0), 0)
    const nh = tableData.reduce((s, r) => s + (r.nh || 0), 0)
    return { salary, da, ta, nh, incentives }
  }, [tableData, monthlyDataForPeriod])

  useEffect(() => {
    onSummaryChange?.(pageSummary)
  }, [pageSummary, onSummaryChange])

  // Sync computed disbursement data to Expenditure + mirror TA/DA value + class + color per line
  useEffect(() => {
    if (!isFirebaseConfigured || !db || tableData.length === 0) return
    const monthIndex = MONTH_LABELS.indexOf(month)
    const yr = String(year)
    const promises = tableData.map((row) => {
      const docId = `${yr}_${month}_${String(row.empKey).replace(/[/\\?#]/g, '_')}`
      const payload = {
        employeeId: row.empKey,
        employeeName: row.employee.name,
        employeeRole: row.employee.role,
        year: yr,
        month,
        monthIndex,
        totals: {
          secondary: row.secondary,
          workDays: row.workDays,
          productiveCalls: row.productiveCalls,
          ta: row.ta,
          da: row.da,
          daDisplayTotal: row.daSumDisplay,
          nh: row.nh,
        },
        salary: row.salary,
        grossSalary: row.grossSalary,
        leaves: row.leaves,
        workingDaysInMonth: row.workingDaysInMonth,
        details: row.details.map((d) => {
          const pres = buildTaDaFirestorePresentation(d)
          return {
            id: d.id,
            dateLabel: d.dateLabel,
            distName: d.distName,
            location: d.location,
            bitName: d.bitName,
            secondary: d.secondary,
            totalCalls: d.totalCalls,
            productiveCalls: d.productiveCalls,
            ta: d.ta,
            da: d.da,
            daDisplay: d.daDisplay,
            nh: d.nh,
            taClass: pres.ta.class,
            daClass: pres.da.class,
            taColor: pres.ta.color,
            daColor: pres.da.color,
            taPresentation: pres.ta,
            daPresentation: pres.da,
          }
        }),
        updatedAt: serverTimestamp(),
      }
      return setDoc(doc(db, EXPENDITURE_COLLECTION, docId), payload, { merge: true })
    })

    const overridesDocRef = doc(db, DISBURSEMENT_OVERRIDES_COLLECTION, `${year}_${month}`)
    const resolvedPatch = { resolvedSnapshotAt: serverTimestamp() }
    tableData.forEach((row) => {
      row.details.forEach((d) => {
        resolvedPatch[`entries.${d.id}.resolved`] = buildTaDaFirestorePresentation(d)
      })
    })
    promises.push(setDoc(overridesDocRef, resolvedPatch, { merge: true }))

    Promise.allSettled(promises).catch((err) => console.warn('Expenditure / override sync error:', err))
  }, [tableData, year, month])

  if (tableData.length === 0) {
    return (
      <div className="disbursement-table-container">
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 14 }}>
          No checkout data found for {month} {year}.
        </p>
      </div>
    )
  }

  return (
    <div className="disbursement-table-container">
      {showOverrideDropdowns && (
        <p className="disb-admin-hint">
          TA/DA dropdowns override <strong>colors only</strong> (amounts stay from checkout / master sheet / rules).
          Changes save automatically (debounced).
        </p>
      )}
      <div className="table-wrapper">
        <table className="disbursement-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>TOTAL SECONDARY (KG)</th>
              <th>TOTAL WORK DAYS</th>
              <th>TOTAL PRODUCTIVE CALLS</th>
              <th>TOTAL TA</th>
              <th>TOTAL DA</th>
              <th>TOTAL N/H</th>
              <th>SALARY</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <React.Fragment key={row.empKey}>
                <tr>
                  <td>
                    <div className="employee-cell">
                      <img src={row.employee.avatar} alt={row.employee.name} className="employee-avatar" />
                      <div className="employee-info">
                        <div className="employee-name">{row.employee.name}</div>
                        <div className="employee-role">{row.employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>{fmt(row.secondary)}</td>
                  <td>{fmt(row.workDays)}</td>
                  <td>{fmt(row.productiveCalls)}</td>
                  <td>{fmt(row.ta)}</td>
                  <td>{fmt(row.daSumDisplay)}</td>
                  <td>{fmt(row.nh)}</td>
                  <td className="salary-cell">{row.salary}</td>
                  <td>
                    <button className="expand-button" onClick={() => toggleRow(row.empKey)}>
                      <img
                        src="/drop-down-icon.png"
                        alt=""
                        className={`expand-arrow ${expandedRows[row.empKey] ? 'expanded' : ''}`}
                      />
                    </button>
                  </td>
                </tr>

                {expandedRows[row.empKey] && (
                  <tr className="expanded-row">
                    <td colSpan="9" className="expanded-cell" style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <div className="expanded-content">
                        <table className="detail-table">
                          <thead>
                            <tr>
                              <th>DATE</th>
                              <th>DISTRIBUTOR NAME</th>
                              <th>BIT NAME</th>
                              <th>SECONDARY (KG)</th>
                              <th>TOTAL CALLS</th>
                              <th>PRODUCTIVE CALLS</th>
                              <th>TA</th>
                              <th>DA</th>
                              <th>N/H</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details.length === 0 ? (
                              <tr><td colSpan="9" style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>No checkout data</td></tr>
                            ) : (
                              row.details.map((detail) => (
                                <DisbursementDetailRow
                                  key={detail.id}
                                  detail={detail}
                                  ov={disbursementOverrideEntries[detail.id]}
                                  showControls={showOverrideDropdowns}
                                  onPatch={patchDisbursementOverride}
                                />
                              ))
                            )}
                          </tbody>
                        </table>
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

export default DisbursementTable
