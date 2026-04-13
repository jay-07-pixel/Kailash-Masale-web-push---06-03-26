/**
 * Totals for Target vs Achieved (primary kg) aligned with Monthly Employee Record / MonthlyTable.
 */

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const TOTAL_MONTH_OPTION = 'Total'

export function parseMonthlyDataDocId(docId) {
  if (!docId || typeof docId !== 'string') return null
  const parts = docId.split('_')
  if (parts.length < 3) return null
  const month = Number(parts[parts.length - 1])
  const year = Number(parts[parts.length - 2])
  const empId = parts.slice(0, -2).join('_')
  if (Number.isNaN(month) || Number.isNaN(year)) return null
  return { month, year, empId }
}

function parseCheckoutDate(v) {
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

function weekOfMonth(day) {
  if (day <= 7) return 0
  if (day <= 15) return 1
  if (day <= 22) return 2
  return 3
}

function toNum(v) {
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''))
  return isNaN(n) ? 0 : n
}

function buildCheckoutLookup(checkOuts, year, monthIndex) {
  const lookup = {}
  checkOuts.forEach((co) => {
    const d = parseCheckoutDate(co.date || co.timestamp)
    if (!d) return
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) return
    const empKey = co.employeeId || co.employeeEmail || co.employee_email || ''
    const distKey = co.distributorId || co.distributor || co.distributorName || ''
    if (!empKey || !distKey) return
    const wi = weekOfMonth(d.getDate())
    const sec = parseFloat(String(co.achievedSecondary ?? co.secondaryAchieved ?? 0).replace(/[^\d.]/g, '')) || 0
    if (!lookup[empKey]) lookup[empKey] = {}
    if (!lookup[empKey][distKey]) lookup[empKey][distKey] = { sec: [0, 0, 0, 0], count: 0 }
    lookup[empKey][distKey].sec[wi] += sec
    lookup[empKey][distKey].count += 1
  })
  return lookup
}

function buildTargetLookup(monthlyData2, year, monthLabel) {
  const monthNum = MONTH_LABELS.indexOf(monthLabel) + 1
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
      if (!lookup[empId][distId]) {
        lookup[empId][distId] = {
          targetKg: Number(row.targetKg ?? row.target ?? 0) || 0,
          workingDays: Number(row.workingDays ?? 0) || 0,
          lmaKg: row.lmaKg ?? row.lma ?? '—',
          incentive: row.incentive ?? '—',
        }
      }
    })
  })
  return lookup
}

/**
 * Same merge as Admin KPI: monthly_data rows + monthlyData distributorDetails overrides.
 */
function mergeAdminStyleTargets(monthlyData2, monthlyOverrides, year, monthLabel) {
  const toTsMs = (v) => {
    if (!v) return 0
    if (typeof v?.toDate === 'function') return v.toDate().getTime() || 0
    if (v instanceof Date) return v.getTime() || 0
    const n = Number(v)
    return Number.isNaN(n) ? 0 : n
  }
  const monthNum = MONTH_LABELS.indexOf(monthLabel) + 1
  const targetByEmpDist = new Map()
  monthlyData2.forEach((mdDoc) => {
    const parsed = parseMonthlyDataDocId(mdDoc.id)
    const y = Number(mdDoc.year ?? parsed?.year)
    const m = Number(mdDoc.month ?? mdDoc.Month ?? parsed?.month)
    if (Number.isNaN(y) || Number.isNaN(m) || y !== year || m !== monthNum) return
    const rows = Array.isArray(mdDoc.rows) ? mdDoc.rows : []
    const empId = mdDoc.employeeId || parsed?.empId || mdDoc.id
    const updatedAtMs = toTsMs(mdDoc.updatedAt)
    rows.forEach((row, rowIndex) => {
      const distKey = row?.distributorId || row?.distributorName || row?.distributor || `row-${rowIndex}`
      const mapKey = `${y}_${m}__${empId}__${distKey}`
      const target = Number(row?.targetKg ?? row?.target ?? 0) || 0
      const prev = targetByEmpDist.get(mapKey)
      if (!prev || updatedAtMs >= prev.updatedAtMs) {
        targetByEmpDist.set(mapKey, { target, updatedAtMs })
      }
    })
  })
  const overrideByEmpDist = new Map()
  const periodKey = `${year}_${monthLabel}`
  monthlyOverrides.forEach((ovDoc) => {
    if (ovDoc.period !== periodKey) return
    const empId = ovDoc.employeeId || ovDoc.id
    const details = ovDoc.distributorDetails || {}
    Object.entries(details).forEach(([distId, detail]) => {
      if (!distId) return
      const t = Number(detail?.target)
      if (Number.isNaN(t)) return
      const key = `${year}_${monthNum}__${empId}__${distId}`
      overrideByEmpDist.set(key, t)
    })
  })
  const allKeys = new Set([...targetByEmpDist.keys(), ...overrideByEmpDist.keys()])
  let sum = 0
  allKeys.forEach((key) => {
    const overrideTarget = overrideByEmpDist.get(key)
    if (overrideTarget != null && overrideTarget !== 0) {
      sum += overrideTarget
    } else {
      sum += targetByEmpDist.get(key)?.target || 0
    }
  })
  return sum
}

