/**
 * Assign a list of distributors to employee "Sharad Agrawal".
 * Run: node scripts/assign-distributors-to-employee.js
 * Requires: .env with VITE_FIREBASE_* variables
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))

const EMPLOYEE_NAME = 'Sharad Agrawal'
const DISTRIBUTOR_NAMES = [
  'Saibaba Agency',
  'Nayan Traders',
  'Nursing Agency',
  'Paratwada (Direct Bit)',
  'Achalpur (Direct Bit)',
  'Karanja Gadge (Direct Bit)',
  'Daryapur (Direct Bit)',
  'Manglurpir (Direct Bit)',
  'Akot (Direct Bit)',
  'Murtizapur (Direct Bit)',
  'Jai Samadha',
  'Mehta Provision',
  'Nandkishor Provision',
]

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

function normalizeName(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

async function main() {
  const employeesSnap = await getDocs(collection(db, 'employees'))
  const employee = employeesSnap.docs.find(
    (d) => normalizeName(d.data().salesPersonName) === normalizeName(EMPLOYEE_NAME)
  )
  if (!employee) {
    console.error(`Employee "${EMPLOYEE_NAME}" not found in Firebase.`)
    process.exit(1)
  }
  const employeeId = employee.id
  console.log(`Found employee: ${EMPLOYEE_NAME} (${employeeId})`)

  const distributorsSnap = await getDocs(collection(db, 'distributors'))
  const targetNames = new Set(DISTRIBUTOR_NAMES.map(normalizeName))
  const matched = []
  for (const d of distributorsSnap.docs) {
    const name = normalizeName(d.data().distributorName)
    if (targetNames.has(name)) matched.push({ id: d.id, name: d.data().distributorName })
  }
  if (matched.length === 0) {
    console.error('None of the distributors were found. Check distributor names in Firebase.')
    process.exit(1)
  }
  console.log(`Found ${matched.length} distributors to assign.`)

  for (const { id: distId } of matched) {
    try {
      const distRef = doc(db, 'distributors', distId)
      await updateDoc(distRef, { assignedEmployeeIds: arrayUnion(employeeId) })
      console.log(`  Updated distributor ${distId}`)
    } catch (err) {
      console.error(`  Failed distributor ${distId}:`, err.message)
    }
  }

  const existingIds = employee.data().assignedDistributorIds || []
  const newIds = matched.map((m) => m.id)
  const merged = [...new Set([...existingIds, ...newIds])]
  try {
    await updateDoc(doc(db, 'employees', employeeId), {
      assignedDistributorIds: merged,
    })
    console.log(`Updated employee "${EMPLOYEE_NAME}" with ${merged.length} assigned distributors.`)
  } catch (err) {
    console.error('Failed to update employee:', err.message)
    process.exit(1)
  }

  console.log('Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
