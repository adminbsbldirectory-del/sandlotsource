export default function TeamTryoutInfoSection({
  form,
  setField,
  g2,
  labelStyle,
  selectStyle,
  inputStyle,
  textareaStyle,
}) {
  const tryoutNotesMax = 160
  const teamDescriptionMax = 500

  return (
    <div className="form-section">
      <div className="form-section-title">3. Tryout Info</div>

      <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Tryout Status</label>
          <select
            value={form.tryout_status}
            onChange={(e) => setField('tryout_status', e.target.value)}
            style={selectStyle}
          >
            <option value="closed">Closed / Unknown</option>
            <option value="open">Open</option>
            <option value="year_round">Year Round</option>
            <option value="by_invite">By Invite Only</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Tryout Date</label>
          <input
            type="date"
            value={form.tryout_date}
            onChange={(e) => setField('tryout_date', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Tryout Notes</label>
        <input
          value={form.tryout_notes}
          onChange={(e) => setField('tryout_notes', e.target.value)}
          placeholder="e.g. Bring your own helmet. Arrive 15 min early."
          style={inputStyle}
          maxLength={tryoutNotesMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.tryout_notes || '').length} / {tryoutNotesMax}
        </div>
      </div>

      <div style={{ marginBottom: 0 }}>
        <label style={labelStyle}>Team Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          rows={3}
          placeholder="Tell players and families about your program..."
          style={textareaStyle}
          maxLength={teamDescriptionMax}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
          {(form.description || '').length} / {teamDescriptionMax}
        </div>
      </div>
    </div>
  )
}