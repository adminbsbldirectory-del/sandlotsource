import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase.js'
import ClaimRequestRow from './admin/ClaimRequestRow.jsx'
import ClaimRequestsToolbar from './admin/ClaimRequestsToolbar.jsx'
import AdminTabs from './admin/AdminTabs.jsx'
import PasswordGate from './admin/PasswordGate.jsx'
import GenericAdminTableContent from './admin/GenericAdminTableContent.jsx'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Grogans@2017'
const REVIEWED_BY = 'admin'

const TABS = [
  'Coaches',
  'Travel Teams',
  'Facilities',
  'Claim Requests',
  'Reviews',
  'Featured Coaches',
  'Featured Facilities',
]

const FEATURED_TABS = ['Featured Coaches', 'Featured Facilities']

const COACH_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'sport', label: 'Sport', type: 'select', options: ['baseball', 'softball', 'both'] },
  { key: 'specialty', label: 'Specialty', type: 'readonly' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'facility_name', label: 'Facility', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'age_groups', label: 'Age Groups', type: 'readonly' },
  { key: 'skill_level', label: 'Skill Level', type: 'readonly' },
  { key: 'approval_status', label: 'Approval', type: 'select', options: ['approved', 'pending', 'seeded'] },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'featured_status', label: 'Featured', type: 'boolean' },
  { key: 'featured_rank', label: 'Rank', type: 'number' },
  { key: 'verified_status', label: 'Verified', type: 'boolean' },
]

const TEAM_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'sport', label: 'Sport', type: 'select', options: ['baseball', 'softball', 'both'] },
  { key: 'age_group', label: 'Age Group', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'contact_name', label: 'Contact', type: 'text' },
  { key: 'contact_email', label: 'Email', type: 'text' },
  { key: 'contact_phone', label: 'Phone', type: 'text' },
  { key: 'tryout_status', label: 'Tryouts', type: 'select', options: ['open', 'closed', 'by_invite', 'year_round'] },
  { key: 'approval_status', label: 'Approval', type: 'select', options: ['approved', 'pending'] },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'claimed', label: 'Claimed', type: 'boolean' },
  { key: 'featured_status', label: 'Featured', type: 'boolean' },
  { key: 'featured_rank', label: 'Rank', type: 'number' },
]

const FACILITY_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'sport', label: 'Sport', type: 'select', options: ['baseball', 'softball', 'both'] },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'facility_type', label: 'Type', type: 'text' },
  { key: 'approval_status', label: 'Approval', type: 'select', options: ['approved', 'pending', 'seeded'] },
  { key: 'active', label: 'Active', type: 'boolean' },
]

const REVIEW_FIELDS = [
  { key: '_coach_name', label: 'Coach', type: 'joined', joinPath: ['coaches', 'name'] },
  { key: 'rating', label: 'Rating', type: 'stars' },
  { key: 'review_text', label: 'Review', type: 'text' },
  { key: 'reviewer_name', label: 'Reviewer', type: 'text' },
  { key: 'player_age_group', label: 'Age Group', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'moderation_status', label: 'Status', type: 'select', options: ['pending', 'approved', 'rejected'] },
  { key: 'created_at', label: 'Submitted', type: 'date-readonly' },
]

const FEATURED_COACH_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'sport', label: 'Sport', type: 'select', options: ['baseball', 'softball', 'both'] },
  { key: 'featured_status', label: 'Featured', type: 'boolean' },
  { key: 'featured_rank', label: 'Rank', type: 'number' },
  { key: 'featured_start', label: 'Start Date', type: 'date-edit' },
  { key: 'featured_until', label: 'Expiry', type: 'date-edit' },
]

const FEATURED_FACILITY_FIELDS = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'city', label: 'City', type: 'text' },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'sport', label: 'Sport', type: 'select', options: ['baseball', 'softball', 'both'] },
  { key: 'featured_status', label: 'Featured', type: 'boolean' },
  { key: 'featured_rank', label: 'Rank', type: 'number' },
  { key: 'featured_until', label: 'Expiry', type: 'date-edit' },
]

