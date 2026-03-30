import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

function normalizeAction(value) {
  const action = String(value || '').trim().toLowerCase()

  if (['approve', 'reject', 'mark_pending', 'mark_new'].includes(action)) {
    return action
  }

  return ''
}

function buildAdminNotes(action, rawNotes) {
  const notes = String(rawNotes || '').trim()

  if (action === 'approve') {
    return notes ? `[APPROVED] ${notes}` : '[APPROVED]'
  }

  if (action === 'reject') {
    return notes ? `[REJECTED] ${notes}` : '[REJECTED]'
  }

  return notes || null
}

function isClaimRequest(row) {
  return String(row?.request_kind || 'claim').trim().toLowerCase() === 'claim'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let body = req.body

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }

  const claimRequestId = Number(body?.claimRequestId)
  const action = normalizeAction(body?.action)
  const reviewedBy = String(body?.reviewedBy || 'admin').trim().slice(0, 120) || 'admin'
  const adminNotes = String(body?.adminNotes || '').trim().slice(0, 4000)

  if (!Number.isFinite(claimRequestId) || claimRequestId <= 0) {
    return res.status(400).json({ error: 'Missing or invalid claimRequestId' })
  }

  if (!action) {
    return res.status(400).json({ error: 'Invalid action' })
  }

  const { data: claim, error: claimError } = await supabase
    .from('claim_requests')
    .select('*')
    .eq('id', claimRequestId)
    .single()

  if (claimError || !claim) {
    return res.status(404).json({ error: 'Claim request not found.' })
  }

  if (action === 'mark_pending' || action === 'mark_new') {
    if (claim.status === 'resolved') {
      return res.status(409).json({ error: 'Resolved claim requests cannot be moved back in queue from this workflow.' })
    }

    const nextStatus = action === 'mark_pending' ? 'pending' : 'new'

    const { error: queueError } = await supabase
      .from('claim_requests')
      .update({
        status: nextStatus,
        reviewed_by: reviewedBy,
        admin_notes: adminNotes || claim.admin_notes || null,
      })
      .eq('id', claimRequestId)

    if (queueError) {
      console.error('review-claim queue update error:', queueError)
      return res.status(500).json({ error: 'Failed to update claim queue status.' })
    }

    return res.status(200).json({
      ok: true,
      message: `Claim request marked ${nextStatus}.`,
    })
  }

  if (claim.status === 'resolved') {
    return res.status(409).json({ error: 'This claim request has already been resolved.' })
  }

  const nowIso = new Date().toISOString()
  const resolvedNotes = buildAdminNotes(action, adminNotes)

  if (action === 'reject') {
    const { error: rejectError } = await supabase
      .from('claim_requests')
      .update({
        status: 'resolved',
        resolved_at: nowIso,
        reviewed_by: reviewedBy,
        admin_notes: resolvedNotes,
      })
      .eq('id', claimRequestId)

    if (rejectError) {
      console.error('review-claim reject update error:', rejectError)
      return res.status(500).json({ error: 'Failed to reject claim request.' })
    }

    return res.status(200).json({
      ok: true,
      message: 'Claim request rejected.',
    })
  }

  // Approve path
  if (!isClaimRequest(claim)) {
    const { error: resolveUpdateError } = await supabase
      .from('claim_requests')
      .update({
        status: 'resolved',
        resolved_at: nowIso,
        reviewed_by: reviewedBy,
        admin_notes: resolvedNotes,
      })
      .eq('id', claimRequestId)

    if (resolveUpdateError) {
      console.error('review-claim update-request approve error:', resolveUpdateError)
      return res.status(500).json({ error: 'Failed to resolve update request.' })
    }

    return res.status(200).json({
      ok: true,
      message: 'Update request approved and resolved.',
    })
  }

  if (!claim.listing_id) {
    return res.status(400).json({ error: 'Claim request is missing listing_id.' })
  }

  if (!claim.listing_type) {
    return res.status(400).json({ error: 'Claim request is missing listing_type.' })
  }

  if (!claim.requester_email) {
    return res.status(400).json({ error: 'Claim request is missing requester_email.' })
  }

  const { data: existingOwners, error: existingOwnersError } = await supabase
    .from('listing_ownerships')
    .select('id, owner_email, status')
    .eq('listing_type', claim.listing_type)
    .eq('listing_id', claim.listing_id)
    .eq('status', 'active')
    .limit(1)

  if (existingOwnersError) {
    console.error('review-claim existing owner check error:', existingOwnersError)
    return res.status(500).json({ error: 'Failed to check existing ownership.' })
  }

  if (existingOwners && existingOwners.length > 0) {
    return res.status(409).json({
      error: 'This listing already has an active owner. Resolve ownership manually before approving another claim.',
    })
  }

  const ownershipInsert = {
    listing_type: claim.listing_type,
    listing_id: claim.listing_id,
    owner_name: claim.requester_name || null,
    owner_email: claim.requester_email,
    owner_phone: claim.requester_phone || null,
    status: 'active',
    approved_claim_request_id: claim.id,
  }

  const { data: insertedOwnership, error: ownershipInsertError } = await supabase
    .from('listing_ownerships')
    .insert(ownershipInsert)
    .select('id')
    .single()

  if (ownershipInsertError) {
    console.error('review-claim ownership insert error:', ownershipInsertError)

    if (ownershipInsertError.code === '23505') {
      return res.status(409).json({
        error: 'An active ownership already exists for this listing.',
      })
    }

    return res.status(500).json({ error: 'Failed to create ownership record.' })
  }

  let teamWasUpdated = false

  if (claim.listing_type === 'team') {
    const { data: updatedTeams, error: teamUpdateError } = await supabase
      .from('travel_teams')
      .update({
        claimed: true,
        claimed_at: nowIso,
      })
      .eq('id', claim.listing_id)
      .select('id')

    if (teamUpdateError || !updatedTeams || updatedTeams.length === 0) {
      console.error('review-claim team update error:', teamUpdateError)

      if (insertedOwnership?.id) {
        await supabase.from('listing_ownerships').delete().eq('id', insertedOwnership.id)
      }

      return res.status(500).json({
        error: 'Failed to mark team as claimed.',
      })
    }

    teamWasUpdated = true
  }

  const { error: approveUpdateError } = await supabase
    .from('claim_requests')
    .update({
      status: 'resolved',
      resolved_at: nowIso,
      reviewed_by: reviewedBy,
      admin_notes: resolvedNotes,
    })
    .eq('id', claimRequestId)

  if (approveUpdateError) {
    console.error('review-claim claim request resolve error:', approveUpdateError)

    if (teamWasUpdated && claim.listing_type === 'team') {
      await supabase
        .from('travel_teams')
        .update({
          claimed: false,
          claimed_at: null,
        })
        .eq('id', claim.listing_id)
    }

    if (insertedOwnership?.id) {
      await supabase.from('listing_ownerships').delete().eq('id', insertedOwnership.id)
    }

    return res.status(500).json({
      error: 'Failed to finalize claim approval.',
    })
  }

  return res.status(200).json({
    ok: true,
    message:
      claim.listing_type === 'team'
        ? 'Team claim approved and ownership recorded.'
        : 'Claim approved and ownership recorded.',
  })
}