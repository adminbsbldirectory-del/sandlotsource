export default function FacilityAmenitiesDetailsSection({
  form,
  setField,
  amenityOptions,
  toggleAmenity,
  labelStyle,
  inputStyle,
  textareaStyle,
}) {
  const descriptionMax = 500
  const hoursMax = 120

  return (
    <div className="form-section">
      <div className="form-section-title">2. Amenities &amp; Details</div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Amenities / Features</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {amenityOptions.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAmenity(a)}
              style={{
                padding: '5px 12px',
                borderRadius: 20,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.amenities.includes(a) ? 'var(--navy)' : 'var(--lgray)',
                background: form.amenities.includes(a) ? 'var(--navy)' : 'white',
                color: form.amenities.includes(a) ? 'white' : 'var(--navy)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
          placeholder="Tell families what makes your facility special..."
          style={textareaStyle}
          maxLength={descriptionMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.description || '').length} / {descriptionMax}
        </div>
      </div>

      <div style={{ marginBottom: 0 }}>
        <label style={labelStyle}>Hours of Operation</label>
        <input
          value={form.hours}
          onChange={(e) => setField('hours', e.target.value)}
          placeholder="e.g. Mon-Fri 4-9pm, Sat 8am-5pm"
          style={inputStyle}
          maxLength={hoursMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.hours || '').length} / {hoursMax}
        </div>
      </div>
    </div>
  )
}