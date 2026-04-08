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

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeLocalityText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bst\b\.?/g, 'st')
    .replace(/\bfort\b/g, 'ft')
    .replace(/\bft\b\.?/g, 'ft')
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function localityTokens(value) {
  return normalizeLocalityText(value)
    .split(' ')
    .filter(Boolean)
    .filter((token) => !['island', 'city', 'town', 'village'].includes(token))
}

function localityCore(value) {
  return localityTokens(value).join(' ')
}

const STREET_SUFFIX_MAP = {
  street: 'st',
  st: 'st',
  avenue: 'ave',
  ave: 'ave',
  road: 'rd',
  rd: 'rd',
  drive: 'dr',
  dr: 'dr',
  lane: 'ln',
  ln: 'ln',
  court: 'ct',
  ct: 'ct',
  place: 'pl',
  pl: 'pl',
  boulevard: 'blvd',
  blvd: 'blvd',
  parkway: 'pkwy',
  pkwy: 'pkwy',
  circle: 'cir',
  cir: 'cir',
  terrace: 'ter',
  ter: 'ter',
  trail: 'trl',
  trl: 'trl',
  highway: 'hwy',
  hwy: 'hwy',
  route: 'rte',
  rte: 'rte',
  way: 'way',
  mount: 'mt',
  mt: 'mt',
}

const DIRECTIONAL_MAP = {
  north: 'n',
  n: 'n',
  south: 's',
  s: 's',
  east: 'e',
  e: 'e',
  west: 'w',
  w: 'w',
  northeast: 'ne',
  ne: 'ne',
  northwest: 'nw',
  nw: 'nw',
  southeast: 'se',
  se: 'se',
  southwest: 'sw',
  sw: 'sw',
}

function normalizeAddressToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeStreetForGeocode(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  return raw
    .replace(/,\s*(ste|suite|unit|#|bldg|building|fl|floor|apt|apartment|room|rm)\b.*$/i, '')
    .replace(/\s+(ste|suite|unit|#|bldg|building|fl|floor|apt|apartment|room|rm)\b.*$/i, '')
    .replace(/\b(p\.?\s*o\.?\s*box)\b.*$/i, '')
    .replace(/\./g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

function canonicalizeStreetWords(words = []) {
  return words
    .map((word) => {
      const clean = normalizeAddressToken(word)
      if (!clean) return ''
      if (DIRECTIONAL_MAP[clean]) return DIRECTIONAL_MAP[clean]
      if (STREET_SUFFIX_MAP[clean]) return STREET_SUFFIX_MAP[clean]
      return clean
    })
    .filter(Boolean)
}

function parseStreetParts(value) {
  const normalized = normalizeStreetForGeocode(value)
  if (!normalized) {
    return {
      raw: '',
      houseNumber: '',
      road: '',
      roadNoDir: '',
      roadNoSuffix: '',
      tokens: [],
      normalizedLine: '',
    }
  }

  const compact = normalizeAddressToken(normalized)
  const parts = compact.split(' ').filter(Boolean)

  let houseNumber = ''
  let streetWords = parts

  const houseMatch = compact.match(/^(\d+[a-zA-Z]?)\b/)
  if (houseMatch) {
    houseNumber = houseMatch[1].toLowerCase()
    streetWords = compact.slice(houseMatch[0].length).trim().split(' ').filter(Boolean)
  }

  const canonicalWords = canonicalizeStreetWords(streetWords)
  const road = canonicalWords.join(' ').trim()

  const roadNoDir = canonicalWords
    .filter((token, index, arr) => {
      const isDirectional = Object.values(DIRECTIONAL_MAP).includes(token)
      if (!isDirectional) return true
      return index !== 0 && index !== arr.length - 1
    })
    .join(' ')
    .trim()

  const roadNoSuffix = canonicalWords
    .filter((token) => !Object.values(STREET_SUFFIX_MAP).includes(token))
    .join(' ')
    .trim()

  return {
    raw: normalized,
    houseNumber,
    road,
    roadNoDir,
    roadNoSuffix,
    tokens: canonicalWords,
    normalizedLine: [houseNumber, road].filter(Boolean).join(' ').trim(),
  }
}

function getStreetMatchQuality(inputStreet, candidateStreet) {
  const input = parseStreetParts(inputStreet)
  const candidate = parseStreetParts(candidateStreet)

  if (!input.road || !candidate.road) return 0

  if (input.road === candidate.road) return 4
  if (input.roadNoDir && input.roadNoDir === candidate.roadNoDir) return 3
  if (input.roadNoSuffix && input.roadNoSuffix === candidate.roadNoSuffix) return 2

  const inputSet = new Set(input.tokens)
  const candidateSet = new Set(candidate.tokens)
  const overlap = [...inputSet].filter((token) => candidateSet.has(token)).length
  const maxTokens = Math.max(inputSet.size, candidateSet.size, 1)

  if (overlap >= 2 && overlap / maxTokens >= 0.67) return 1
  return 0
}

function buildStreetVariants(value) {
  const raw = String(value || '').trim()
  const base = normalizeStreetForGeocode(raw)
  const parsed = parseStreetParts(base)

  const strongest = parsed.normalizedLine || base || raw
  return strongest ? [strongest] : []
}

async function geocodeZip(zip) {
  const cleanZip = normalizeZipCode(zip)
  if (cleanZip.length !== 5) return null

  try {
    const res = await fetch('https://api.zippopotam.us/us/' + cleanZip)
    if (!res.ok) return null

    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null

    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place['place name'],
      state: normalizeStateValue(place['state abbreviation'] || place['state']),
      zip_code: cleanZip,
    }
  } catch {
    return null
  }
}

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getResolvedCity(addr = {}) {
  return (
    addr.municipality ||
    addr.suburb ||
    addr.city ||
    addr.town ||
    addr.village ||
    addr.hamlet ||
    null
  )
}

function getResolvedState(addr = {}) {
  return normalizeStateValue(addr.state_code || addr.state || null) || null
}

function cityMatches(expectedCity, row, addr = {}) {
  const expectedRaw = String(expectedCity || '').trim()
  if (!expectedRaw) return false

  const hayParts = [
    getResolvedCity(addr),
    addr.city_district,
    addr.county,
    row.display_name,
  ].filter(Boolean)

  const hayRaw = hayParts.join(' ')
  if (!hayRaw) return false

  const expectedNorm = normalizeLocalityText(expectedRaw)
  const hayNorm = normalizeLocalityText(hayRaw)

  if (hayNorm.includes(expectedNorm) || expectedNorm.includes(hayNorm)) {
    return true
  }

  const expectedCore = localityCore(expectedRaw)
  const hayCore = localityCore(hayRaw)

  if (!expectedCore || !hayCore) return false

  if (hayCore.includes(expectedCore) || expectedCore.includes(hayCore)) {
    return true
  }

  const expectedSet = new Set(expectedCore.split(' ').filter(Boolean))
  const haySet = new Set(hayCore.split(' ').filter(Boolean))
  const overlap = [...expectedSet].filter((token) => haySet.has(token))

  return overlap.length >= Math.min(expectedSet.size, 2)
}

function buildAddressQueries(street, city, state, zip, listingName = '') {
  const cleanStreet = normalizeStreetForGeocode(street)
  const cleanCity = String(city || '').trim()
  const cleanState = normalizeStateValue(state)
  const cleanZip = normalizeZipCode(zip)

  return [
    [cleanStreet, cleanCity, cleanState, cleanZip, 'USA'].filter(Boolean).join(', '),
    [cleanStreet, cleanCity, cleanState, 'USA'].filter(Boolean).join(', '),
  ].filter(Boolean)
}

function isCompatibleCandidate({
  row,
  addr,
  lat,
  lng,
  street,
  city,
  state,
  zip,
  zipGeo,
}) {
  const expectedState = normalizeStateValue(state)
  const expectedZip = normalizeZipCode(zip)
  const expectedCity = String(city || '').trim()
  const returnedState = getResolvedState(addr)
  const returnedZip = normalizeZipCode(addr.postcode || '')

  const inputStreet = parseStreetParts(street)

  if (expectedState && returnedState && returnedState !== expectedState) {
    return false
  }

  if (expectedCity && getResolvedCity(addr) && !cityMatches(expectedCity, row, addr)) {
    return false
  }

  if (
    inputStreet.houseNumber &&
    addr.house_number &&
    normalizeAddressToken(addr.house_number) !== inputStreet.houseNumber
  ) {
    return false
  }

  const streetMatchQuality = getStreetMatchQuality(street, addr.road || '')
  if (inputStreet.road && addr.road && streetMatchQuality === 0) {
    return false
  }

  if (expectedZip && returnedZip && returnedZip !== expectedZip) {
    if (!zipGeo) return false
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
    if (dist > 3) return false
  }

  if (expectedZip && !returnedZip && zipGeo) {
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
    if (dist > 10) return false
  }

  return true
}

function scoreCandidate({ row, addr, lat, lng, street, city, state, zip, zipGeo }) {
  const expectedState = normalizeStateValue(state)
  const expectedZip = normalizeZipCode(zip)
  const expectedCity = String(city || '').trim()
  const returnedState = getResolvedState(addr)
  const returnedZip = normalizeZipCode(addr.postcode || '')

  const inputStreet = parseStreetParts(street)
  const candidateStreet = parseStreetParts(addr.road || '')
  const streetMatchQuality = getStreetMatchQuality(street, addr.road || '')

  let score = 0

  if (inputStreet.houseNumber && addr.house_number) {
    if (normalizeAddressToken(addr.house_number) === inputStreet.houseNumber) score += 26
    else score -= 40
  } else if (inputStreet.houseNumber && !addr.house_number) {
    score -= 12
  }

  if (streetMatchQuality === 4) score += 30
  else if (streetMatchQuality === 3) score += 22
  else if (streetMatchQuality === 2) score += 14
  else if (streetMatchQuality === 1) score += 6
  else score -= 20

  if (row.addresstype === 'building' || row.type === 'house') score += 5
  if (row.addresstype === 'amenity' || row.type === 'sports_centre' || row.type === 'stadium') score += 3

  if (expectedState && returnedState === expectedState) score += 18

  if (expectedZip && returnedZip === expectedZip) {
    score += 24
  } else if (expectedZip && returnedZip && returnedZip !== expectedZip) {
    score -= 20
  }

  if (expectedCity && cityMatches(expectedCity, row, addr)) {
    score += 12
  } else if (expectedCity && getResolvedCity(addr)) {
    score -= 12
  }

  if (zipGeo) {
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)

    if (dist <= 1) score += 10
    else if (dist <= 3) score += 7
    else if (dist <= 5) score += 4
    else if (dist > 15) score -= 18
    else if (dist > 10) score -= 8
  }

  if (candidateStreet.road && inputStreet.road && candidateStreet.road === inputStreet.road) {
    score += 4
  }

  return score
}

async function fetchGeocodeRows(query) {
  const apiOrigin =
    window.location.hostname === 'localhost' && window.location.port === '5173'
      ? 'http://localhost:3000'
      : window.location.origin

  const url = new URL('/api/geocode-address', apiOrigin)
  url.searchParams.set('q', query)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3500)

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      signal: controller.signal,
    })

    if (res.status === 429) {
      const err = new Error('RATE_LIMITED')
      err.code = 429
      throw err
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('Geocode proxy failed', res.status, query, detail)
      return []
    }

    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    if (err?.name === 'AbortError') {
      console.error('Geocode request timed out', query)
      return []
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

async function geocodeAddress(address, city, state, zip, options = {}) {
  const rawStreet = String(address || '').trim()
  if (!rawStreet) return null

  const cleanCity = String(city || '').trim()
  const cleanState = normalizeStateValue(state)
  const cleanZip = normalizeZipCode(zip)
  const zipGeo = cleanZip ? await geocodeZip(cleanZip) : null

  const streetVariants = buildStreetVariants(rawStreet)
  const queries = Array.from(
    new Set(
      streetVariants.flatMap((streetLine) =>
        buildAddressQueries(streetLine, cleanCity, cleanState, cleanZip)
      )
    )
  ).slice(0, 2)

  const candidates = []
  const seen = new Set()

  for (const query of queries) {
    try {
      const data = await fetchGeocodeRows(query)

      for (const row of Array.isArray(data) ? data : []) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

        const addr = row.address || {}
        const returnedState = getResolvedState(addr)
        const returnedZip = normalizeZipCode(addr.postcode || '')
        const key = `${lat.toFixed(6)}|${lng.toFixed(6)}|${returnedState || ''}|${returnedZip || ''}`

        if (seen.has(key)) continue
        seen.add(key)

        const compatible = isCompatibleCandidate({
          row,
          addr,
          lat,
          lng,
          street: rawStreet,
          city: cleanCity,
          state: cleanState,
          zip: cleanZip,
          zipGeo,
        })

        if (!compatible) continue

        const candidate = {
          lat,
          lng,
          score: scoreCandidate({
            row,
            addr,
            lat,
            lng,
            street: rawStreet,
            city: cleanCity,
            state: cleanState,
            zip: cleanZip,
            zipGeo,
          }),
          city: getResolvedCity(addr),
          state: returnedState,
          zip_code: returnedZip || cleanZip || null,
          display_name: row.display_name || '',
          house_number: normalizeAddressToken(addr.house_number || ''),
          road: parseStreetParts(addr.road || '').road,
        }

        candidates.push(candidate)

        const inputStreet = parseStreetParts(rawStreet)
        const exactHouse =
          inputStreet.houseNumber &&
          candidate.house_number &&
          candidate.house_number === inputStreet.houseNumber
        const exactRoad =
          inputStreet.road &&
          candidate.road &&
          candidate.road === inputStreet.road
        const exactZip = cleanZip && candidate.zip_code === cleanZip

        if (candidate.score >= 70 && exactHouse && exactRoad && exactZip) {
          return {
            lat: candidate.lat,
            lng: candidate.lng,
            city: candidate.city || cleanCity || null,
            state: normalizeStateValue(candidate.state || cleanState) || null,
            zip_code: candidate.zip_code || cleanZip || null,
          }
        }
      }
    } catch (err) {
      if (err?.code === 429) {
        console.error('Geocode rate limit hit, stopping further queries')
        break
      }
      console.error('Geocode error', err)
    }
  }

  if (!candidates.length) return null

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.display_name.length - b.display_name.length
  })

    const best = candidates[0]
  const inputStreet = parseStreetParts(rawStreet)
  const minimumScore = inputStreet.houseNumber || cleanZip || cleanCity ? 40 : 28

  if (best.score < minimumScore) {
    return null
  }

  return {
    lat: best.lat,
    lng: best.lng,
    city: best.city || cleanCity || null,
    state: normalizeStateValue(best.state || cleanState) || null,
    zip_code: best.zip_code || cleanZip || null,
  }
}

