import { useState } from 'react'
import { supabase } from '../supabase'

const BORDER = '#eaeae6'
const RED = '#D42B2B'
const DARK = '#1a1a1a'
const MUTED = '#666'
const LIGHT = '#fafaf8'
const NAVY = '#0B1F3A'

function SectionCard({ title, children }) {
  return (
    <section
      style={{
        background: '#fff',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: '24px',
        marginBottom: 18,
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
          fontSize: 15,
          lineHeight: 1.7,
          color: '#444',
        }}
      >
        {children}
      </div>
    </section>
  )
}

function BulletList({ items }) {
  return (
    <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
      {items.map((item, idx) => (
        <li key={idx} style={{ marginBottom: 8 }}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SpecCard({ title, size, details }) {
  return (
    <div
      style={{
        background: LIGHT,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 18,
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
        {title}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: DARK,
          marginBottom: 8,
          fontFamily: 'var(--font-head)',
        }}
      >
        {size}
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: MUTED,
        }}
      >
        {details}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, required = false, type = 'text' }) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: DARK,
          marginBottom: 6,
        }}
      >
        {label}
        {required ? ' *' : ''}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: '100%',
          minHeight: 44,
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          padding: '10px 12px',
          fontSize: 14,
          color: DARK,
          background: '#fff',
          boxSizing: 'border-box',
        }}
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: DARK,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          minHeight: 44,
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          padding: '10px 12px',
          fontSize: 14,
          color: DARK,
          background: '#fff',
          boxSizing: 'border-box',
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option || 'Select one'}
          </option>
        ))}
      </select>
    </label>
  )
}

function TextAreaField({ label, value, onChange, rows = 4 }) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: DARK,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          width: '100%',
          borderRadius: 10,
          border: `1px solid ${BORDER}`,
          padding: '10px 12px',
          fontSize: 14,
          lineHeight: 1.6,
          color: DARK,
          background: '#fff',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
    </label>
  )
}

const initialForm = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  website: '',
  cityState: '',
  placementInterest: '',
  targetGeography: '',
  description: '',
  notes: '',
}