function rollupOneMonth(employees, distributors, monthlyData2, monthlyOverrides, checkOuts, year, monthLabel) {
  const monthIndex = MONTH_LABELS.indexOf(monthLabel)
  if (monthIndex < 0) return { targetRowSum: 0, achievedPrimarySum: 0 }
  const periodKey = `${year}_${monthLabel}`
  const monthlyForPeriod = monthlyOverrides.filter((m) => m.period === periodKey)
  const checkoutLookup = buildCheckoutLookup(checkOuts, year, monthIndex)
  const secLookup = {}
  Object.entries(checkoutLookup).forEach(([empKey, distMap]) => {
    secLookup[empKey] = {}
    Object.entries(distMap).forEach(([distKey, val]) => {
      secLookup[empKey][distKey] = val.sec
    })
  })
  const targetLookup = buildTargetLookup(monthlyData2, year, monthLabel)

  let achievedPrimarySum = 0

  employees.forEach((emp) => {
    const assignedIds = emp.assignedDistributorIds || []
    const fromDistributorSide = distributors.filter((d) => (d.assignedEmployeeIds || []).includes(emp.id))
    const fromEmployeeSide = assignedIds.map((id) => distributors.find((d) => d.id === id)).filter(Boolean)
    const assignedDistributorsMap = new Map()
    fromDistributorSide.forEach((d) => assignedDistributorsMap.set(d.id, d))
    fromEmployeeSide.forEach((d) => assignedDistributorsMap.set(d.id, d))
    const assignedDistributors = Array.from(assignedDistributorsMap.values())
    if (assignedDistributors.length === 0) return

    const saved = monthlyForPeriod.find((m) => m.employeeId === emp.id)
    const distDetails = saved?.distributorDetails || {}
    const empP1 = saved?.primary1to7 ?? '—'
    const empP2 = saved?.primary8to15 ?? '—'
    const empP3 = saved?.primary16to22 ?? '—'
    const empP4 = saved?.primary23to31 ?? '—'
    const empSecMap = secLookup[emp.id] || secLookup[emp.email] || secLookup[emp.employeeEmail] || {}

    const details = assignedDistributors.map((d) => {
      const dd = distDetails[d.id]
      const p1 = dd?.primary1to7 ?? empP1
      const p2 = dd?.primary8to15 ?? empP2
      const p3 = dd?.primary16to22 ?? empP3
      const p4 = dd?.primary23to31 ?? empP4
      const empCoMap = checkoutLookup[emp.id] || checkoutLookup[emp.email] || checkoutLookup[emp.employeeEmail] || {}
      const coEntry = empCoMap[d.id] || empCoMap[d.distributorName] || empCoMap[d.name] || { sec: [0, 0, 0, 0], count: 0 }
      const secArr = coEntry.sec
      const empTargetMap = targetLookup[emp.id] || {}
      const tData = empTargetMap[d.id] || null
      const targetKg =
        dd?.target != null && dd.target !== 0 ? dd.target : (tData?.targetKg ?? 0)
      const totalSec = secArr.reduce((s, v) => s + v, 0)
      const totalSecFmt = totalSec > 0 ? totalSec : '—'
      const totalPrimary = toNum(p1) + toNum(p2) + toNum(p3) + toNum(p4)
      const totalPrimaryFmt = totalPrimary > 0 ? totalPrimary : '—'
      return {
        target: targetKg,
        targetSec: totalSecFmt,
        targetPrimary: totalPrimaryFmt,
      }
    })

    const totalTarget = details.reduce((s, d) => s + toNum(d.target), 0)
    const totalTargetPrimary = details.reduce((s, d) => s + toNum(d.targetPrimary), 0)
    const primary = totalTargetPrimary > 0 ? totalTargetPrimary : 0
    achievedPrimarySum += primary
  })

  const adminStyleTarget = mergeAdminStyleTargets(monthlyData2, monthlyOverrides, year, monthLabel)
  return { achievedPrimarySum, adminStyleTarget }
}

/**
 * @returns {{ totalTargetKg: number, achievedPrimaryKg: number, percent: number }}
 */
export function rollupEmployeeRecordTotals({
  employees = [],
  distributors = [],
  monthlyData2 = [],
  monthlyOverrides = [],
  checkOuts = [],
  year,
  monthLabel,
}) {
  const yr = Number(year)
  if (Number.isNaN(yr)) {
    return { totalTargetKg: 0, achievedPrimaryKg: 0, percent: 0 }
  }

  if (monthLabel === TOTAL_MONTH_OPTION) {
    let totalTargetKg = 0
    let achievedPrimaryKg = 0
    MONTH_LABELS.forEach((label) => {
      const one = rollupOneMonth(employees, distributors, monthlyData2, monthlyOverrides, checkOuts, yr, label)
      totalTargetKg += one.adminStyleTarget
      achievedPrimaryKg += one.achievedPrimarySum
    })
    const percent =
      totalTargetKg > 0 ? Math.min(100, Math.round((achievedPrimaryKg / totalTargetKg) * 1000) / 10) : 0
    return { totalTargetKg: Math.round(totalTargetKg * 10) / 10, achievedPrimaryKg: Math.round(achievedPrimaryKg * 10) / 10, percent }
  }

  const one = rollupOneMonth(employees, distributors, monthlyData2, monthlyOverrides, checkOuts, yr, monthLabel)
  const totalTargetKg = Math.round(one.adminStyleTarget * 10) / 10
  const achievedPrimaryKg = Math.round(one.achievedPrimarySum * 10) / 10
  const percent =
    totalTargetKg > 0 ? Math.min(100, Math.round((achievedPrimaryKg / totalTargetKg) * 1000) / 10) : 0
  return { totalTargetKg, achievedPrimaryKg, percent }
}
