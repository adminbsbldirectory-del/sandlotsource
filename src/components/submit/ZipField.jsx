import { useEffect, useRef, useState } from 'react'
import { geocodeZip } from '../../lib/submit/geocode.js'

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  display: 'block',
  marginBottom: 6,
  color: '#444',
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '2px solid var(--lgray)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
}

export default function ZipField({ value, onChange, onGeocode, label, hint, required }) {
  const [status, setStatus] = useState('')
  const lastLookupRef = useRef('')
  const onGeocodeRef = useRef(onGeocode)

  useEffect(() => {
    onGeocodeRef.current = onGeocode
  }, [onGeocode])

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
        onGeocodeRef.current?.(geo)
      } else {
        setStatus('error')
        onGeocodeRef.current?.(null)
      }
    }

    runLookup()

    return () => {
      cancelled = true
    }
  }, [cleanedValue])

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
        onGeocodeRef.current?.(geo)
      } else {
        setStatus('error')
        onGeocodeRef.current?.(null)
      }
    }
  }

  return (
    <div>
      <label style={labelStyle}>
        {label || 'Zip Code'}
        {required && <span style={{ color: 'var(--red)' }}> *</span>}
        {status === 'loading' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>
            Checking…
          </span>
        )}
        {status === 'ok' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>
            ✓ Located
          </span>
        )}
        {status === 'error' && (
          <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: 'var(--red)' }}>
            Zip not found
          </span>
        )}
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

      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
        {hint || 'Used to place a map pin'}
      </div>
    </div>
  )
}