export default function AdvertisePage() {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (submitting) return

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    const payload = {
      business_name: form.businessName.trim(),
      contact_name: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      website_url: form.website.trim() || null,
      business_city_state: form.cityState.trim() || null,
      placement_interest: form.placementInterest || null,
      target_geography: form.targetGeography.trim() || null,
      business_description: form.description.trim() || null,
      notes_goals: form.notes.trim() || null,
    }

    const { error } = await supabase
      .from('advertiser_inquiries')
      .insert([payload])

    if (error) {
      console.error('Advertiser inquiry submit error:', error)
      setSubmitError('Something went wrong while sending your inquiry. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitSuccess(true)
    setForm(initialForm)
    setSubmitting(false)
  }

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
          Advertise with Sandlot Source
        </h1>

        <div
          style={{
            fontSize: 16,
            lineHeight: 1.7,
            color: '#444',
            maxWidth: 760,
            marginBottom: 18,
          }}
        >
          Sandlot Source connects advertisers with the families, coaches, and organizations actively
          building youth baseball and softball programs. If your business serves this community,
          this is where to start.
        </div>

        <a
          href="#advertise-form"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 44,
            padding: '12px 18px',
            borderRadius: 10,
            background: NAVY,
            color: '#fff',
            textDecoration: 'none',
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '0.03em',
          }}
        >
          Request information
        </a>
      </div>

      <SectionCard title="Why advertise">
        <p style={{ marginTop: 0 }}>
          Sandlot Source is built around discovery — coaches, teams, facilities, roster openings,
          and player needs. Every visitor is here because they&apos;re looking for something specific
          to youth baseball or softball. That makes placements here more relevant than general
          local display advertising.
        </p>

        <BulletList
          items={[
            'Reach families actively looking for baseball and softball resources.',
            'Appear alongside coaches, teams, facilities, roster opportunities, and player needs.',
            'Support a launch-stage platform designed specifically for the youth baseball and softball community.',
            'Create local or regional visibility without needing a large national media buy.',
          ]}
        />
      </SectionCard>

      <SectionCard title="Available opportunities">
        <p style={{ marginTop: 0 }}>
          Placements are built around the pages where your audience is already browsing.
          Recommendations are tailored to your business type, target geography, and goals.
        </p>

        <BulletList
          items={[
            'Homepage visibility',
            'Directory page placements',
            'Section-specific sponsored exposure',
            'Launch partner opportunities for relevant baseball and softball businesses',
          ]}
        />
      </SectionCard>

      <SectionCard title="Creative specs">
        <p style={{ marginTop: 0 }}>
          Keep creative clean and easy to read. If you don&apos;t have finished ad artwork yet,
          you can still submit — your logo, website, and a short description of your business is
          enough to get started.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
            marginTop: 16,
          }}
        >
          <SpecCard
            title="Desktop leaderboard"
            size="970 × 90"
            details="Best for top or footer-style horizontal placements."
          />
          <SpecCard
            title="Desktop inline"
            size="970 × 250"
            details="Best for larger in-content visibility on desktop."
          />
          <SpecCard
            title="Mobile banner"
            size="320 × 100"
            details="Best for mobile-friendly placements with simple, legible messaging."
          />
        </div>

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
            Submission basics
          </div>
          <BulletList
            items={[
              'Preferred file types: JPG, PNG, or WebP',
              'Include a destination URL if the ad should be clickable',
              'Keep text readable on mobile',
              'If no creative is ready yet, submit your logo, website, and a short business summary',
            ]}
          />
        </div>
      </SectionCard>

      <SectionCard title="Launch packages">
        <p style={{ marginTop: 0, marginBottom: 0 }}>
          Introductory packages are available on request. Pricing is flexible during early rollout
          so we can match placements to your audience and goals before locking in a rate.
        </p>
      </SectionCard>

      <section
        id="advertise-form"
        style={{
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: '24px',
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
          Advertiser inquiry
        </h2>

        <p
          style={{
            margin: '0 0 18px',
            fontSize: 14,
            lineHeight: 1.7,
            color: MUTED,
          }}
        >
          Fill out the form below and we&apos;ll follow up with placement options, pricing, and
          next steps.
        </p>

        {submitError && (
          <div
            style={{
              marginBottom: 16,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #efc2c2',
              background: '#fff5f5',
              color: '#a12626',
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
            }}
          >
            <Field
              label="Business name"
              value={form.businessName}
              onChange={(value) => updateField('businessName', value)}
              required
            />
            <Field
              label="Contact name"
              value={form.contactName}
              onChange={(value) => updateField('contactName', value)}
              required
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => updateField('email', value)}
              required
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(value) => updateField('phone', value)}
            />
            <Field
              label="Website / landing page"
              value={form.website}
              onChange={(value) => updateField('website', value)}
            />
            <Field
              label="Business city / state"
              value={form.cityState}
              onChange={(value) => updateField('cityState', value)}
            />

            <SelectField
              label="Placement interest"
              value={form.placementInterest}
              onChange={(value) => updateField('placementInterest', value)}
              options={[
                '',
                'Homepage',
                'Coaches',
                'Teams',
                'Facilities',
                'Player board / roster',
                'Not sure yet',
              ]}
            />

            <Field
              label="Target geography"
              value={form.targetGeography}
              onChange={(value) => updateField('targetGeography', value)}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <TextAreaField
              label="Business description"
              value={form.description}
              onChange={(value) => updateField('description', value)}
              rows={4}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <TextAreaField
              label="Notes / goals"
              value={form.notes}
              onChange={(value) => updateField('notes', value)}
              rows={4}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: DARK,
                marginBottom: 6,
              }}
            >
              Creative upload
            </div>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${BORDER}`,
                background: LIGHT,
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.6,
              }}
            >
              Creative upload is not enabled yet. You can submit your inquiry now and share creative afterward.
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                minHeight: 44,
                padding: '10px 16px',
                borderRadius: 10,
                border: 'none',
                background: submitting ? '#cc6b6b' : RED,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                letterSpacing: '0.03em',
                opacity: submitting ? 0.85 : 1,
              }}
            >
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </div>

          {submitSuccess && (
            <div
                style={{
                marginTop: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #b7dfc6',
                background: '#f3fbf6',
                color: '#1f6b3d',
                fontSize: 14,
                lineHeight: 1.6,
                }}
            >
                Thanks for your interest. Your inquiry has been sent, and we&apos;ll follow up with placement
                options, pricing, and next steps.
            </div>
            )}

        </form>
      </section>
    </div>
  )
}