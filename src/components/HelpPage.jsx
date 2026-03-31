import { Link } from 'react-router-dom'

const sectionStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: '18px 18px',
}

const headingStyle = {
  fontFamily: 'var(--font-head)',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--navy)',
  margin: '0 0 10px',
}

const subheadingStyle = {
  fontSize: 11,
  fontWeight: 800,
  color: 'var(--gray)',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
}

const paragraphStyle = {
  fontSize: 14,
  lineHeight: 1.65,
  color: '#334155',
  margin: 0,
}

const faqItemStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: '14px 14px',
}

export default function HelpPage() {
  return (
    <div style={{ background: 'var(--cream)', minHeight: '100%' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '24px 14px 40px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, var(--navy) 0%, #1e3a8a 100%)',
            color: '#fff',
            borderRadius: 18,
            padding: '22px 20px',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Sandlot Source Support
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: 30,
              lineHeight: 1.05,
              fontWeight: 800,
              margin: '0 0 10px',
            }}
          >
            Help / FAQ
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, opacity: 0.95 }}>
            Sandlot Source is a community directory for coaches, teams, facilities, and roster
            connections. Use this page for claim guidance, listing updates, ownership issues, and
            general questions.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginBottom: 18,
          }}
        >
          <a href="#claims" style={{ ...sectionStyle, textDecoration: 'none' }}>
            <div style={subheadingStyle}>Claims</div>
            <div style={{ ...headingStyle, fontSize: 16, marginBottom: 6 }}>Claiming a listing</div>
            <p style={paragraphStyle}>
              Claims must start from the specific coach, team, or facility listing you want to claim.
            </p>
          </a>

          <a href="#updates" style={{ ...sectionStyle, textDecoration: 'none' }}>
            <div style={subheadingStyle}>Updates</div>
            <div style={{ ...headingStyle, fontSize: 16, marginBottom: 6 }}>Requesting a change</div>
            <p style={paragraphStyle}>
              Use update requests for contact info, tryout details, availability, or removal requests.
            </p>
          </a>

          <a href="#ownership" style={{ ...sectionStyle, textDecoration: 'none' }}>
            <div style={subheadingStyle}>Ownership</div>
            <div style={{ ...headingStyle, fontSize: 16, marginBottom: 6 }}>Disputes / edge cases</div>
            <p style={paragraphStyle}>
              Former admins, duplicate claims, or ownership disputes should be handled through support.
            </p>
          </a>

          <a href="#faq" style={{ ...sectionStyle, textDecoration: 'none' }}>
            <div style={subheadingStyle}>FAQ</div>
            <div style={{ ...headingStyle, fontSize: 16, marginBottom: 6 }}>Quick answers</div>
            <p style={paragraphStyle}>
              Short answers to the most common questions about listings, claims, and verification.
            </p>
          </a>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <section id="claims" style={sectionStyle}>
            <div style={subheadingStyle}>Claims</div>
            <h2 style={headingStyle}>How to claim a listing</h2>
            <p style={paragraphStyle}>
              Claims only work when they start from the actual listing page or profile. Browse to the
              coach, team, or facility you want, then use the claim button from that listing.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 14,
              }}
            >
              <Link to="/coaches" style={buttonStyle('navy')}>
                Browse Coaches
              </Link>
              <Link to="/teams" style={buttonStyle('navy')}>
                Browse Teams
              </Link>
              <Link to="/facilities" style={buttonStyle('navy')}>
                Browse Facilities
              </Link>
            </div>
          </section>

          <section id="updates" style={sectionStyle}>
            <div style={subheadingStyle}>Updates</div>
            <h2 style={headingStyle}>What to use an update request for</h2>
            <div style={{ display: 'grid', gap: 8 }}>
              <p style={paragraphStyle}>Request an update when you need to:</p>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: 14, lineHeight: 1.7 }}>
                <li>correct listing details</li>
                <li>update contact information</li>
                <li>change tryout status or availability</li>
                <li>mark a listing inactive</li>
                <li>request removal</li>
              </ul>
            </div>
          </section>

          <section id="ownership" style={sectionStyle}>
            <div style={subheadingStyle}>Ownership issues</div>
            <h2 style={headingStyle}>Disputes, former admins, and edge cases</h2>
            <p style={paragraphStyle}>
              If someone else claimed your listing, your organization changed admins, or a former
              coach/manager is still attached, contact support directly instead of submitting a second
              claim from scratch.
            </p>
            <div
              style={{
                marginTop: 14,
                padding: '14px 14px',
                borderRadius: 14,
                border: '1px solid #fde68a',
                background: '#fffbeb',
                color: '#92400e',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Ownership decisions and verification changes are handled manually by Sandlot Source
              admin.
            </div>
            <div style={{ marginTop: 14 }}>
              <a
                href="mailto:admin@sandlotsource.com"
                style={buttonStyle('red')}
              >
                Email Support
              </a>
            </div>
          </section>

          <section style={sectionStyle}>
            <div style={subheadingStyle}>Add vs. claim</div>
            <h2 style={headingStyle}>Can someone add a listing they do not own?</h2>
            <p style={paragraphStyle}>
              Yes. A coach, team, or facility can be submitted to the directory and remain unclaimed.
              Ownership is separate from listing creation. A true owner can later claim the listing,
              and admin can review and approve that ownership manually.
            </p>
          </section>

          <section id="faq" style={sectionStyle}>
            <div style={subheadingStyle}>FAQ</div>
            <h2 style={headingStyle}>Common questions</h2>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={faqItemStyle}>
                <div style={questionStyle}>Why can’t I submit a claim from a blank claim form?</div>
                <p style={paragraphStyle}>
                  Claims must be tied to a specific listing record so admin can review the correct coach,
                  team, or facility.
                </p>
              </div>

              <div style={faqItemStyle}>
                <div style={questionStyle}>What does Verified mean?</div>
                <p style={paragraphStyle}>
                  Verified means ownership has been reviewed and approved by admin. It does not mean
                  endorsement, ranking, or background screening.
                </p>
              </div>

              <div style={faqItemStyle}>
                <div style={questionStyle}>Can a live listing exist without an owner?</div>
                <p style={paragraphStyle}>
                  Yes. Listings can be approved and visible before a true owner claims them.
                </p>
              </div>

              <div style={faqItemStyle}>
                <div style={questionStyle}>How long do claims and updates take?</div>
                <p style={paragraphStyle}>
                  Requests are reviewed manually. Timing can vary, but support will follow up as needed.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function buttonStyle(variant = 'navy') {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    padding: '10px 14px',
    borderRadius: 12,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 800,
    fontFamily: 'var(--font-head)',
    letterSpacing: '0.03em',
    border: 'none',
    background: variant === 'red' ? 'var(--red)' : 'var(--navy)',
    color: '#fff',
  }
}

const questionStyle = {
  fontSize: 14,
  fontWeight: 800,
  color: 'var(--navy)',
  marginBottom: 6,
}