async function resolveBestLocation(address, city, state, zip) {
  const street = String(address || '').trim()

  if (street) {
    const exact = await geocodeAddress(street, city, state, zip)
    if (exact) return { ...exact, source: 'address' }
  }

  const zipGeo = await geocodeZip(String(zip || '').trim())
  if (zipGeo) {
    return {
      lat: zipGeo.lat,
      lng: zipGeo.lng,
      city: String(city || '').trim() || zipGeo.city || null,
      state: normalizeStateValue(state) || zipGeo.state || null,
      zip_code: normalizeZipCode(zip) || null,
      source: 'zip',
    }
  }

  return null
}

async function finalizeListingLocation({
  address,
  city,
  state,
  zip,
  addressRequired = false,
  allowZipFallback = false,
  preResolved = null,
  listingName = '',
}) {
  const cleanAddress = String(address || '').trim()

  if (
    cleanAddress &&
    preResolved &&
    Number.isFinite(preResolved.lat) &&
    Number.isFinite(preResolved.lng)
  ) {
    return {
      ok: true,
      resolved: {
        ...preResolved,
        source: preResolved.source || 'address',
      },
    }
  }

  if (cleanAddress) {
    const exact = await geocodeAddress(cleanAddress, city, state, zip, { listingName })

    if (exact) {
      return { ok: true, resolved: { ...exact, source: 'address' } }
    }

    return {
      ok: false,
      error:
        'We could not confidently place that street address. Please verify it or contact admin@sandlotsource.com before submitting.',
    }
  }

  if (addressRequired) {
    return {
      ok: false,
      error: 'A street address is required for this listing.',
    }
  }

  if (allowZipFallback) {
    const zipGeo = await geocodeZip(String(zip || '').trim())

    if (zipGeo) {
      return {
        ok: true,
        resolved: {
          lat: zipGeo.lat,
          lng: zipGeo.lng,
          city: String(city || '').trim() || zipGeo.city || null,
          state: normalizeStateValue(state) || zipGeo.state || null,
          zip_code: normalizeZipCode(zip) || null,
          source: 'zip',
        },
      }
    }

    return {
      ok: false,
      error: 'A valid zip code is required to place this listing on the map.',
    }
  }

  return {
    ok: false,
    error:
      'We could not determine a precise map location for this listing. Please contact admin@sandlotsource.com.',
  }
}

