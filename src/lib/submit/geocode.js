async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch('https://api.zippopotam.us/us/' + zip)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places && data.places[0]
    if (!place) return null
    return {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place['place name'],
      state: normalizeStateValue(place['state abbreviation'] || place['state']),
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
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getResolvedCity(addr = {}) {
  return addr.municipality || addr.suburb || addr.city || addr.town || addr.village || addr.hamlet || null
}

function getResolvedState(addr = {}) {
  return normalizeStateValue(addr.state_code || addr.state || null) || null
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
    ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA', COLORADO: 'CO',
    CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA', HAWAII: 'HI', IDAHO: 'ID',
    ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA', KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA',
    MAINE: 'ME', MARYLAND: 'MD', MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
    MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ',
    'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', OHIO: 'OH',
    OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN', TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA',
    WASHINGTON: 'WA', 'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY',
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

async function geocodeAddress(address, city, state, zip) {
  const rawStreet = String(address || '').trim()
  if (!rawStreet) return null

  const street = normalizeStreetForGeocode(rawStreet) || rawStreet
  const zipGeo = zip && zip.length === 5 ? await geocodeZip(zip) : null
  const streetVariants = Array.from(new Set([street, rawStreet].filter(Boolean)))
  const queries = Array.from(new Set(streetVariants.flatMap((streetLine) => [
    [streetLine, zip].filter(Boolean).join(', '),
    [streetLine, normalizeStateValue(state), zip].filter(Boolean).join(', '),
    [streetLine, city, normalizeStateValue(state)].filter(Boolean).join(', '),
    [streetLine, city, normalizeStateValue(state), zip].filter(Boolean).join(', '),
  ].filter(Boolean))))

  const candidates = []

  for (const query of queries) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('format', 'jsonv2')
      url.searchParams.set('addressdetails', '1')
      url.searchParams.set('countrycodes', 'us')
      url.searchParams.set('limit', '5')
      url.searchParams.set('q', query)

      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' },
      })
      if (!res.ok) continue
      const data = await res.json()

      for (const row of Array.isArray(data) ? data : []) {
        const lat = parseFloat(row.lat)
        const lng = parseFloat(row.lon)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue

        const addr = row.address || {}
        let score = 0
        if (addr.house_number) score += 6
        if (addr.road) score += 5
        if (zip && String(addr.postcode || '').includes(zip)) score += 6

        const cityNeedle = String(city || '').trim().toLowerCase()
        const cityHay = [addr.city, addr.town, addr.village, addr.hamlet, row.display_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (cityNeedle && cityHay.includes(cityNeedle)) score += 4

        if (state && String(addr.state || addr.state_code || row.display_name || '').toLowerCase().includes(String(state).toLowerCase())) {
          score += 3
        }

        if (zipGeo) {
          const dist = distanceMiles(zipGeo.lat, zipGeo.lng, lat, lng)
          score -= Math.min(dist, 25) / 2
          if (dist > 20) score -= 10
        }

        candidates.push({
          lat,
          lng,
          score,
          city: getResolvedCity(addr),
          state: getResolvedState(addr),
          zip_code: normalizeZipCode(addr.postcode || zip),
        })
      }

      if (candidates.length) break
    } catch (err) {
      console.error('Geocode error', err)
    }
  }

  if (!candidates.length) return null

  candidates.sort((a, b) => b.score - a.score)

  return {
    lat: candidates[0].lat,
    lng: candidates[0].lng,
    city: candidates[0].city || String(city || '').trim() || null,
    state: normalizeStateValue(candidates[0].state || state) || null,
    zip_code: candidates[0].zip_code || normalizeZipCode(zip) || null,
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

async function finalizeListingLocation({ address, city, state, zip, addressRequired = false, allowZipFallback = false }) {
  const cleanAddress = String(address || '').trim()

  if (cleanAddress) {
    const exact = await geocodeAddress(cleanAddress, city, state, zip)
    if (exact) {
      return { ok: true, resolved: { ...exact, source: 'address' } }
    }
    return {
      ok: false,
      error: 'We could not place that street address. Please verify it or clear it before submitting.',
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
    error: 'We could not determine a precise map location for this listing.',
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
    facility_zip_code: normalizeZipCode(current.facility_zip_code) || normalizeZipCode(resolved.zip_code) || '',
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