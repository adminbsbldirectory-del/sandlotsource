import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Grogans@2017'

const TABS = ['Coaches', 'Travel Teams', 'Facilities', 'Claim Requests', 'Reviews', 'Featured Coaches', 'Featured Facilities']

// ── Field config per table ──────────────────────────────────────────
const COACH_FIELDS = [
  { key: 'name',            label: 'Name',            type: 'text' },
  { key: 'sport',           label: 'Sport',           type: 'select', options: ['baseball','softball','both'] },
  { key: 'specialty',       label: 'Specialty',       type: 'multiselect', options: ['Pitching','Hitting','Catching','Fielding','Strength/Conditioning'] },
  { key: 'city',            label: 'City',            type: 'text' },
  { key: 'state',           label: 'State',           type: 'text' },
  { key: 'facility_name',   label: 'Facility',        type: 'text' },
  { key: 'phone',           label: 'Phone',           type: 'text' },
  { key: 'email',           label: 'Email',           type: 'text' },
  { key: 'website',         label: 'Website',         type: 'text' },
  { key: 'age_groups',      label: 'Age Groups',      type: 'multiselect', options: ['6U','8U','10U','12U','14U','16U','18U','Adult'] },
  { key: 'skill_level',     label: 'Skill Level',     type: 'multiselect', options: ['Beginner','Intermediate','Advanced','Elite'] },
  { key: 'approval_status', label: 'Approval',        type: 'select', options: ['approved','pending','seeded'] },
  { key: 'active',          label: 'Active',          type: 'boolean' },
  { key: 'featured_status', label: 'Featured',        type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',            type: 'number' },
  { key: 'verified_status', label: 'Verified',        type: 'boolean' },
]

const TEAM_FIELDS = [
  { key: 'name',            label: 'Name',            type: 'text' },
  { key: 'sport',           label: 'Sport',           type: 'select', options: ['baseball','softball','both'] },
  { key: 'age_group',       label: 'Age Group',       type: 'text' },
  { key: 'city',            label: 'City',            type: 'text' },
  { key: 'state',           label: 'State',           type: 'text' },
  { key: 'contact_name',    label: 'Contact',         type: 'text' },
  { key: 'contact_email',   label: 'Email',           type: 'text' },
  { key: 'contact_phone',   label: 'Phone',           type: 'text' },
  { key: 'tryout_status',   label: 'Tryouts',         type: 'select', options: ['open','closed','by_invite','year_round'] },
  { key: 'approval_status', label: 'Approval',        type: 'select', options: ['approved','pending'] },
  { key: 'active',          label: 'Active',          type: 'boolean' },
  { key: 'claimed',         label: 'Claimed',         type: 'boolean' },
  { key: 'featured_status', label: 'Featured',        type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',            type: 'number' },
]

const FACILITY_FIELDS = [
  { key: 'name',            label: 'Name',            type: 'text' },
  { key: 'sport',           label: 'Sport',           type: 'select', options: ['baseball','softball','both'] },
  { key: 'city',            label: 'City',            type: 'text' },
  { key: 'state',           label: 'State',           type: 'text' },
  { key: 'phone',           label: 'Phone',           type: 'text' },
  { key: 'email',           label: 'Email',           type: 'text' },
  { key: 'website',         label: 'Website',         type: 'text' },
  { key: 'facility_type',   label: 'Type',            type: 'select', options: ['park_field','training_facility','private_facility','travel_team_facility','school_field','other'] },
  { key: 'approval_status', label: 'Approval',        type: 'select', options: ['approved','pending','seeded'] },
  { key: 'active',          label: 'Active',          type: 'boolean' },
]

const CLAIM_FIELDS = [
  { key: 'listing_name',    label: 'Listing',         type: 'text' },
  { key: 'listing_type',    label: 'Type',            type: 'text' },
  { key: 'city',            label: 'City',            type: 'text' },
  { key: 'requested_change',label: 'Change',          type: 'text' },
  { key: 'requester_name',  label: 'Requester',       type: 'text' },
  { key: 'requester_email', label: 'Email',           type: 'email-link' },
  { key: 'requester_phone', label: 'Phone',           type: 'text' },
  { key: 'notes',           label: 'Notes',           type: 'text' },
  { key: 'status',          label: 'Status',          type: 'select', options: ['new','pending','resolved'] },
  { key: 'admin_notes',     label: 'Admin Notes',     type: 'text' },
]

const REVIEW_FIELDS = [
  { key: '_coach_name',      label: 'Coach',          type: 'joined',        joinPath: ['coaches', 'name'] },
  { key: 'rating',           label: 'Rating',         type: 'stars' },
  { key: 'review_text',      label: 'Review',         type: 'text' },
  { key: 'reviewer_name',    label: 'Reviewer',       type: 'text' },
  { key: 'player_age_group', label: 'Age Group',      type: 'text' },
  { key: 'email',            label: 'Email',          type: 'email-link' },
  { key: 'moderation_status',label: 'Status',         type: 'select',        options: ['pending','approved','rejected'] },
  { key: 'created_at',       label: 'Submitted',      type: 'date-readonly' },
]

const FEATURED_COACH_FIELDS = [
  { key: 'name',             label: 'Name',           type: 'text' },
  { key: 'city',             label: 'City',           type: 'text' },
  { key: 'state',            label: 'State',          type: 'text' },
  { key: 'sport',            label: 'Sport',          type: 'select',    options: ['baseball','softball','both'] },
  { key: 'featured_status',  label: 'Featured',       type: 'boolean' },
  { key: 'featured_rank',    label: 'Rank',           type: 'number' },
  { key: 'featured_start',   label: 'Start Date',     type: 'date-edit' },
  { key: 'featured_until',   label: 'Expiry',         type: 'date-edit' },
]

const FEATURED_FACILITY_FIELDS = [
  { key: 'name',             label: 'Name',           type: 'text' },
  { key: 'city',             label: 'City',           type: 'text' },
  { key: 'state',            label: 'State',          type: 'text' },
  { key: 'sport',            label: 'Sport',          type: 'select',    options: ['baseball','softball','both'] },
  { key: 'featured_status',  label: 'Featured',       type: 'boolean' },
  { key: 'featured_rank',    label: 'Rank',           type: 'number' },
  { key: 'featured_until',   label: 'Expiry',         type: 'date-edit' },
]

const TABLE_CONFIG = {
  'Coaches':             { table: 'coaches',        fields: COACH_FIELDS,             orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Travel Teams':        { table: 'travel_teams',   fields: TEAM_FIELDS,              orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Facilities':          { table: 'facilities',     fields: FACILITY_FIELDS,          orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Claim Requests':      { table: 'claim_requests', fields: CLAIM_FIELDS,             orderBy: 'submitted_at',  ascending: false, selectQuery: '*' },
  'Reviews':             { table: 'reviews',        fields: REVIEW_FIELDS,            orderBy: 'created_at',    ascending: false, selectQuery: '*, coaches(name)' },
  'Featured Coaches':    { table: 'coaches',        fields: FEATURED_COACH_FIELDS,    orderBy: 'featured_rank', ascending: true,  selectQuery: '*' },
  'Featured Facilities': { table: 'facilities',     fields: FEATURED_FACILITY_FIELDS, orderBy: 'featured_rank', ascending: true,  selectQuery: '*' },
}

// ── Styles ──────────────────────────────────────────────────────────
const s = {
  page: {
    background: '#f4f6f9',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
  },
  header: {
    background: '#1b3a5c',
    padding: '14px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'var(--font-head, system-ui)',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.04em',
    margin: 0,
  },
  headerBadge: {
    background: 'rgba(255,255,255,0.15)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 20,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  body: { padding: '16px 20px' },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 20,
    borderBottom: '2px solid #dde3ec',
  },
  tab: (active) => ({
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: 'none',
    borderBottom: active ? '2px solid #1b3a5c' : '2px solid transparent',
    borderRadius: '6px 6px 0 0',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1b3a5c' : '#888',
    cursor: 'pointer',
    marginBottom: -2,
    transition: 'all 0.15s',
  }),
  featuredTab: (active) => ({
    padding: '9px 20px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    border: 'none',
    borderBottom: active ? '2px solid #d97706' : '2px solid transparent',
    borderRadius: '6px 6px 0 0',
    background: active ? '#fffbeb' : 'transparent',
    color: active ? '#d97706' : '#888',
    cursor: 'pointer',
    marginBottom: -2,
    transition: 'all 0.15s',
  }),
  card: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #dde3ec',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  toolbar: {
    padding: '14px 18px',
    borderBottom: '1px solid #eef0f4',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#f8f9fb',
  },
  featuredToolbar: {
    padding: '14px 18px',
    borderBottom: '1px solid #fde68a',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#fffbeb',
  },
  searchInput: {
    flex: 1,
    maxWidth: 320,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #dde3ec',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  },
  countBadge: {
    fontSize: 12,
    color: '#888',
    marginLeft: 'auto',
  },
  filterToggle: (active) => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: active ? '1px solid #d97706' : '1px solid #dde3ec',
    background: active ? '#fef3c7' : '#fff',
    color: active ? '#92400e' : '#666',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  }),
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'auto' },
  th: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#666',
    background: '#f8f9fb',
    borderBottom: '1px solid #eef0f4',
    whiteSpace: 'nowrap',
    minWidth: 100,
  },
  featuredTh: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#92400e',
    background: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    whiteSpace: 'nowrap',
    minWidth: 100,
  },
  td: {
    padding: '9px 14px',
    borderBottom: '1px solid #f0f2f6',
    verticalAlign: 'middle',
    color: '#1a1a2e',
    minWidth: 100,
  },
  inlineInput: {
    width: '100%',
    minWidth: 80,
    padding: '5px 8px',
    borderRadius: 6,
    border: '1px solid transparent',
    fontSize: 13,
    fontFamily: 'inherit',
    background: 'transparent',
    outline: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  inlineSelect: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #dde3ec',
    fontSize: 12,
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  dateInput: {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #dde3ec',
    fontSize: 12,
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  savingDot: { color: '#f59e0b', fontSize: 11, marginLeft: 6 },
  savedDot:  { color: '#16a34a', fontSize: 11, marginLeft: 6 },
  errorDot:  { color: '#dc2626', fontSize: 11, marginLeft: 6 },
  boolBadge: (val) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: val ? '#dcfce7' : '#f1f5f9',
    color: val ? '#15803d' : '#64748b',
    cursor: 'pointer',
    userSelect: 'none',
    border: val ? '1px solid #86efac' : '1px solid #e2e8f0',
  }),
  approvalBadge: (val) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: val === 'approved' ? '#dcfce7' : val === 'seeded' ? '#eff6ff' : '#fef3c7',
    color: val === 'approved' ? '#15803d' : val === 'seeded' ? '#1d4ed8' : '#92400e',
    border: val === 'approved' ? '1px solid #86efac' : val === 'seeded' ? '1px solid #bfdbfe' : '1px solid #fcd34d',
  }),
  claimBadge: (val) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: val === 'resolved' ? '#dcfce7' : val === 'pending' ? '#fef3c7' : '#fee2e2',
    color: val === 'resolved' ? '#15803d' : val === 'pending' ? '#92400e' : '#991b1b',
    border: val === 'resolved' ? '1px solid #86efac' : val === 'pending' ? '1px solid #fcd34d' : '1px solid #fca5a5',
  }),
  reviewBadge: (val) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: val === 'approved' ? '#dcfce7' : val === 'rejected' ? '#fee2e2' : '#fef3c7',
    color: val === 'approved' ? '#15803d' : val === 'rejected' ? '#991b1b' : '#92400e',
    border: val === 'approved' ? '1px solid #86efac' : val === 'rejected' ? '1px solid #fca5a5' : '1px solid #fcd34d',
  }),
  featuredDateBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d',
  },
  expiredDateBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 700,
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
  },
  passwordWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f4f6f9',
  },
  passwordCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '36px 40px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    width: 320,
    textAlign: 'center',
  },
}

