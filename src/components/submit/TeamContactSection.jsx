function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

export default function TeamContactSection({
  form,
  setField,
  g2,
  g3,
  labelStyle,
  inputStyle,
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">4. Contact</div>

      <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Contact Name <RequiredMark /></label>
          <input
            value={form.contact_name}
            onChange={(e) => setField('contact_name', e.target.value)}
            placeholder="Full name"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            Contact Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span>
          </label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => setField('contact_email', e.target.value)}
            placeholder="coach@example.com"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Contact Phone</label>
          <input
            type="tel"
            value={form.contact_phone}
            onChange={(e) => setField('contact_phone', e.target.value)}
            placeholder="770-555-0100"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 0 }}>
        <div>
          <label style={labelStyle}>Website</label>
          <input
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Submission Notes</label>
          <input
            value={form.submission_notes}
            onChange={(e) => setField('submission_notes', e.target.value)}
            placeholder="Anything else we should know?"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}