const TABLE_CONFIG = {
  Coaches: {
    table: 'coaches',
    fields: COACH_FIELDS,
    orderBy: 'name',
    ascending: true,
    selectQuery: '*',
  },
  'Travel Teams': {
    table: 'travel_teams',
    fields: TEAM_FIELDS,
    orderBy: 'name',
    ascending: true,
    selectQuery: '*',
  },
  Facilities: {
    table: 'facilities',
    fields: FACILITY_FIELDS,
    orderBy: 'name',
    ascending: true,
    selectQuery: '*',
  },
  Reviews: {
    table: 'reviews',
    fields: REVIEW_FIELDS,
    orderBy: 'created_at',
    ascending: false,
    selectQuery: '*, coaches(name)',
  },
  'Featured Coaches': {
    table: 'coaches',
    fields: FEATURED_COACH_FIELDS,
    orderBy: 'featured_rank',
    ascending: true,
    selectQuery: '*',
  },
  'Featured Facilities': {
    table: 'facilities',
    fields: FEATURED_FACILITY_FIELDS,
    orderBy: 'featured_rank',
    ascending: true,
    selectQuery: '*',
  },
}

const TAB_FILTERS = {
  Coaches: [
    { key: 'state', label: 'State', getValue: (r) => normalizeFilterValue(r.state), placeholder: 'All States' },
    { key: 'sport', label: 'Sport', getValue: (r) => normalizeFilterValue(r.sport), placeholder: 'All Sports' },
    { key: 'approval_status', label: 'Approval', getValue: (r) => normalizeFilterValue(r.approval_status), placeholder: 'All Approval' },
  ],
  'Travel Teams': [
    { key: 'state', label: 'State', getValue: (r) => normalizeFilterValue(r.state), placeholder: 'All States' },
    { key: 'sport', label: 'Sport', getValue: (r) => normalizeFilterValue(r.sport), placeholder: 'All Sports' },
    { key: 'approval_status', label: 'Approval', getValue: (r) => normalizeFilterValue(r.approval_status), placeholder: 'All Approval' },
    { key: 'claimed', label: 'Claimed', getValue: (r) => (r.claimed ? 'claimed' : 'unclaimed'), placeholder: 'All Claim Status' },
  ],
  Facilities: [
    { key: 'state', label: 'State', getValue: (r) => normalizeFilterValue(r.state), placeholder: 'All States' },
    { key: 'sport', label: 'Sport', getValue: (r) => normalizeFilterValue(r.sport), placeholder: 'All Sports' },
    { key: 'facility_type', label: 'Type', getValue: (r) => normalizeFilterValue(r.facility_type), placeholder: 'All Types' },
    { key: 'approval_status', label: 'Approval', getValue: (r) => normalizeFilterValue(r.approval_status), placeholder: 'All Approval' },
  ],
  Reviews: [
    { key: 'moderation_status', label: 'Status', getValue: (r) => normalizeFilterValue(r.moderation_status), placeholder: 'All Statuses' },
  ],
  'Featured Coaches': [
    { key: 'state', label: 'State', getValue: (r) => normalizeFilterValue(r.state), placeholder: 'All States' },
    { key: 'sport', label: 'Sport', getValue: (r) => normalizeFilterValue(r.sport), placeholder: 'All Sports' },
  ],
  'Featured Facilities': [
    { key: 'state', label: 'State', getValue: (r) => normalizeFilterValue(r.state), placeholder: 'All States' },
    { key: 'sport', label: 'Sport', getValue: (r) => normalizeFilterValue(r.sport), placeholder: 'All Sports' },
  ],
}

