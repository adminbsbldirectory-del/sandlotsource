function normalize(value) {
  return String(value || '').toLowerCase().trim()
}

function normalizePhoneDigits(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeFacilityName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bhs\b/g, ' high school ')
    .replace(/\bh\.?s\.?\b/g, ' high school ')
    .replace(/\bms\b/g, ' middle school ')
    .replace(/\brec\b/g, ' recreation ')
    .replace(/\bctr\b/g, ' center ')
    .replace(/\bath\b/g, ' athletics ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAddress(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bst\b/g, ' street ')
    .replace(/\brd\b/g, ' road ')
    .replace(/\bave\b/g, ' avenue ')
    .replace(/\bdr\b/g, ' drive ')
    .replace(/\bln\b/g, ' lane ')
    .replace(/\bblvd\b/g, ' boulevard ')
    .replace(/\bct\b/g, ' court ')
    .replace(/\bcir\b/g, ' circle ')
    .replace(/\bpkwy\b/g, ' parkway ')
    .replace(/\bhwy\b/g, ' highway ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeCoachName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bcoach\b/g, ' ')
    .replace(/\btrainer\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTeamIdentity(name, orgAffiliation) {
  return String(`${orgAffiliation || ''} ${name || ''}`)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bga\b/g, ' georgia ')
    .replace(/\b(\d{1,2})u\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeAgeGroup(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim()
}

function normalizedTokens(value) {
  return Array.from(new Set(String(value || '').split(' ').filter(Boolean)))
}

function tokenSimilarity(a, b) {
  const aTokens = normalizedTokens(a)
  const bTokens = normalizedTokens(b)

  if (!aTokens.length || !bTokens.length) return 0

  const bSet = new Set(bTokens)
  const overlap = aTokens.filter((token) => bSet.has(token)).length
  return overlap / Math.max(aTokens.length, bTokens.length)
}

function dedupeReasons(reasons) {
  return [...new Set(reasons.filter(Boolean))]
}

function buildMap() {
  const map = new Map()

  function addRows(rows) {
    for (const row of rows || []) {
      if (row?.id && !map.has(row.id)) {
        map.set(row.id, row)
      }
    }
  }

  return { map, addRows }
}

function excludeRecordQuery(query, excludeId) {
  if (excludeId == null || excludeId === '') return query
  return query.neq('id', excludeId)
}

export function scoreFacilityCandidate(input, row) {
  const inputName = normalizeFacilityName(input.facilityName)
  const rowName = normalizeFacilityName(row.name)
  const inputAddress = normalizeAddress(input.address)
  const rowAddress = normalizeAddress(row.address)
  const inputCity = normalize(input.city)
  const rowCity = normalize(row.city)
  const inputState = normalize(input.state)
  const rowState = normalize(row.state)
  const inputZip = String(input.zipCode || '').trim()
  const rowZip = String(row.zip_code || '').trim()

  const exactAddress = !!inputAddress && !!rowAddress && inputAddress === rowAddress
  const sameCity = !!inputCity && !!rowCity && inputCity === rowCity
  const sameState = !!inputState && !!rowState && inputState === rowState
  const sameCityState = sameCity && sameState
  const sameZip = !!inputZip && !!rowZip && inputZip === rowZip
  const exactName = !!inputName && !!rowName && inputName === rowName
  const containsName =
    !!inputName &&
    !!rowName &&
    (inputName.includes(rowName) || rowName.includes(inputName))

  const nameSimilarity =
    inputName && rowName
      ? Math.max(tokenSimilarity(inputName, rowName), containsName ? 0.92 : 0)
      : 0

  let score = nameSimilarity

  if (exactAddress) score = Math.max(score, 0.99)
  if (exactName && sameZip) score = Math.max(score, 0.96)
  if (nameSimilarity >= 0.82 && sameZip) score = Math.max(score, 0.93)
  if (nameSimilarity >= 0.72 && sameCityState) score = Math.max(score, 0.82)

  let matchType = null

  if (exactAddress || (exactName && sameZip) || (nameSimilarity >= 0.82 && sameZip)) {
    matchType = 'strong'
  } else if (nameSimilarity >= 0.72 && sameCityState) {
    matchType = 'soft'
  }

  if (!matchType) return null

  const reasons = []
  if (exactAddress) reasons.push('same address')
  if (sameZip) reasons.push('same zip')
  if (sameCityState) reasons.push('same city/state')
  if (exactName) reasons.push('same normalized name')
  else if (nameSimilarity >= 0.72) reasons.push('similar name')

  return {
    ...row,
    score,
    matchType,
    reasons: dedupeReasons(reasons),
  }
}

export function scoreCoachCandidate(input, row) {
  const inputName = normalizeCoachName(input.name)
  const rowName = normalizeCoachName(row.name)
  const inputCity = normalize(input.city)
  const rowCity = normalize(row.city)
  const inputState = normalize(input.state)
  const rowState = normalize(row.state)
  const inputEmail = normalize(input.email)
  const rowEmail = normalize(row.email)
  const inputPhone = normalizePhoneDigits(input.phone)
  const rowPhone = normalizePhoneDigits(row.phone)

  const exactName = !!inputName && !!rowName && inputName === rowName
  const nameSimilarity =
    inputName && rowName
      ? Math.max(
          tokenSimilarity(inputName, rowName),
          inputName.includes(rowName) || rowName.includes(inputName) ? 0.92 : 0
        )
      : 0

  const sameCity = !!inputCity && !!rowCity && inputCity === rowCity
  const sameState = !!inputState && !!rowState && inputState === rowState
  const sameCityState = sameCity && sameState
  const sameEmail = !!inputEmail && !!rowEmail && inputEmail === rowEmail
  const samePhone = !!inputPhone && !!rowPhone && inputPhone === rowPhone

  let score = nameSimilarity

  if (exactName && sameCityState) score = Math.max(score, 0.97)
  else if (exactName) score = Math.max(score, 0.9)
  else if (nameSimilarity >= 0.76 && sameCityState) score = Math.max(score, 0.84)

  if ((sameEmail || samePhone) && (exactName || nameSimilarity >= 0.6 || sameCityState)) {
    score = Math.max(score, sameEmail ? 0.95 : 0.9)
  }

  let matchType = null

  if (
    (exactName && sameCityState) ||
    (sameEmail && (exactName || nameSimilarity >= 0.6 || sameCityState)) ||
    (samePhone && (exactName || nameSimilarity >= 0.6 || sameCityState))
  ) {
    matchType = 'strong'
  } else if (exactName || (nameSimilarity >= 0.76 && sameCityState)) {
    matchType = 'soft'
  }

  if (!matchType) return null

  const reasons = []
  if (exactName) reasons.push('same normalized name')
  else if (nameSimilarity >= 0.76) reasons.push('similar name')
  if (sameCityState) reasons.push('same city/state')
  if (sameEmail) reasons.push('same email')
  if (samePhone) reasons.push('same phone')

  return {
    ...row,
    score,
    matchType,
    reasons: dedupeReasons(reasons),
  }
}

export function scoreTeamCandidate(input, row) {
  const inputIdentity = normalizeTeamIdentity(input.name, input.org_affiliation)
  const rowIdentity = normalizeTeamIdentity(row.name, row.org_affiliation)
  const inputAge = normalizeAgeGroup(input.age_group)
  const rowAge = normalizeAgeGroup(row.age_group)
  const inputCity = normalize(input.city)
  const rowCity = normalize(row.city)
  const inputState = normalize(input.state)
  const rowState = normalize(row.state)
  const inputEmail = normalize(input.contact_email)
  const rowEmail = normalize(row.contact_email)

  const exactIdentity = !!inputIdentity && !!rowIdentity && inputIdentity === rowIdentity
  const identitySimilarity =
    inputIdentity && rowIdentity
      ? Math.max(
          tokenSimilarity(inputIdentity, rowIdentity),
          inputIdentity.includes(rowIdentity) || rowIdentity.includes(inputIdentity) ? 0.92 : 0
        )
      : 0

  const sameAge = !!inputAge && !!rowAge && inputAge === rowAge
  const sameCity = !!inputCity && !!rowCity && inputCity === rowCity
  const sameState = !!inputState && !!rowState && inputState === rowState
  const sameCityState = sameCity && sameState
  const sameEmail = !!inputEmail && !!rowEmail && inputEmail === rowEmail

  let score = identitySimilarity

  if (exactIdentity && sameAge) score = Math.max(score, 0.97)
  else if (exactIdentity && sameCityState) score = Math.max(score, 0.94)
  else if (exactIdentity) score = Math.max(score, 0.82)
  else if (identitySimilarity >= 0.76 && sameAge && sameCityState) score = Math.max(score, 0.88)

  if (sameEmail && (exactIdentity || identitySimilarity >= 0.65 || sameAge)) {
    score = Math.max(score, 0.9)
  }

  let matchType = null

  if (
    (exactIdentity && sameAge) ||
    (exactIdentity && sameCityState) ||
    (sameEmail && (exactIdentity || identitySimilarity >= 0.65 || sameAge))
  ) {
    matchType = 'strong'
  } else if (
    exactIdentity ||
    (identitySimilarity >= 0.76 && sameAge) ||
    (identitySimilarity >= 0.76 && sameCityState)
  ) {
    matchType = 'soft'
  }

  if (!matchType) return null

  const reasons = []
  if (exactIdentity) reasons.push('same normalized team/org name')
  else if (identitySimilarity >= 0.76) reasons.push('similar team/org name')
  if (sameAge) reasons.push('same age group')
  if (sameCityState) reasons.push('same city/state')
  if (sameEmail) reasons.push('same contact email')

  return {
    ...row,
    score,
    matchType,
    reasons: dedupeReasons(reasons),
  }
}

export async function searchFacilityCandidates({
  supabaseClient,
  facilityName,
  address,
  city,
  state,
  zipCode,
  excludeId = null,
  limit = 5,
}) {
  const trimmedName = String(facilityName || '').trim()
  const trimmedAddress = String(address || '').trim()
  const trimmedCity = String(city || '').trim()
  const trimmedState = String(state || '').trim()
  const trimmedZip = String(zipCode || '').trim()

  if (!trimmedName && !trimmedAddress) return []

  const { map, addRows } = buildMap()

  if (trimmedZip) {
    let query = supabaseClient
      .from('facilities')
      .select('id, name, address, city, state, zip_code, lat, lng, phone, email, approval_status')
      .eq('zip_code', trimmedZip)
      .limit(25)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedCity && trimmedState) {
    let query = supabaseClient
      .from('facilities')
      .select('id, name, address, city, state, zip_code, lat, lng, phone, email, approval_status')
      .ilike('city', trimmedCity)
      .eq('state', trimmedState)
      .limit(40)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedName) {
    const firstToken = normalizeFacilityName(trimmedName).split(' ')[0]
    if (firstToken) {
      let query = supabaseClient
        .from('facilities')
        .select('id, name, address, city, state, zip_code, lat, lng, phone, email, approval_status')
        .ilike('name', `%${firstToken}%`)
        .limit(40)

      query = excludeRecordQuery(query, excludeId)
      const { data, error } = await query
      if (error) throw error
      addRows(data)
    }
  }

  return Array.from(map.values())
    .map((row) =>
      scoreFacilityCandidate(
        {
          facilityName: trimmedName,
          address: trimmedAddress,
          city: trimmedCity,
          state: trimmedState,
          zipCode: trimmedZip,
        },
        row
      )
    )
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function searchCoachCandidates({
  supabaseClient,
  name,
  city,
  state,
  email,
  phone,
  excludeId = null,
  limit = 5,
}) {
  const trimmedName = String(name || '').trim()
  const trimmedCity = String(city || '').trim()
  const trimmedState = String(state || '').trim()
  const trimmedEmail = String(email || '').trim().toLowerCase()
  const trimmedPhone = normalizePhoneDigits(phone)

  if (!trimmedName && !trimmedEmail && !trimmedPhone) return []

  const { map, addRows } = buildMap()

  if (trimmedEmail) {
    let query = supabaseClient
      .from('coaches')
      .select('id, name, city, state, phone, email, facility_name, approval_status')
      .eq('email', trimmedEmail)
      .limit(10)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedCity && trimmedState) {
    let query = supabaseClient
      .from('coaches')
      .select('id, name, city, state, phone, email, facility_name, approval_status')
      .ilike('city', trimmedCity)
      .eq('state', trimmedState)
      .limit(40)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedName) {
    const firstToken = normalizeCoachName(trimmedName).split(' ')[0]
    if (firstToken) {
      let query = supabaseClient
        .from('coaches')
        .select('id, name, city, state, phone, email, facility_name, approval_status')
        .ilike('name', `%${firstToken}%`)
        .limit(40)

      query = excludeRecordQuery(query, excludeId)
      const { data, error } = await query
      if (error) throw error
      addRows(data)
    }
  }

  return Array.from(map.values())
    .map((row) =>
      scoreCoachCandidate(
        {
          name: trimmedName,
          city: trimmedCity,
          state: trimmedState,
          email: trimmedEmail,
          phone: trimmedPhone,
        },
        row
      )
    )
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function searchTeamCandidates({
  supabaseClient,
  name,
  org_affiliation,
  age_group,
  city,
  state,
  contact_email,
  excludeId = null,
  limit = 5,
}) {
  const trimmedName = String(name || '').trim()
  const trimmedOrg = String(org_affiliation || '').trim()
  const trimmedAge = String(age_group || '').trim()
  const trimmedCity = String(city || '').trim()
  const trimmedState = String(state || '').trim()
  const trimmedEmail = String(contact_email || '').trim().toLowerCase()

  if (!trimmedName && !trimmedOrg && !trimmedEmail) return []

  const { map, addRows } = buildMap()

  if (trimmedEmail) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .eq('contact_email', trimmedEmail)
      .limit(20)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedCity && trimmedState) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .ilike('city', trimmedCity)
      .eq('state', trimmedState)
      .limit(40)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedAge && trimmedState) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .eq('age_group', trimmedAge)
      .eq('state', trimmedState)
      .limit(40)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  const normalizedIdentity = normalizeTeamIdentity(trimmedName, trimmedOrg)
  const identityTokens = normalizedIdentity.split(' ').filter(Boolean)
  const firstToken = identityTokens[0]
  const secondToken = identityTokens[1]

  if (firstToken) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .or(`name.ilike.%${firstToken}%,org_affiliation.ilike.%${firstToken}%`)
      .limit(40)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (firstToken && secondToken) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .or(
        `name.ilike.%${firstToken}%,name.ilike.%${secondToken}%,org_affiliation.ilike.%${firstToken}%,org_affiliation.ilike.%${secondToken}%`
      )
      .limit(50)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  if (trimmedName.length >= 6) {
    let query = supabaseClient
      .from('travel_teams')
      .select('id, name, org_affiliation, age_group, city, state, zip_code, contact_email, contact_phone, approval_status')
      .ilike('name', `%${trimmedName}%`)
      .limit(25)

    query = excludeRecordQuery(query, excludeId)
    const { data, error } = await query
    if (error) throw error
    addRows(data)
  }

  return Array.from(map.values())
    .map((row) =>
      scoreTeamCandidate(
        {
          name: trimmedName,
          org_affiliation: trimmedOrg,
          age_group: trimmedAge,
          city: trimmedCity,
          state: trimmedState,
          contact_email: trimmedEmail,
        },
        row
      )
    )
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}