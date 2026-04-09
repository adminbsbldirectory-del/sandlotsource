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
    const { subject, html } = buildEmail(record, token, duplicates);

    // Detect geocode_review records. The primary signal is approval_status, but if
    // a DB-level DEFAULT or CHECK constraint coerces the value back to 'pending'
    // before the webhook fires, fall back to geocode_source + address: the
    // zip-centroid fallback path (Session 9) is the only path that stores
    // geocode_source='zip' when a street address was also provided.
    // Regular no-address zip fallbacks always have address=null, so the
    // compound check is unambiguous.
    const GEO_REVIEW_TABLES = ['coaches', 'travel_teams', 'facilities'];
    const needsGeocodeReview =
      GEO_REVIEW_TABLES.includes(table) &&
      (
        record.approval_status === 'geocode_review' ||
        (record.geocode_source === 'zip' && record.address != null)
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