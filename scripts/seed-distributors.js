/**
 * Seed distributors from Book1.xlsx (or Distributo Data.xlsx) into Firebase.
 * Run: npm run seed-distributors
 * Requires: .env with VITE_FIREBASE_* variables
 *
 * Columns: No., Distributor Name, Bit Name, Zone
 * - One Firestore document per distributor (in sequence by No.).
 * - When Distributor Name is blank: same distributor as previous row (additional bit).
 * - When Bit Name is "-" or empty: no bit name (bits array empty for that row; does not add a bit).
 * - Multiple bits: collect all non "-" Bit Names into bits array for that distributor.
 *
 * If re-running: clear the distributors collection in Firebase Console first to avoid duplicates.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

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
  console.error('Missing VITE_FIREBASE_API_KEY in .env. Copy from .env.example.')
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

function findExcelPath() {
  const candidates = [
    resolve(rootDir, 'Book1.xlsx'),
    resolve(rootDir, 'Distributo Data.xlsx'),
    resolve(rootDir, 'Distributor details.xlsx'),
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

function parseExcelRows(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('distributor') || s.toLowerCase().includes('sheet')) || wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  const headerIdx = rows.findIndex((r) => Array.isArray(r) && r.some((c) => String(c || '').toLowerCase().includes('distributor')) && r.some((c) => String(c || '').toLowerCase().includes('bit')))
  const startIdx = headerIdx >= 0 ? headerIdx + 1 : 1
  return rows.slice(startIdx).filter((r) => Array.isArray(r) && r.length > 0)
}

/**
 * Group rows into one distributor per distinct name (in order).
 * Blank "Distributor Name" = same distributor, add Bit Name to bits (if not "-").
 * Bit Name "-" or empty = do not add any bit for that row.
 */
function parseDistributors(rows) {
  const distributors = []
  let currentDist = null

  for (const row of rows) {
    const no = row[0]
    const distNameRaw = row[1]
    const bitNameRaw = row[2]
    const zoneRaw = row[3]

    const distName = (distNameRaw != null ? String(distNameRaw) : '').trim()
    const bitVal = (bitNameRaw != null ? String(bitNameRaw) : '').trim()
    const zone = (zoneRaw != null && zoneRaw !== '') ? String(zoneRaw).trim() : (currentDist ? currentDist.zone : '')

    const isNewDistributor = distName.length > 0
    const hasBit = bitVal.length > 0 && bitVal !== '-'

    if (isNewDistributor) {
      if (currentDist) {
        distributors.push(currentDist)
      }
      currentDist = {
        distributorName: distName,
        zone: zone || '',
        bits: hasBit ? [bitVal] : [],
      }
    } else if (currentDist) {
      if (hasBit) {
        currentDist.bits = currentDist.bits || []
        currentDist.bits.push(bitVal)
      }
      if (zone) currentDist.zone = zone
    }
  }
  if (currentDist) {
    distributors.push(currentDist)
  }
  return distributors
}

/** Sort zone-wise: Akola first, then Nagpur, then any other zones. */
function sortByZone(distributors) {
  const zoneOrder = (z) => {
    const lower = (z || '').toLowerCase().trim()
    if (lower === 'akola') return 0
    if (lower === 'nagpur') return 1
    return 2
  }
  return [...distributors].sort((a, b) => zoneOrder(a.zone) - zoneOrder(b.zone))
}

async function seed() {
  const filePath = findExcelPath()
  if (!filePath) {
    console.error('No Excel file found. Place Book1.xlsx (or Distributo Data.xlsx) in the project root.')
    process.exit(1)
  }
  console.log('Reading:', filePath)

  const rows = parseExcelRows(filePath)
  let distributors = parseDistributors(rows)
  distributors = sortByZone(distributors)

  console.log(`Parsed ${distributors.length} distributors (zone order: Akola, then Nagpur).`)
  console.log('Sample:', distributors.slice(0, 5))

  let created = 0
  let errors = 0

  for (const d of distributors) {
    if (!d.distributorName) continue
    try {
      const docData = {
        distributorName: d.distributorName,
        bits: Array.isArray(d.bits) ? d.bits.filter((b) => (b || '').trim()) : [],
        zone: d.zone || '',
        assignedEmployeeIds: [],
        target: 0,
        achieved: 0,
        status: 'active',
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'distributors'), docData)
      created++
      if (created % 10 === 0) console.log(`  Created ${created}...`)
    } catch (err) {
      console.error(`Failed: ${d.distributorName}`, err.message)
      errors++
    }
  }

  console.log(`\nDone. Created ${created} distributors. Errors: ${errors}`)
  process.exit(errors > 0 ? 1 : 0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
