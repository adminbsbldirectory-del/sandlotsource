import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'admin.bsbldirectory@gmail.com'

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label, value) {
  return `
    <tr>
      <td style="padding:8px 10px;border:1px solid #ddd;background:#f8f8f8;font-weight:700;vertical-align:top;width:180px;">
        ${esc(label)}
      </td>
      <td style="padding:8px 10px;border:1px solid #ddd;">
        ${esc(value) || '—'}
      </td>
    </tr>
  `
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    listing_type,
    submitted_name,
    address,
    city,
    state,
    zip,
    contact_name,
    contact_email,
    contact_phone,
    reason,
    timestamp,
  } = req.body || {}

  if (!listing_type || !reason) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  try {
    const subject = `🚫 Blocked ${listing_type} submit — unresolved address`

    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
        <h2 style="margin:0 0 12px;">Blocked submit: unresolved address</h2>
        <p style="margin:0 0 16px;">
          A user reached final submit, but the listing was blocked because the street address could not be confidently placed.
        </p>

        <table style="border-collapse:collapse;width:100%;max-width:760px;">
          ${row('Listing Type', listing_type)}
          ${row('Submitted Name', submitted_name)}
          ${row('Address', address)}
          ${row('City', city)}
          ${row('State', state)}
          ${row('ZIP', zip)}
          ${row('Contact Name', contact_name)}
          ${row('Contact Email', contact_email)}
          ${row('Contact Phone', contact_phone)}
          ${row('Reason for Failure', reason)}
          ${row('Timestamp', timestamp)}
        </table>
      </div>
    `

    await resend.emails.send({
      from: 'Sandlot Source <noreply@sandlotsource.com>',
      to: ADMIN_EMAIL,
      subject,
      html,
      click_tracking: false,
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('notify-blocked-geocode error:', err)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}