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

// Returns true when the record's lat/lng match the zip centroid from zippopotam.us
// within a tight tolerance (~5m), indicating we fell back to zip-level geocoding.
async function isZipCentroidFallback(record) {
  const lat = record.lat != null ? parseFloat(record.lat) : NaN;
  const lng = record.lng != null ? parseFloat(record.lng) : NaN;
  const zip = record.zip || record.zip_code;
  if (!isFinite(lat) || !isFinite(lng) || !zip) return false;
  const cleanZip = String(zip).replace(/\D/g, '').slice(0, 5);
  if (cleanZip.length !== 5) return false;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    if (!res.ok) return false;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return false;
    const zipLat = parseFloat(place.latitude);
    const zipLng = parseFloat(place.longitude);
    return Math.abs(lat - zipLat) < 0.00005 && Math.abs(lng - zipLng) < 0.00005;
  } catch { return false; }
}

// Injects Latitude / Longitude / Geocode Source rows when the deployed
// emailTemplates.js predates Session 3 and those rows are absent from the HTML.
function injectCoordRows(html, record) {
  if (html.includes('>Latitude<')) return html;
  const cell = (content, extra = '') =>
    `<td style="padding:8px 12px;${extra}border-bottom:1px solid #f3f4f6;">${content}</td>`;
  const makeRow = (label, value) =>
    `<tr>${cell(label, 'font-weight:600;color:#374151;width:180px;vertical-align:top;')}${cell(value != null ? String(value) : 'Not resolved')}</tr>`;
  const rows =
    makeRow('Latitude', record.lat) +
    makeRow('Longitude', record.lng) +
    makeRow('Geocode Source', record.geocode_source ?? null);
  return html.replace('</table>', rows + '</table>');
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

    // Inject coordinate rows when the deployed emailTemplates.js predates Session 3
    // (those rows will be absent from the HTML entirely rather than showing "Not resolved").
    const GEO_REVIEW_TABLES = ['coaches', 'travel_teams', 'facilities'];
    if (GEO_REVIEW_TABLES.includes(table)) {
      html = injectCoordRows(html, record);
    }

    // Detect geocode_review records via three independent signals — any one is sufficient.
    // Signal 1: approval_status field (set by Session 9 submit logic).
    // Signal 2: geocode_source field (may be absent if DB column was added after the
    //           webhook schema was cached — PostgREST silently drops unknown columns).
    // Signal 3: coordinate match against zippopotam.us centroid — the definitive
    //           fallback when both DB fields are missing from the webhook payload.
    // All three are gated on record.address != null so ordinary zip-only listings
    // (which intentionally have no street address) are never flagged.
    const needsGeocodeReview =
      GEO_REVIEW_TABLES.includes(table) &&
      record.address != null &&
      (
        record.approval_status === 'geocode_review' ||
        record.geocode_source === 'zip' ||
        await isZipCentroidFallback(record)
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