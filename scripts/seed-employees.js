/**
 * Seed employees from Book2.xlsx into Firebase.
 * Run: npm run seed-employees
 * Requires: .env with VITE_FIREBASE_* variables
 *
 * All employee fields from the sheet are imported. Default password is set to "123456" for every employee.
 * Expected columns (names matched case-insensitively, spaces/underscores ignored):
 *   Sales Person Name, Email, Address, Designation, Salary, Head Quarter, DA Headquarter, DA Outstation, N/H, TA Own Vehicle, TA Local Transport
 * Optional: Sr, No. (for serial number)
 *
 * If re-running: delete existing employees in Firebase Console or the script will add duplicates.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const DEFAULT_PASSWORD = '123456'

function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env')
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=')
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim()
          const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) process.env[key] = val
        }
      }
    }
  } catch (e) {
    console.warn('Could not load .env:', e.message)
  }
}

loadEnv()

const apiKey = process.env.VITE_FIREBASE_API_KEY
if (!apiKey) {
  console.error('Missing VITE_FIREBASE_API_KEY in .env.')
  process.exit(1)
}

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

function normalizeHeader(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/[\s_\-]+/g, ' ')
    .trim()
}

const COLUMN_ALIASES = {
  'sales person name': 'salesPersonName',
  'name': 'salesPersonName',
  'employee name': 'salesPersonName',
  'email': 'email',
  'emailid': 'email',
  'email id': 'email',
  'address': 'address',
  'adress': 'address',
  'designation': 'designation',
  'salary': 'salary',
  'head quarter': 'headQuarter',
  'headquarter': 'headQuarter',
  'headquater': 'headQuarter',
  'head quarters': 'headQuarter',
  'place': 'headQuarter',
  'head quarter place': 'headQuarter',
  'da headquarter': 'daHeadquarter',
  'da headquarters': 'daHeadquarter',
  'daheadquater': 'daHeadquarter',
  'da headquater': 'daHeadquarter',
  'da outstation': 'daOutstation',
  'daoutstation': 'daOutstation',
  'n/h': 'nh',
  'nh': 'nh',
  'ta own vehicle': 'taOwnVehicle',
  'taownvehichle': 'taOwnVehicle',
  'ta own vehichle': 'taOwnVehicle',
  'ta local transport': 'taLocalTransport',
  'talocaltransport': 'taLocalTransport',
  'sr': 'sr',
  'no': 'sr',
  'no.': 'sr',
  's.no': 'sr',
}

function findColumnIndex(headerRow) {
  const map = {}
  headerRow.forEach((cell, idx) => {
    const key = normalizeHeader(cell)
    const field = COLUMN_ALIASES[key] || (key ? key.replace(/\s+/g, '') : null)
    if (field && !map[field]) map[field] = idx
  })
  return map
}

function parseExcelRows(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerIdx = rows.findIndex(
    (r) =>
      Array.isArray(r) &&
      r.some((c) => normalizeHeader(c).includes('email') || normalizeHeader(c).includes('name') || normalizeHeader(c).includes('sales'))
  )
  const startIdx = headerIdx >= 0 ? headerIdx : 0
  const headerRow = rows[startIdx] || []
  const dataRows = rows.slice(startIdx + 1).filter((r) => Array.isArray(r) && r.length > 0)
  return { headerRow, dataRows }
}

function rowToEmployee(row, colIdx, startSr) {
  const get = (field) => {
    const idx = colIdx[field]
    if (idx == null) return ''
    const v = row[idx]
    if (v == null || v === undefined) return ''
    if (typeof v === 'number') return String(v)
    return String(v).trim()
  }
  const salesPersonName = get('salesPersonName') || get('name')
  const email = get('email')
  if (!salesPersonName || !email) return null

  const sr = get('sr')
  const numSr = sr !== '' && !isNaN(Number(sr)) ? Number(sr) : startSr

  return {
    sr: numSr,
    salesPersonName,
    email,
    defaultPassword: DEFAULT_PASSWORD,
    address: get('address'),
    designation: get('designation'),
    salary: get('salary'),
    headQuarter: get('headQuarter'),
    daHeadquarter: get('daHeadquarter'),
    daOutstation: get('daOutstation'),
    nh: get('nh'),
    taOwnVehicle: get('taOwnVehicle'),
    taLocalTransport: get('taLocalTransport'),
  }
}

async function seed() {
  const filePath = resolve(rootDir, 'Book2.xlsx')
  if (!existsSync(filePath)) {
    console.error('Book2.xlsx not found in project root. Place the file and run again.')
    process.exit(1)
  }
  console.log('Reading:', filePath)

  const { headerRow, dataRows } = parseExcelRows(filePath)
  const colIdx = findColumnIndex(headerRow)
  console.log('Column map:', colIdx)

  const employees = []
  let startSr = 1
  for (let i = 0; i < dataRows.length; i++) {
    const emp = rowToEmployee(dataRows[i], colIdx, startSr)
    if (emp) {
      employees.push(emp)
      startSr = (emp.sr || startSr) + 1
    }
  }

  console.log(`Parsed ${employees.length} employees. Default password for all: ${DEFAULT_PASSWORD}`)
  if (employees.length === 0) {
    console.error('No valid rows (need at least Sales Person Name and Email).')
    process.exit(1)
  }
  console.log('Sample:', employees[0])

  let created = 0
  let errors = 0
  for (const emp of employees) {
    try {
      await addDoc(collection(db, 'employees'), emp)
      created++
      if (created % 5 === 0) console.log(`  Created ${created}...`)
    } catch (err) {
      console.error(`Failed: ${emp.salesPersonName} / ${emp.email}`, err.message)
      errors++
    }
  }

  console.log(`\nDone. Created ${created} employees. Errors: ${errors}`)
  process.exit(errors > 0 ? 1 : 0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
