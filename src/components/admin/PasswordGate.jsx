import { useState } from 'react'

export default function PasswordGate({
  adminPassword,
  onUnlock,
  styles,
}) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function attempt() {
    if (val === adminPassword) {
      sessionStorage.setItem('admin_unlocked', '1')
      onUnlock()
    } else {
      setErr(true)
      setVal('')
    }
  }

  return (
    <div style={styles.passwordWrap}>
      <div style={styles.passwordCard}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: 20,
            fontWeight: 700,
            color: '#1b3a5c',
            marginBottom: 6,
          }}
        >
          Admin Access
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Sandlot Source</div>
        <input
          type="password"
          value={val}
          autoFocus
          onChange={(e) => {
            setVal(e.target.value)
            setErr(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && attempt()}
          placeholder="Password"
          style={{
            ...styles.searchInput,
            width: '100%',
            maxWidth: '100%',
            marginBottom: 12,
            boxSizing: 'border-box',
            border: err ? '1px solid #dc2626' : '1px solid #dde3ec',
          }}
        />
        {err ? <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>Incorrect password</div> : null}
        <button
          onClick={attempt}
          style={{
            width: '100%',
            padding: '10px',
            background: '#1b3a5c',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  )
}