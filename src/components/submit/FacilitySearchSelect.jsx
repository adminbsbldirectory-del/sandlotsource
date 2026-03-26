import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../supabase.js'

const inputStyle = {
  width: '100%',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 15,
  outline: 'none',
  background: '#fff',
}

export default function FacilitySearchSelect({ selectedFacility, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const trimmed = String(query || '').trim()
    if (!trimmed) {
      setResults([])
      setShowResults(false)
      return
    }
    let cancelled = false
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('facilities')
          .select('id, name, city, state, zip_code, address')
          .ilike('name', '%' + trimmed + '%')
          .in('approval_status', ['approved', 'seeded'])
          .eq('active', true)
          .order('name')
          .limit(8)

        if (!cancelled) {
          setResults(data || [])
          setShowResults(true)
          setSearching(false)
        }
      } catch {
        if (!cancelled) {
          setResults([])
          setSearching(false)
        }
      }
    }, 280)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (selectedFacility) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#EFF6FF',
          border: '2px solid #BFDBFE',
          borderRadius: 8,
          padding: '10px 14px',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
            {selectedFacility.name}
          </div>
          {(selectedFacility.city || selectedFacility.state) && (
            <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>
              {[selectedFacility.city, selectedFacility.state].filter(Boolean).join(', ')}
              {selectedFacility.zip_code ? ' ' + selectedFacility.zip_code : ''}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gray)',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            padding: '4px 8px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
          }}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          placeholder="Search by facility name…"
          style={{ ...inputStyle, paddingRight: 36 }}
        />

        {searching && (
          <span
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              color: '#888',
            }}
          >
            Searching…
          </span>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '2px solid var(--lgray)',
            borderRadius: 8,
            marginTop: 4,
            zIndex: 50,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {results.map((f, idx) => (
            <button
              key={f.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                onSelect(f)
                setQuery('')
                setResults([])
                setShowResults(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: idx < results.length - 1 ? '1px solid var(--lgray)' : 'none',
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>
                {f.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>
                {[f.city, f.state].filter(Boolean).join(', ')}
                {f.zip_code ? ' · ' + f.zip_code : ''}
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && results.length === 0 && !searching && String(query || '').trim().length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#fff',
            border: '2px solid var(--lgray)',
            borderRadius: 8,
            marginTop: 4,
            zIndex: 50,
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--gray)',
          }}
        >
          No approved facilities found yet. You can add a new one below from the team form.
        </div>
      )}
    </div>
  )
}