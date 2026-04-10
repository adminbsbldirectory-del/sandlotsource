// api/notify-admin.js
// Supabase webhook calls this when a new row is inserted into any watched table.
// It generates a secure token and sends a formatted approval email to the admin.

import crypto from 'crypto';
import { Resend } from 'resend';
import {
  coachEmail,
  teamEmail,
  playerBoardEmail,
  facilityEmail,
  claimEmail,
  reviewEmail,
  advertiserInquiryEmail,
} from '../lib/emailTemplates.js';
import { findDuplicates } from '../lib/duplicateCheck.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = 'admin.bsbldirectory@gmail.com';

// Injects Latitude / Longitude / Geocode Source rows before the last </table> in the
// email HTML. Guard at the top ensures this is a true no-op when the rows are already
// present (detects the exact closing-tag pattern that makeRow produces).
// Using lastIndexOf guarantees we target the main data table, not any header/banner table.
function injectCoordRows(html, record) {
  if (html.includes('>Latitude</td>')) return html;
  const cell = (content, extra = '') =>
    `<td style="padding:8px 12px;${extra}border-bottom:1px solid #f3f4f6;">${content}</td>`;
  const makeRow = (label, value) =>
    `<tr>${cell(label, 'font-weight:600;color:#374151;width:180px;vertical-align:top;')}${cell(value != null ? String(value) : 'Not resolved')}</tr>`;
  const rows =
    makeRow('Latitude', record.lat) +
    makeRow('Longitude', record.lng) +
    makeRow('Geocode Source', record.geocode_source ?? null);
  const lastClose = html.lastIndexOf('</table>');
  if (lastClose === -1) return html + rows;
  return html.slice(0, lastClose) + rows + html.slice(lastClose);
}

function generateToken(table, id) {
  return crypto
    .createHmac('sha256', process.env.APPROVAL_SECRET)
    .update(`${table}:${id}`)
    .digest('hex');
}

const templateMap = {
  coaches: coachEmail,
  travel_teams: teamEmail,
  player_board: playerBoardEmail,
  facilities: facilityEmail,
  claim_requests: claimEmail,
  reviews: reviewEmail,
  advertiser_inquiries: advertiserInquiryEmail,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supabase webhooks send: { type, table, record, schema, old_record }
  const { table, record } = req.body;

  if (!table || !record) {
    return res.status(400).json({ error: 'Missing table or record' });
  }

  if (table !== 'reviews' && !record?.id) {
    return res.status(400).json({ error: 'Missing record id' });
  }

  const buildEmail = templateMap[table];
  if (!buildEmail) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const token = record?.id ? generateToken(table, record.id) : null;

    // Run duplicate check only for listing-style submissions — never blocks the email even if it fails
    const duplicates = ['coaches', 'travel_teams', 'player_board', 'facilities'].includes(table)
      ? await findDuplicates(table, record)
      : [];

    // Build email, passing duplicate results in so the banner renders
    let { subject, html } = buildEmail(record, token, duplicates);

    const GEO_REVIEW_TABLES = ['coaches', 'travel_teams', 'facilities'];

    // Always inject coordinate rows for geo-table emails. The helper uses lastIndexOf
    // so it reliably targets the main data table even when a duplicate banner is present.
    if (GEO_REVIEW_TABLES.includes(table)) {
      html = injectCoordRows(html, record);
    }

    // Debug: log the exact keys and geocode-related fields from the webhook payload so
    // we can confirm whether approval_status / geocode_source arrive from Supabase.
    // Check Vercel function logs after the next test submission to diagnose missing prefix.
    console.log(
      '[notify-admin] record keys:', JSON.stringify(Object.keys(record)),
      '| approval_status:', record.approval_status,
      '| geocode_source:', record.geocode_source,
      '| address:', record.address,
      '| lat:', record.lat,
      '| lng:', record.lng,
    );

    // Two synchronous signals are sufficient — the zippopotam.us async fallback was
    // removed because it added latency and both DB fields are confirmed saving correctly.
    // Gated on record.address != null so ordinary zip-only listings are never flagged.
    const needsGeocodeReview =
      GEO_REVIEW_TABLES.includes(table) &&
      record.address != null &&
      (
        record.approval_status === 'geocode_review' ||
        record.geocode_source === 'zip'
      );

    // Prepend warning to subject line so it stands out immediately in your inbox
    let finalSubject = subject;
    if (needsGeocodeReview) {
      finalSubject = `📍 GEOCODE REVIEW NEEDED — ${finalSubject}`;
    }
    if (duplicates.length > 0) {
      finalSubject = `⚠️ POSSIBLE DUPLICATE — ${finalSubject}`;
    }

    await resend.emails.send({
      from: 'Sandlot Source <noreply@sandlotsource.com>',
      to: ADMIN_EMAIL,
      subject: finalSubject,
      html,
      click_tracking: false,
    });

    return res.status(200).json({ ok: true, duplicatesFound: duplicates.length });
  } catch (err) {
    console.error('notify-admin error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}