/**
 * Seed locations from Locations.xlsx into Firebase (locations collection).
 * Run: npm run seed-locations
 * Requires: .env with VITE_FIREBASE_* variables.
 *
 * Excel columns: No., Distributor Name, Bit Name, latitude, Longitude, Area, Name of location
 * - Matches each row to a distributor in Firebase by "Distributor Name" (distributorName or name).
 * - Area is parsed as km (e.g. "10km", "8 km") and converted to meters for radius.
 * - Creates one location doc per row with: name, latitude, longitude, radius, distributorId, distributorName.
 * - Optionally assigns new locations to employees who are assigned to that distributor.
 *
 * Run after seed-distributors so distributors exist. Re-run is safe: skips locations that already exist (same distributorId + name).
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

function normalize(s) {
  return (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/** Parse "10km", "8 km ", "5km" -> meters (number) */
function parseAreaToMeters(areaStr) {
  if (areaStr == null || areaStr === '') return null
  const s = String(areaStr).trim().toLowerCase().replace(/\s+/g, '')
  const match = s.match(/^(\d+(?:\.\d+)?)\s*km?$/)
  if (match) {
    const km = parseFloat(match[1])
    return Number.isFinite(km) ? Math.round(km * 1000) : null
  }
  const num = parseFloat(s)
  return Number.isFinite(num) ? (num < 100 ? Math.round(num * 1000) : Math.round(num)) : null
}

function parseExcelRows(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerRow = rows[0] || []
  const col = (name) => {
    const n = normalize(name)
    const idx = headerRow.findIndex((h) => normalize(h) === n || normalize(h).includes(n))
    return idx >= 0 ? idx : null
  }
  const distributorCol = col('Distributor Name') ?? col('Distributor') ?? 1
  const latCol = col('latitude') ?? col('lat') ?? 3
  const lngCol = col('Longitude') ?? col('longitude') ?? col('lng') ?? 4
  const areaCol = col('Area') ?? 5
  const nameCol = col('Name of location') ?? col('location') ?? col('name') ?? 6

  const dataRows = rows.slice(1).filter((r) => Array.isArray(r) && (r[distributorCol] != null && r[distributorCol] !== ''))
  return dataRows.map((row) => ({
    distributorName: (row[distributorCol] ?? '').toString().trim(),
    latitude: typeof row[latCol] === 'number' ? row[latCol] : parseFloat(row[latCol]),
    longitude: typeof row[lngCol] === 'number' ? row[lngCol] : parseFloat(row[lngCol]),
    area: row[areaCol],
    name: (row[nameCol] ?? '').toString().trim(),
  }))
}

async function seed() {
  const filePath = resolve(rootDir, 'Locations.xlsx')
  if (!existsSync(filePath)) {
    console.error('Locations.xlsx not found in project root. Place the file and run again.')
    process.exit(1)
  }
  console.log('Reading:', filePath)

  const rows = parseExcelRows(filePath)
  console.log(`Parsed ${rows.length} location rows from Excel.`)

  const distributorsSnap = await getDocs(collection(db, DISTRIBUTORS_COLLECTION))
  const distributors = distributorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  console.log(`Found ${distributors.length} distributors in Firebase.`)

  const locationsSnap = await getDocs(collection(db, LOCATIONS_COLLECTION))
  const existingLocations = locationsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const existingKey = new Set(
    existingLocations.map((l) => `${(l.distributorId || '').trim()}|${(l.name || '').trim().toLowerCase()}`)
  )

  const employeesSnap = await getDocs(collection(db, EMPLOYEES_COLLECTION))
  const employees = employeesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

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

  let created = 0
  let skipped = 0
  let noDist = 0
  let errors = 0
  const locationIdsByDistributorId = {}

  for (const row of rows) {
    const dist = findDistributorByName(row.distributorName)
    if (!dist) {
      noDist++
      console.warn(`  No distributor match for "${row.distributorName}" – skipping location "${row.name || '(no name)'}".`)
      continue
    }

    const lat = typeof row.latitude === 'number' && !isNaN(row.latitude) ? row.latitude : null
    const lng = typeof row.longitude === 'number' && !isNaN(row.longitude) ? row.longitude : null
    const radius = parseAreaToMeters(row.area)
    const name = (row.name || '').trim() || (row.distributorName ? `${row.distributorName} location` : 'Unnamed')

    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn(`  Invalid lat/lng for "${row.distributorName}" / "${name}" – skipping.`)
      errors++
      continue
    }
    const radiusM = radius != null && radius > 0 ? radius : 10000

    const key = `${dist.id}|${name.toLowerCase()}`
    if (existingKey.has(key)) {
      skipped++
      continue
    }

    try {
      const ref = await addDoc(collection(db, LOCATIONS_COLLECTION), {
        name,
        latitude: lat,
        longitude: lng,
        radius: radiusM,
        distributorId: dist.id,
        distributorName: dist.distributorName || dist.name || '',
        createdAt: new Date().toISOString(),
      })
      existingKey.add(key)
      if (!locationIdsByDistributorId[dist.id]) locationIdsByDistributorId[dist.id] = []
      locationIdsByDistributorId[dist.id].push(ref.id)
      created++
      if (created % 10 === 0) console.log(`  Created ${created} locations...`)
    } catch (err) {
      console.error(`  Failed to add location "${name}" for ${row.distributorName}:`, err.message)
      errors++
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

  console.log(
    `\nDone. Created ${created} locations. Skipped (already exist): ${skipped}. No distributor match: ${noDist}. Errors: ${errors}.`
  )
  process.exit(errors > 0 ? 1 : 0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
