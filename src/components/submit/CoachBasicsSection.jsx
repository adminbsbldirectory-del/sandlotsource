import ZipField from './ZipField.jsx'
import { SPORT_OPTIONS_WITH_BOTH } from '../../utils/sportUtils.js';

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

export default function CoachBasicsSection({
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
  stateOptions,
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">1. The Basics</div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SPORT_OPTIONS_WITH_BOTH.map((s) => (
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
          <label style={labelStyle}>Coach / Trainer Name <RequiredMark /></label>
          <input
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Full name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Facility / Business Name</label>
          <input
            value={form.facility_name}
            onChange={(e) => setField('facility_name', e.target.value)}
            placeholder="Optional — e.g. El Dojo, GrandSlam"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            Optional. Enter your business or home facility name and we will suggest an existing facility if one looks like a match.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          Street Address
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
              We could not place that address — fix it or clear it to use a zip-area pin
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
          placeholder="Optional street address for more accurate map placement"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
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