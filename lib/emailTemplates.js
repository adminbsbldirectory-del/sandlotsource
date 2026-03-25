const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sandlotsource.com';

function approvalButtons(table, id, token) {
  const base = `${BASE_URL}/api/approve`;
  return `<div style="margin:32px 0;">
    <a href="${base}?table=${table}&id=${id}&token=${token}&action=approve"
       style="background:#16a34a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;margin-right:12px;">✅ Approve</a>
    <a href="${base}?table=${table}&id=${id}&token=${token}&action=reject"
       style="background:#dc2626;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px;display:inline-block;">❌ Reject</a>
  </div>`;
}

function row(label, value) {
  if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  const displayValue = Array.isArray(value) ? value.join(', ') : value;
  return `<tr>
    <td style="padding:8px 12px;font-weight:600;color:#374151;width:180px;vertical-align:top;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:8px 12px;color:#111827;border-bottom:1px solid #f3f4f6;">${displayValue}</td>
  </tr>`;
}

function duplicateBanner(duplicates) {
  if (!duplicates || duplicates.length === 0) return '';
  const items = duplicates.map(d => {
    const name = d.name || d.team_name || d.contact_info || `ID: ${d.id}`;
    const reasons = d.reasons?.join(', ') || 'possible match';
    const status = d.approval_status ? ` · status: ${d.approval_status}` : '';
    return `<li style="margin:6px 0;"><strong>${name}</strong> — ${reasons}${status}</li>`;
  }).join('');
  return `<div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
    <p style="margin:0 0 8px;font-weight:700;color:#92400e;font-size:15px;">⚠️ Possible Duplicate${duplicates.length > 1 ? 's' : ''} Detected</p>
    <p style="margin:0 0 10px;font-size:13px;color:#78350f;">The following existing record${duplicates.length > 1 ? 's' : ''} may already match this submission. Review before approving.</p>
    <ul style="margin:0;padding-left:18px;font-size:13px;color:#92400e;">${items}</ul>
  </div>`;
}