const s = {
  page: {
    background: '#f4f6f9',
    fontFamily: 'var(--font-body, system-ui, sans-serif)',
    minHeight: '100vh',
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
  body: {
    padding: '16px 20px',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 20,
    borderBottom: '2px solid #dde3ec',
  },
  tab: (active) => ({
    padding: '9px 18px',
    fontSize: 12,
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
  }),
  featuredTab: (active) => ({
    padding: '9px 18px',
    fontSize: 12,
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
  }),
  card: {
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #dde3ec',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  toolbar: {
    padding: '12px 16px',
    borderBottom: '1px solid #eef0f4',
    background: '#f8f9fb',
    display: 'grid',
    gap: 10,
  },
  filterRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    minWidth: 240,
    flex: 1,
    maxWidth: 340,
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #dde3ec',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fff',
  },
  filterSelect: {
    minWidth: 140,
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #dde3ec',
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
  },
  countBadge: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 'auto',
    whiteSpace: 'nowrap',
  },
  tableWrap: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 320px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
    tableLayout: 'auto',
  },
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
    minWidth: 90,
    userSelect: 'none',
    cursor: 'pointer',
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
    minWidth: 90,
    userSelect: 'none',
    cursor: 'pointer',
  },
  td: {
    padding: '9px 14px',
    borderBottom: '1px solid #f0f2f6',
    verticalAlign: 'top',
    color: '#1a1a2e',
    minWidth: 90,
  },
  featuredTd: {
    padding: '9px 14px',
    borderBottom: '1px solid #fef3c7',
    verticalAlign: 'top',
    color: '#1a1a2e',
    minWidth: 90,
  },
  inlineInput: {
    width: '100%',
    minWidth: 100,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #dde3ec',
    fontSize: 13,
    fontFamily: 'inherit',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  inlineSelect: {
    minWidth: 100,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #dde3ec',
    fontSize: 12,
    fontFamily: 'inherit',
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  dateInput: {
    minWidth: 120,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #dde3ec',
    fontSize: 12,
    fontFamily: 'inherit',
    background: '#fff',
    outline: 'none',
  },
  smallStatus: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  claimList: {
    display: 'grid',
  },
  claimItem: {
    padding: '16px',
    borderBottom: '1px solid #eef0f4',
  },
  claimGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1.2fr 0.9fr 1.1fr 0.9fr',
    gap: 14,
    alignItems: 'start',
  },
  claimGridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 12,
    alignItems: 'start',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 4,
  },
  monospace: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    color: '#334155',
    wordBreak: 'break-all',
  },
  actionButton: (variant = 'neutral') => ({
    padding: '8px 10px',
    borderRadius: 8,
    border:
      variant === 'approve'
        ? '1px solid #15803d'
        : variant === 'reject'
        ? '1px solid #dc2626'
        : variant === 'pending'
        ? '1px solid #d97706'
        : '1px solid #cbd5e1',
    background:
      variant === 'approve'
        ? '#16a34a'
        : variant === 'reject'
        ? '#dc2626'
        : variant === 'pending'
        ? '#f59e0b'
        : '#fff',
    color: variant === 'neutral' ? '#334155' : '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  }),
  errorBox: {
    margin: '12px 16px 0',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #fca5a5',
    background: '#fef2f2',
    color: '#991b1b',
    fontSize: 13,
    lineHeight: 1.45,
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

function normalizeFilterValue(value) {
  const raw = String(value || '').trim()
  return raw
}

function formatFilterOption(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (raw === 'claimed') return 'Claimed'
  if (raw === 'unclaimed') return 'Unclaimed'
  return raw
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function toDateInputValue(val) {
  if (!val) return ''
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function formatDateDisplay(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isExpired(val) {
  if (!val) return false
  return new Date(val) < new Date()
}

function displayFieldValue(record, field) {
  if (field.type === 'joined') {
    const [parentKey, childKey] = field.joinPath
    return record[parentKey]?.[childKey] ?? ''
  }

  const value = record[field.key]

  if (value == null || value === '') return ''

  if (Array.isArray(value)) return value.join(', ')

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  return String(value)
}

function sortRows(rows, sortKey, sortDir, fields) {
  if (!sortKey) return rows

  const field = fields.find((f) => f.key === sortKey)

  return [...rows].sort((a, b) => {
    let av
    let bv

    if (field?.type === 'joined') {
      av = displayFieldValue(a, field)
      bv = displayFieldValue(b, field)
    } else if (field?.type === 'boolean') {
      av = a[sortKey] ? 1 : 0
      bv = b[sortKey] ? 1 : 0
    } else if (field?.type === 'date-readonly' || field?.type === 'date-edit') {
      av = a[sortKey] ? new Date(a[sortKey]).getTime() : 0
      bv = b[sortKey] ? new Date(b[sortKey]).getTime() : 0
    } else if (field?.type === 'stars' || field?.type === 'number') {
      av = Number(a[sortKey] || 0)
      bv = Number(b[sortKey] || 0)
    } else {
      av = displayFieldValue(a, field || { key: sortKey, type: 'text' })
      bv = displayFieldValue(b, field || { key: sortKey, type: 'text' })
    }

    if (av == null && bv == null) return 0
    if (av == null || av === '') return 1
    if (bv == null || bv === '') return -1

    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, {
            numeric: true,
            sensitivity: 'base',
          })

    return sortDir === 'asc' ? cmp : -cmp
  })
}

function getDistinctOptions(rows, getValue) {
  const values = new Set()

  rows.forEach((row) => {
    const value = getValue(row)
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      values.add(String(value).trim())
    }
  })

  return Array.from(values).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
  )
}

function deriveClaimDecision(record) {
  if (record.status !== 'resolved') return ''
  const notes = String(record.admin_notes || '').trim().toUpperCase()
  if (notes.startsWith('[APPROVED]')) return 'approved'
  if (notes.startsWith('[REJECTED]')) return 'rejected'
  return 'resolved'
}


function EditableCell({ tableName, record, field, onSave, isFeaturedTab }) {
  const [value, setValue] = useState(record[field.key] ?? '')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setValue(record[field.key] ?? '')
    setStatus('')
  }, [record, field.key])

  const tdStyle = isFeaturedTab ? s.featuredTd : s.td

  async function save(nextValue) {
    setStatus('Saving…')

    const update = {}
    update[field.key] = nextValue === '' ? null : nextValue

    const { error } = await supabase.from(tableName).update(update).eq('id', record.id)

    if (error) {
      console.error('Admin save error:', error)
      setStatus('Error')
      setTimeout(() => setStatus(''), 2000)
      return
    }

    setStatus('Saved')
    onSave(record.id, field.key, nextValue === '' ? null : nextValue)
    setTimeout(() => setStatus(''), 1200)
  }

  function statusNode() {
    return status ? <div style={s.smallStatus}>{status}</div> : null
  }

  if (field.type === 'joined') {
    return (
      <td style={tdStyle}>
        <div>{displayFieldValue(record, field) || '—'}</div>
      </td>
    )
  }

  if (field.type === 'readonly') {
    return (
      <td style={tdStyle}>
        <div style={{ lineHeight: 1.45 }}>{displayFieldValue(record, field) || '—'}</div>
      </td>
    )
  }

  if (field.type === 'stars') {
    return (
      <td style={tdStyle}>
        <div>{Number(record[field.key] || 0)} / 5</div>
      </td>
    )
  }

  if (field.type === 'date-readonly') {
    return (
      <td style={tdStyle}>
        <div>{formatDateDisplay(record[field.key])}</div>
      </td>
    )
  }

  if (field.type === 'date-edit') {
    const expired = field.key === 'featured_until' && isExpired(record[field.key])

    return (
      <td style={tdStyle}>
        <div style={{ fontSize: 12, color: expired ? '#991b1b' : '#64748b', marginBottom: 6 }}>
          {formatDateDisplay(record[field.key])}
        </div>
        <input
          type="date"
          value={toDateInputValue(record[field.key])}
          onChange={(e) => save(e.target.value || '')}
          style={s.dateInput}
        />
        {statusNode()}
      </td>
    )
  }

  if (field.type === 'boolean') {
    return (
      <td style={tdStyle}>
        <select
          value={record[field.key] ? 'true' : 'false'}
          onChange={(e) => save(e.target.value === 'true')}
          style={s.inlineSelect}
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        {statusNode()}
      </td>
    )
  }

  if (field.type === 'select') {
    return (
      <td style={tdStyle}>
        <select
          value={record[field.key] ?? ''}
          onChange={(e) => save(e.target.value)}
          style={s.inlineSelect}
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {formatFilterOption(option)}
            </option>
          ))}
        </select>
        {statusNode()}
      </td>
    )
  }

  if (field.type === 'number') {
    return (
      <td style={tdStyle}>
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const nextValue = value === '' ? '' : Number(value)
            if ((record[field.key] ?? '') !== nextValue) save(nextValue)
          }}
          style={s.inlineInput}
        />
        {statusNode()}
      </td>
    )
  }

  return (
    <td style={tdStyle}>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if ((record[field.key] ?? '') !== value) save(value)
        }}
        style={s.inlineInput}
      />
      {statusNode()}
    </td>
  )
}

