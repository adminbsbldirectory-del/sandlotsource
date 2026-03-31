import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const QUEUE_ACTIONS = new Set(['approve', 'reject', 'mark_pending', 'mark_new'])
const ACTIVE_OWNERSHIP_STATUS = 'active'

function normalizeAction(value) {
  const action = String(value || '').trim().toLowerCase()
  return QUEUE_ACTIONS.has(action) ? action : ''
}

function normalizeListingType(value) {
  const raw = String(value || '').trim().toLowerCase()

  if (raw === 'coach') return 'coach'
  if (raw === 'team') return 'team'
  if (raw === 'facility') return 'facility'

  return ''
}

const CLAIM_CHANGE = 'claim this listing'

const UPDATE_CHANGES = new Set([
  'correct listing info',
  'update contact info',
  'update tryout status',
  'update availability',
  'mark inactive',
  'remove listing',
])

function normalizeRequestKind(value) {
  const raw = String(value || '').trim().toLowerCase()
  return raw === 'update' ? 'update' : 'claim'
}

function normalizeRequestedChange(value) {
  return String(value || '').trim().toLowerCase()
}

function getRequestMode(row) {
  const requestKind = normalizeRequestKind(row?.request_kind)
  const requestedChange = normalizeRequestedChange(row?.requested_change)

  if (requestKind === 'claim' && (!requestedChange || requestedChange === CLAIM_CHANGE)) {
    return 'claim'
  }

  if (requestKind === 'update' && UPDATE_CHANGES.has(requestedChange)) {
    return 'update'
  }

  return 'invalid'
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

function getListingTableName(listingType) {
  if (listingType === 'coach') return 'coaches'
  if (listingType === 'team') return 'travel_teams'
  if (listingType === 'facility') return 'facilities'
  return ''
}

async function setListingVerifiedStatus({ listingType, listingId, verified }) {
  const tableName = getListingTableName(listingType)

  if (!tableName) {
    return {
      ok: false,
      error: `Unsupported listing type: ${listingType}`,
      code: 400,
    }
  }

  const updatePayload = { verified_status: verified }

  // Temporary backward-compat support for travel_teams only.
  if (listingType === 'team') {
    updatePayload.claimed = verified
    updatePayload.claimed_at = verified ? new Date().toISOString() : null
  }

  const { data, error } = await supabase
    .from(tableName)
    .update(updatePayload)
    .eq('id', listingId)
    .select('id')
    .limit(1)

  if (error) {
    console.error('setListingVerifiedStatus error:', error)
    return {
      ok: false,
      error: `Failed to update ${tableName}.`,
      code: 500,
    }
  }

  if (!data || data.length === 0) {
    return {
      ok: false,
      error: `Listing not found in ${tableName}.`,
      code: 404,
    }
  }

  return { ok: true }
}

async function insertOwnershipFromClaim(claim) {
  const ownershipInsert = {
    listing_type: claim.listing_type,
    listing_id: claim.listing_id,
    owner_name: claim.requester_name || null,
    owner_email: claim.requester_email,
    owner_phone: claim.requester_phone || null,
    status: ACTIVE_OWNERSHIP_STATUS,
    approved_claim_request_id: claim.id,
  }

  const { data, error } = await supabase
    .from('listing_ownerships')
    .insert(ownershipInsert)
    .select('id')
    .single()

  if (error) {
    console.error('insertOwnershipFromClaim error:', error)

    if (error.code === '23505') {
      return {
        ok: false,
        code: 409,
        error: 'An active ownership already exists for this listing.',
      }
    }

    return {
      ok: false,
      code: 500,
      error: 'Failed to create ownership record.',
    }
  }

  return {
    ok: true,
    ownershipId: data?.id,
  }
}

async function deleteOwnershipById(id) {
  if (!id) return
  const { error } = await supabase.from('listing_ownerships').delete().eq('id', id)
  if (error) {
    console.error('deleteOwnershipById rollback error:', error)
  }
}

async function resolveClaimRequest({ claimRequestId, reviewedBy, resolvedAtIso, adminNotes }) {
  const { error } = await supabase
    .from('claim_requests')
    .update({
      status: 'resolved',
      resolved_at: resolvedAtIso,
      reviewed_by: reviewedBy,
      admin_notes: adminNotes,
    })
    .eq('id', claimRequestId)

  if (error) {
    console.error('resolveClaimRequest error:', error)
    return {
      ok: false,
      code: 500,
      error: 'Failed to finalize claim request.',
    }
  }

  return { ok: true }
}

async function setClaimQueueStatus({ claimRequestId, reviewedBy, nextStatus, adminNotes, existingAdminNotes }) {
  const { error } = await supabase
    .from('claim_requests')
    .update({
      status: nextStatus,
      reviewed_by: reviewedBy,
      admin_notes: adminNotes || existingAdminNotes || null,
    })
    .eq('id', claimRequestId)

  if (error) {
    console.error('setClaimQueueStatus error:', error)
    return {
      ok: false,
      code: 500,
      error: 'Failed to update claim queue status.',
    }
  }

  return { ok: true }
}

async function getActiveOwnershipForListing({ listingType, listingId }) {
  const { data, error } = await supabase
    .from('listing_ownerships')
    .select('id, owner_email, status')
    .eq('listing_type', listingType)
    .eq('listing_id', listingId)
    .eq('status', ACTIVE_OWNERSHIP_STATUS)
    .limit(1)

  if (error) {
    console.error('getActiveOwnershipForListing error:', error)
    return {
      ok: false,
      code: 500,
      error: 'Failed to check existing ownership.',
    }
  }

  return {
    ok: true,
    ownership: data && data.length > 0 ? data[0] : null,
  }
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
  const rawAdminNotes = String(body?.adminNotes || '').trim().slice(0, 4000)

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
      return res.status(409).json({
        error: 'Resolved claim requests cannot be moved back in queue from this workflow.',
      })
    }

    const nextStatus = action === 'mark_pending' ? 'pending' : 'new'
    const queueResult = await setClaimQueueStatus({
      claimRequestId,
      reviewedBy,
      nextStatus,
      adminNotes: rawAdminNotes,
      existingAdminNotes: claim.admin_notes,
    })

    if (!queueResult.ok) {
      return res.status(queueResult.code).json({ error: queueResult.error })
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
  const resolvedNotes = buildAdminNotes(action, rawAdminNotes)

  if (action === 'reject') {
    const rejectResult = await resolveClaimRequest({
      claimRequestId,
      reviewedBy,
      resolvedAtIso: nowIso,
      adminNotes: resolvedNotes,
    })

    if (!rejectResult.ok) {
      return res.status(rejectResult.code).json({ error: rejectResult.error })
    }

    return res.status(200).json({
      ok: true,
      message: 'Claim request rejected.',
    })
  }

  // Approve path
  const requestMode = getRequestMode(claim)

  if (requestMode === 'invalid') {
    return res.status(409).json({
      error:
        'This request has an invalid claim/update combination. Only a true claim can create ownership.',
    })
  }

  if (requestMode === 'update') {
    const updateApprovalResult = await resolveClaimRequest({
      claimRequestId,
      reviewedBy,
      resolvedAtIso: nowIso,
      adminNotes: resolvedNotes,
    })

    if (!updateApprovalResult.ok) {
      return res.status(updateApprovalResult.code).json({ error: updateApprovalResult.error })
    }

    return res.status(200).json({
      ok: true,
      message: 'Update request approved and resolved.',
    })
  }

  const listingType = normalizeListingType(claim.listing_type)

  if (!claim.listing_id) {
    return res.status(400).json({ error: 'Claim request is missing listing_id.' })
  }

  if (!listingType) {
    return res.status(400).json({ error: 'Claim request is missing or has invalid listing_type.' })
  }

  if (!claim.requester_email) {
    return res.status(400).json({ error: 'Claim request is missing requester_email.' })
  }

  const activeOwnershipCheck = await getActiveOwnershipForListing({
    listingType,
    listingId: claim.listing_id,
  })

  if (!activeOwnershipCheck.ok) {
    return res.status(activeOwnershipCheck.code).json({ error: activeOwnershipCheck.error })
  }

  if (activeOwnershipCheck.ownership) {
    return res.status(409).json({
      error: 'This listing already has an active owner. Resolve ownership manually before approving another claim.',
    })
  }

  const ownershipResult = await insertOwnershipFromClaim({
    ...claim,
    listing_type: listingType,
  })

  if (!ownershipResult.ok) {
    return res.status(ownershipResult.code).json({ error: ownershipResult.error })
  }

  const verifyResult = await setListingVerifiedStatus({
    listingType,
    listingId: claim.listing_id,
    verified: true,
  })

  if (!verifyResult.ok) {
    await deleteOwnershipById(ownershipResult.ownershipId)
    return res.status(verifyResult.code).json({ error: verifyResult.error })
  }

  const finalizeApprovalResult = await resolveClaimRequest({
    claimRequestId,
    reviewedBy,
    resolvedAtIso: nowIso,
    adminNotes: resolvedNotes,
  })

  if (!finalizeApprovalResult.ok) {
    await setListingVerifiedStatus({
      listingType,
      listingId: claim.listing_id,
      verified: false,
    })
    await deleteOwnershipById(ownershipResult.ownershipId)

    return res.status(finalizeApprovalResult.code).json({ error: finalizeApprovalResult.error })
  }

  return res.status(200).json({
    ok: true,
    message: 'Claim approved, ownership recorded, and listing verified.',
  })
}