import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null

const SUPPORTED_TABLES = {
  coaches: {
    label: 'coach',
    table: 'coaches',
  },
  travel_teams: {
    label: 'travel team',
    table: 'travel_teams',
  },
  facilities: {
    label: 'facility',
    table: 'facilities',
  },
}

function normalizeZipCode(value) {
  const match = String(value || '').match(/\b\d{5}\b/)
  return match ? match[0] : ''
}

function normalizeStateValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const upper = raw.toUpperCase()
  if (/^[A-Z]{2}$/.test(upper)) return upper

  const map = {
    ALABAMA: 'AL',
    ALASKA: 'AK',
    ARIZONA: 'AZ',
    ARKANSAS: 'AR',
    CALIFORNIA: 'CA',
    COLORADO: 'CO',
    CONNECTICUT: 'CT',
    DELAWARE: 'DE',
    FLORIDA: 'FL',
    GEORGIA: 'GA',
    HAWAII: 'HI',
    IDAHO: 'ID',
    ILLINOIS: 'IL',
    INDIANA: 'IN',
    IOWA: 'IA',
    KANSAS: 'KS',
    KENTUCKY: 'KY',
    LOUISIANA: 'LA',
    MAINE: 'ME',
    MARYLAND: 'MD',
    MASSACHUSETTS: 'MA',
    MICHIGAN: 'MI',
    MINNESOTA: 'MN',
    MISSISSIPPI: 'MS',
    MISSOURI: 'MO',
    MONTANA: 'MT',
    NEBRASKA: 'NE',
    NEVADA: 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    OHIO: 'OH',
    OKLAHOMA: 'OK',
    OREGON: 'OR',
    PENNSYLVANIA: 'PA',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    TENNESSEE: 'TN',
    TEXAS: 'TX',
    UTAH: 'UT',
    VERMONT: 'VT',
    VIRGINIA: 'VA',
    WASHINGTON: 'WA',
    'WEST VIRGINIA': 'WV',
    WISCONSIN: 'WI',
    WYOMING: 'WY',
    'DISTRICT OF COLUMBIA': 'DC',
  }

  return map[upper] || upper
}

function normalizeStreetForGeocode(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw
    .replace(/,\s*(ste|suite|unit|#|bldg|building|fl|floor)\b.*$/i, '')
    .replace(/\s+(ste|suite|unit|#|bldg|building|fl|floor)\b.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

async function geocodeAddress(query, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', query)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('components', 'country:US')

  const upstream = await fetch(url.toString())
  const text = await upstream.text()

  if (!upstream.ok) {
    console.error('admin-regeocode upstream error:', upstream.status, text)
    throw new Error('Upstream geocoder failed.')
  }

  let data
  try {
    data = JSON.parse(text)
  } catch (error) {
    console.error('admin-regeocode parse error:', error, text)
    throw new Error('Failed to parse geocoder response.')
  }

  if (!data || data.status === 'ZERO_RESULTS' || !Array.isArray(data.results) || !data.results.length) {
    return null
  }

  if (data.status && data.status !== 'OK') {
    console.error('admin-regeocode Google status:', data.status, data.error_message || '')
    return null
  }

  const best = data.results[0]
  const lat = best?.geometry?.location?.lat
  const lng = best?.geometry?.location?.lng

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client is not configured.' })
  }

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Google geocoding is not configured.' })
  }

  try {
    const { tableName, recordId, address, city, state, zip } = req.body || {}
    const tableConfig = SUPPORTED_TABLES[tableName]

    if (!tableConfig) {
      return res.status(400).json({ error: 'Unsupported tableName.' })
    }

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId.' })
    }

    const cleanAddress = normalizeStreetForGeocode(address)
    const cleanCity = String(city || '').trim()
    const cleanState = normalizeStateValue(state)
    const cleanZip = normalizeZipCode(zip)

    if (!cleanAddress) {
      return res.status(400).json({
        error: `A street address is required to re-geocode this ${tableConfig.label}.`,
      })
    }

    const query = [cleanAddress, cleanCity, cleanState, cleanZip].filter(Boolean).join(', ')
    const resolved = await geocodeAddress(query, apiKey)

    if (!resolved) {
      return res.status(422).json({
        error: `No confident geocode result was found for this ${tableConfig.label}.`,
      })
    }

    const update = {
      lat: resolved.lat,
      lng: resolved.lng,
      geocode_source: 'address',
    }

    const { data, error } = await supabaseAdmin
      .from(tableConfig.table)
      .update(update)
      .eq('id', recordId)
      .select('id, lat, lng, geocode_source')
      .single()

    if (error) {
      console.error('admin-regeocode supabase update error:', error)
      return res.status(500).json({
        error: `Failed to update ${tableConfig.label} coordinates.`,
      })
    }

    return res.status(200).json({
      ok: true,
      record: data,
    })
  } catch (error) {
    console.error('admin-regeocode error:', error)
    return res.status(500).json({
      error: error?.message || 'Unexpected server error.',
    })
  }
}