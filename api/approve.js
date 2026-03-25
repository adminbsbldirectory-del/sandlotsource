import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function verifyToken(table, id, token) {
  const expected = crypto
    .createHmac('sha256', process.env.APPROVAL_SECRET)
    .update(`${table}:${id}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(token, 'hex')
    );
  } catch {
    return false;
  }
}

const statusColumn = {
  coaches: 'approval_status',
  travel_teams: 'approval_status',
  player_board: 'approval_status',
  facilities: 'approval_status',
  reviews: 'moderation_status',
};

const tableLabels = {
  coaches: 'Coach',
  travel_teams: 'Travel Team',
  player_board: 'Player Board Post',
  facilities: 'Facility',
};

function confirmationPage(action, table, record) {
  const approved = action === 'approve';
  const label = tableLabels[table] || table;
  const name = record?.name || record?.team_name || `ID: ${record?.id}`;
  const emoji = approved ? '✅' : '❌';
  const color = approved ? '#16a34a' : '#dc2626';
  const status = approved ? 'approved and is now live on the site' : 'rejected and will not appear on the site';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sandlot Source</title></head>
  <body style="font-family:-apple-system,sans-serif;background:#f9fafb;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;">
  <div style="background:#fff;border-radius:12px;padding:40px;max-width:480px;box-shadow:0 4px 12px rgba(0,0,0,0.1);text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">${emoji}</div>
  <h1 style="margin:0 0 8px;color:#111827;font-size:22px;">${label} ${approved ? 'Approved' : 'Rejected'}</h1>
  <p style="color:#6b7280;font-size:15px;margin:0 0 24px;"><strong>${name}</strong> has been ${status}.</p>
  <div style="background:${approved ? '#f0fdf4' : '#fef2f2'};border:1px solid ${color}30;border-radius:8px;padding:16px;margin-bottom:24px;">
  <p style="margin:0;font-size:14px;color:${color};font-weight:600;">Status set to: ${approved ? 'approved' : 'rejected'}</p></div>
  <a href="https://sandlotsource.com" style="color:#3b82f6;text-decoration:none;font-size:14px;">← Back to Sandlot Source</a>
  </div></body></html>`;
}

export default async function handler(req, res) {
  const { table, id, token, action } = req.query;
  if (!table || !id || !token || !action) return res.status(400).send('Missing required parameters');
  if (!['approve', 'reject'].includes(action)) return res.status(400).send('Invalid action');
  if (!statusColumn[table]) return res.status(400).send('Unknown table');
  if (!verifyToken(table, id, token)) {
    return res.status(403).send('<h2 style="font-family:sans-serif;color:#dc2626;">⛔ Invalid or expired link</h2>');
  }
  const { data, error } = await supabase
    .from(table)
    .update({ [statusColumn[table]]: action === 'approve' ? 'approved' : 'rejected' })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).send('Database error — please update manually in Supabase.');
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(confirmationPage(action, table, data));
}
