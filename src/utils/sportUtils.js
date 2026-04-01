// src/utils/sportUtils.js
// Purpose: Shared sport option lists used across submit form sections.
// Used by: CoachBasicsSection.jsx, FacilityBasicsSection.jsx, TeamBasicsSection.jsx
// Last updated: April 2026

export const SPORT_OPTIONS_WITH_BOTH = ['baseball', 'softball', 'both'];

export const SPORT_OPTIONS_STANDARD = ['baseball', 'softball'];

export function normalizeSportValue(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'baseball' || raw === 'softball' || raw === 'both') return raw
  if (raw.includes('baseball') && raw.includes('softball')) return 'both'
  if (raw.includes('softball')) return 'softball'
  if (raw.includes('baseball')) return 'baseball'
  return raw
}