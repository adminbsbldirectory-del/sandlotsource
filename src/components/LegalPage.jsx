import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const BORDER = '#eaeae6'
const RED = '#e63329'
const DARK = '#1a1a1a'
const MUTED = '#666'
const LIGHT = '#fafaf8'

function SectionCard({ id, title, children }) {
  return (
    <section
      id={id}
      style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '24px',
        marginBottom: 18,
        scrollMarginTop: 96,
      }}
    >
      <h2
        style={{
          margin: '0 0 14px',
          fontSize: 22,
          fontWeight: 800,
          color: DARK,
          fontFamily: 'var(--font-head)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: '#444',
        }}
      >
        {children}
      </div>
    </section>
  )
}

function MiniNav() {
  const links = [
    { id: 'about', label: 'About' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'terms', label: 'Terms of Use' },
    { id: 'disclaimer', label: 'Disclaimer' },
  ]

  return (
    <div
      style={{
        position: 'sticky',
        top: 72,
        zIndex: 20,
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 18,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          style={{
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 700,
            color: DARK,
            background: LIGHT,
            border: `1px solid ${BORDER}`,
            borderRadius: 999,
            padding: '7px 12px',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '8px 0 16px 20px', padding: 0 }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function LegalPage() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 0)
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
  }, [location])

  return (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        padding: '24px 20px 48px',
      }}
    >
      <div
        style={{
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderTop: `4px solid ${RED}`,
          borderRadius: 14,
          padding: '24px',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: RED,
            marginBottom: 8,
          }}
        >
          Sandlot Source
        </div>
        <h1
          style={{
            margin: '0 0 10px',
            fontSize: 30,
            fontWeight: 800,
            color: DARK,
            fontFamily: 'var(--font-head)',
          }}
        >
          About, Privacy, Terms, and Disclaimer
        </h1>
        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          Last updated: March 16, 2026
        </div>
      </div>

      <MiniNav />

      <SectionCard id="about" title="About Sandlot Source">
        <p style={{ marginTop: 0 }}>
          Sandlot Source was built to make youth baseball and softball connections easier.
          The goal is simple: help families, players, coaches, and teams find each other
          faster without having to bounce across scattered Facebook posts, old spreadsheets,
          message threads, and word-of-mouth leads.
        </p>

        <p>
          The platform brings together coach listings, team listings, facilities, open roster
          spots, and pickup player needs in one place so people can search more quickly and
          act on real opportunities.
        </p>

        <p>
          This site started with a practical need: there was no clean, centralized place to
          discover local travel ball resources, especially when timing matters and families
          need information fast.
        </p>

        <p>
          Sandlot Source is designed to be useful first. Over time, the platform may grow to
          include stronger search filters, claimed listings, premium placement options,
          alert-based features, and broader geographic coverage. The focus, though, stays the
          same: make the youth baseball and softball community easier to navigate.
        </p>

        <p>
          At its core, Sandlot Source is meant to be practical, easy to use, and grounded in
          real community needs.
        </p>

        <div
          style={{
            marginTop: 18,
            background: LIGHT,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: DARK,
              marginBottom: 8,
            }}
          >
            Safety First
          </div>
          <p style={{ margin: 0 }}>
            Sandlot Source helps families, coaches, teams, and players connect, but users are
            responsible for their own screening and decision-making. Always verify credentials,
            references, fit, scheduling details, payment terms, and safety before participating
            in any lesson, roster opportunity, team arrangement, or event.
          </p>
        </div>
      </SectionCard>

      <SectionCard id="privacy" title="Privacy Policy">
        <p style={{ marginTop: 0 }}>
          Sandlot Source values your privacy. This Privacy Policy explains what information
          we may collect through the website, how we use it, and the choices available to users.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>1. Information We May Collect</h3>
        <BulletList
          items={[
            'Information you provide directly, such as your name, email address, phone number, city, state, team name, organization name, sport, age group, listing details, and any other information you choose to submit through forms, listings, contact fields, or claim requests.',
            'Listing content you choose to publish, including profile information, roster needs, team details, facility details, coach descriptions, and similar public-facing submission content.',
            'Technical information collected automatically through website tools, such as device type, browser type, IP address, page views, referring pages, approximate location data, and related usage information.',
            'Cookie or similar tracking data, if used for analytics, site performance, spam prevention, advertising, or future site functionality.',
          ]}
        />

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>2. How We Use Information</h3>
        <BulletList
          items={[
            'To operate, improve, and maintain the website and its directory features.',
            'To review, publish, edit, verify listing ownership, update, reject, or remove submitted listings.',
            'To respond to inquiries, support requests, listing claims, correction requests, and community reports.',
            'To communicate about listings, site updates, policy updates, or platform-related notices.',
            'To understand how visitors use the site and improve the user experience.',
            'To help protect the site against spam, abuse, fraud, bots, or misuse.',
          ]}
        />

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>3. Public Listings</h3>
        <p>
          Information submitted for a public listing may be visible to other users of the site.
          By submitting listing content, you understand that certain profile details may be
          displayed publicly as part of the directory or related search features.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>4. Information Sharing</h3>
        <p>
          Sandlot Source does not sell personal information to third parties for their own
          independent marketing use.
        </p>
        <p>
          Information may be shared with service providers or tools used to operate the website,
          such as hosting providers, analytics tools, database tools, spam prevention tools, or
          form processing services.
        </p>
        <p>
          Information may also be disclosed if required by law, legal process, or to protect the
          rights, safety, or integrity of the site or others.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>5. Cookies and Analytics</h3>
        <p>
          The site may use cookies, analytics, or similar technologies to understand traffic,
          measure usage, improve performance, prevent abuse, and support future advertising or
          promotional functionality. Users can generally manage cookie preferences through their
          browser settings.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>6. Data Retention</h3>
        <p>
          Sandlot Source may retain submitted information for as long as reasonably necessary to
          operate the website, maintain listings, resolve disputes, comply with legal obligations,
          or protect the platform.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>7. Third-Party Links</h3>
        <p>
          The website may contain links to third-party websites, social media pages, registration
          systems, team sites, scheduling tools, or external platforms. Sandlot Source is not
          responsible for the privacy practices or content of those third parties.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>8. Children&apos;s Privacy</h3>
        <p>
          Sandlot Source is intended as an informational platform for parents, guardians, coaches,
          teams, and organizations. It is not intended for children to independently submit
          personal information.
        </p>
        <p>
          Sandlot Source does not knowingly collect personal information directly from children
          under 13 and intends to operate in a manner consistent with the Children&apos;s Online
          Privacy Protection Act (COPPA). If we learn that information from a child under 13 has
          been submitted without appropriate parental involvement, we may delete that information.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>9. Your Choices</h3>
        <p>
          You may contact Sandlot Source to request an update, correction, or removal of your
          submitted listing information, subject to operational, legal, or recordkeeping needs.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>10. Changes to This Policy</h3>
        <p>
          Sandlot Source may update this Privacy Policy from time to time. Continued use of the
          site after updates are posted may constitute acceptance of the updated policy.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>11. Contact</h3>
        <p style={{ marginBottom: 0 }}>
          For privacy-related questions or requests, users may contact Sandlot Source through the
          website contact form or the published contact method on the website.
        </p>
      </SectionCard>

      <SectionCard id="terms" title="Terms of Use">
        <p style={{ marginTop: 0 }}>
          These Terms of Use govern access to and use of Sandlot Source. By using the site,
          you agree to these Terms. If you do not agree, do not use the site.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>1. Nature of the Site</h3>
        <p>
          Sandlot Source is an informational directory and listing platform for baseball and
          softball coaches, teams, facilities, open rosters, and related connections.
        </p>
        <p>
          The site organizes and displays information and is not a party to any private
          arrangement, lesson, payment, event, team placement, service, or other transaction
          between users.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>2. No Guarantee of Accuracy or Availability</h3>
        <p>
          Listings, openings, and profile details may be submitted by third parties and may
          change at any time.
        </p>
        <p>
          Sandlot Source does not guarantee that any listing is complete, accurate, current,
          available, safe, verified, or suitable for any particular purpose.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>3. User Responsibility and Independent Screening</h3>
        <p>
          Users are responsible for independently evaluating coaches, teams, facilities,
          organizations, events, and opportunities before contacting, hiring, joining, attending,
          paying, traveling, or participating.
        </p>
        <p>
          Parents and guardians are responsible for their own due diligence regarding safety, fit,
          qualifications, scheduling, pricing, references, and background.
        </p>
        <p>
          Sandlot Source does not conduct criminal background checks, sex offender registry
          checks, identity verification, credential validation, or safety reviews of coaches,
          teams, organizations, or other users unless expressly stated in writing for a specific
          feature.
        </p>
        <p>
          Users assume all risk regarding the safety, conduct, quality, legality, legitimacy, and
          character of individuals or organizations they encounter through the platform.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>4. Listing Submissions and Claims</h3>
        <p>
          By submitting or claiming a listing, you represent that the information provided is
          accurate to the best of your knowledge and that you have the right to submit it.
        </p>
        <p>
          You agree not to submit false, misleading, defamatory, infringing, unauthorized, unsafe,
          or unlawful content.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>5. Badges, Featured Placement, and No Endorsement</h3>
        <p>
          A featured, premium, claimed, sponsored, or otherwise highlighted listing reflects only
          the site feature described for that designation and does not, by itself, mean Sandlot
          Source has screened, endorsed, recommended, background-checked, or approved that listing.
        </p>
        <p>
          If Sandlot Source later offers any verification-related feature, the meaning and limits
          of that feature will be defined separately.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>6. Right to Edit, Reject, or Remove Content</h3>
        <p>
          Sandlot Source may review, edit, reject, suspend, unpublish, or remove any listing or
          submission at any time, with or without notice, including where content appears
          inaccurate, incomplete, misleading, harmful, unsafe, inappropriate, infringing, spammy,
          or inconsistent with platform standards.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>7. Acceptable Use</h3>
        <p>
          You agree not to use the site for unlawful, abusive, fraudulent, harmful, or misleading
          purposes.
        </p>
        <p>
          You agree not to use any robot, spider, scraper, crawler, site search or retrieval
          application, data mining tool, automated script, or similar device or process to
          retrieve, index, copy, harvest, monitor, mirror, or reuse any portion of the site,
          except as expressly authorized in writing.
        </p>
        <p>
          You agree not to interfere with site operations, security, functionality, or the
          experience of other users.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>8. Intellectual Property</h3>
        <p>
          The Sandlot Source name, branding, site design, and original content created by the site
          owner are protected by applicable intellectual property laws.
        </p>
        <p>
          Users may not reproduce, republish, distribute, or exploit site materials except as
          allowed by law or with permission.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>9. Third-Party Content and Links</h3>
        <p>
          The site may include third-party listings, external links, social profiles, or business
          references. Sandlot Source does not control those third parties and is not responsible
          for their actions, content, offerings, or policies.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>10. Financial Transactions and No Payment Responsibility</h3>
        <p>
          Sandlot Source does not process, hold, guarantee, refund, or recover payments between
          users unless expressly stated for a future feature.
        </p>
        <p>
          Sandlot Source is not responsible for any financial loss, including unpaid team fees,
          missed tournament refunds, coaching deposits, chargebacks, private payment disputes,
          cancellations, travel costs, or other off-platform transaction issues.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>11. Limitation of Liability</h3>
        <p>
          To the fullest extent permitted by law, Sandlot Source is not liable for any loss,
          injury, claim, damage, dispute, delay, cost, or expense arising from use of the website,
          reliance on a listing, interaction with another user, participation in an activity, or
          any off-platform arrangement or transaction.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>12. Indemnification</h3>
        <p>
          You agree to indemnify and hold harmless Sandlot Source and its owner from claims,
          liabilities, damages, and expenses arising from your use of the site, your submissions,
          your conduct, or your violation of these Terms.
        </p>
        <p>
          If you are a parent or guardian using the site on behalf of a minor, you also agree to
          indemnify and hold harmless Sandlot Source for claims brought by or on behalf of that
          minor arising from an activity, arrangement, lesson, event, team placement, or
          interaction connected to the site.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>13. Dispute Handling</h3>
        <p>
          To the fullest extent permitted by law, any dispute relating to the site should be
          brought only on an individual basis and not as part of a class, collective, or
          representative action. Users are encouraged to contact Sandlot Source first in an effort
          to resolve concerns informally.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>14. Changes to the Terms</h3>
        <p>
          Sandlot Source may revise these Terms of Use from time to time. Continued use of the
          site after revised Terms are posted may constitute acceptance of the updated Terms.
        </p>

        <h3 style={{ margin: '18px 0 8px', color: DARK }}>15. Contact</h3>
        <p style={{ marginBottom: 0 }}>
          Questions about these Terms may be submitted through the site contact form or the
          published contact method on the website.
        </p>
      </SectionCard>

      <SectionCard id="disclaimer" title="Disclaimer">
        <p style={{ marginTop: 0 }}>
          Sandlot Source is provided for general informational and connection purposes only.
        </p>
        <p>
          Sandlot Source is a directory and listing platform and is not a coach, team operator,
          facility operator, travel organization, employer, tournament host, payment processor, or
          safety screening service.
        </p>
        <p>
          Listings and opportunities may be submitted by third parties. Sandlot Source does not
          independently verify every listing, credential, coach claim, roster opening,
          organization, age group, availability, pricing detail, or user-submitted statement.
        </p>
        <p>
          Sandlot Source does not conduct criminal background checks, sex offender registry
          checks, identity verification, credential validation, or safety reviews unless expressly
          stated in writing for a specific feature.
        </p>
        <p>
          Sandlot Source does not guarantee safety, availability, quality, legitimacy, skill
          level, playing time, instruction quality, financial reliability, roster placement, or
          outcomes of any kind.
        </p>
        <p>
          Sandlot Source is not responsible for any financial loss, including but not limited to
          unpaid team fees, missed tournament refunds, coaching deposits, travel costs,
          cancellations, or private payment disputes between users.
        </p>
        <p>
          Any decision to contact, hire, join, attend, register with, travel to, pay, or
          participate with a coach, team, facility, organization, or event found through the site
          is made solely at the user&apos;s own risk.
        </p>
        <p>
          Parents, guardians, and users should conduct their own due diligence before relying on
          any listing or entering into any arrangement connected to the site.
        </p>
        <p>
          The site may include third-party links or references for convenience only. Sandlot
          Source is not responsible for those outside services, sites, or organizations.
        </p>
        <p style={{ marginBottom: 0 }}>
          To the fullest extent permitted by law, use of the website is at your own risk.
        </p>
      </SectionCard>
    </div>
  )
}