function GenericAdminTable({ tabName }) {
  const cfg = TABLE_CONFIG[tabName]
  const isFeaturedTab = FEATURED_TABS.includes(tabName)
  const filters = TAB_FILTERS[tabName] || []

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(cfg.orderBy)
  const [sortDir, setSortDir] = useState(cfg.ascending ? 'asc' : 'desc')
  const [filterValues, setFilterValues] = useState(
    Object.fromEntries(filters.map((filter) => [filter.key, '']))
  )

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)

      const { data, error } = await supabase
        .from(cfg.table)
        .select(cfg.selectQuery)
        .order(cfg.orderBy, { ascending: cfg.ascending })

      if (ignore) return

      if (error) {
        console.error(`${tabName} load error:`, error)
        setRows([])
      } else {
        setRows(data || [])
      }

      setLoading(false)
    }

    load()

    return () => {
      ignore = true
    }
  }, [cfg.ascending, cfg.orderBy, cfg.selectQuery, cfg.table, tabName])

  const filterOptions = useMemo(() => {
    const next = {}

    filters.forEach((filter) => {
      next[filter.key] = getDistinctOptions(rows, filter.getValue)
    })

    return next
  }, [filters, rows])

  function handleSave(id, key, nextValue) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: nextValue } : row))
    )
  }

  function handleSort(nextKey) {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(nextKey)
      setSortDir('asc')
    }
  }

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = rows.filter((row) => {
      const passesFilters = filters.every((filter) => {
        const selected = filterValues[filter.key]
        if (!selected) return true
        return String(filter.getValue(row) || '') === selected
      })

      if (!passesFilters) return false

      if (!q) return true

      return cfg.fields.some((field) =>
        displayFieldValue(row, field).toLowerCase().includes(q)
      )
    })

    return sortRows(result, sortKey, sortDir, cfg.fields)
  }, [cfg.fields, filterValues, filters, rows, search, sortDir, sortKey])

     return (
    <GenericAdminTableContent
      tabName={tabName}
      cfg={cfg}
      isFeaturedTab={isFeaturedTab}
      filters={filters}
      search={search}
      onSearchChange={setSearch}
      filterValues={filterValues}
      onFilterValueChange={(key, value) =>
        setFilterValues((prev) => ({
          ...prev,
          [key]: value,
        }))
      }
      filterOptions={filterOptions}
      displayed={displayed}
      loading={loading}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={handleSort}
      onSave={handleSave}
      CellComponent={EditableCell}
      styles={s}
      formatFilterOption={formatFilterOption}
    />
  )
} 

