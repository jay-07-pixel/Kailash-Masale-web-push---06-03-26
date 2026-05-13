/**
 * Reverse geocode via OpenStreetMap Nominatim (no API key).
 * @see https://operations.osmfoundation.org/policies/nominatim/ — throttle ~1 req/s from the client.
 */

const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

export function geoCacheKey(lat, lng) {
  return `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`
}

/** True when the UI label is our synthetic "lat, lng" pair (not a place name). */
export function labelLooksLikeLatCommaLng(label) {
  if (label == null || label === '—') return false
  const s = String(label).trim()
  return /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(s)
}

function pickPlaceLabel(data) {
  if (!data) return ''
  const a = data.address
  if (a && typeof a === 'object') {
    const place =
      a.city ||
      a.town ||
      a.village ||
      a.hamlet ||
      a.suburb ||
      a.neighbourhood ||
      a.city_district ||
      a.county
    const region = a.state_district || a.state || a.region
    const parts = [place, region].filter((x) => x && String(x).trim())
    if (parts.length) return parts.join(', ')
  }
  const full = data.display_name
  if (typeof full === 'string' && full.trim()) {
    return full
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 4)
      .join(', ')
  }
  return ''
}

/**
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>} Short place label or null on failure
 */
export async function reverseGeocode(lat, lng) {
  const la = Number(lat)
  const ln = Number(lng)
  if (Number.isNaN(la) || Number.isNaN(ln)) return null
  const url = new URL(NOMINATIM_REVERSE)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(la))
  url.searchParams.set('lon', String(ln))
  url.searchParams.set('zoom', '16')
  url.searchParams.set('accept-language', 'en')
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.error) return null
    const label = pickPlaceLabel(data)
    return label || null
  } catch {
    return null
  }
}
