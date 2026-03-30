import ZipField from './ZipField.jsx'
import FacilitySearchSelect from './FacilitySearchSelect.jsx'

export default function TeamFacilitySection({
  g2,
  g3,
  linkToFacility,
  setLinkToFacility,
  selectedFacility,
  setSelectedFacility,
  showCreateFacilityForm,
  setShowCreateFacilityForm,
  newFacilityAddrStatus,
  setNewFacilityAddrStatus,
  newFacilityForm,
  setNewFacilityForm,
  setNewFacility,
  handleNewFacilityAddressBlur,
  handleNewFacilityZipGeocode,
  setError,
  labelStyle,
  inputStyle,
  selectStyle,
  RequiredMark,
  US_STATE_ABBRS,
}) {
  const facilityNameMax = 80
  const facilityAddressMax = 120
  const facilityWebsiteMax = 120
  const facilityPhoneMax = 25

  return (
    <div className="form-section">
      <div className="form-section-title">2. Primary / Home Facility</div>

      <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 14 }}>
        Does this team train or operate out of a dedicated facility? (e.g. Georgia Bombers → Grand Slam Johns Creek)
        If not, leave this unchecked — independent teams that use parks or rotate fields do not need one.
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
        <input
          type="checkbox"
          checked={linkToFacility}
          onChange={(e) => {
            const checked = e.target.checked
            setLinkToFacility(checked)
            if (!checked) {
              setSelectedFacility(null)
              setShowCreateFacilityForm(false)
              setNewFacilityAddrStatus('')
              setNewFacilityForm({
                name: '',
                address: '',
                city: '',
                state: '',
                zip_code: '',
                website: '',
                phone: '',
                lat: null,
                lng: null,
              })
            }
          }}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--navy)' }}
        />
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>
          This team is associated with a facility
        </span>
      </label>

      {linkToFacility && (
        <div>
          <label style={labelStyle}>Search for facility</label>
          <FacilitySearchSelect
            selectedFacility={selectedFacility}
            onSelect={(f) => {
              setSelectedFacility(f)
              setShowCreateFacilityForm(false)
              setError('')
            }}
            onClear={() => setSelectedFacility(null)}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedFacility(null)
                setShowCreateFacilityForm((v) => !v)
                setError('')
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1.5px solid var(--navy)',
                background: showCreateFacilityForm ? 'var(--navy)' : 'white',
                color: showCreateFacilityForm ? 'white' : 'var(--navy)',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {showCreateFacilityForm ? 'Hide New Facility Form' : "Can't find it? Add a new facility"}
            </button>
          </div>

          <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
            Existing approved facilities can be linked immediately. New facilities entered below will be created as pending and auto-linked to this team when you submit.
          </div>

          {showCreateFacilityForm && (
            <div style={{ marginTop: 14, padding: '14px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Add New Facility
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Facility Name <RequiredMark /></label>
                  <input
                    value={newFacilityForm.name}
                    onChange={(e) => setNewFacility('name', e.target.value)}
                    placeholder="e.g. Grand Slam Johns Creek"
                    style={inputStyle}
                    maxLength={facilityNameMax}
                  />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
                    {(newFacilityForm.name || '').length} / {facilityNameMax}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Facility Phone</label>
                  <input
                    value={newFacilityForm.phone}
                    onChange={(e) => setNewFacility('phone', e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                    maxLength={facilityPhoneMax}
                  />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
                    {(newFacilityForm.phone || '').length} / {facilityPhoneMax}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>
                  Facility Street Address <RequiredMark />
                  {newFacilityAddrStatus === 'locating' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#888' }}>Locating…</span>}
                  {newFacilityAddrStatus === 'found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#16a34a' }}>✓ Pin placed at address</span>}
                  {newFacilityAddrStatus === 'not_found' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>We could not place that exact address yet</span>}
                  {newFacilityAddrStatus === 'needs_location' && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 6, color: '#ea580c' }}>Enter zip or city/state first</span>}
                </label>
                <input
                  value={newFacilityForm.address}
                  onChange={(e) => setNewFacility('address', e.target.value)}
                  onBlur={handleNewFacilityAddressBlur}
                  placeholder="Required for accurate facility placement"
                  style={inputStyle}
                  maxLength={facilityAddressMax}
                />
                <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
                  {(newFacilityForm.address || '').length} / {facilityAddressMax}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: g3, gap: 12, marginBottom: 12 }}>
                <ZipField
                  value={newFacilityForm.zip_code}
                  onChange={(v) => setNewFacility('zip_code', v)}
                  onGeocode={handleNewFacilityZipGeocode}
                  required
                  hint="Enter zip first to auto-fill city and state"
                />
                <div>
                  <label style={labelStyle}>Facility City</label>
                  <input
                    value={newFacilityForm.city}
                    onChange={(e) => setNewFacility('city', e.target.value)}
                    placeholder="Auto-filled from zip"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Facility State</label>
                  <select
                    value={newFacilityForm.state}
                    onChange={(e) => setNewFacility('state', e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: g2, gap: 12 }}>
                <div>
                  <label style={labelStyle}>Facility Website</label>
                  <input
                    value={newFacilityForm.website}
                    onChange={(e) => setNewFacility('website', e.target.value)}
                    placeholder="Optional"
                    style={inputStyle}
                    maxLength={facilityWebsiteMax}
                  />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4, textAlign: 'right' }}>
                    {(newFacilityForm.website || '').length} / {facilityWebsiteMax}
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#888', alignSelf: 'end' }}>
                  This creates a pending facility record using the team contact information from Section 4.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}