function ClaimRequestsTable() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [listingType, setListingType] = useState('')
  const [requestKind, setRequestKind] = useState('')
  const [statusFilter, setStatusFilter] = useState('new')
  const [sortOrder, setSortOrder] = useState('newest')
  const [notesById, setNotesById] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1200 : false)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1200)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function loadRows() {
    setLoading(true)
    setLoadError('')

    try {
      const response = await fetch('/api/admin-claim-requests')

      if (!response.ok) {
        if (response.status === 404) {
          setLoadError(
            'Claim requests API is not available in this local mode. Use Vercel preview or vercel dev to test claim workflow.'
          )
        } else {
          const payload = await response.json().catch(() => ({}))
          setLoadError(payload?.error || 'Failed to load claim requests.')
        }
        setRows([])
        setLoading(false)
        return
      }

      const payload = await response.json()
      const nextRows = payload?.rows || []

      setRows(nextRows)

      const nextNotes = {}
      nextRows.forEach((row) => {
        nextNotes[row.id] = row.admin_notes || ''
      })
      setNotesById(nextNotes)
      setLoading(false)
    } catch (error) {
      console.error('Claim Requests load error:', error)
      setLoadError('Failed to load claim requests.')
      setRows([])
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [])

  async function updateClaimQueue(row, action) {
    setBusyId(row.id)

    try {
      const response = await fetch('/api/review-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimRequestId: row.id,
          action,
          reviewedBy: REVIEWED_BY,
          adminNotes: notesById[row.id] || '',
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        window.alert(payload?.error || 'Failed to update claim request.')
        setBusyId(null)
        return
      }

      setBusyId(null)
      await loadRows()
    } catch (error) {
      console.error('Claim queue update error:', error)
      setBusyId(null)
      window.alert('Failed to update claim request.')
    }
  }

  async function reviewClaim(row, action) {
    const message = action === 'approve' ? 'Approve this request?' : 'Reject this request?'
    if (!window.confirm(message)) return

    await updateClaimQueue(row, action)
  }

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()

    let result = rows.filter((row) => {
      if (listingType && row.listing_type !== listingType) return false
      if (requestKind && row.request_kind !== requestKind) return false
      if (statusFilter && row.status !== statusFilter) return false

      if (!q) return true

      return [
        row.listing_name,
        row.listing_type,
        row.city,
        row.requester_name,
        row.requester_email,
        row.requester_phone,
        row.relationship_to_listing,
        row.requested_change,
        row.notes,
        row.admin_notes,
        row.request_kind,
        row.listing_id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    })

    result = [...result].sort((a, b) => {
      const av = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
      const bv = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
      return sortOrder === 'oldest' ? av - bv : bv - av
    })

    return result
  }, [listingType, requestKind, rows, search, sortOrder, statusFilter])

    return (
      <div style={s.card}>
              <ClaimRequestsToolbar
                search={search}
                onSearchChange={setSearch}
                listingType={listingType}
                onListingTypeChange={setListingType}
                requestKind={requestKind}
                onRequestKindChange={setRequestKind}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                shownCount={displayed.length}
                styles={s}
              />

      {loadError ? <div style={s.errorBox}>{loadError}</div> : null}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
      ) : displayed.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No claim requests match.</div>
      ) : (
               <div style={s.claimList}>
          {displayed.map((row) => {
            const decision = deriveClaimDecision(row)
            const isResolved = row.status === 'resolved'
            const isBusy = busyId === row.id

            return (
              <ClaimRequestRow
                key={row.id}
                row={row}
                decision={decision}
                isResolved={isResolved}
                isBusy={isBusy}
                isMobile={isMobile}
                noteValue={notesById[row.id] || ''}
                onNoteChange={(nextValue) =>
                  setNotesById((prev) => ({
                    ...prev,
                    [row.id]: nextValue,
                  }))
                }
                onMarkPending={() => updateClaimQueue(row, 'mark_pending')}
                onMarkNew={() => updateClaimQueue(row, 'mark_new')}
                onApprove={() => reviewClaim(row, 'approve')}
                onReject={() => reviewClaim(row, 'reject')}
                styles={s}
                formatFilterOption={formatFilterOption}
                formatDateDisplay={formatDateDisplay}
              />
            )
          })}
        </div> 
      )}
    </div>
  )
}

function AdminTable({ tabName }) {
  if (tabName === 'Claim Requests') {
    return <ClaimRequestsTable />
  }

  return <GenericAdminTable tabName={tabName} />
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('admin_unlocked') === '1')
  const [activeTab, setActiveTab] = useState('Coaches')

  if (!unlocked) {
    return (
      <PasswordGate
        adminPassword={ADMIN_PASSWORD}
        onUnlock={() => setUnlocked(true)}
        styles={s}
      />
    )
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={{ fontSize: 22 }}>⚾</span>
        <h1 style={s.headerTitle}>Sandlot Source</h1>
        <span style={s.headerBadge}>Admin</span>
        <button
          onClick={() => {
            sessionStorage.removeItem('admin_unlocked')
            setUnlocked(false)
          }}
          style={{
            marginLeft: 'auto',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 6,
            padding: '5px 14px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 600,
          }}
        >
          Log out
        </button>
      </div>

      <div style={s.body}>
        <AdminTabs
          tabs={TABS}
          featuredTabs={FEATURED_TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          styles={s}
        />

        <AdminTable key={activeTab} tabName={activeTab} />
      </div>
    </div>
  )
}