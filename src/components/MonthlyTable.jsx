import React, { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, query, where, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase'
import './MonthlyTable.css'

const EMPLOYEES_COLLECTION       = 'employees'
const DISTRIBUTORS_COLLECTION    = 'distributors'
const MONTHLY_DATA_COLLECTION    = 'monthlyData'
const MONTHLY_DATA2_COLLECTION   = 'monthly_data'
const CHECK_OUTS_COLLECTION      = 'check_outs'
const PERFORMANCE_COLLECTION     = 'performance'

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** Firestore monthly_data doc id: {employeeId}_{year}_{monthNumber} e.g. YCbRIhu3oWwVkw0cGCCZ_2026_3 */
function parseMonthlyDataDocId(docId) {
  if (!docId || typeof docId !== 'string') return null
  const parts = docId.split('_')
  if (parts.length < 3) return null
  const month = Number(parts[parts.length - 1])
  const yr = Number(parts[parts.length - 2])
  const empId = parts.slice(0, -2).join('_')
  if (!empId || Number.isNaN(month) || Number.isNaN(yr)) return null
  return { empId, year: yr, month }
}

function monthlyData2DocIdFor(employeeId, yr, monthNum) {
  return `${employeeId}_${yr}_${monthNum}`
}

// Always parse as dd/mm/yyyy (Indian date format used throughout the app)
function parseCheckoutDate(v) {
  if (!v) return null
  if (typeof v?.toDate === 'function') return v.toDate()
  if (v instanceof Date) return v
  const clean = String(v).trim().replace(/\s/g, '')
  // "01/03/2026" or "01-03-2026" → day=1, month=3, year=2026 → March 1st
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(clean)) {
    const [day, mon, yr] = clean.split(/[\/\-]/).map(Number)
    const d = new Date(yr, mon - 1, day)
    return isNaN(d.getTime()) ? null : d
  }
  // ISO "2026-03-01" handled natively
  const p = new Date(v)
  return isNaN(p.getTime()) ? null : p
}

function weekOfMonth(day) {
  if (day <=  7) return 0   // index 0 → 1st–7th
  if (day <= 15) return 1   // index 1 → 8th–15th
  if (day <= 22) return 2   // index 2 → 16th–22nd
  return 3                  // index 3 → 23rd–31st
}

function fmtSec(val) {
  if (val === 0) return 0
  return val || '—'
}

