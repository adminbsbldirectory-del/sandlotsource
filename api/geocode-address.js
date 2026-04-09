// api/geocode-address.js
// Proxies address geocoding through Google Geocoding API and returns results in the
// same flat-array shape that geocode.js expects (Nominatim-compatible field names).

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = String(req.query?.q || '').trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing q parameter.' })
  }

  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY
  if (!apiKey) {
    console.error('geocode-address: GOOGLE_GEOCODING_API_KEY not set')
    return res.status(500).json({ error: 'Geocoder not configured.' })
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
    url.searchParams.set('address', q)
    url.searchParams.set('key', apiKey)
    // Restrict to US results to match the previous countrycodes=us Nominatim behaviour
    url.searchParams.set('components', 'country:US')

    const upstream = await fetch(url.toString())
    const text = await upstream.text()

    if (!upstream.ok) {
      console.error('geocode-address upstream error:', upstream.status, text)
      return res.status(upstream.status).json({ error: 'Upstream geocoder failed', status: upstream.status })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('geocode-address parse error:', err, text)
      return res.status(500).json({ error: 'Failed to parse geocoder response' })
    }

    // ZERO_RESULTS and any non-OK status that isn't a hard error → return empty array
    if (!data || data.status === 'ZERO_RESULTS' || !Array.isArray(data.results)) {
      if (data?.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('geocode-address Google error status:', data.status, data.error_message || '')
      }
      return res.status(200).json([])
    }

    const results = data.results.map(transformResult)
    return res.status(200).json(results)
  } catch (err) {
    console.error('geocode-address proxy error:', err)
    return res.status(500).json({ error: 'Geocode proxy failed', detail: err.message || 'Unknown error' })
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a single address_component value by type.
 * nameType is 'long_name' (default) or 'short_name'.
 */
function getComponent(components, type, nameType = 'long_name') {
  const comp = (components || []).find((c) => Array.isArray(c.types) && c.types.includes(type))
  return comp ? comp[nameType] : null
}

/**
 * Derive Nominatim-style `type`, `addresstype`, and `class` from Google's `types[]`.
 *
 * geocode.js uses these fields for:
 *   - score bonus:  row.addresstype === 'building' || row.type === 'house'  (+4)
 *   - zip detection in geocodeZip: r.type === 'postcode' || r.class === 'boundary'
 */
function deriveTypeFields(types) {
  if (!Array.isArray(types) || types.length === 0) {
    return { type: '', addresstype: '', cls: 'place' }
  }

  if (types.includes('street_address') || types.includes('premise') || types.includes('subpremise')) {
    return { type: 'house', addresstype: 'building', cls: 'building' }
  }

  if (types.includes('postal_code')) {
    // geocodeZip checks r.type === 'postcode' and r.class === 'boundary'
    return { type: 'postcode', addresstype: 'postcode', cls: 'boundary' }
  }

  if (types.includes('route')) {
    return { type: 'road', addresstype: 'road', cls: 'highway' }
  }

  if (types.includes('park') || types.includes('natural_feature')) {
    return { type: types[0], addresstype: types[0], cls: 'leisure' }
  }

  if (types.includes('establishment') || types.includes('point_of_interest')) {
    return { type: types[0], addresstype: types[0], cls: 'amenity' }
  }

  if (types.includes('locality') || types.includes('administrative_area_level_3')) {
    return { type: 'city', addresstype: 'city', cls: 'place' }
  }

  return { type: types[0], addresstype: types[0], cls: 'place' }
}

/**
 * Transform a single Google Geocoding API result into the Nominatim-compatible
 * shape that geocode.js expects.
 *
 * Fields consumed by geocode.js:
 *   row.lat              — string, parsed with parseFloat
 *   row.lon              — string, parsed with parseFloat  (NOTE: lon, not lng)
 *   row.display_name     — string
 *   row.addresstype      — used in scoreCandidate bonus check
 *   row.type             — used in scoreCandidate and geocodeZip postcode detection
 *   row.class            — used in geocodeZip boundary detection
 *   row.address.house_number
 *   row.address.road
 *   row.address.postcode
 *   row.address.city     — resolved by getResolvedCity
 *   row.address.town     — resolved by getResolvedCity
 *   row.address.village  — resolved by getResolvedCity
 *   row.address.county   — used in cityMatches fallback
 *   row.address.state    — full name, used in getResolvedState
 *   row.address.state_code     — 2-letter abbreviation, used in getResolvedState
 *   row.address['ISO3166-2-lvl4'] — used in getResolvedState fallback
 */
function transformResult(result) {
  const components = result.address_components || []
  const types = result.types || []
  const { type, addresstype, cls } = deriveTypeFields(types)

  const stateShort = getComponent(components, 'administrative_area_level_1', 'short_name')
  const stateLong  = getComponent(components, 'administrative_area_level_1', 'long_name')

  // city: prefer locality (e.g. "Brunswick"), fall back to administrative_area_level_3
  // town: same value — getResolvedCity checks city first, then town, so this is safe
  const cityName =
    getComponent(components, 'locality') ||
    getComponent(components, 'administrative_area_level_3') ||
    null

  const address = {
    house_number:      getComponent(components, 'street_number')              || null,
    road:              getComponent(components, 'route')                       || null,
    postcode:          getComponent(components, 'postal_code')                 || null,
    city:              cityName,
    town:              cityName,
    village:           getComponent(components, 'sublocality_level_1')        || null,
    // suburb / municipality / hamlet not used in Google results — leave absent
    county:            getComponent(components, 'administrative_area_level_2') || null,
    state:             stateLong                                               || null,
    state_code:        stateShort                                              || null,
    // getResolvedState also checks ISO3166-2-lvl4 as a last resort
    'ISO3166-2-lvl4':  stateShort ? `US-${stateShort}` : null,
    country:           'United States',
    country_code:      'us',
  }

  return {
    lat:          String(result.geometry.location.lat),
    lon:          String(result.geometry.location.lng),  // lon (not lng) — Nominatim convention
    display_name: result.formatted_address || '',
    type,
    addresstype,
    class:        cls,
    address,
  }
}
