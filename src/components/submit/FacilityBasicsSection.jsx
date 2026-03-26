import ZipField from './ZipField.jsx'

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

export default function FacilityBasicsSection({
  form,
  setField,
  g2,
  g3,
  labelStyle,
  inputStyle,
  selectStyle,
  addrStatus,
  handleAddressBlur,
  handleZipGeocode,
  facilityTypeOptions,
  stateOptions,
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">1. The Basics</div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['baseball', 'softball', 'both'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setField('sport', s)}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.sport === s ? 'var(--navy)' : 'var(--lgray)',
                background: form.sport === s ? 'var(--navy)' : 'white',
                color: form.sport === s ? 'white' : 'var(--navy)',
                fontWeight: 600,
                fontSize: 13,
                textTransform: 'capitalize',
                fontFamily: 'var(--font-body)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Facility Name <RequiredMark /></label>
          <input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="e.g. Grit Academy Athletics"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            We will suggest an existing facility when the name or address looks close to one already on the site.
          </div>
        </div>

        <div>
          <label style={labelStyle}>Facility Type</label>
          <select
            value={form.facility_type}
            onChange={(e) => setField('facility_type', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select type</option>
            {facilityTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          Street Address <RequiredMark />
          {addrStatus === 'locating' && (
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>
              Locating…
            </span>
          )}
          {addrStatus === 'found' && (
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>
              ✓ Pin placed at address
            </span>
          )}
          {addrStatus === 'not_found' && (
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>
              We could not place that exact address yet
            </span>
          )}
          {addrStatus === 'needs_location' && (
            <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>
              Enter zip or city/state first
            </span>
          )}
        </label>

        <input
          value={form.address}
          onChange={(e) => setField('address', e.target.value)}
          onBlur={handleAddressBlur}
          placeholder="e.g. 5735 North Commerce Court"
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
          Enter the full street address for the most accurate facility pin possible.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 0 }}>
        <ZipField
          value={form.zip_code}
          onChange={(v) => setField('zip_code', v)}
          onGeocode={handleZipGeocode}
          required
          hint="Enter zip first to auto-fill city and state"
        />
        <div>
          <label style={labelStyle}>City</label>
          <input
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            placeholder="Auto-filled from zip"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>State</label>
          <select
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select</option>
            {stateOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}