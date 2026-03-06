/**
 * Seed locations from Final Location List.xlsx into Firebase (locations collection).
 * Run: npm run seed-locations-final
 *
 * - One location per row; same distributor multiple times = multiple locations (each with its own name, lat, long, radius).
 * - Radius in Excel (km) is converted to meters before storing.
 * - Stores: name, latitude, longitude, radius (meters), distributorId, distributorName.
 * - Logs exactly which rows were NOT added and why.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const LOCATIONS_COLLECTION = 'locations'
const DISTRIBUTORS_COLLECTION = 'distributors'
const EMPLOYEES_COLLECTION = 'employees'

function loadEnv() {
  try {
    const envPath = resolve(rootDir, '.env')
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

function normalize(s) {
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Parse radius: "10km", "8 km", 10 (assume km) -> meters */
function radiusKmToMeters(val) {
  if (val == null || val === '') return null
  const s = String(val).trim().toLowerCase().replace(/\s+/g, '')
  const match = s.match(/^(\d+(?:\.\d+)?)\s*km?$/)
  if (match) {
    const km = parseFloat(match[1])
    return Number.isFinite(km) ? Math.round(km * 1000) : null
  }
  const num = parseFloat(val)
  if (!Number.isFinite(num)) return null
  if (num < 100) return Math.round(num * 1000)
  return Math.round(num)
}

function parseExcelRows(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerRow = rows[0] || []
  const col = (names) => {
    const n = (h) => normalize(h)
    for (const name of names) {
      const idx = headerRow.findIndex((h) => n(h) === normalize(name) || n(h).includes(normalize(name)))
      if (idx >= 0) return idx
    }
    return null
  }
  const distributorCol = col(['Distributor Name', 'Distributor', 'distributor name']) ?? 1
  const nameCol = col(['Location Name', 'Name of location', 'Location name', 'location name', 'name']) ?? 2
  const latCol = col(['Latitude', 'latitude', 'lat']) ?? 3
  const lngCol = col(['Longitude', 'longitude', 'lng']) ?? 4
  const radiusCol = col(['Radius', 'radius', 'Area', 'area']) ?? 5

  const dataRows = rows.slice(1).filter((r) => Array.isArray(r))
  return dataRows.map((row, i) => ({
    rowIndex: i + 2,
    distributorName: (row[distributorCol] ?? '').toString().trim(),
    name: (row[nameCol] ?? '').toString().trim(),
    latitude: typeof row[latCol] === 'number' ? row[latCol] : parseFloat(String(row[latCol] ?? '').replace(/,/g, '')),
    longitude: typeof row[lngCol] === 'number' ? row[lngCol] : parseFloat(String(row[lngCol] ?? '').replace(/,/g, '')),
    radiusRaw: row[radiusCol],
  }))
}

async function seed() {
  const filePath = resolve(rootDir, 'Final Location List.xlsx')
  if (!existsSync(filePath)) {
    console.error('Final Location List.xlsx not found in project root. Place the file and run again.')
    process.exit(1)
  }
  console.log('Reading:', filePath)

  const rows = parseExcelRows(filePath)
  console.log(`Parsed ${rows.length} rows from Excel.`)

  const distributorsSnap = await getDocs(collection(db, DISTRIBUTORS_COLLECTION))
  const distributors = distributorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`Found ${distributors.length} distributors in Firebase.`)

  const locationsSnap = await getDocs(collection(db, LOCATIONS_COLLECTION))
  const existingLocations = locationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const existingKey = new Set(
    existingLocations.map((l) => `${(l.distributorId || '').trim()}|${(l.name || '').trim().toLowerCase()}`)
  )

  function findDistributorByName(distributorName) {
    const q = normalize(distributorName)
    return distributors.find(
      (d) =>
        normalize(d.distributorName || '') === q ||
        normalize(d.name || '') === q ||
        (d.distributorName && normalize(d.distributorName).includes(q)) ||
        (d.name && normalize(d.name).includes(q))
    )
  }

  const employeesSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION))
  const employees = employeesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  let created = 0
  const notAdded = []
  const locationIdsByDistributorId = {}

  for (const row of rows) {
    const locationName = (row.name || '').trim() || '(no name)'
    const distName = (row.distributorName || '').trim()

    if (!distName) {
      notAdded.push({
        row: row.rowIndex,
        distributorName: distName || '(empty)',
        locationName,
        reason: 'Distributor name is empty',
      })
      continue
    }

    const dist = findDistributorByName(row.distributorName)
    if (!dist) {
      notAdded.push({
        row: row.rowIndex,
        distributorName: distName,
        locationName,
        reason: 'No matching distributor in Firebase',
      })
      continue
    }

    const lat = typeof row.latitude === 'number' && !isNaN(row.latitude) ? row.latitude : null
    const lng = typeof row.longitude === 'number' && !isNaN(row.longitude) ? row.longitude : null
    const radiusM = radiusKmToMeters(row.radiusRaw)
    const radiusFinal = radiusM != null && radiusM > 0 ? radiusM : 10000

    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      notAdded.push({
        row: row.rowIndex,
        distributorName: distName,
        locationName,
        reason: `Invalid latitude/longitude (lat=${row.latitude}, lng=${row.longitude})`,
      })
      continue
    }

    const key = `${dist.id}|${locationName.toLowerCase()}`
    if (existingKey.has(key)) {
      notAdded.push({
        row: row.rowIndex,
        distributorName: distName,
        locationName,
        reason: 'Location with same name already exists for this distributor',
      })
      continue
    }

    try {
      const ref = await addDoc(collection(db, LOCATIONS_COLLECTION), {
        name: locationName,
        latitude: lat,
        longitude: lng,
        radius: radiusFinal,
        distributorId: dist.id,
        distributorName: dist.distributorName || dist.name || '',
        createdAt: new Date().toISOString(),
      })
      existingKey.add(key)
      if (!locationIdsByDistributorId[dist.id]) locationIdsByDistributorId[dist.id] = []
      locationIdsByDistributorId[dist.id].push(ref.id)
      created++
    } catch (err) {
      notAdded.push({
        row: row.rowIndex,
        distributorName: distName,
        locationName,
        reason: `Error: ${err.message}`,
      })
    }
  }

  // Assign new locations to employees assigned to each distributor
  for (const emp of employees) {
    const assignedDistIds = emp.assignedDistributorIds || []
    const currentLocIds = new Set(emp.assignedLocationIds || [])
    let added = false
    for (const distId of assignedDistIds) {
      const newIds = locationIdsByDistributorId[distId] || []
      for (const locId of newIds) {
        if (!currentLocIds.has(locId)) {
          currentLocIds.add(locId)
          added = true
        }
      }
    }
    if (added) {
      try {
        await updateDoc(doc(db, EMPLOYEES_COLLECTION, emp.id), {
          assignedLocationIds: [...currentLocIds],
        })
      } catch (err) {
        console.warn(`  Could not update employee ${emp.id} locations:`, err.message)
      }
    }
  }

  console.log(`\nCreated ${created} locations in Firebase.`)
  if (notAdded.length > 0) {
    console.log('\n=== ROWS NOT ADDED (exact log) ===\n')
    notAdded.forEach(({ row, distributorName, locationName, reason }) => {
      console.log(`Row ${row} | Distributor: "${distributorName}" | Location: "${locationName}" | Reason: ${reason}`)
    })
    console.log(`\nTotal not added: ${notAdded.length}`)
  }
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
