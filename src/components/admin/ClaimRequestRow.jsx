export default function ClaimRequestRow({
  row,
  decision,
  isResolved,
  isBusy,
  isMobile,
  noteValue,
  onNoteChange,
  onMarkPending,
  onMarkNew,
  onApprove,
  onReject,
  styles,
  formatFilterOption,
  formatDateDisplay,
}) {
  const layoutStyle = isMobile ? styles.claimGridMobile : styles.claimGrid

  return (
    <div style={styles.claimItem}>
      <div style={layoutStyle}>
        <div>
          <div style={styles.sectionLabel}>Listing</div>
          <div style={{ fontWeight: 700, color: '#1b3a5c' }}>{row.listing_name || '—'}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            {row.listing_type || '—'} · {row.request_kind || 'claim'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{row.city || '—'}</div>
          <div style={{ ...styles.monospace, marginTop: 6 }}>{row.listing_id || 'No listing_id'}</div>
        </div>

        <div>
          <div style={styles.sectionLabel}>Requester</div>
          <div style={{ fontWeight: 600 }}>{row.requester_name || '—'}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {row.requester_email ? (
              <a href={`mailto:${row.requester_email}`} style={{ color: '#1d4ed8', textDecoration: 'none' }}>
                {row.requester_email}
              </a>
            ) : (
              '—'
            )}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{row.requester_phone || '—'}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
            {row.relationship_to_listing || '—'}
          </div>
        </div>

        <div>
          <div style={styles.sectionLabel}>Request</div>
          <div style={{ fontWeight: 600 }}>{row.requested_change || '—'}</div>

          {row.corrected_contact_info ? (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
              Contact: {row.corrected_contact_info}
            </div>
          ) : null}

          {row.website_social_updates ? (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
              Web/Social: {row.website_social_updates}
            </div>
          ) : null}

          {row.tryout_updates ? (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
              Tryout: {row.tryout_updates}
            </div>
          ) : null}

          {row.availability_updates ? (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
              Availability: {row.availability_updates}
            </div>
          ) : null}

          {row.notes ? (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.45 }}>
              Notes: {row.notes}
            </div>
          ) : null}
        </div>

        <div>
          <div style={styles.sectionLabel}>Status</div>
          <div style={{ fontWeight: 600 }}>{formatFilterOption(row.status || 'new')}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Decision: {decision ? formatFilterOption(decision) : '—'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Submitted: {formatDateDisplay(row.submitted_at)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Resolved: {formatDateDisplay(row.resolved_at)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
            Reviewed by: {row.reviewed_by || '—'}
          </div>
        </div>

        <div>
          <div style={styles.sectionLabel}>Admin Notes</div>
          <textarea
            value={noteValue}
            onChange={(e) => onNoteChange(e.target.value)}
            disabled={isBusy || isResolved}
            rows={6}
            style={{
              ...styles.inlineInput,
              resize: 'vertical',
              minHeight: 120,
              minWidth: isMobile ? '100%' : 220,
            }}
          />
        </div>

        <div>
          <div style={styles.sectionLabel}>Actions</div>

          {!isResolved ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {row.status === 'new' ? (
                <button
                  type="button"
                  onClick={onMarkPending}
                  disabled={isBusy}
                  style={styles.actionButton('pending')}
                >
                  {isBusy ? 'Working…' : 'Set Pending'}
                </button>
              ) : null}

              {row.status === 'pending' ? (
                <button
                  type="button"
                  onClick={onMarkNew}
                  disabled={isBusy}
                  style={styles.actionButton('neutral')}
                >
                  {isBusy ? 'Working…' : 'Set New'}
                </button>
              ) : null}

              <button
                type="button"
                onClick={onApprove}
                disabled={isBusy}
                style={styles.actionButton('approve')}
              >
                {isBusy ? 'Working…' : 'Approve'}
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={isBusy}
                style={styles.actionButton('reject')}
              >
                {isBusy ? 'Working…' : 'Reject'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
              This request is already resolved.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}