import { createClient } from '@supabase/supabase-js'
import {
  searchCoachCandidates,
  searchFacilityCandidates,
  searchTeamCandidates,
} from '../src/lib/duplicateMatchers.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function normalize(value) {
  return String(value || '').toLowerCase().trim()
}

export async function findCoachDuplicates(record) {
  if (!record?.name && !record?.email && !record?.phone) return []

  return searchCoachCandidates({
    supabaseClient: supabase,
    name: record.name,
    city: record.city,
    state: record.state,
    email: record.email,
    phone: record.phone,
    excludeId: record.id,
    limit: 5,
  })
}

export async function findTeamDuplicates(record) {
  if (!record?.name && !record?.org_affiliation && !record?.contact_email) return []

  return searchTeamCandidates({
    supabaseClient: supabase,
    name: record.name,
    org_affiliation: record.org_affiliation,
    age_group: record.age_group,
    city: record.city,
    state: record.state,
    contact_email: record.contact_email,
    excludeId: record.id,
    limit: 5,
  })
}

export async function findFacilityDuplicates(record) {
  if (!record?.name && !record?.address) return []

  return searchFacilityCandidates({
    supabaseClient: supabase,
    facilityName: record.name,
    address: record.address,
    city: record.city,
    state: record.state,
    zipCode: record.zip_code,
    excludeId: record.id,
    limit: 5,
  })
}

export async function findPlayerBoardDuplicates(record) {
  const matches = []

  let query = supabase
    .from('player_board')
    .select('id, post_type, sport, city, contact_info, created_at, approval_status')
    .not('approval_status', 'eq', 'rejected')
    .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  if (record?.id != null && record.id !== '') {
    query = query.neq('id', record.id)
  }

  const { data } = await query

  for (const existing of data || []) {
    const reasons = []

    if (
      record.contact_info &&
      existing.contact_info &&
      normalize(existing.contact_info) === normalize(record.contact_info)
    ) {
      reasons.push('same contact info')
    }

    if (
      normalize(existing.post_type) === normalize(record.post_type) &&
      normalize(existing.sport) === normalize(record.sport) &&
      normalize(existing.city) === normalize(record.city) &&
      record.contact_info &&
      normalize(existing.contact_info) === normalize(record.contact_info)
    ) {
      reasons.push('identical post already exists')
    }

    if (reasons.length > 0) {
      matches.push({
        ...existing,
        reasons: [...new Set(reasons)],
      })
    }
  }

  return matches
}

export async function findDuplicates(table, record) {
  try {
    switch (table) {
      case 'coaches':
        return await findCoachDuplicates(record)
      case 'travel_teams':
        return await findTeamDuplicates(record)
      case 'facilities':
        return await findFacilityDuplicates(record)
      case 'player_board':
        return await findPlayerBoardDuplicates(record)
      default:
        return []
    }
  } catch (err) {
    console.error('Duplicate check error:', err)
    return []
  }
}