function applyZipLookupLocality(current, geo) {
  if (!geo) return { ...current }

  return {
    ...current,
    city: String(current.city || '').trim() || geo.city || '',
    state: normalizeStateValue(current.state) || normalizeStateValue(geo.state) || '',
  }
}

function hasLocationContext(city, state, zip) {
  const cleanZip = normalizeZipCode(zip)
  if (cleanZip && cleanZip.length === 5) return true

  return Boolean(String(city || '').trim() && normalizeStateValue(state))
}

function applyResolvedCoordsPreservingLocality(current, resolved, options = {}) {
  if (!resolved) return { ...current }

  const preserveLocality = options.preserveLocality !== false

  const next = {
    ...current,
    lat: resolved.lat,
    lng: resolved.lng,
  }

  if (preserveLocality) {
    next.city = String(current.city || '').trim() || resolved.city || ''
    next.state = normalizeStateValue(current.state) || normalizeStateValue(resolved.state) || ''
    next.zip_code = normalizeZipCode(current.zip_code) || normalizeZipCode(resolved.zip_code) || ''
    return next
  }

  next.city = resolved.city || String(current.city || '').trim() || ''
  next.state = normalizeStateValue(resolved.state || current.state) || ''
  next.zip_code = normalizeZipCode(resolved.zip_code) || normalizeZipCode(current.zip_code) || ''
  return next
}

function applyResolvedFacilityCoordsPreservingLocality(current, resolved) {
  if (!resolved) return { ...current }

  return {
    ...current,
    facility_lat: resolved.lat,
    facility_lng: resolved.lng,
    facility_city: String(current.facility_city || '').trim() || resolved.city || '',
    facility_state:
      normalizeStateValue(current.facility_state) || normalizeStateValue(resolved.state) || '',
    facility_zip_code:
      normalizeZipCode(current.facility_zip_code) || normalizeZipCode(resolved.zip_code) || '',
  }
}

export {
  applyResolvedCoordsPreservingLocality,
  applyResolvedFacilityCoordsPreservingLocality,
  applyZipLookupLocality,
  distanceMiles,
  finalizeListingLocation,
  geocodeAddress,
  geocodeZip,
  getResolvedCity,
  getResolvedState,
  hasLocationContext,
  normalizeStateValue,
  normalizeStreetForGeocode,
  normalizeZipCode,
  resolveBestLocation,
}