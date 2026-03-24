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
  claim_requests: (record) => claimEmail(record),
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supabase webhooks send: { type, table, record, schema, old_record }
  const { table, record } = req.body;

  if (!table || !record?.id) {
    return res.status(400).json({ error: 'Missing table or record' });
  }

  const buildEmail = templateMap[table];
  if (!buildEmail) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const token = generateToken(table, record.id);

    // Run duplicate check — never blocks the email even if it fails
    const duplicates = await findDuplicates(table, record);

    // Build email, passing duplicate results in so the banner renders
    const { subject, html } = buildEmail(record, token, duplicates);

    // Prepend warning to subject line so it stands out immediately in your inbox
    const finalSubject = duplicates.length > 0
      ? `⚠️ POSSIBLE DUPLICATE — ${subject}`
      : subject;

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