function wrapper(title, badgeColor, badgeLabel, tableRows, buttons, duplicates = []) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1e3a5f;padding:24px 28px;"><span style="color:#fff;font-size:20px;font-weight:700;">⚾ SANDLOT SOURCE</span></div>
    <div style="background:#f0f4ff;padding:16px 28px;border-bottom:2px solid #e5e7eb;">
      <span style="background:${badgeColor};color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;">${badgeLabel}</span>
      <h1 style="margin:8px 0 0;font-size:18px;color:#1e3a5f;">${title}</h1>
    </div>
    <div style="padding:24px 28px;">
      ${duplicateBanner(duplicates)}
      <p style="margin:0 0 20px;color:#6b7280;font-size:14px;">A new submission is waiting for your review. Click Approve or Reject below.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;font-size:14px;">${tableRows}</table>
      ${buttons}
      <p style="margin-top:24px;font-size:12px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:16px;">
        This approval link is unique to this submission.<br>
        <a href="https://supabase.com/dashboard" style="color:#3b82f6;">Open Supabase</a> to manage entries directly.
      </p>
    </div>
  </div></body></html>`;
}

export function coachEmail(record, token, duplicates = []) {
  const rows = [
    row('Name', record.name), row('Sport', record.sport), row('Specialty', record.specialty),
    row('City', record.city), row('County', record.county), row('Facility', record.facility_name),
    row('Phone', record.phone), row('Email', record.email), row('Website', record.website),
    row('Instagram', record.instagram), row('Age Groups', record.age_groups),
    row('Skill Levels', record.skill_level),
    row('Price / Session', record.price_per_session ? `$${record.price_per_session}` : null),
    row('Price Notes', record.price_notes), row('Credentials', record.credentials),
    row('Tier', record.tier), row('Bio', record.bio), row('Notes', record.notes),
  ].join('');
  return {
    subject: `🧢 New Coach Submission — ${record.name}`,
    html: wrapper(`New Coach: ${record.name}`, '#2563eb', 'Coach', rows, approvalButtons('coaches', record.id, token), duplicates),
  };
}

export function teamEmail(record, token, duplicates = []) {
  const rows = [
    row('Team Name', record.name), row('Sport', record.sport), row('Org / Affiliation', record.org_affiliation),
    row('Age Group', record.age_group), row('City', record.city), row('County', record.county),
    row('Contact Name', record.contact_name), row('Contact Email', record.contact_email),
    row('Contact Phone', record.contact_phone), row('Website', record.website),
    row('Tryout Status', record.tryout_status), row('Tryout Date', record.tryout_date),
    row('Tryout Notes', record.tryout_notes), row('Description', record.description),
  ].join('');
  return {
    subject: `⚾ New Team Submission — ${record.name}`,
    html: wrapper(`New Travel Team: ${record.name}`, '#7c3aed', 'Travel Team', rows, approvalButtons('travel_teams', record.id, token), duplicates),
  };
}

export function playerBoardEmail(record, token, duplicates = []) {
  const isPlayerNeeded = record.post_type === 'player_needed';
  const title = isPlayerNeeded ? `Player Needed — ${record.team_name || record.city}` : `Player Available — ${record.sport} / ${record.city}`;
  const rows = [
    row('Post Type', isPlayerNeeded ? '🔍 Team Looking for Player' : '🙋 Player Looking for Team'),
    row('Sport', record.sport), row('City', record.city), row('County', record.county),
    ...(isPlayerNeeded ? [
      row('Team Name', record.team_name),
      row('Age Group', record.age_group),
      row('Position(s) Needed', record.position_needed),
      row('Event / Location', record.location_name),
      row('Event Date', record.event_date),
    ] : []),
    ...(!isPlayerNeeded ? [
      row('Player Age', record.player_age),
      row('Age Group', record.age_group),
      row('Position(s)', record.player_position),
      row('Team Name', record.team_name),
      row('Player Description', record.player_description),
    ] : []),
    row('Contact Info', record.contact_info),
    row('Additional Notes', record.additional_notes),
  ].join('');
  return {
    subject: `📋 New Player Board Post — ${isPlayerNeeded ? 'Player Needed' : 'Player Available'}`,
    html: wrapper(title, '#d97706', isPlayerNeeded ? 'Player Needed' : 'Player Available', rows, approvalButtons('player_board', record.id, token), duplicates),
  };
}

export function facilityEmail(record, token, duplicates = []) {
  const rows = [
    row('Facility Name', record.name), row('Sport', record.sport), row('Address', record.address),
    row('City', record.city), row('County', record.county), row('Phone', record.phone),
    row('Website', record.website), row('Description', record.description), row('Amenities', record.amenities),
  ].join('');
  return {
    subject: `🏟️ New Facility Submission — ${record.name}`,
    html: wrapper(`New Facility: ${record.name}`, '#059669', 'Facility', rows, approvalButtons('facilities', record.id, token), duplicates),
  };
}

export function claimEmail(record) {
  const rows = [
    row('Listing Type', record.listing_type),
    row('Listing Name', record.listing_name),
    row('City', record.city),
    row('Requested Change', record.requested_change),
    row('Requester Name', record.requester_name),
    row('Requester Email', record.requester_email),
    row('Requester Phone', record.requester_phone),
    row('Relationship', record.relationship_to_listing),
    row('Corrected Contact Info', record.corrected_contact_info),
    row('Website / Social Updates', record.website_social_updates),
    row('Tryout Updates', record.tryout_updates),
    row('Availability Updates', record.availability_updates),
    row('Notes', record.notes),
  ].join('');
  const noButtons = '<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Review this request and follow up with the requester directly.</p>';
  return {
    subject: '📋 New Claim Request — ' + record.listing_name,
    html: wrapper('New Claim Request: ' + record.listing_name, '#c0392b', 'Claim Request', rows, noButtons),
  };
}

export function reviewEmail(record) {
  const coachLabel = record.coach_name || record.coach_id || 'Unknown coach';
  const rows = [
    row('Coach', coachLabel),
    row('Coach ID', record.coach_id),
    row('Rating', record.rating ? `${record.rating}/5` : null),
    row('Reviewer Name', record.reviewer_name),
    row('Reviewer Email', record.email),
    row('Player Age Group', record.player_age_group),
    row('Review', record.review_text),
    row('Moderation Status', record.moderation_status || 'pending'),
  ].join('');
  const note = '<p style="margin:24px 0 0;font-size:13px;color:#6b7280;">Review submitted by a site visitor. Moderate this review in Supabase.</p>';
  return {
    subject: `⭐ New Coach Review — ${coachLabel}`,
    html: wrapper(`New Coach Review: ${coachLabel}`, '#f59e0b', 'Coach Review', rows, note),
  };
}
