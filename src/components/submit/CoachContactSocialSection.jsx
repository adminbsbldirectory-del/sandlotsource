import SocialInput from './SocialInput.jsx'

function RequiredMark() {
  return <span style={{ color: 'var(--red)' }}> *</span>
}

export default function CoachContactSocialSection({
  form,
  setField,
  g2,
  g3,
  labelStyle,
  inputStyle,
  textareaStyle,
}) {
  const roleMax = 80
  const submissionNotesMax = 200

  return (
    <div className="form-section">
      <div className="form-section-title">3. Contact &amp; Social</div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Your Role <RequiredMark /></label>
        <input
          value={form.contact_role}
          onChange={(e) => setField('contact_role', e.target.value)}
          placeholder="e.g. Coach (self), Facility Owner, Parent submitting for coach"
          style={inputStyle}
          maxLength={roleMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
          Helps us understand your relationship to this listing
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.contact_role || '').length} / {roleMax}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>
            Email <RequiredMark /> <span style={{ fontWeight: 400, textTransform: 'none' }}>(or phone)</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="coach@example.com"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="e.g. 770-555-0100"
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

      <div style={{ marginBottom: 0 }}>
        <label style={labelStyle}>Submission Notes</label>
        <textarea
          value={form.submission_notes}
          onChange={(e) => setField('submission_notes', e.target.value)}
          rows={2}
          placeholder="Anything else we should know when reviewing this listing?"
          style={textareaStyle}
          maxLength={submissionNotesMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.submission_notes || '').length} / {submissionNotesMax}
        </div>
      </div>
    </div>
  )
}