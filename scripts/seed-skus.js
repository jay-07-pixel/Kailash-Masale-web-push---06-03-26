/**
 * Seed SKUs from products.xlsx into Firebase (skus collection).
 * Run: npm run seed-skus
 * Requires: .env with VITE_FIREBASE_* variables
 *
 * Reads the first sheet; looks for a column like "Product Name", "Name", or "SKU".
 * Each non-empty cell in that column becomes one document in the skus collection with { name }.
 * Duplicate names in the sheet are only added once.
 *
 * If you re-run: existing SKUs in Firebase are not removed; duplicates (by name) are skipped.
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const SKUS_COLLECTION = 'skus'

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

/** Find column index for SKU / product name (first matching: product name, name, sku) */
function findNameColumnIndex(headerRow) {
  const row = Array.isArray(headerRow) ? headerRow : []
  for (let i = 0; i < row.length; i++) {
    const key = normalizeHeader(row[i])
    if (key.includes('product') && key.includes('name')) return i
    if (key === 'name' || key === 'sku' || key === 'product') return i
  }
  return 0
}

function parseProductNames(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheetName = wb.SheetNames[0]
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerRow = rows[0] || []
  const nameCol = findNameColumnIndex(headerRow)
  const names = new Set()
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const raw = row[nameCol]
    if (raw == null || raw === '') continue
    const name = String(raw).trim()
    if (name) names.add(name)
  }
  return [...names]
}

async function seed() {
  const filePath = resolve(rootDir, 'products.xlsx')
  if (!existsSync(filePath)) {
    console.error('products.xlsx not found in project root. Place the file and run again.')
    process.exit(1)
  }
  console.log('Reading:', filePath)

  const names = parseProductNames(filePath)
  console.log(`Found ${names.length} unique SKU names in the sheet.`)

  if (names.length === 0) {
    console.error('No product names found. Check that the first row is a header and column has "Product Name" or "Name".')
    process.exit(1)
  }

  // Load existing SKU names to avoid duplicates
  const existingSnap = await getDocs(collection(db, SKUS_COLLECTION))
  const existingNames = new Set(existingSnap.docs.map((d) => (d.data().name || '').trim()).filter(Boolean))
  console.log(`Existing SKUs in Firebase: ${existingNames.size}`)

  const toAdd = names.filter((name) => !existingNames.has(name))
  if (toAdd.length === 0) {
    console.log('All SKUs from the sheet already exist in Firebase. Nothing to add.')
    process.exit(0)
  }
  console.log(`Adding ${toAdd.length} new SKUs...`)

  let created = 0
  let errors = 0
  for (const name of toAdd) {
    try {
      await addDoc(collection(db, SKUS_COLLECTION), {
        name: name.trim(),
        createdAt: serverTimestamp(),
      })
      created++
      if (created % 10 === 0) console.log(`  Created ${created}...`)
    } catch (err) {
      console.error(`Failed to add "${name}":`, err.message)
      errors++
    }
  }

  console.log(`\nDone. Created ${created} SKUs. Errors: ${errors}`)
  process.exit(errors > 0 ? 1 : 0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