// ── Helpers ─────────────────────────────────────────────────────────
function toDateInputValue(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function formatDateDisplay(val) {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isExpired(val) {
  if (!val) return false
  return new Date(val) < new Date()
}

// ── Password gate ────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function attempt() {
    if (val === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_unlocked', '1')
      onUnlock()
    } else {
      setErr(true)
      setVal('')
    }
  }

  return (
    <div style={s.passwordWrap}>
      <div style={s.passwordCard}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: '#1b3a5c', marginBottom: 6 }}>
          Admin Access
        </div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Sandlot Source</div>
        <input
          type="password"
          value={val}
          onChange={e => { setVal(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="Password"
          style={{ ...s.searchInput, width: '100%', maxWidth: '100%', marginBottom: 12, boxSizing: 'border-box',
            border: err ? '1px solid #dc2626' : '1px solid #dde3ec' }}
          autoFocus
        />
        {err && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>Incorrect password</div>}
        <button onClick={attempt} style={{
          width: '100%', padding: '10px', background: '#1b3a5c', color: '#fff',
          border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Unlock
        </button>
      </div>
    </div>
  )
}

// ── Inline cell ──────────────────────────────────────────────────────
function Cell({ record, field, onSave, isFeaturedTab }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(record[field.key])
  const [status, setStatus] = useState('')

  async function save(newVal) {
    setStatus('saving')
    const update = {}
    update[field.key] = newVal || null
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    const { error } = await supabase
      .from(cfg?.table || '')
      .update(update)
      .eq('id', record.id)
    if (error) {
      setStatus('error')
      setTimeout(() => setStatus(''), 2000)
    } else {
      setStatus('saved')
      onSave(record.id, field.key, newVal)
      setTimeout(() => setStatus(''), 1500)
    }
    setEditing(false)
  }

  const tdStyle = isFeaturedTab
    ? { ...s.td, borderBottom: '1px solid #fef3c7' }
    : s.td

  // ── joined (read-only) ──
  if (field.type === 'joined') {
    const [tableKey, colKey] = field.joinPath
    const displayVal = record[tableKey] ? record[tableKey][colKey] : null
    return (
      <td style={{ ...tdStyle, fontWeight: 600, color: '#1b3a5c' }}>
        {displayVal || <span style={{ color: '#ccc' }}>—</span>}
      </td>
    )
  }

  // ── date-readonly ──
  if (field.type === 'date-readonly') {
    return (
      <td style={{ ...tdStyle, color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>
        {formatDateDisplay(record[field.key]) || '—'}
      </td>
    )
  }

  // ── date-edit (editable date picker with expiry badge) ──
  if (field.type === 'date-edit') {
    const expired = field.key === 'featured_until' && isExpired(val)
    const displayText = formatDateDisplay(val)
    return (
      <td style={tdStyle}>
        {editing ? (
          <input
            type="date"
            defaultValue={toDateInputValue(val)}
            autoFocus
            style={s.dateInput}
            onBlur={e => save(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Click to edit"
          >
            {displayText
              ? <span style={expired ? s.expiredDateBadge : s.featuredDateBadge}>{displayText}{expired ? ' ⚠' : ''}</span>
              : <span style={{ color: '#bbb', fontSize: 12 }}>Set date…</span>}
            {status === 'saving' && <span style={s.savingDot}>●</span>}
            {status === 'saved'  && <span style={s.savedDot}>●</span>}
            {status === 'error'  && <span style={s.errorDot}>●</span>}
          </span>
        )}
      </td>
    )
  }

  // ── stars ──
  if (field.type === 'stars') {
    const num = Number(record[field.key]) || 0
    return (
      <td style={tdStyle}>
        <span style={{ color: '#f59e0b', fontSize: 15, letterSpacing: 1 }}>
          {'★'.repeat(num)}
          <span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - num)}</span>
        </span>
      </td>
    )
  }

  // ── boolean ──
  if (field.type === 'boolean') {
    return (
      <td style={tdStyle}>
        <span style={s.boolBadge(val)} onClick={async () => {
          const next = !val
          setVal(next)
          setStatus('saving')
          const update = {}
          update[field.key] = next
          const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
          const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
          setStatus(error ? 'error' : 'saved')
          onSave(record.id, field.key, next)
          setTimeout(() => setStatus(''), 1500)
        }}>
          {val ? 'Yes' : 'No'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </span>
      </td>
    )
  }

  // ── select ──
  if (field.type === 'select') {
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    return (
      <td style={tdStyle}>
        <select value={val || ''} style={s.inlineSelect}
          onChange={async e => {
            const next = e.target.value
            setVal(next)
            setStatus('saving')
            const update = {}
            update[field.key] = next
            const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
            setStatus(error ? 'error' : 'saved')
            onSave(record.id, field.key, next)
            setTimeout(() => setStatus(''), 1500)
          }}>
          <option value="">—</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {status === 'saving' && <span style={s.savingDot}>●</span>}
        {status === 'saved'  && <span style={s.savedDot}>●</span>}
        {status === 'error'  && <span style={s.errorDot}>●</span>}
      </td>
    )
  }

  // ── multiselect ──
  if (field.type === 'multiselect') {
    const arr = Array.isArray(val) ? val : (val ? [val] : [])
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    return (
      <td style={tdStyle}>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 160 }}>
            {field.options.map(o => {
              const checked = arr.includes(o)
              return (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                  background: checked ? '#dbeafe' : '#f1f5f9', borderRadius: 6, padding: '3px 8px',
                  cursor: 'pointer', border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" checked={checked} style={{ margin: 0 }} onChange={async () => {
                    const next = checked ? arr.filter(x => x !== o) : [...arr, o]
                    setVal(next)
                    setStatus('saving')
                    const update = {}
                    update[field.key] = next
                    const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
                    setStatus(error ? 'error' : 'saved')
                    onSave(record.id, field.key, next)
                    setTimeout(() => setStatus(''), 1500)
                  }} />
                  {o}
                </label>
              )
            })}
            <button onClick={() => setEditing(false)} style={{ fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}>done</button>
          </div>
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {arr.length > 0
              ? arr.map(a => <span key={a} style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{a}</span>)
              : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>}
          </span>
        )}
        {status === 'saving' && <span style={s.savingDot}>●</span>}
        {status === 'saved'  && <span style={s.savedDot}>●</span>}
      </td>
    )
  }

  // ── email-link ──
  if (field.type === 'email-link') {
    return (
      <td style={tdStyle}>
        <a href={'mailto:' + (val || '')} style={{ color: '#1b3a5c', fontSize: 13 }}>{val || '—'}</a>
      </td>
    )
  }

  // ── text / number ──
  return (
    <td style={tdStyle}>
      {editing ? (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={val || ''}
          autoFocus
          style={{ ...s.inlineInput, border: '1px solid #93c5fd', background: '#f0f7ff',
            width: field.type === 'number' ? 60 : 'auto',
            minWidth: field.type === 'number' ? 60 : 100 }}
          onChange={e => setVal(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={() => save(val)}
          onKeyDown={e => {
            if (e.key === 'Enter') save(val)
            if (e.key === 'Escape') { setVal(record[field.key]); setEditing(false) }
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{ cursor: 'text', display: 'block', minWidth: 40, color: val ? '#1a1a2e' : '#ccc' }}
          title="Click to edit"
        >
          {val !== null && val !== undefined && val !== '' ? String(val) : '—'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </span>
      )}
    </td>
  )
}

// ── Table view ───────────────────────────────────────────────────────
function AdminTable({ tabName }) {
  const cfg = TABLE_CONFIG[tabName]
  const isFeaturedTab = tabName === 'Featured Coaches' || tabName === 'Featured Facilities'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(true)

  useEffect(() => {
    setLoading(true)
    setSearch('')
    setFeaturedOnly(true)
    supabase
      .from(cfg.table)
      .select(cfg.selectQuery || '*')
      .order(cfg.orderBy, { ascending: cfg.ascending !== false })
      .then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [tabName])

  const filtered = rows.filter(r => {
    if (isFeaturedTab && featuredOnly && !r.featured_status) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return Object.values(r).some(v => {
      if (v && typeof v === 'object') {
        return Object.values(v).some(inner => inner && String(inner).toLowerCase().includes(q))
      }
      return v && String(v).toLowerCase().includes(q)
    })
  })

  function handleSave(id, key, val) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  return (
    <div style={s.card}>
      <div style={isFeaturedTab ? s.featuredToolbar : s.toolbar}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={'Search ' + tabName.toLowerCase() + '…'}
          style={s.searchInput}
        />
        {isFeaturedTab && (
          <button
            style={s.filterToggle(featuredOnly)}
            onClick={() => setFeaturedOnly(f => !f)}
          >
            {featuredOnly ? '★ Featured only' : 'All records'}
          </button>
        )}
        <span style={s.countBadge}>{filtered.length} of {rows.length} records</span>
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 310px)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
            {isFeaturedTab && featuredOnly
              ? 'No featured records yet — toggle to promote one.'
              : 'No records found'}
          </div>
        ) : (
          <table style={s.table}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {cfg.fields.map(f => (
                  <th key={f.key} style={isFeaturedTab ? s.featuredTh : s.th}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(record => (
                <tr
                  key={record.id}
                  style={{ background: isFeaturedTab && record.featured_status ? '#fffdf5' : '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = isFeaturedTab ? '#fffbeb' : '#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background = isFeaturedTab && record.featured_status ? '#fffdf5' : '#fff'}
                >
                  {cfg.fields.map(field => (
                    <Cell key={field.key} record={record} field={field} onSave={handleSave} isFeaturedTab={isFeaturedTab} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('admin_unlocked') === '1')
  const [activeTab, setActiveTab] = useState('Coaches')

  const featuredTabs = ['Featured Coaches', 'Featured Facilities']

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={{ fontSize: 22 }}>⚾</span>
        <h1 style={s.headerTitle}>Sandlot Source</h1>
        <span style={s.headerBadge}>Admin</span>
        <button
          onClick={() => { sessionStorage.removeItem('admin_unlocked'); setUnlocked(false) }}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.12)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 14px',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          Log out
        </button>
      </div>
      <div style={s.body}>
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              style={featuredTabs.includes(t) ? s.featuredTab(activeTab === t) : s.tab(activeTab === t)}
              onClick={() => setActiveTab(t)}
            >
              {featuredTabs.includes(t) ? ('★ ' + t) : t}
            </button>
          ))}
        </div>
        <AdminTable key={activeTab} tabName={activeTab} />
      </div>
    </div>
  )
}
