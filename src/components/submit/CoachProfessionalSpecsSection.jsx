export default function CoachProfessionalSpecsSection({
  form,
  setField,
  g2,
  labelStyle,
  inputStyle,
  textareaStyle,
  selectStyle,
  specialtyOptions,
  toggleSpecialty,
}) {
  const credentialsMax = 140
  const bioMax = 500
  const ageGroupsMax = 60
  const priceNotesMax = 120

  return (
    <div className="form-section">
      <div className="form-section-title">2. Professional Specs</div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Specialty</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {specialtyOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleSpecialty(item)}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                border: '2px solid',
                cursor: 'pointer',
                borderColor: form.specialty.includes(item) ? 'var(--navy)' : 'var(--lgray)',
                background: form.specialty.includes(item) ? 'var(--navy)' : 'white',
                color: form.specialty.includes(item) ? 'white' : 'var(--navy)',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Credentials / Background</label>
        <input
          value={form.credentials}
          onChange={(e) => setField('credentials', e.target.value)}
          placeholder="e.g. Former MiLB pitcher, Masters in Biomechanics"
          style={inputStyle}
          maxLength={credentialsMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.credentials || '').length} / {credentialsMax}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Bio / Description</label>
        <textarea
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          rows={3}
          placeholder="Tell families about your coaching style, experience, and approach..."
          style={textareaStyle}
          maxLength={bioMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.bio || '').length} / {bioMax}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Age Groups Served</label>
          <input
            value={form.age_groups}
            onChange={(e) => setField('age_groups', e.target.value)}
            placeholder="e.g. 10U, 12U, 14U"
            style={inputStyle}
            maxLength={ageGroupsMax}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
            {(form.age_groups || '').length} / {ageGroupsMax}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Skill Level</label>
          <select
            value={form.skill_level}
            onChange={(e) => setField('skill_level', e.target.value)}
            style={selectStyle}
          >
            <option value="">All levels</option>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Elite / Travel</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 0 }}>
        <div>
          <label style={labelStyle}>Price Per Session ($)</label>
          <input
            type="number"
            min="0"
            value={form.price_per_session}
            onChange={(e) => setField('price_per_session', e.target.value)}
            placeholder="e.g. 70"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Price Notes</label>
          <input
            value={form.price_notes}
            onChange={(e) => setField('price_notes', e.target.value)}
            placeholder="e.g. Group rates available"
            style={inputStyle}
            maxLength={priceNotesMax}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
            {(form.price_notes || '').length} / {priceNotesMax}
          </div>
        </div>
      </div>
    </div>
  )
}