import SocialInput from './SocialInput.jsx'

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

export default function FacilityContactSection({
  form,
  setField,
  g2,
  g3,
  labelStyle,
  inputStyle,
}) {
  return (
    <div className="form-section">
      <div className="form-section-title">3. Contact</div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Facility Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="770-555-0100"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Facility Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="info@facility.com"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 14 }}>
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
          <label style={labelStyle}>Instagram</label>
          <SocialInput
            prefix="@"
            value={form.instagram}
            onChange={(v) => setField('instagram', v)}
            placeholder="handle"
          />
        </div>
        <div>
          <label style={labelStyle}>Facebook</label>
          <SocialInput
            prefix="facebook.com/"
            value={form.facebook}
            onChange={(v) => setField('facebook', v)}
            placeholder="page name"
          />
        </div>
      </div>

      <div style={{ background: '#f8f9fa', borderRadius: 8, padding: '14px', border: '1px solid var(--lgray)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Your Contact Info (not public)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12 }}>
          <div>
            <label style={labelStyle}>Your Name <RequiredMark /></label>
            <input
              value={form.contact_name}
              onChange={(e) => setField('contact_name', e.target.value)}
              placeholder="Full name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Your Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span></label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setField('contact_email', e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Your Phone</label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => setField('contact_phone', e.target.value)}
              placeholder="770-555-0100"
              style={inputStyle}
            />
          </div>
        </div>
      </div>
    </div>
  )
}