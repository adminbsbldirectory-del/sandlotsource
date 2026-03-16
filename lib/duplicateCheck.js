import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function normalize(str) { return (str || '').toLowerCase().trim(); }

function isSimilarName(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

export async function findCoachDuplicates(record) {
  const matches = [];
  if (!record.name) return matches;
  const { data } = await supabase.from('coaches').select('id, name, city, phone, email, approval_status').neq('id', record.id).not('approval_status', 'eq', 'rejected');
  for (const existing of data || []) {
    const reasons = [];
    if (isSimilarName(existing.name, record.name)) reasons.push('similar name');
    if (record.phone && existing.phone && normalize(existing.phone) === normalize(record.phone)) reasons.push('same phone');
    if (record.email && existing.email && normalize(existing.email) === normalize(record.email)) reasons.push('same email');
    if (reasons.length > 0) matches.push({ ...existing, reasons });
  }
  return matches;
}

export async function findTeamDuplicates(record) {
  const matches = [];
  const { data } = await supabase.from('travel_teams').select('id, name, age_group, city, contact_email, approval_status').neq('id', record.id).not('approval_status', 'eq', 'rejected');
  for (const existing of data || []) {
    const reasons = [];
    if (isSimilarName(existing.name, record.name)) reasons.push('similar name');
    if (isSimilarName(existing.name, record.name) && normalize(existing.age_group) === normalize(record.age_group)) reasons.push('same age group');
    if (record.contact_email && existing.contact_email && normalize(existing.contact_email) === normalize(record.contact_email)) reasons.push('same contact email');
    if (reasons.length > 0) matches.push({ ...existing, reasons: [...new Set(reasons)] });
  }
  return matches;
}

export async function findFacilityDuplicates(record) {
  const matches = [];
  const { data } = await supabase.from('facilities').select('id, name, city, phone, address, approval_status').neq('id', record.id).not('approval_status', 'eq', 'rejected');
  for (const existing of data || []) {
    const reasons = [];
    if (isSimilarName(existing.name, record.name)) reasons.push('similar name');
    if (record.phone && existing.phone && normalize(existing.phone) === normalize(record.phone)) reasons.push('same phone');
    if (record.address && existing.address && normalize(existing.address) === normalize(record.address)) reasons.push('same address');
    if (reasons.length > 0) matches.push({ ...existing, reasons });
  }
  return matches;
}

export async function findPlayerBoardDuplicates(record) {
  const matches = [];
  const { data } = await supabase.from('player_board').select('id, post_type, sport, city, contact_info, created_at, approval_status')
    .neq('id', record.id).not('approval_status', 'eq', 'rejected')
    .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  for (const existing of data || []) {
    const reasons = [];
    if (record.contact_info && existing.contact_info && normalize(existing.contact_info) === normalize(record.contact_info)) reasons.push('same contact info');
    if (normalize(existing.post_type) === normalize(record.post_type) && normalize(existing.sport) === normalize(record.sport) &&
        normalize(existing.city) === normalize(record.city) && record.contact_info && normalize(existing.contact_info) === normalize(record.contact_info))
      reasons.push('identical post already exists');
    if (reasons.length > 0) matches.push({ ...existing, reasons: [...new Set(reasons)] });
  }
  return matches;
}

export async function findDuplicates(table, record) {
  try {
    switch (table) {
      case 'coaches':      return await findCoachDuplicates(record);
      case 'travel_teams': return await findTeamDuplicates(record);
      case 'facilities':   return await findFacilityDuplicates(record);
      case 'player_board': return await findPlayerBoardDuplicates(record);
      default:             return [];
    }
  } catch (err) {
    console.error('Duplicate check error:', err);
    return [];
  }
}
