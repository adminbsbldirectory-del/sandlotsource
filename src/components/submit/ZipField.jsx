import { useEffect, useRef, useState } from 'react'
import { geocodeZip } from '../../lib/submit/geocode.js'

const inputStyle = {
  width: '100%',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '11px 12px',
  fontSize: 15,
  outline: 'none',
  background: '#fff',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: 'var(--navy)',
  marginBottom: 8,
}

export default function ZipField({ value, onChange, onGeocode, label, hint, required }) {
  const [status, setStatus] = useState('')
  const lastLookupRef = useRef('')

  const cleanedValue = String(value || '').replace(/\D/g, '').slice(0, 5)

  useEffect(() => {
    let cancelled = false

    async function runLookup() {
      if (cleanedValue.length !== 5) {
        if (cleanedValue.length === 0) setStatus('')
        return
      }
      if (lastLookupRef.current === cleanedValue) return
      lastLookupRef.current = cleanedValue
      setStatus('loading')
      const geo = await geocodeZip(cleanedValue)
      if (cancelled) return
      if (geo) {
        setStatus('ok')
        onGeocode(geo)
      } else {
        setStatus('error')
        onGeocode(null)
      }
    }

    runLookup()
    return () => {
      cancelled = true
    }
  }, [cleanedValue, onGeocode])

  function updateZip(nextValue) {
    const digits = String(nextValue || '').replace(/\D/g, '').slice(0, 5)
    if (digits.length < 5) {
      lastLookupRef.current = ''
      if (!digits) setStatus('')
    }
    onChange(digits)
  }

  async function handleBlur() {
    if (cleanedValue.length !== 5) return
    if (lastLookupRef.current !== cleanedValue) {
      setStatus('loading')
      const geo = await geocodeZip(cleanedValue)
      lastLookupRef.current = cleanedValue
      if (geo) {
        setStatus('ok')
        onGeocode(geo)
      } else {
        setStatus('error')
        onGeocode(null)
      }
    }
  }

  return (
    <div>
      <label style={labelStyle}>
        {label || 'Zip Code'}
        {required && <span style={{ color: 'var(--red)' }}> *</span>}
        {status === 'loading' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Checking…</span>}
        {status === 'ok' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Located</span>}
        {status === 'error' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--red)' }}>Zip not found</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={5}
        value={cleanedValue}
        onChange={(e) => updateZip(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          updateZip(e.clipboardData.getData('text'))
        }}
        onBlur={handleBlur}
        placeholder="e.g. 30076"
        style={inputStyle}
      />
      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>{hint || 'Used to place a map pin'}</div>
    </div>
  )
}