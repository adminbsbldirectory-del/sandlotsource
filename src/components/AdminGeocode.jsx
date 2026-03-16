import { useState } from 'react'
import { supabase } from '../supabase.js'

// Known GA zip codes for seeded facilities based on city/address data
// These cover the seeded facilities that have no zip in the DB
const KNOWN_ZIPS = {
  'Sandy Springs Youth Sports':              '30350',
  'Alpharetta Youth Baseball Association (AYBA)': '30009',
  'Alpharetta Youth Softball Association (AYSA)': '30009',
  'East Cobb Baseball':                      '30062',
  'Bombers Sports Academy':                  '30117',
  'Chatham County Little League':            '31406',
  'Druid Hills Youth Sports (DHYS)':         '30307',
  'Georgia Little League':                   '30303',
  'D-BAT Warner Robins':                     '31088',
  'Sally Little League':                     '31909',
  'Peach Little League':                     '31909',
  'Warner Robins American Little League':    '31093',
  'Northern Little League':                  '31906',
  'Sandy Plains Baseball':                   '30066',
  'Northside Youth Organization (NYO)':      '30305',
  'Georgia Stars Baseball Academy':          '30093',
  'Hit Lab Sport':                           '30540',
  'Valdosta-Lowndes Parks & Recreation (VL)': '31601',
  'Hopewell Baseball':                       '30004',
  'Martinez-Evans Little League':            '30907',
  '643 DP Athletics':                        '30060',
  'Murphey Candler Baseball':                '30319',
  'Columbus Parks & Recreation Youth Athle': '31906',
  'Georgia Premier Academy':                 '30458',
  'East Cobb Complex':                       '30062',
}

async function geocodeZip(zip) {
  if (!zip || zip.length !== 5) return null
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!res.ok) return null
    const data = await res.json()
    const place = data.places?.[0]
    if (!place) return null
    return {
      lat:   parseFloat(place.latitude),
      lng:   parseFloat(place.longitude),
      city:  place['place name'],
      state: place['state abbreviation'],
    }
  } catch { return null }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export default function AdminGeocode() {
  const [results, setResults]   = useState([])
  const [running, setRunning]   = useState(false)
  const [done,    setDone]      = useState(false)
  const [summary, setSummary]   = useState({ updated: 0, skipped: 0, failed: 0 })

  async function runGeocode() {
    setRunning(true)
    setResults([])
    setDone(false)
    setSummary({ updated: 0, skipped: 0, failed: 0 })

    // Fetch all active facilities
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('id, name, zip_code, lat, lng, city')
      .eq('active', true)

    if (error) {
      setResults([{ name: 'ERROR', status: 'error', msg: error.message }])
      setRunning(false)
      return
    }

    let updated = 0, skipped = 0, failed = 0

    for (const f of facilities) {
      // Already has coordinates — skip
      if (f.lat && f.lng) {
        setResults(r => [...r, { name: f.name, status: 'skip', msg: 'Already has coordinates' }])
        skipped++
        continue
      }

      // Determine zip to use: from DB first, then from KNOWN_ZIPS lookup
      const zip = f.zip_code?.trim() ||
        Object.entries(KNOWN_ZIPS).find(([k]) => f.name?.includes(k.slice(0, 20)))?.[1] ||
        KNOWN_ZIPS[f.name]

      if (!zip) {
        setResults(r => [...r, { name: f.name, status: 'fail', msg: 'No zip code available' }])
        failed++
        continue
      }

      // Geocode
      await sleep(150) // be polite to the free API
      const geo = await geocodeZip(zip)

      if (!geo) {
        setResults(r => [...r, { name: f.name, status: 'fail', msg: `Zip ${zip} not found` }])
        failed++
        continue
      }

      // Update Supabase
      const updatePayload = {
        lat:      geo.lat,
        lng:      geo.lng,
        zip_code: zip,
        state:    geo.state || 'GA',
      }
      // Auto-fill city if blank
      if (!f.city) updatePayload.city = geo.city

      const { error: updateError } = await supabase
        .from('facilities')
        .update(updatePayload)
        .eq('id', f.id)

      if (updateError) {
        setResults(r => [...r, { name: f.name, status: 'fail', msg: updateError.message }])
        failed++
      } else {
        setResults(r => [...r, { name: f.name, status: 'ok', msg: `${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)} (zip ${zip})` }])
        updated++
      }
    }

    setSummary({ updated, skipped, failed })
    setRunning(false)
    setDone(true)
  }

  const STATUS_COLORS = {
    ok:   { bg: '#dcfce7', color: '#15803d', icon: '✓' },
    skip: { bg: '#f1f5f9', color: '#64748b', icon: '—' },
    fail: { bg: '#fee2e2', color: '#dc2626', icon: '✗' },
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
          🗺️ Facility Geocoder
        </div>
        <div style={{ fontSize: 14, color: 'var(--gray)', lineHeight: 1.6 }}>
          Looks up lat/lng coordinates for every facility that doesn't have them yet. Uses zip codes from the database, with fallback lookups for seeded facilities. Safe to run multiple times — facilities that already have coordinates are skipped.
        </div>
      </div>

      {!running && !done && (
        <button onClick={runGeocode} style={{
          background: 'var(--red)', color: 'white', border: 'none',
          borderRadius: 8, padding: '12px 28px',
          fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
          letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer',
        }}>
          Run Geocoder
        </button>
      )}

      {running && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 20, height: 20, border: '3px solid var(--lgray)', borderTop: '3px solid var(--red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 14, color: 'var(--gray)' }}>Geocoding… please wait</span>
        </div>
      )}

      {done && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Updated', val: summary.updated, bg: '#dcfce7', color: '#15803d' },
            { label: 'Skipped', val: summary.skipped, bg: '#f1f5f9', color: '#64748b' },
            { label: 'Failed',  val: summary.failed,  bg: '#fee2e2', color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: s.color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {done && (
        <button onClick={runGeocode} style={{
          background: 'var(--navy)', color: 'white', border: 'none',
          borderRadius: 8, padding: '10px 24px', marginBottom: 20,
          fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700,
          cursor: 'pointer',
        }}>
          Run Again
        </button>
      )}

      {results.length > 0 && (
        <div style={{ border: '2px solid var(--lgray)', borderRadius: 10, overflow: 'hidden' }}>
          {results.map((r, i) => {
            const s = STATUS_COLORS[r.status] || STATUS_COLORS.fail
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px',
                background: i % 2 === 0 ? '#fff' : '#fafaf8',
                borderBottom: i < results.length - 1 ? '1px solid var(--lgray)' : 'none',
              }}>
                <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, minWidth: 18, textAlign: 'center' }}>
                  {s.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', flex: 1 }}>{r.name}</span>
                <span style={{ fontSize: 12, color: 'var(--gray)' }}>{r.msg}</span>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
