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

  function buildStreetVariants(value) {
    const raw = String(value || '').trim()
    const base = normalizeStreetForGeocode(raw)
    const variants = new Set([raw, base].filter(Boolean))

    const replacements = [
      [/\bplace\b/gi, 'pl'],
      [/\bpl\b/gi, 'place'],
      [/\bstreet\b/gi, 'st'],
      [/\bst\b/gi, 'street'],
      [/\broad\b/gi, 'rd'],
      [/\brd\b/gi, 'road'],
      [/\bavenue\b/gi, 'ave'],
      [/\bave\b/gi, 'avenue'],
      [/\bdrive\b/gi, 'dr'],
      [/\bdr\b/gi, 'drive'],
      [/\blane\b/gi, 'ln'],
      [/\bln\b/gi, 'lane'],
      [/\bcourt\b/gi, 'ct'],
      [/\bct\b/gi, 'court'],
    ]

    for (const current of Array.from(variants)) {
      for (const [pattern, replacement] of replacements) {
        const swapped = current.replace(pattern, replacement).replace(/\s{2,}/g, ' ').trim()
        if (swapped) variants.add(swapped)
      }
    }

    if (/\b(ne|nw|se|sw)\b/i.test(raw)) {
      variants.add(raw.replace(/\b(ne|nw|se|sw)\b/gi, '').replace(/\s{2,}/g, ' ').trim())
    }

    return Array.from(variants).filter(Boolean).slice(0, 4)
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
  const needle = normalizeText(expectedCity)
  if (!needle) return false

  const hay = [
    getResolvedCity(addr),
    addr.city_district,
    addr.county,
    row.display_name,
  ]
    .filter(Boolean)
    .join(' ')

  return normalizeText(hay).includes(needle)
}

function buildAddressQueries(street, city, state, zip, listingName = '') {
  const cleanCity = String(city || '').trim()
  const cleanState = normalizeStateValue(state)
  const cleanZip = normalizeZipCode(zip)
  const cleanListingName = String(listingName || '').trim()

  const queries = [
    [street, cleanCity, cleanState, cleanZip, 'USA'].filter(Boolean).join(', '),
    [street, cleanCity, cleanState, 'USA'].filter(Boolean).join(', '),
    [street, cleanState, cleanZip, 'USA'].filter(Boolean).join(', '),
    [street, cleanCity, cleanZip, 'USA'].filter(Boolean).join(', '),
    [street, cleanZip, 'USA'].filter(Boolean).join(', '),
    [street, cleanCity, 'USA'].filter(Boolean).join(', '),
  ]

  if (cleanListingName) {
    queries.unshift(
      [cleanListingName, street, cleanCity, cleanState, cleanZip, 'USA']
        .filter(Boolean)
        .join(', ')
    )
    queries.push(
      [cleanListingName, street, cleanCity, cleanState, 'USA']
        .filter(Boolean)
        .join(', ')
    )
  }

  return Array.from(new Set(queries.filter(Boolean))).slice(0, 8)
}

function isCompatibleCandidate({ returnedState, returnedZip, lat, lng, state, zip, zipGeo }) {
  const expectedState = normalizeStateValue(state)
  const expectedZip = normalizeZipCode(zip)

  if (expectedState && returnedState && returnedState !== expectedState) {
    return false
  }

  if (expectedZip && returnedZip && returnedZip !== expectedZip) {
    if (!zipGeo) return false
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
    if (dist > 5) return false
  }

  if (expectedZip && !returnedZip && zipGeo) {
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
    if (dist > 15) return false
  }

  return true
}

function scoreCandidate({ row, addr, lat, lng, city, state, zip, zipGeo }) {
  const expectedState = normalizeStateValue(state)
  const expectedZip = normalizeZipCode(zip)
  const returnedState = getResolvedState(addr)
  const returnedZip = normalizeZipCode(addr.postcode || '')

  let score = 0

  if (addr.house_number) score += 12
  if (addr.road) score += 10
  if (row.addresstype === 'building' || row.type === 'house') score += 4

  if (expectedState && returnedState === expectedState) score += 18

  if (expectedZip && returnedZip === expectedZip) {
    score += 24
  } else if (expectedZip && returnedZip && returnedZip !== expectedZip) {
    score -= 12
  }

  if (cityMatches(city, row, addr)) score += 8

  if (zipGeo) {
    const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)

  if (dist <= 2) score += 8
  else if (dist <= 5) score += 5
  else if (dist <= 10) score += 2
  else if (dist > 25) score -= 25
  else if (dist > 15) score -= 10
  }

  return score
}

async function geocodeAddress(address, city, state, zip, options = {}) {
  const rawStreet = String(address || '').trim()
  if (!rawStreet) return null

  const cleanCity = String(city || '').trim()
  const cleanState = normalizeStateValue(state)
  const cleanZip = normalizeZipCode(zip)
  const cleanListingName = String(options.listingName || '').trim()
  const zipGeo = cleanZip ? await geocodeZip(cleanZip) : null

  const streetVariants = buildStreetVariants(rawStreet)
  const queries = Array.from(
    new Set(
      streetVariants.flatMap((streetLine) =>
        buildAddressQueries(streetLine, cleanCity, cleanState, cleanZip, cleanListingName)
      )
    )
  )

  console.log('GEOCODE queries', {
  rawStreet,
  cleanCity,
  cleanState,
  cleanZip,
  cleanListingName,
  queries,
})

  const candidates = []
  const seen = new Set()

  for (const query of queries) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('countrycodes', 'us')
      url.searchParams.set('limit', '10')
      url.searchParams.set('q', query)

      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      })

      if (!res.ok) continue

      const data = await res.json()

      console.log('GEOCODE raw results for query', query, data)

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
          returnedState,
          returnedZip,
          lat,
          lng,
          state: cleanState,
          zip: cleanZip,
          zipGeo,
        })

        if (!compatible) {
          const distFromZip = zipGeo ? distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng) : null

          console.log('GEOCODE rejected row', {
            query,
            display_name: row.display_name,
            returnedState,
            returnedZip,
            expectedState: cleanState,
            expectedZip: cleanZip,
            lat,
            lng,
            distFromZip,
            addr,
          })

          continue
        }

        candidates.push({
          lat,
          lng,
          score: scoreCandidate({
            row,
            addr,
            lat,
            lng,
            city: cleanCity,
            state: cleanState,
            zip: cleanZip,
            zipGeo,
          }),
          city: getResolvedCity(addr),
          state: returnedState,
          zip_code: returnedZip || cleanZip || null,
          display_name: row.display_name || '',
        })
      }
    } catch (err) {
      console.error('Geocode error', err)
    }
  }

  console.log('GEOCODE candidates', candidates)

  if (!candidates.length) return null

  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.display_name.length - b.display_name.length
  })

  const best = candidates[0]

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
    facility_state: normalizeStateValue(current.facility_state) || normalizeStateValue(resolved.state) || '',
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