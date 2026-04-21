// api/sitemap.js
// Vercel serverless function that generates sitemap.xml for Sandlot Source.
// Queries Supabase for distinct approved city/state pairs across coaches,
// travel_teams, and facilities and builds location landing page URLs.
// Accessible at /api/sitemap — referenced in public/robots.txt.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Maps state abbreviations to URL-slug-ready full names.
// Handles both abbreviation-stored ("GA") and full-name-stored ("Georgia") state values.
const STATE_ABBR_TO_SLUG = {
  AL: 'alabama',    AK: 'alaska',       AZ: 'arizona',      AR: 'arkansas',
  CA: 'california', CO: 'colorado',     CT: 'connecticut',  DE: 'delaware',
  FL: 'florida',    GA: 'georgia',      HI: 'hawaii',       ID: 'idaho',
  IL: 'illinois',   IN: 'indiana',      IA: 'iowa',         KS: 'kansas',
  KY: 'kentucky',   LA: 'louisiana',    ME: 'maine',        MD: 'maryland',
  MA: 'massachusetts', MI: 'michigan',  MN: 'minnesota',    MS: 'mississippi',
  MO: 'missouri',   MT: 'montana',      NE: 'nebraska',     NV: 'nevada',
  NH: 'new-hampshire', NJ: 'new-jersey', NM: 'new-mexico',  NY: 'new-york',
  NC: 'north-carolina', ND: 'north-dakota', OH: 'ohio',     OK: 'oklahoma',
  OR: 'oregon',     PA: 'pennsylvania', RI: 'rhode-island', SC: 'south-carolina',
  SD: 'south-dakota', TN: 'tennessee',  TX: 'texas',        UT: 'utah',
  VT: 'vermont',    VA: 'virginia',     WA: 'washington',   WV: 'west-virginia',
  WI: 'wisconsin',  WY: 'wyoming',
}

function toSlug(str) {
  return (str || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function stateToSlug(rawState) {
  if (!rawState) return ''
  const upper = rawState.trim().toUpperCase()
  // If it's a two-letter abbreviation, look it up directly.
  if (STATE_ABBR_TO_SLUG[upper]) return STATE_ABBR_TO_SLUG[upper]
  // If it's a full state name ("Georgia"), slug it directly.
  return toSlug(rawState)
}

export default async function handler(req, res) {
  const BASE_URL = 'https://www.sandlotsource.com'

  const tables = [
    { table: 'coaches',      path: 'coaches' },
    { table: 'travel_teams', path: 'teams' },
    { table: 'facilities',   path: 'facilities' },
  ]

  const locationSet = new Set()
  const locationUrls = []

  for (const { table, path } of tables) {
    const { data } = await supabase
      .from(table)
      .select('city, state')
      .eq('approval_status', 'approved')
      .not('city', 'is', null)
      .not('state', 'is', null)

    if (!data) continue

    for (const row of data) {
      const citySlug  = toSlug(row.city)
      const stateSlug = stateToSlug(row.state)
      if (!citySlug || !stateSlug) continue
      const url = `${BASE_URL}/${path}/${stateSlug}/${citySlug}`
      if (!locationSet.has(url)) {
        locationSet.add(url)
        locationUrls.push(url)
      }
    }
  }

  const staticUrls = [
    BASE_URL + '/',
    BASE_URL + '/coaches',
    BASE_URL + '/teams',
    BASE_URL + '/facilities',
    BASE_URL + '/submit',
    BASE_URL + '/roster',
    BASE_URL + '/find',
    BASE_URL + '/advertise',
    BASE_URL + '/help',
  ]

  const allUrls = [...staticUrls, ...locationUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
  res.status(200).send(xml)
}
