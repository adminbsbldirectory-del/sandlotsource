import ZipField from './ZipField.jsx'
import { SPORT_OPTIONS_STANDARD } from '../../utils/sportUtils.js';

const TEAM_AGE_GROUP_OPTIONS = [
  '6U',
  '7U',
  '8U',
  '9U',
  '10U',
  '11U',
  '12U',
  '13U',
  '14U',
  '15U',
  '16U',
  '17U',
  '18U',
]

export default function TeamBasicsSection({
  g2,
  g3,
  form,
  set,
  addrStatus,
  handlePracticeAddressBlur,
  handleGeocode,
  classificationOptions,
  labelStyle,
  inputStyle,
  selectStyle,
  RequiredMark,
  US_STATE_ABBRS,
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">1. The Basics</div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Sport <RequiredMark /></label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SPORT_OPTIONS_STANDARD.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('sport', s)}
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
          <label style={labelStyle}>Team Name <RequiredMark /></label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Georgia Bombers 12U"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Organization / Affiliation</label>
          <input
            value={form.org_affiliation}
            onChange={(e) => set('org_affiliation', e.target.value)}
            placeholder="e.g. Georgia Bombers"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Classification</label>
          <select
            value={form.classification}
            onChange={(e) => set('classification', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select</option>
            {classificationOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Age Group <RequiredMark /></label>
          <select
            value={form.age_group}
            onChange={(e) => set('age_group', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select</option>
            {TEAM_AGE_GROUP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>
          Practice / Home Field Address <RequiredMark />
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
          onChange={(e) => set('address', e.target.value)}
          onBlur={handlePracticeAddressBlur}
          placeholder="Required for accurate map placement"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 0 }}>
        <ZipField
          value={form.zip_code}
          onChange={(v) => set('zip_code', v)}
          onGeocode={handleGeocode}
          required
          hint="Enter zip first to auto-fill city and state"
        />

        <div>
          <label style={labelStyle}>Practice City</label>
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="Auto-filled from zip"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Practice State</label>
          <select
            value={form.state}
            onChange={(e) => set('state', e.target.value)}
            style={selectStyle}
          >
            <option value="">Select</option>
            {US_STATE_ABBRS.map((s) => (
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