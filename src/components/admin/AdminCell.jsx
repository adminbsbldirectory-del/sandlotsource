import { useEffect, useState } from 'react'
import { supabase } from '../../supabase.js'

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

export default function AdminCell({
  tableName,
  record,
  field,
  onSave,
  isFeaturedTab,
  styles,
  formatFilterOption,
}) {
  const [value, setValue] = useState(record[field.key] ?? '')
  const [status, setStatus] = useState('')

  useEffect(() => {
    setValue(record[field.key] ?? '')
    setStatus('')
  }, [record, field.key])

  const tdStyle = isFeaturedTab ? styles.featuredTd : styles.td

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
    return status ? <div style={styles.smallStatus}>{status}</div> : null
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
          style={styles.dateInput}
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
          style={styles.inlineSelect}
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
          style={styles.inlineSelect}
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
          style={styles.inlineInput}
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
        style={styles.inlineInput}
      />
      {statusNode()}
    </td>
  )
}