const MonthlyTable = ({ year = '2026', month = 'Jan', searchQuery = '' }) => {
  const [expandedRows, setExpandedRows] = useState({})
  const [employees, setEmployees] = useState([])
  const [distributors, setDistributors] = useState([])
  const [monthlyDataList, setMonthlyDataList] = useState([])
  const [monthlyData2, setMonthlyData2] = useState([])
  const [checkOuts, setCheckOuts] = useState([])
  const [editModal, setEditModal] = useState({ open: false, row: null, form: null })
  const [saveError, setSaveError] = useState(null)

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
    const unsub = onSnapshot(collection(db, CHECK_OUTS_COLLECTION), (snapshot) => {
      setCheckOuts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return
    const unsub = onSnapshot(collection(db, MONTHLY_DATA2_COLLECTION), (snapshot) => {
      setMonthlyData2(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
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

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const toFormVal = (v) => (v == null || v === '—' || v === '' ? '' : (typeof v === 'number' ? v : String(v)))

  const formFromDetail = (detail) => {
    if (!detail) return null
    return {
      workingDays: detail.workingDays ?? 0,
      daysWorked: toFormVal(detail.daysWorked),
      target: detail.target ?? 0,
      incentive: toFormVal(detail.incentive),
      primary: toFormVal(detail.targetPrimary),
      secondary: toFormVal(detail.targetSec),
      primary1to7: toFormVal(detail.periods?.[0]?.primary),
      primary8to15: toFormVal(detail.periods?.[1]?.primary),
      primary16to22: toFormVal(detail.periods?.[2]?.primary),
      primary23to31: toFormVal(detail.periods?.[3]?.primary),
    }
  }

  const openEdit = (row) => {
    setSaveError(null)
    const firstDetail = row.details?.[0]
    const selectedDistributorId = firstDetail?.distributorId || null
    const initialForm = formFromDetail(firstDetail) || {
      workingDays: row.workingDays ?? 0,
      daysWorked: toFormVal(row.daysWorked),
      target: row.target ?? 0,
      incentive: toFormVal(row.incentive),
      primary: toFormVal(row.primary),
      secondary: toFormVal(row.secondary),
      primary1to7: toFormVal(row.primary1to7),
      primary8to15: toFormVal(row.primary8to15),
      primary16to22: toFormVal(row.primary16to22),
      primary23to31: toFormVal(row.primary23to31),
    }
    setEditModal({
      open: true,
      row,
      selectedDistributorId,
      form: initialForm,
    })
  }

  const updateEditForm = (field, value) => {
    setEditModal((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }))
  }

  const selectDistributorInModal = (distributorId) => {
    setEditModal((prev) => {
      if (!prev.row) return prev
      const detail = prev.row.details?.find((d) => d.distributorId === distributorId)
      const form = formFromDetail(detail) || prev.form
      return {
        ...prev,
        selectedDistributorId: distributorId,
        form,
      }
    })
  }

  const saveEdit = async () => {
    if (!editModal.row || !isFirebaseConfigured || !db) return
    const { row, form, selectedDistributorId } = editModal
    if (!selectedDistributorId) {
      setSaveError('Please select a distributor.')
      return
    }
    setSaveError(null)
    const docId = `${row.id}_${periodKey}`
    const toPayloadVal = (v) => (v === '' || v === '—' ? '—' : (Number(v) || v))
    const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n }
    const totalPrimary = toNum(form.primary1to7) + toNum(form.primary8to15) + toNum(form.primary16to22) + toNum(form.primary23to31)
    const targetNum = toNum(form.target)
    const shortfall = targetNum - totalPrimary
    const achievedPct = targetNum > 0 ? Math.round((totalPrimary / targetNum) * 1000) / 10 : null
    const achieved = achievedPct != null ? `${achievedPct}%` : '—'
    const distPayload = {
      workingDays: Number(form.workingDays) || 0,
      daysWorked: toPayloadVal(form.daysWorked),
      target: Number(form.target) || 0,
      incentive: toPayloadVal(form.incentive),
      primary: toPayloadVal(form.primary),
      secondary: toPayloadVal(form.secondary),
      primary1to7: toPayloadVal(form.primary1to7),
      primary8to15: toPayloadVal(form.primary8to15),
      primary16to22: toPayloadVal(form.primary16to22),
      primary23to31: toPayloadVal(form.primary23to31),
      shortfall,
      achieved,
    }
    const current = monthlyDataList.find((m) => m.employeeId === row.id) || {
      employeeId: row.id,
      period: periodKey,
    }
    const distributorDetails = {
      ...(current.distributorDetails || {}),
      [selectedDistributorId]: distPayload,
    }
    const payload = {
      ...current,
      employeeId: row.id,
      period: periodKey,
      distributorDetails,
    }
    try {
      await setDoc(doc(db, MONTHLY_DATA_COLLECTION, docId), payload, { merge: true })
      // Also update monthly_data: doc id is {employeeId}_{year}_{month} (see Firestore console)
      const monthNum = MONTH_LABELS.indexOf(month) + 1
      const yr = Number(year)
      const canonicalId = monthlyData2DocIdFor(row.id, yr, monthNum)
      const monthlyData2Doc =
        monthlyData2.find((m) => m.id === canonicalId) ||
        monthlyData2.find((m) => {
          const parsed = parseMonthlyDataDocId(m.id)
          return (
            (m.employeeId === row.id || parsed?.empId === row.id) &&
            Number(m.month ?? m.Month ?? parsed?.month ?? '') === monthNum &&
            (m.year == null || Number(m.year) === yr || parsed?.year === yr)
          )
        })
      const targetFirestoreId = monthlyData2Doc?.id || canonicalId
      const rows = [...(monthlyData2Doc?.rows || [])]
      const rowIndex = rows.findIndex((r) => (r.distributorId || r.distributor_id) === selectedDistributorId)
      const targetKgVal = Number(form.target) || 0
      const workingDaysVal = Number(form.workingDays) || 0
      const incentiveVal = form.incentive === '' || form.incentive === '—' ? '—' : (Number(form.incentive) || form.incentive)
      const distRec = distributors.find((d) => d.id === selectedDistributorId)
      const detailLine = row.details?.find((d) => d.distributorId === selectedDistributorId)
      const distName =
        detailLine?.distributor?.name ||
        distRec?.distributorName ||
        distRec?.name ||
        '—'
      const updatedRow = {
        ...(rowIndex >= 0 ? rows[rowIndex] : {}),
        distributorId: selectedDistributorId,
        distributorName: rows[rowIndex]?.distributorName || distName,
        bits: rowIndex >= 0 ? (rows[rowIndex]?.bits ?? '—') : '—',
        lmaKg: rows[rowIndex]?.lmaKg ?? rows[rowIndex]?.lma ?? '0',
        targetKg: targetKgVal,
        workingDays: workingDaysVal,
        incentive: incentiveVal,
      }
      if (rowIndex >= 0) {
        rows[rowIndex] = updatedRow
      } else {
        rows.push(updatedRow)
      }
      const { id: _docId, ...docData } = monthlyData2Doc || {}
      await setDoc(
        doc(db, MONTHLY_DATA2_COLLECTION, targetFirestoreId),
        {
          ...docData,
          employeeId: row.id,
          month: monthNum,
          year: yr,
          rows,
        },
        { merge: true }
      )
      setEditModal({ open: false, row: null, form: null, selectedDistributorId: null })
    } catch (e) {
      console.error('saveEdit failed:', e)
      setSaveError(e.message || 'Failed to save')
    }
  }

  const setRowStatus = async (row, status) => {
    if (!isFirebaseConfigured || !db) return
    const docId = `${row.id}_${periodKey}`
    const patch = status === 'approved'
      ? { status: 'approved', approvedAt: serverTimestamp(), rejectedAt: null }
      : { status: 'rejected',  rejectedAt: serverTimestamp(), approvedAt: null }
    try {
      await setDoc(
        doc(db, MONTHLY_DATA_COLLECTION, docId),
        { employeeId: row.id, period: periodKey, ...patch },
        { merge: true }
      )
      // onSnapshot listener automatically updates monthlyDataList — no manual patch needed
    } catch (e) {
      console.error('setRowStatus failed:', e)
    }
  }

  const getIconStyles = (role) => {
    if (role === 'Regional Mgr') {
      return {
        backgroundColor: '#FFF4E8',
        color: '#f97316',
      }
    }
    return {
      backgroundColor: '#EFF6FF',
      color: '#3b82f6',
    }
  }

  // Build a lookup per employee → distributor: { sec: [w1,w2,w3,w4], count: totalCheckouts }
  const checkoutLookup = useMemo(() => {
    const monthIndex = MONTH_LABELS.indexOf(month)
    const yr = Number(year)
    const lookup = {}
    checkOuts.forEach((co) => {
      const d = parseCheckoutDate(co.date || co.timestamp)
      if (!d) return
      if (d.getFullYear() !== yr || d.getMonth() !== monthIndex) return
      const empKey  = co.employeeId || co.employeeEmail || co.employee_email || ''
      const distKey = co.distributorId || co.distributor || co.distributorName || ''
      if (!empKey || !distKey) return
      const wi  = weekOfMonth(d.getDate())
      const sec = parseFloat(String(co.achievedSecondary ?? co.secondaryAchieved ?? 0).replace(/[^\d.]/g, '')) || 0
      if (!lookup[empKey]) lookup[empKey] = {}
      if (!lookup[empKey][distKey]) lookup[empKey][distKey] = { sec: [0, 0, 0, 0], count: 0 }
      lookup[empKey][distKey].sec[wi] += sec
      lookup[empKey][distKey].count   += 1
    })
    return lookup
  }, [checkOuts, year, month])

  // Keep a simple alias for sec arrays (used in periods)
  const secLookup = useMemo(() => {
    const flat = {}
    Object.entries(checkoutLookup).forEach(([empKey, distMap]) => {
      flat[empKey] = {}
      Object.entries(distMap).forEach(([distKey, val]) => {
        flat[empKey][distKey] = val.sec
      })
    })
    return flat
  }, [checkoutLookup])

  // Build lookup from monthly_data: empId → distId → { targetKg, workingDays, lmaKg, incentive }
  // Doc ID: {employeeId}_{year}_{monthNumber}, e.g. YCbRIhu3oWwVkw0cGCCZ_2026_3 (employeeId may only exist in id)
  const targetLookup = useMemo(() => {
    const monthNum = MONTH_LABELS.indexOf(month) + 1   // Jan→1 … Dec→12
    const yr = Number(year)
    const lookup = {}
    monthlyData2.forEach((docObj) => {
      const parsed = parseMonthlyDataDocId(docObj.id)
      const docMonth = Number(docObj.month ?? docObj.Month ?? parsed?.month ?? '')
      if (docMonth !== monthNum) return
      const docYear = docObj.year != null ? Number(docObj.year) : parsed?.year
      if (docYear != null && docYear !== yr) return

      const empId = docObj.employeeId || parsed?.empId
      if (!empId) return
      if (!lookup[empId]) lookup[empId] = {}

      ;(docObj.rows || []).forEach((row) => {
        const distId = row.distributorId
        if (!distId) return
        // Only overwrite if not already set (keeps most recent entry if duplicates)
        if (!lookup[empId][distId]) {
          lookup[empId][distId] = {
            targetKg:    Number(row.targetKg    ?? row.target    ?? 0) || 0,
            workingDays: Number(row.workingDays ?? 0)                   || 0,
            lmaKg:       row.lmaKg    ?? row.lma    ?? '—',
            incentive:   row.incentive ?? '—',
          }
        }
      })
    })
    return lookup
  }, [monthlyData2, month, year])

  const tableData = useMemo(() => {
    const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n }
    const list = employees.map((emp) => {
      const assignedIds = emp.assignedDistributorIds || []
      const fromDistributorSide = distributors.filter((d) =>
        (d.assignedEmployeeIds || []).includes(emp.id)
      )
      const fromEmployeeSide = assignedIds
        .map((id) => distributors.find((d) => d.id === id))
        .filter(Boolean)
      const assignedDistributorsMap = new Map()
      fromDistributorSide.forEach((d) => assignedDistributorsMap.set(d.id, d))
      fromEmployeeSide.forEach((d) => assignedDistributorsMap.set(d.id, d))
      const assignedDistributors = Array.from(assignedDistributorsMap.values())
      const distributorCount = assignedDistributors.length
      const name =
        emp.salesPersonName ||
        emp.name ||
        emp.employeeName ||
        emp.email ||
        '—'
      const role = emp.role || emp.designation || '—'
      const avatar =
        emp.avatar ||
        emp.photoURL ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(String(name).replace(/\s+/g, '+'))}&background=6b7280&color=fff`
      const saved = monthlyDataList.find((m) => m.employeeId === emp.id)
      const distDetails = saved?.distributorDetails || {}
      const empP1 = saved?.primary1to7 ?? '—'
      const empP2 = saved?.primary8to15 ?? '—'
      const empP3 = saved?.primary16to22 ?? '—'
      const empP4 = saved?.primary23to31 ?? '—'
      // secondary achieved from check_outs (per distributor, per week)
      const empSecMap  = secLookup[emp.id] || secLookup[emp.email] || secLookup[emp.employeeEmail] || {}

      const details = assignedDistributors.map((d) => {
        const dd = distDetails[d.id]
        const p1 = dd?.primary1to7 ?? empP1
        const p2 = dd?.primary8to15 ?? empP2
        const p3 = dd?.primary16to22 ?? empP3
        const p4 = dd?.primary23to31 ?? empP4
        const dName = d.distributorName || d.name || '—'
        const dLocation = d.zone || d.area || d.location || '—'
        const icon = (dName.trim().slice(0, 2) || '—').toUpperCase()
        // checkout data: try by distributor id, then by name
        const empCoMap  = checkoutLookup[emp.id] || checkoutLookup[emp.email] || checkoutLookup[emp.employeeEmail] || {}
        const coEntry   = empCoMap[d.id] || empCoMap[d.distributorName] || empCoMap[d.name] || { sec: [0, 0, 0, 0], count: 0 }
        const secArr    = coEntry.sec
        const checkInCount = coEntry.count

        // Target / LMA / working days / incentive
        // Priority: admin-edited monthlyData (dd) > monthly_data plan (tData) > employee-level
        const empTargetMap = targetLookup[emp.id] || {}
        const tData = empTargetMap[d.id] || null

        // workingDays: admin edit wins; fall back to monthly_data, then 0
        const workingDaysV =
          (dd?.workingDays != null && dd.workingDays !== 0)
            ? dd.workingDays
            : (tData?.workingDays ?? saved?.workingDays ?? 0)

        // target: admin edit wins; fall back to monthly_data targetKg, then 0
        const targetKg =
          (dd?.target != null && dd.target !== 0)
            ? dd.target
            : (tData?.targetKg ?? 0)

        // lma / incentive: admin edit wins; fall back to monthly_data
        const lmaKg      = dd?.lma       ?? tData?.lmaKg    ?? '—'
        const incentiveV = dd?.incentive ?? tData?.incentive ?? '—'

        // Total secondary across all 4 weeks
        const totalSec = secArr.reduce((s, v) => s + v, 0)
        const totalSecFmt = totalSec > 0 ? totalSec : '—'

        // Total primary = sum of all 4 period primary values from monthlyData (Target Achieved PRIMARY KG)
        const toNum = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return isNaN(n) ? 0 : n }
        const totalPrimary = toNum(p1) + toNum(p2) + toNum(p3) + toNum(p4)
        const totalPrimaryFmt = totalPrimary > 0 ? totalPrimary : '—'

        // Achieved % = (Target Achieved PRIMARY KG / Target) * 100; use stored shortfall/achieved if present
        const targetNum = toNum(targetKg)
        const computedShortfall = toNum(targetKg) - totalPrimary
        const achievedPct = targetNum > 0
          ? Math.round((totalPrimary / targetNum) * 1000) / 10
          : null
        const achievedFmt = achievedPct != null ? `${achievedPct}%` : '—'
        const shortfall = dd?.shortfall != null ? dd.shortfall : computedShortfall
        const achievedVal = dd?.achieved != null && dd?.achieved !== '' ? dd.achieved : achievedFmt

        return {
          distributorId: d.id,
          distributor: { name: dName, location: dLocation, icon },
          workingDays: workingDaysV,
          lma: lmaKg,
          target: targetKg,
          incentive: incentiveV,
          periods: [
            { sec: fmtSec(secArr[0]), primary: p1 },
            { sec: fmtSec(secArr[1]), primary: p2 },
            { sec: fmtSec(secArr[2]), primary: p3 },
            { sec: fmtSec(secArr[3]), primary: p4 },
          ],
          daysWorked: checkInCount || 0,
          targetSec: totalSecFmt,
          targetPrimary: totalPrimaryFmt,
          shortfall,
          achieved: achievedVal,
        }
      })
      const totalTarget = details.reduce((s, d) => s + toNum(d.target), 0)
      const totalWorkingDays = details.reduce((s, d) => s + toNum(d.workingDays), 0)
      const totalIncentiveNum = details.reduce((s, d) => s + toNum(d.incentive), 0)
      const totalIncentive = totalIncentiveNum > 0 ? totalIncentiveNum : '—'
      const totalTargetPrimary = details.reduce((s, d) => s + toNum(d.targetPrimary), 0)
      const totalTargetSec = details.reduce((s, d) => s + toNum(d.targetSec), 0)
      const primary = totalTargetPrimary > 0 ? totalTargetPrimary : '—'
      const secondary = totalTargetSec > 0 ? totalTargetSec : '—'
      const targetNum = totalTarget
      const achievedNum = totalTargetPrimary
      const totalAchieved = targetNum > 0 && achievedNum >= 0
        ? Math.round((achievedNum / targetNum) * 1000) / 10
        : null
      return {
        id: emp.id,
        employee: { name, role, avatar },
        distributorCount,
        workingDays: totalWorkingDays,
        daysWorked: saved?.daysWorked ?? '—',
        lma: saved?.lma ?? '—',
        target: totalTarget,
        incentive: totalIncentive,
        primary,
        secondary,
        totalAchieved,
        primary1to7: empP1,
        primary8to15: empP2,
        primary16to22: empP3,
        primary23to31: empP4,
        rowStatus: saved?.status || null,
        details,
      }
    })
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase().trim()
    return list.filter((r) => r.employee.name.toLowerCase().includes(q))
  }, [employees, distributors, monthlyDataList, checkoutLookup, targetLookup, searchQuery])

  // Sync each row to Firebase performance collection (year, month, employee, totalAchieved, etc.)
  useEffect(() => {
    if (!db || !year || !month || !tableData.length) return
    const run = async () => {
      for (const row of tableData) {
        const docId = `${year}_${month}_${row.id}`
        const payload = {
          year,
          month,
          employeeId: row.id,
          employeeName: row.employee?.name ?? '',
          employeeRole: row.employee?.role ?? '—',
          totalAchieved: row.totalAchieved != null ? row.totalAchieved : null,
          target: row.target ?? 0,
          achieved: row.primary ?? null,
          workingDays: row.workingDays ?? 0,
          incentive: row.incentive ?? null,
          secondary: row.secondary ?? null,
          distributorCount: row.distributorCount ?? 0,
          updatedAt: serverTimestamp(),
        }
        try {
          await setDoc(doc(db, PERFORMANCE_COLLECTION, docId), payload, { merge: true })
        } catch (err) {
          console.warn('Performance sync failed for', docId, err?.message)
        }
      }
    }
    run()
  }, [tableData, year, month])

  return (
    <div className="monthly-table-container">
      <div className="table-wrapper">
        <table className="monthly-table">
          <thead>
            <tr>
              <th>EMPLOYEE</th>
              <th>DISTRIBUTOR</th>
              <th className="monthly-th-highlight">WORKING DAYS</th>
              <th className="monthly-th-highlight">ACHIEVED</th>
              <th className="monthly-th-highlight">TARGET</th>
              <th>INCENTIVE</th>
              <th>SECONDARY (KG)</th>
              <th className="monthly-th-highlight">Total Achieved</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <React.Fragment key={row.id}>
                <tr>
                  <td>
                    <div className="employee-cell">
                      <img
                        src={row.employee.avatar}
                        alt={row.employee.name}
                        className="employee-avatar"
                      />
                      <div className="employee-info">
                        <div className="employee-name">{row.employee.name}</div>
                        <div className="employee-role">{row.employee.role}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="distributor-count-cell">
                      {row.distributorCount}
                    </div>
                  </td>
                  <td className="monthly-td-highlight">{row.workingDays}</td>
                  <td className="monthly-td-highlight">{row.primary}</td>
                  <td className="monthly-td-highlight">{row.target}</td>
                  <td>{row.incentive}</td>
                  <td>{row.secondary}</td>
                  <td className="monthly-td-highlight">
                    {row.totalAchieved != null ? `${row.totalAchieved}%` : '—'}
                  </td>
                  <td>
                    <div className="row-end-cell">
                      {row.rowStatus && (
                        <span className={`row-status-badge row-status-${row.rowStatus}`}>
                          {row.rowStatus === 'approved' ? '✓ Approved' : '✕ Rejected'}
                        </span>
                      )}
                      <button
                        className="expand-button"
                        onClick={() => toggleRow(row.id)}
                      >
                        <img
                          src="/drop-down-icon.png"
                          alt=""
                          className={`expand-arrow ${expandedRows[row.id] ? 'expanded' : ''}`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRows[row.id] && (
                  <tr className="expanded-row">
                    <td colSpan="9" className="expanded-cell">
                      <div className="expanded-cell-wrapper">
                        <div className="action-buttons-container">
                          <button
                            type="button"
                            className={`action-btn approve ${row.rowStatus === 'approved' ? 'action-btn-active-approve' : ''}`}
                            title="Approve"
                            onClick={(e) => { e.stopPropagation(); setRowStatus(row, 'approved') }}
                          >✓</button>
                          <button
                            type="button"
                            className={`action-btn reject ${row.rowStatus === 'rejected' ? 'action-btn-active-reject' : ''}`}
                            title="Reject"
                            onClick={(e) => { e.stopPropagation(); setRowStatus(row, 'rejected') }}
                          >✕</button>
                          <button
                            type="button"
                            className="action-btn action-btn-pen"
                            title="Edit"
                            onClick={() => openEdit(row)}
                          >
                            <img src="/pen-icon.png" alt="Edit" className="pen-icon-img" />
                          </button>
                        </div>
                      </div>
                      <div className="expanded-content">
                        <table className="detail-table">
                          <thead>
                            <tr className="header-row-1">
                              <th rowSpan="2" className="group-header">DISTRIBUTOR</th>
                              <th rowSpan="2" className="group-header monthly-th-highlight">
                                <div className="two-line-header">
                                  <div>WORKING</div>
                                  <div>DAYS</div>
                                </div>
                              </th>
                              <th rowSpan="2" className="group-header">LMA</th>
                              <th rowSpan="2" className="group-header monthly-th-highlight">TARGET</th>
                              <th rowSpan="2" className="group-header">INCENTIVE</th>
                              <th colSpan="2" className="period-header">
                                <div className="period-header-content">
                                  <span className="tracking-label">Tracking :-</span>
                                  <span className="period-range">1ˢᵗ - 7ᵗʰ</span>
                                </div>
                              </th>
                              <th colSpan="2" className="period-header">8ᵗʰ - 15ᵗʰ</th>
                              <th colSpan="2" className="period-header">16ᵗʰ - 22ⁿᵈ</th>
                              <th colSpan="2" className="period-header">23ʳᵈ - 31ˢᵗ</th>
                              <th colSpan="3" className="period-header target-achieved-header">
                                Target Achieved
                              </th>
                              <th rowSpan="2" className="group-header">SHORTFALL</th>
                              <th rowSpan="2" className="group-header">ACHIEVED %</th>
                            </tr>
                            <tr className="header-row-2">
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header monthly-th-highlight">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header monthly-th-highlight">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header monthly-th-highlight">PRIMARY (KG)</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header monthly-th-highlight">PRIMARY (KG)</th>
                              <th className="sub-header">DAYS WORKED</th>
                              <th className="sub-header">SEC (KG)</th>
                              <th className="sub-header monthly-th-highlight">PRIMARY (KG)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.details.length === 0 ? (
                              <tr>
                                <td colSpan="18" className="detail-table-empty">
                                  No distributors assigned
                                </td>
                              </tr>
                            ) : (
                              row.details.map((detail, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="distributor-cell">
                                      <div className="distributor-info">
                                        <div className="distributor-name">
                                          {detail.distributor.name}
                                        </div>
                                        <div className="distributor-location">
                                          {detail.distributor.location}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="monthly-td-highlight">{detail.workingDays}</td>
                                  <td>{detail.lma}</td>
                                  <td className="monthly-td-highlight">{detail.target}</td>
                                  <td>{detail.incentive}</td>
                                  <td>{detail.periods[0].sec}</td>
                                  <td className="monthly-td-highlight">{detail.periods[0].primary}</td>
                                  <td>{detail.periods[1].sec}</td>
                                  <td className="monthly-td-highlight">{detail.periods[1].primary}</td>
                                  <td>{detail.periods[2].sec}</td>
                                  <td className="monthly-td-highlight">{detail.periods[2].primary}</td>
                                  <td>{detail.periods[3].sec}</td>
                                  <td className="monthly-td-highlight">{detail.periods[3].primary}</td>
                                  <td>{detail.daysWorked}</td>
                                  <td>{detail.targetSec}</td>
                                  <td className="monthly-td-highlight">{detail.targetPrimary}</td>
                                  <td>{detail.shortfall}</td>
                                  <td className="monthly-td-highlight">{detail.achieved}</td>
                                </tr>
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

      {editModal.open && editModal.row && (
        <div className="monthly-edit-modal-overlay" onClick={() => setEditModal((p) => ({ ...p, open: false }))}>
          <div className="monthly-edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="monthly-edit-modal-title">
              Edit — {editModal.row.employee.name} ({year} {month})
            </h3>
            {saveError && <p className="monthly-edit-modal-error">{saveError}</p>}

            <div className="monthly-edit-modal-box">
              <span className="monthly-edit-modal-box-label">Select distributor</span>
              <select
                className="monthly-edit-modal-select"
                value={editModal.selectedDistributorId || ''}
                onChange={(e) => selectDistributorInModal(e.target.value)}
                aria-label="Select distributor"
              >
                <option value="">— Select —</option>
                {(editModal.row.details || []).map((d) => (
                  <option key={d.distributorId} value={d.distributorId}>
                    {d.distributor.name} {d.distributor.location && d.distributor.location !== '—' ? `(${d.distributor.location})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {editModal.selectedDistributorId && (
              <div className="monthly-edit-modal-box monthly-edit-modal-details-box">
                <span className="monthly-edit-modal-box-label">Details for selected distributor</span>
                <div className="monthly-edit-modal-form">
                  <div className="monthly-edit-modal-field-row">
                    <label className="monthly-edit-modal-label-inline">
                      Working Days
                      <input
                        type="number"
                        min={0}
                        value={editModal.form.workingDays}
                        onChange={(e) => updateEditForm('workingDays', e.target.value)}
                      />
                    </label>
                    <label className="monthly-edit-modal-label-inline">
                      Target
                      <input
                        type="number"
                        min={0}
                        placeholder="e.g. kg"
                        value={editModal.form.target}
                        onChange={(e) => updateEditForm('target', e.target.value)}
                      />
                    </label>
                    <label className="monthly-edit-modal-label-inline">
                      Incentive
                      <input
                        type="text"
                        placeholder="e.g. amount or —"
                        value={editModal.form.incentive}
                        onChange={(e) => updateEditForm('incentive', e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="monthly-edit-modal-horizontal-row">
                    <label className="monthly-edit-modal-label-inline">
                      Primary (1ˢᵗ - 7ᵗʰ)
                      <input
                        type="text"
                        placeholder="e.g. 250"
                        value={editModal.form.primary1to7}
                        onChange={(e) => updateEditForm('primary1to7', e.target.value)}
                      />
                    </label>
                    <label className="monthly-edit-modal-label-inline">
                      Primary (8ᵗʰ - 15ᵗʰ)
                      <input
                        type="text"
                        placeholder="e.g. 250"
                        value={editModal.form.primary8to15}
                        onChange={(e) => updateEditForm('primary8to15', e.target.value)}
                      />
                    </label>
                    <label className="monthly-edit-modal-label-inline">
                      Primary (16ᵗʰ - 22ⁿᵈ)
                      <input
                        type="text"
                        placeholder="e.g. 250"
                        value={editModal.form.primary16to22}
                        onChange={(e) => updateEditForm('primary16to22', e.target.value)}
                      />
                    </label>
                    <label className="monthly-edit-modal-label-inline">
                      Primary (23ʳᵈ - 31ˢᵗ)
                      <input
                        type="text"
                        placeholder="e.g. 250"
                        value={editModal.form.primary23to31}
                        onChange={(e) => updateEditForm('primary23to31', e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="monthly-edit-modal-actions">
              <button type="button" className="monthly-edit-modal-cancel" onClick={() => setEditModal({ open: false, row: null, form: null, selectedDistributorId: null })}>
                Cancel
              </button>
              <button type="button" className="monthly-edit-modal-save" onClick={saveEdit} disabled={!editModal.selectedDistributorId}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthlyTable
