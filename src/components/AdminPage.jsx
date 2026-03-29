import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../supabase.js'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Grogans@2017'

const TABS = ['Coaches', 'Travel Teams', 'Facilities', 'Claim Requests', 'Reviews', 'Featured Coaches', 'Featured Facilities', 'Ad Manager']
const FEATURED_TABS = ['Featured Coaches', 'Featured Facilities']
const AD_SUBTABS = ['Slots', 'Advertisers', 'Ads', 'Assignments']

// ── Quick-filter pill config ─────────────────────────────────────────
const QUICK_FILTERS = {
  'Coaches': [
    { label: 'All',      filterFn: () => true },
    { label: 'Approved', filterFn: r => r.approval_status === 'approved' },
    { label: 'Pending',  filterFn: r => r.approval_status === 'pending' },
    { label: 'Seeded',   filterFn: r => r.approval_status === 'seeded' },
    { label: 'Featured', filterFn: r => r.featured_status === true },
    { label: 'Inactive', filterFn: r => r.active === false },
  ],
  'Travel Teams': [
    { label: 'All',      filterFn: () => true },
    { label: 'Approved', filterFn: r => r.approval_status === 'approved' },
    { label: 'Pending',  filterFn: r => r.approval_status === 'pending' },
    { label: 'Featured', filterFn: r => r.featured_status === true },
    { label: 'Open',     filterFn: r => r.tryout_status === 'open' },
  ],
  'Facilities': [
    { label: 'All',      filterFn: () => true },
    { label: 'Approved', filterFn: r => r.approval_status === 'approved' },
    { label: 'Pending',  filterFn: r => r.approval_status === 'pending' },
    { label: 'Seeded',   filterFn: r => r.approval_status === 'seeded' },
    { label: 'Featured', filterFn: r => r.featured_status === true },
  ],
  'Claim Requests': [
    { label: 'All',      filterFn: () => true },
    { label: 'New',      filterFn: r => r.status === 'new' },
    { label: 'Pending',  filterFn: r => r.status === 'pending' },
    { label: 'Resolved', filterFn: r => r.status === 'resolved' },
  ],
  'Reviews': [
    { label: 'All',      filterFn: () => true },
    { label: 'Pending',  filterFn: r => r.moderation_status === 'pending' },
    { label: 'Approved', filterFn: r => r.moderation_status === 'approved' },
    { label: 'Rejected', filterFn: r => r.moderation_status === 'rejected' },
  ],
  'Featured Coaches': [
    { label: 'Featured', filterFn: r => r.featured_status === true },
    { label: 'All',      filterFn: () => true },
    { label: 'Expired',  filterFn: r => r.featured_until && new Date(r.featured_until) < new Date() },
  ],
  'Featured Facilities': [
    { label: 'Featured', filterFn: r => r.featured_status === true },
    { label: 'All',      filterFn: () => true },
    { label: 'Expired',  filterFn: r => r.featured_until && new Date(r.featured_until) < new Date() },
  ],
  'Slots': [
    { label: 'All',      filterFn: () => true },
    { label: 'Desktop',  filterFn: r => r.device_type === 'desktop' },
    { label: 'Mobile',   filterFn: r => r.device_type === 'mobile' },
    { label: 'Active',   filterFn: r => r.is_active === true },
    { label: 'Inactive', filterFn: r => r.is_active === false },
  ],
  'Advertisers': [
    { label: 'All',      filterFn: () => true },
    { label: 'Active',   filterFn: r => r.is_active === true },
    { label: 'Inactive', filterFn: r => r.is_active === false },
  ],
  'Ads': [
    { label: 'All',       filterFn: () => true },
    { label: 'Live',      filterFn: r => r.status === 'live' },
    { label: 'Paused',    filterFn: r => r.status === 'paused' },
    { label: 'Draft',     filterFn: r => r.status === 'draft' },
    { label: 'Pending',   filterFn: r => r.approval_status === 'pending' },
    { label: 'House Ads', filterFn: r => r.is_house_ad === true },
  ],
}

// ── Field configs ────────────────────────────────────────────────────
const COACH_FIELDS = [
  { key: 'name',            label: 'Name',         type: 'text' },
  { key: 'sport',           label: 'Sport',        type: 'select', options: ['baseball','softball','both'] },
  { key: 'specialty',       label: 'Specialty',    type: 'multiselect', options: ['Pitching','Hitting','Catching','Fielding','Strength/Conditioning'] },
  { key: 'city',            label: 'City',         type: 'text' },
  { key: 'state',           label: 'State',        type: 'text' },
  { key: 'facility_name',   label: 'Facility',     type: 'text' },
  { key: 'phone',           label: 'Phone',        type: 'text' },
  { key: 'email',           label: 'Email',        type: 'text' },
  { key: 'website',         label: 'Website',      type: 'text' },
  { key: 'age_groups',      label: 'Age Groups',   type: 'multiselect', options: ['6U','8U','10U','12U','14U','16U','18U','Adult'] },
  { key: 'skill_level',     label: 'Skill Level',  type: 'multiselect', options: ['Beginner','Intermediate','Advanced','Elite'] },
  { key: 'approval_status', label: 'Approval',     type: 'select', options: ['approved','pending','seeded'] },
  { key: 'active',          label: 'Active',       type: 'boolean' },
  { key: 'featured_status', label: 'Featured',     type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',         type: 'number' },
  { key: 'verified_status', label: 'Verified',     type: 'boolean' },
]

const TEAM_FIELDS = [
  { key: 'name',            label: 'Name',         type: 'text' },
  { key: 'sport',           label: 'Sport',        type: 'select', options: ['baseball','softball','both'] },
  { key: 'age_group',       label: 'Age Group',    type: 'text' },
  { key: 'city',            label: 'City',         type: 'text' },
  { key: 'state',           label: 'State',        type: 'text' },
  { key: 'contact_name',    label: 'Contact',      type: 'text' },
  { key: 'contact_email',   label: 'Email',        type: 'text' },
  { key: 'contact_phone',   label: 'Phone',        type: 'text' },
  { key: 'tryout_status',   label: 'Tryouts',      type: 'select', options: ['open','closed','by_invite','year_round'] },
  { key: 'approval_status', label: 'Approval',     type: 'select', options: ['approved','pending'] },
  { key: 'active',          label: 'Active',       type: 'boolean' },
  { key: 'claimed',         label: 'Claimed',      type: 'boolean' },
  { key: 'featured_status', label: 'Featured',     type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',         type: 'number' },
]

const FACILITY_FIELDS = [
  { key: 'name',            label: 'Name',         type: 'text' },
  { key: 'sport',           label: 'Sport',        type: 'select', options: ['baseball','softball','both'] },
  { key: 'city',            label: 'City',         type: 'text' },
  { key: 'state',           label: 'State',        type: 'text' },
  { key: 'phone',           label: 'Phone',        type: 'text' },
  { key: 'email',           label: 'Email',        type: 'text' },
  { key: 'website',         label: 'Website',      type: 'text' },
  { key: 'facility_type',   label: 'Type',         type: 'select', options: ['park_field','training_facility','private_facility','travel_team_facility','school_field','other'] },
  { key: 'approval_status', label: 'Approval',     type: 'select', options: ['approved','pending','seeded'] },
  { key: 'active',          label: 'Active',       type: 'boolean' },
]

const CLAIM_FIELDS = [
  { key: 'listing_name',     label: 'Listing',     type: 'text' },
  { key: 'listing_type',     label: 'Type',        type: 'text' },
  { key: 'city',             label: 'City',        type: 'text' },
  { key: 'requested_change', label: 'Change',      type: 'text' },
  { key: 'requester_name',   label: 'Requester',   type: 'text' },
  { key: 'requester_email',  label: 'Email',       type: 'email-link' },
  { key: 'requester_phone',  label: 'Phone',       type: 'text' },
  { key: 'notes',            label: 'Notes',       type: 'text' },
  { key: 'status',           label: 'Status',      type: 'select', options: ['new','pending','resolved'] },
  { key: 'admin_notes',      label: 'Admin Notes', type: 'text' },
]

const REVIEW_FIELDS = [
  { key: '_coach_name',      label: 'Coach',       type: 'joined',       joinPath: ['coaches','name'] },
  { key: 'rating',           label: 'Rating',      type: 'stars' },
  { key: 'review_text',      label: 'Review',      type: 'text' },
  { key: 'reviewer_name',    label: 'Reviewer',    type: 'text' },
  { key: 'player_age_group', label: 'Age Group',   type: 'text' },
  { key: 'email',            label: 'Email',       type: 'email-link' },
  { key: 'moderation_status',label: 'Status',      type: 'select',       options: ['pending','approved','rejected'] },
  { key: 'created_at',       label: 'Submitted',   type: 'date-readonly' },
]

const FEATURED_COACH_FIELDS = [
  { key: 'name',            label: 'Name',         type: 'text' },
  { key: 'city',            label: 'City',         type: 'text' },
  { key: 'state',           label: 'State',        type: 'text' },
  { key: 'sport',           label: 'Sport',        type: 'select', options: ['baseball','softball','both'] },
  { key: 'featured_status', label: 'Featured',     type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',         type: 'number' },
  { key: 'featured_start',  label: 'Start Date',   type: 'date-edit' },
  { key: 'featured_until',  label: 'Expiry',       type: 'date-edit' },
]

const FEATURED_FACILITY_FIELDS = [
  { key: 'name',            label: 'Name',         type: 'text' },
  { key: 'city',            label: 'City',         type: 'text' },
  { key: 'state',           label: 'State',        type: 'text' },
  { key: 'sport',           label: 'Sport',        type: 'select', options: ['baseball','softball','both'] },
  { key: 'featured_status', label: 'Featured',     type: 'boolean' },
  { key: 'featured_rank',   label: 'Rank',         type: 'number' },
  { key: 'featured_until',  label: 'Expiry',       type: 'date-edit' },
]

const AD_SLOT_FIELDS = [
  { key: 'slot_key',       label: 'Slot Key',      type: 'text' },
  { key: 'slot_label',     label: 'Label',         type: 'text' },
  { key: 'page_key',       label: 'Page',          type: 'select', options: ['homepage','coaches','facilities','teams','player_board','roster_spots','search_results','coach_profile','facility_profile','team_profile'] },
  { key: 'device_type',    label: 'Device',        type: 'select', options: ['desktop','mobile'] },
  { key: 'position_type',  label: 'Position',      type: 'select', options: ['top_banner','left_rail','right_rail','mid_page','inline','footer_strip','sponsored_card','sticky_footer'] },
  { key: 'display_order',  label: 'Order',         type: 'number' },
  { key: 'width_px',       label: 'W px',          type: 'number' },
  { key: 'height_px',      label: 'H px',          type: 'number' },
  { key: 'max_ads',        label: 'Max',           type: 'number' },
  { key: 'is_active',      label: 'Active',        type: 'boolean' },
  { key: 'notes',          label: 'Notes',         type: 'text' },
]

const ADVERTISER_FIELDS = [
  { key: 'business_name',  label: 'Business',      type: 'text' },
  { key: 'contact_name',   label: 'Contact',       type: 'text' },
  { key: 'contact_email',  label: 'Email',         type: 'email-link' },
  { key: 'contact_phone',  label: 'Phone',         type: 'text' },
  { key: 'website_url',    label: 'Website',       type: 'text' },
  { key: 'notes',          label: 'Notes',         type: 'text' },
  { key: 'is_active',      label: 'Active',        type: 'boolean' },
]

const AD_FIELDS = [
  { key: 'ad_name',         label: 'Ad Name',      type: 'text' },
  { key: '_advertiser',     label: 'Advertiser',   type: 'joined',       joinPath: ['advertisers','business_name'] },
  { key: 'display_type',    label: 'Type',         type: 'select',       options: ['house_ad','banner','sponsored_card','logo','text_cta'] },
  { key: 'status',          label: 'Status',       type: 'select',       options: ['live','paused','draft'] },
  { key: 'approval_status', label: 'Approval',     type: 'select',       options: ['approved','pending','rejected'] },
  { key: 'is_active',       label: 'Active',       type: 'boolean' },
  { key: 'is_house_ad',     label: 'House Ad',     type: 'boolean' },
  { key: 'priority',        label: 'Priority',     type: 'number' },
  { key: 'target_url',      label: 'Target URL',   type: 'text' },
  { key: 'alt_text',        label: 'Alt Text',     type: 'text' },
  { key: 'image_path',      label: 'Image',        type: 'image-upload' },
  { key: 'start_at',        label: 'Start',        type: 'date-edit' },
  { key: 'end_at',          label: 'End',          type: 'date-edit' },
  { key: 'notes',           label: 'Notes',        type: 'text' },
]

const TABLE_CONFIG = {
  'Coaches':             { table: 'coaches',        fields: COACH_FIELDS,             orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Travel Teams':        { table: 'travel_teams',   fields: TEAM_FIELDS,              orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Facilities':          { table: 'facilities',     fields: FACILITY_FIELDS,          orderBy: 'name',          ascending: true,  selectQuery: '*' },
  'Claim Requests':      { table: 'claim_requests', fields: CLAIM_FIELDS,             orderBy: 'submitted_at',  ascending: false, selectQuery: '*' },
  'Reviews':             { table: 'reviews',        fields: REVIEW_FIELDS,            orderBy: 'created_at',    ascending: false, selectQuery: '*, coaches(name)' },
  'Featured Coaches':    { table: 'coaches',        fields: FEATURED_COACH_FIELDS,    orderBy: 'featured_rank', ascending: true,  selectQuery: '*' },
  'Featured Facilities': { table: 'facilities',     fields: FEATURED_FACILITY_FIELDS, orderBy: 'featured_rank', ascending: true,  selectQuery: '*' },
  'Slots':               { table: 'ad_slots',       fields: AD_SLOT_FIELDS,           orderBy: 'page_key',      ascending: true,  selectQuery: '*' },
  'Advertisers':         { table: 'advertisers',    fields: ADVERTISER_FIELDS,        orderBy: 'business_name', ascending: true,  selectQuery: '*' },
  'Ads':                 { table: 'ads',            fields: AD_FIELDS,                orderBy: 'created_at',    ascending: false, selectQuery: '*, advertisers(business_name)' },
}

// ── Styles ───────────────────────────────────────────────────────────
const s = {
  page:          { background: '#f4f6f9', fontFamily: 'var(--font-body, system-ui, sans-serif)', minHeight: '100vh' },
  header:        { background: '#1b3a5c', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.18)' },
  headerTitle:   { color: '#fff', fontFamily: 'var(--font-head, system-ui)', fontSize: 18, fontWeight: 700, letterSpacing: '0.04em', margin: 0 },
  headerBadge:   { background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase' },
  body:          { padding: '16px 20px' },
  tabs:          { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 20, borderBottom: '2px solid #dde3ec' },
  tab: (active) => ({
    padding: '9px 18px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em', textTransform: 'uppercase', border: 'none',
    borderBottom: active ? '2px solid #1b3a5c' : '2px solid transparent',
    borderRadius: '6px 6px 0 0', background: active ? '#fff' : 'transparent',
    color: active ? '#1b3a5c' : '#888', cursor: 'pointer', marginBottom: -2, transition: 'all 0.15s',
  }),
  featuredTab: (active) => ({
    padding: '9px 18px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em', textTransform: 'uppercase', border: 'none',
    borderBottom: active ? '2px solid #d97706' : '2px solid transparent',
    borderRadius: '6px 6px 0 0', background: active ? '#fffbeb' : 'transparent',
    color: active ? '#d97706' : '#888', cursor: 'pointer', marginBottom: -2, transition: 'all 0.15s',
  }),
  adTab: (active) => ({
    padding: '9px 18px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em', textTransform: 'uppercase', border: 'none',
    borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
    borderRadius: '6px 6px 0 0', background: active ? '#f5f3ff' : 'transparent',
    color: active ? '#7c3aed' : '#888', cursor: 'pointer', marginBottom: -2, transition: 'all 0.15s',
  }),
  // Sub-tabs inside Ad Manager
  adSubTabBar:   { display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #ede9fe', background: '#f5f3ff', padding: '12px 16px 0', borderRadius: '10px 10px 0 0' },
  adSubTab: (active) => ({
    padding: '7px 16px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head, system-ui)',
    letterSpacing: '0.04em', textTransform: 'uppercase', border: 'none',
    borderBottom: active ? '2px solid #7c3aed' : '2px solid transparent',
    borderRadius: '4px 4px 0 0', background: active ? '#fff' : 'transparent',
    color: active ? '#7c3aed' : '#9ca3af', cursor: 'pointer', marginBottom: -2, transition: 'all 0.15s',
  }),
  card:          { background: '#fff', borderRadius: 10, border: '1px solid #dde3ec', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  adCard:        { background: '#fff', borderRadius: '0 0 10px 10px', border: '1px solid #ede9fe', borderTop: 'none', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  toolbar:       { padding: '12px 16px', borderBottom: '1px solid #eef0f4', display: 'flex', alignItems: 'center', gap: 10, background: '#f8f9fb', flexWrap: 'wrap' },
  featuredToolbar: { padding: '12px 16px', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', flexWrap: 'wrap' },
  adToolbar:     { padding: '12px 16px', borderBottom: '1px solid #ede9fe', display: 'flex', alignItems: 'center', gap: 10, background: '#faf9ff', flexWrap: 'wrap' },
  pillBar:       { padding: '8px 16px', borderBottom: '1px solid #eef0f4', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#fff' },
  featuredPillBar: { padding: '8px 16px', borderBottom: '1px solid #fde68a', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#fffdf5' },
  adPillBar:     { padding: '8px 16px', borderBottom: '1px solid #ede9fe', display: 'flex', gap: 6, flexWrap: 'wrap', background: '#faf9ff' },
  pill: (active, isFeatured, isAd) => ({
    padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
    border: active ? (isAd ? '1px solid #7c3aed' : isFeatured ? '1px solid #d97706' : '1px solid #1b3a5c') : '1px solid #dde3ec',
    background: active ? (isAd ? '#ede9fe' : isFeatured ? '#fef3c7' : '#e8edf5') : '#fff',
    color: active ? (isAd ? '#6d28d9' : isFeatured ? '#92400e' : '#1b3a5c') : '#888',
    transition: 'all 0.12s',
  }),
  searchInput:   { flex: 1, maxWidth: 300, padding: '7px 12px', borderRadius: 8, border: '1px solid #dde3ec', fontSize: 13, outline: 'none', fontFamily: 'inherit' },
  countBadge:    { fontSize: 12, color: '#888', marginLeft: 'auto', whiteSpace: 'nowrap' },
  table:         { width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'auto' },
  th: (sortable) => ({
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#666', background: '#f8f9fb', borderBottom: '1px solid #eef0f4',
    whiteSpace: 'nowrap', minWidth: 90, userSelect: 'none', cursor: sortable ? 'pointer' : 'default',
  }),
  featuredTh: (sortable) => ({
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#92400e', background: '#fffbeb', borderBottom: '1px solid #fde68a',
    whiteSpace: 'nowrap', minWidth: 90, userSelect: 'none', cursor: sortable ? 'pointer' : 'default',
  }),
  adTh: (sortable) => ({
    padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.06em', color: '#6d28d9', background: '#f5f3ff', borderBottom: '1px solid #ede9fe',
    whiteSpace: 'nowrap', minWidth: 90, userSelect: 'none', cursor: sortable ? 'pointer' : 'default',
  }),
  td:            { padding: '9px 14px', borderBottom: '1px solid #f0f2f6', verticalAlign: 'middle', color: '#1a1a2e', minWidth: 90 },
  featuredTd:    { padding: '9px 14px', borderBottom: '1px solid #fef3c7', verticalAlign: 'middle', color: '#1a1a2e', minWidth: 90 },
  adTd:          { padding: '9px 14px', borderBottom: '1px solid #f5f3ff', verticalAlign: 'middle', color: '#1a1a2e', minWidth: 90 },
  inlineInput:   { width: '100%', minWidth: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid transparent', fontSize: 13, fontFamily: 'inherit', background: 'transparent', outline: 'none', cursor: 'pointer', transition: 'all 0.15s' },
  inlineSelect:  { padding: '4px 8px', borderRadius: 6, border: '1px solid #dde3ec', fontSize: 12, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', outline: 'none' },
  dateInput:     { padding: '4px 8px', borderRadius: 6, border: '1px solid #dde3ec', fontSize: 12, fontFamily: 'inherit', background: '#fff', cursor: 'pointer', outline: 'none' },
  savingDot:     { color: '#f59e0b', fontSize: 11, marginLeft: 6 },
  savedDot:      { color: '#16a34a', fontSize: 11, marginLeft: 6 },
  errorDot:      { color: '#dc2626', fontSize: 11, marginLeft: 6 },
  boolBadge: (val) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: val ? '#dcfce7' : '#f1f5f9', color: val ? '#15803d' : '#64748b', cursor: 'pointer', userSelect: 'none', border: val ? '1px solid #86efac' : '1px solid #e2e8f0' }),
  approvalBadge: (val) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: val === 'approved' ? '#dcfce7' : val === 'seeded' ? '#eff6ff' : '#fef3c7', color: val === 'approved' ? '#15803d' : val === 'seeded' ? '#1d4ed8' : '#92400e', border: val === 'approved' ? '1px solid #86efac' : val === 'seeded' ? '1px solid #bfdbfe' : '1px solid #fcd34d' }),
  claimBadge: (val) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: val === 'resolved' ? '#dcfce7' : val === 'pending' ? '#fef3c7' : '#fee2e2', color: val === 'resolved' ? '#15803d' : val === 'pending' ? '#92400e' : '#991b1b', border: val === 'resolved' ? '1px solid #86efac' : val === 'pending' ? '1px solid #fcd34d' : '1px solid #fca5a5' }),
  reviewBadge: (val) => ({ display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: val === 'approved' ? '#dcfce7' : val === 'rejected' ? '#fee2e2' : '#fef3c7', color: val === 'approved' ? '#15803d' : val === 'rejected' ? '#991b1b' : '#92400e', border: val === 'approved' ? '1px solid #86efac' : val === 'rejected' ? '1px solid #fca5a5' : '1px solid #fcd34d' }),
  featuredDateBadge: { display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  expiredDateBadge:  { display: 'inline-block', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  passwordWrap:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9' },
  passwordCard:  { background: '#fff', borderRadius: 12, padding: '36px 40px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: 320, textAlign: 'center' },
}

// ── Helpers ──────────────────────────────────────────────────────────
function toDateInputValue(val) {
  if (!val) return ''
  const d = new Date(val)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function formatDateDisplay(val) {
  if (!val) return null
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isExpired(val) {
  if (!val) return false
  return new Date(val) < new Date()
}

function sortRows(rows, sortKey, sortDir, fields) {
  if (!sortKey) return rows
  const field = fields ? fields.find(f => f.key === sortKey) : null
  return [...rows].sort((a, b) => {
    let av = a[sortKey]
    let bv = b[sortKey]
    if (field && field.type === 'joined' && field.joinPath) {
      av = a[field.joinPath[0]] ? a[field.joinPath[0]][field.joinPath[1]] : null
      bv = b[field.joinPath[0]] ? b[field.joinPath[0]][field.joinPath[1]] : null
    }
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'boolean') av = av ? 1 : 0
    if (typeof bv === 'boolean') bv = bv ? 1 : 0
    const cmp = typeof av === 'number' && typeof bv === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
    return sortDir === 'asc' ? cmp : -cmp
  })
}

// ── Password gate ────────────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  function attempt() {
    if (val === ADMIN_PASSWORD) { sessionStorage.setItem('admin_unlocked', '1'); onUnlock() }
    else { setErr(true); setVal('') }
  }
  return (
    <div style={s.passwordWrap}>
      <div style={s.passwordCard}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        <div style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 700, color: '#1b3a5c', marginBottom: 6 }}>Admin Access</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Sandlot Source</div>
        <input type="password" value={val} autoFocus
          onChange={e => { setVal(e.target.value); setErr(false) }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="Password"
          style={{ ...s.searchInput, width: '100%', maxWidth: '100%', marginBottom: 12, boxSizing: 'border-box', border: err ? '1px solid #dc2626' : '1px solid #dde3ec' }}
        />
        {err && <div style={{ color: '#dc2626', fontSize: 12, marginBottom: 10 }}>Incorrect password</div>}
        <button onClick={attempt} style={{ width: '100%', padding: '10px', background: '#1b3a5c', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer' }}>
          Unlock
        </button>
      </div>
    </div>
  )
}

// ── Cell ─────────────────────────────────────────────────────────────
function Cell({ record, field, onSave, isFeaturedTab, isAdTab }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(record[field.key])
  const [status, setStatus]   = useState('')
  const fileInputRef          = useRef(null)

  async function save(newVal) {
    setStatus('saving')
    const update = {}
    update[field.key] = newVal || null
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
    if (error) { setStatus('error'); setTimeout(() => setStatus(''), 2000) }
    else { setStatus('saved'); onSave(record.id, field.key, newVal); setTimeout(() => setStatus(''), 1500) }
    setEditing(false)
  }

  const tdStyle = isAdTab ? s.adTd : isFeaturedTab ? s.featuredTd : s.td

  // joined read-only
  if (field.type === 'joined') {
    const [tableKey, colKey] = field.joinPath
    const displayVal = record[tableKey] ? record[tableKey][colKey] : null
    return <td style={{ ...tdStyle, fontWeight: 600, color: '#1b3a5c' }}>{displayVal || <span style={{ color: '#ccc' }}>—</span>}</td>
  }

  // date-readonly
  if (field.type === 'date-readonly') {
    return <td style={{ ...tdStyle, color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDateDisplay(record[field.key]) || '—'}</td>
  }

  // date-edit
  if (field.type === 'date-edit') {
    const expired = (field.key === 'featured_until' || field.key === 'end_at') && isExpired(val)
    const displayText = formatDateDisplay(val)
    return (
      <td style={tdStyle}>
        {editing ? (
          <input type="date" defaultValue={toDateInputValue(val)} autoFocus style={s.dateInput}
            onChange={e => { if (e.target.value) { setVal(e.target.value); save(e.target.value) } }}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} title="Click to edit">
            {displayText
              ? <span style={expired ? s.expiredDateBadge : s.featuredDateBadge}>{displayText}{expired ? ' ⚠' : ''}</span>
              : <span style={{ color: '#bbb', fontSize: 12 }}>Set date…</span>}
            {status === 'saving' && <span style={s.savingDot}>●</span>}
            {status === 'saved'  && <span style={s.savedDot}>●</span>}
            {status === 'error'  && <span style={s.errorDot}>●</span>}
          </span>
        )}
      </td>
    )
  }

  // stars
  if (field.type === 'stars') {
    const num = Number(record[field.key]) || 0
    return (
      <td style={tdStyle}>
        <span style={{ color: '#f59e0b', fontSize: 15, letterSpacing: 1 }}>
          {'★'.repeat(num)}<span style={{ color: '#e5e7eb' }}>{'★'.repeat(5 - num)}</span>
        </span>
      </td>
    )
  }

  // boolean
  if (field.type === 'boolean') {
    return (
      <td style={tdStyle}>
        <span style={s.boolBadge(val)} onClick={async () => {
          const next = !val; setVal(next); setStatus('saving')
          const update = {}; update[field.key] = next
          const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
          const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
          if (error) { setVal(!next); setStatus('error') } else { setStatus('saved'); onSave(record.id, field.key, next) }
          setTimeout(() => setStatus(''), 1500)
        }}>
          {val ? 'Yes' : 'No'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </span>
      </td>
    )
  }

  // select
  if (field.type === 'select') {
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    return (
      <td style={tdStyle}>
        <select value={val || ''} style={s.inlineSelect}
          onChange={async e => {
            const next = e.target.value; setVal(next); setStatus('saving')
            const update = {}; update[field.key] = next
            const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
            if (error) { setVal(record[field.key]); setStatus('error') } else { setStatus('saved'); onSave(record.id, field.key, next) }
            setTimeout(() => setStatus(''), 1500)
          }}>
          <option value="">—</option>
          {field.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        {status === 'saving' && <span style={s.savingDot}>●</span>}
        {status === 'saved'  && <span style={s.savedDot}>●</span>}
        {status === 'error'  && <span style={s.errorDot}>●</span>}
      </td>
    )
  }

  // multiselect
  if (field.type === 'multiselect') {
    const arr = Array.isArray(val) ? val : (val ? [val] : [])
    const cfg = Object.values(TABLE_CONFIG).find(c => c.fields.includes(field))
    return (
      <td style={tdStyle}>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 160 }}>
            {field.options.map(o => {
              const checked = arr.includes(o)
              return (
                <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: checked ? '#dbeafe' : '#f1f5f9', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', border: checked ? '1px solid #93c5fd' : '1px solid #e2e8f0' }}>
                  <input type="checkbox" checked={checked} style={{ margin: 0 }} onChange={async () => {
                    const next = checked ? arr.filter(x => x !== o) : [...arr, o]
                    setVal(next); setStatus('saving')
                    const update = {}; update[field.key] = next
                    const { error } = await supabase.from(cfg?.table || '').update(update).eq('id', record.id)
                    if (error) { setVal(arr); setStatus('error') } else { setStatus('saved'); onSave(record.id, field.key, next) }
                    setTimeout(() => setStatus(''), 1500)
                  }} />
                  {o}
                </label>
              )
            })}
            <button onClick={() => setEditing(false)} style={{ fontSize: 11, border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}>done</button>
          </div>
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {arr.length > 0
              ? arr.map(a => <span key={a} style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>{a}</span>)
              : <span style={{ color: '#ccc', fontSize: 12 }}>—</span>}
          </span>
        )}
        {status === 'saving' && <span style={s.savingDot}>●</span>}
        {status === 'saved'  && <span style={s.savedDot}>●</span>}
      </td>
    )
  }

  // email-link
  if (field.type === 'email-link') {
    return <td style={tdStyle}><a href={'mailto:' + (val || '')} style={{ color: '#1b3a5c', fontSize: 13 }}>{val || '—'}</a></td>
  }

  // image-upload (ads only)
  if (field.type === 'image-upload') {
    const publicUrl = val ? supabase.storage.from('ads').getPublicUrl(val).data.publicUrl : null
    return (
      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {publicUrl && (
            <img src={publicUrl} alt="ad creative" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 4, border: '1px solid #dde3ec' }} />
          )}
          <label style={{ cursor: 'pointer', fontSize: 11, color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: 6, padding: '4px 10px', background: '#f5f3ff', whiteSpace: 'nowrap' }}>
            {val ? 'Change' : 'Upload'}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files[0]
                if (!file) return
                setStatus('saving')
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
                const path = 'uploads/' + Date.now() + '_' + safeName
                const { data: uploadData, error: uploadError } = await supabase.storage.from('ads').upload(path, file, { upsert: false })
                if (uploadError) { setStatus('error'); setTimeout(() => setStatus(''), 2500); return }
                const { error: updateError } = await supabase.from('ads').update({ image_path: uploadData.path }).eq('id', record.id)
                if (updateError) { setStatus('error'); setTimeout(() => setStatus(''), 2500) }
                else { setVal(uploadData.path); onSave(record.id, 'image_path', uploadData.path); setStatus('saved'); setTimeout(() => setStatus(''), 2000) }
              }}
            />
          </label>
          {val && <span style={{ fontSize: 10, color: '#888', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val.split('/').pop()}</span>}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </div>
      </td>
    )
  }

  // text / number
  return (
    <td style={tdStyle}>
      {editing ? (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={val || ''} autoFocus
          style={{ ...s.inlineInput, border: '1px solid #93c5fd', background: '#f0f7ff', width: field.type === 'number' ? 70 : 'auto', minWidth: field.type === 'number' ? 70 : 100 }}
          onChange={e => setVal(field.type === 'number' ? Number(e.target.value) : e.target.value)}
          onBlur={() => save(val)}
          onKeyDown={e => { if (e.key === 'Enter') save(val); if (e.key === 'Escape') { setVal(record[field.key]); setEditing(false) } }}
        />
      ) : (
        <span onClick={() => setEditing(true)} style={{ cursor: 'text', display: 'block', minWidth: 40, color: val ? '#1a1a2e' : '#ccc' }} title="Click to edit">
          {val !== null && val !== undefined && val !== '' ? String(val) : '—'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </span>
      )}
    </td>
  )
}

// ── Ad Assignments sub-tab (custom — FK dropdowns) ───────────────────
function AssignmentsTab() {
  const [rows, setRows]           = useState([])
  const [adOptions, setAdOptions] = useState([])
  const [slotOptions, setSlotOptions] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [activePill, setActivePill] = useState('All')
  const [sortKey, setSortKey]     = useState(null)
  const [sortDir, setSortDir]     = useState('asc')

  const pills = [
    { label: 'All',      filterFn: () => true },
    { label: 'Active',   filterFn: r => r.is_active === true },
    { label: 'Inactive', filterFn: r => r.is_active === false },
    { label: 'Expired',  filterFn: r => r.end_at && new Date(r.end_at) < new Date() },
  ]

  const COLS = [
    { key: 'ad_id',             label: 'Ad',       type: 'fk-ad' },
    { key: 'slot_id',           label: 'Slot',     type: 'fk-slot' },
    { key: 'is_active',         label: 'Active',   type: 'boolean' },
    { key: 'priority_override', label: 'Priority', type: 'number' },
    { key: 'start_at',          label: 'Start',    type: 'date-edit' },
    { key: 'end_at',            label: 'End',      type: 'date-edit' },
    { key: 'notes',             label: 'Notes',    type: 'text' },
  ]

  useEffect(() => {
    setLoading(true)
    Promise.all([
      supabase.from('ad_assignments').select('*, ads(ad_name), ad_slots(slot_label, slot_key)').order('created_at', { ascending: false }),
      supabase.from('ads').select('id, ad_name').order('ad_name'),
      supabase.from('ad_slots').select('id, slot_label, slot_key').eq('is_active', true).order('slot_label'),
    ]).then(([{ data: assignments }, { data: ads }, { data: slots }]) => {
      setRows(assignments || [])
      setAdOptions((ads || []).map(a => ({ value: a.id, label: a.ad_name })))
      setSlotOptions((slots || []).map(sl => ({ value: sl.id, label: sl.slot_label + ' (' + sl.slot_key + ')' })))
      setLoading(false)
    })
  }, [])

  async function saveCell(id, key, newVal) {
    const update = {}; update[key] = newVal || null
    const { error } = await supabase.from('ad_assignments').update(update).eq('id', id)
    if (!error) setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: newVal } : r))
    return !error
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const currentPillFn = pills.find(p => p.label === activePill)?.filterFn || (() => true)

  const displayed = useMemo(() => {
    let result = rows.filter(r => {
      if (!currentPillFn(r)) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (r.ads?.ad_name || '').toLowerCase().includes(q)
        || (r.ad_slots?.slot_label || '').toLowerCase().includes(q)
        || (r.notes || '').toLowerCase().includes(q)
    })
    return sortRows(result, sortKey, sortDir, null)
  }, [rows, search, activePill, sortKey, sortDir])

  return (
    <div style={s.adCard}>
      <div style={s.adToolbar}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments…" style={s.searchInput} />
        <span style={s.countBadge}>{displayed.length} of {rows.length} records</span>
      </div>
      <div style={s.adPillBar}>
        {pills.map(p => (
          <button key={p.label} style={s.pill(activePill === p.label, false, true)} onClick={() => setActivePill(p.label)}>{p.label}</button>
        ))}
      </div>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No assignments found.</div>
        ) : (
          <table style={s.table}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {COLS.map(col => (
                  <th key={col.key} style={s.adTh(true)} onClick={() => handleSort(col.key)}>
                    {col.label}
                    {sortKey === col.key
                      ? <span style={{ color: '#7c3aed', marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                      : <span style={{ color: '#ccc', marginLeft: 4, fontSize: 10 }}>↕</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map(record => (
                <tr key={record.id} style={{ background: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#faf9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                >
                  {COLS.map(col => (
                    <AssignmentCell key={col.key} record={record} col={col} adOptions={adOptions} slotOptions={slotOptions} onSave={saveCell} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function AssignmentCell({ record, col, adOptions, slotOptions, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(record[col.key])
  const [status, setStatus]   = useState('')

  async function save(newVal) {
    setStatus('saving')
    const ok = await onSave(record.id, col.key, newVal)
    setStatus(ok ? 'saved' : 'error')
    setTimeout(() => setStatus(''), 1500)
    setEditing(false)
  }

  const td = s.adTd

  if (col.type === 'fk-ad' || col.type === 'fk-slot') {
    const opts    = col.type === 'fk-ad' ? adOptions : slotOptions
    const display = col.type === 'fk-ad' ? (record.ads?.ad_name || '—') : (record.ad_slots?.slot_label || '—')
    return (
      <td style={{ ...td, fontWeight: 600, color: '#1b3a5c' }}>
        {editing ? (
          <select value={val || ''} style={{ ...s.inlineSelect, minWidth: 200 }} autoFocus
            onChange={async e => { const next = e.target.value; setVal(next); await save(next) }}
            onBlur={() => setEditing(false)}
          >
            <option value="">— select —</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer' }} title="Click to change">
            {display}
            {status === 'saving' && <span style={s.savingDot}>●</span>}
            {status === 'saved'  && <span style={s.savedDot}>●</span>}
            {status === 'error'  && <span style={s.errorDot}>●</span>}
          </span>
        )}
      </td>
    )
  }

  if (col.type === 'boolean') {
    return (
      <td style={td}>
        <span style={s.boolBadge(val)} onClick={async () => {
          const next = !val; setVal(next); setStatus('saving')
          const ok = await onSave(record.id, col.key, next)
          if (!ok) setVal(!next)
          setStatus(ok ? 'saved' : 'error')
          setTimeout(() => setStatus(''), 1500)
        }}>
          {val ? 'Yes' : 'No'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
          {status === 'error'  && <span style={s.errorDot}>●</span>}
        </span>
      </td>
    )
  }

  if (col.type === 'date-edit') {
    const expired = col.key === 'end_at' && isExpired(val)
    const displayText = formatDateDisplay(val)
    return (
      <td style={td}>
        {editing ? (
          <input type="date" defaultValue={toDateInputValue(val)} autoFocus style={s.dateInput}
            onChange={e => { if (e.target.value) { setVal(e.target.value); save(e.target.value) } }}
            onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {displayText
              ? <span style={expired ? s.expiredDateBadge : s.featuredDateBadge}>{displayText}{expired ? ' ⚠' : ''}</span>
              : <span style={{ color: '#bbb', fontSize: 12 }}>Set date…</span>}
            {status === 'saving' && <span style={s.savingDot}>●</span>}
            {status === 'saved'  && <span style={s.savedDot}>●</span>}
            {status === 'error'  && <span style={s.errorDot}>●</span>}
          </span>
        )}
      </td>
    )
  }

  if (col.type === 'number') {
    return (
      <td style={td}>
        {editing ? (
          <input type="number" value={val || ''} autoFocus
            style={{ ...s.inlineInput, border: '1px solid #93c5fd', background: '#f0f7ff', width: 70, minWidth: 70 }}
            onChange={e => setVal(Number(e.target.value))}
            onBlur={() => save(val)}
            onKeyDown={e => { if (e.key === 'Enter') save(val); if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ cursor: 'text', display: 'block', color: val != null ? '#1a1a2e' : '#ccc' }}>
            {val != null ? String(val) : '—'}
            {status === 'saving' && <span style={s.savingDot}>●</span>}
            {status === 'saved'  && <span style={s.savedDot}>●</span>}
          </span>
        )}
      </td>
    )
  }

  // text / notes
  return (
    <td style={td}>
      {editing ? (
        <input type="text" value={val || ''} autoFocus
          style={{ ...s.inlineInput, border: '1px solid #93c5fd', background: '#f0f7ff', minWidth: 140 }}
          onChange={e => setVal(e.target.value)}
          onBlur={() => save(val)}
          onKeyDown={e => { if (e.key === 'Enter') save(val); if (e.key === 'Escape') { setVal(record[col.key]); setEditing(false) } }}
        />
      ) : (
        <span onClick={() => setEditing(true)} style={{ cursor: 'text', display: 'block', color: val ? '#1a1a2e' : '#ccc' }}>
          {val || '—'}
          {status === 'saving' && <span style={s.savingDot}>●</span>}
          {status === 'saved'  && <span style={s.savedDot}>●</span>}
        </span>
      )}
    </td>
  )
}

// ── Generic table view ───────────────────────────────────────────────
function AdminTable({ tabName, isAdTab }) {
  const cfg          = TABLE_CONFIG[tabName]
  const isFeaturedTab = FEATURED_TABS.includes(tabName)
  const pills        = QUICK_FILTERS[tabName] || []

  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activePill, setActivePill] = useState(pills[0]?.label || 'All')
  const [sortKey, setSortKey]       = useState(null)
  const [sortDir, setSortDir]       = useState('asc')

  useEffect(() => {
    setLoading(true)
    setSearch('')
    setSortKey(null)
    setSortDir('asc')
    setActivePill((QUICK_FILTERS[tabName] || [])[0]?.label || 'All')
    supabase
      .from(cfg.table)
      .select(cfg.selectQuery || '*')
      .order(cfg.orderBy, { ascending: cfg.ascending !== false })
      .then(({ data }) => { setRows(data || []); setLoading(false) })
  }, [tabName])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const currentPillFn = pills.find(p => p.label === activePill)?.filterFn || (() => true)

  const displayed = useMemo(() => {
    let result = rows.filter(r => {
      if (!currentPillFn(r)) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return Object.values(r).some(v => {
        if (v && typeof v === 'object') return Object.values(v).some(inner => inner && String(inner).toLowerCase().includes(q))
        return v && String(v).toLowerCase().includes(q)
      })
    })
    return sortRows(result, sortKey, sortDir, cfg.fields)
  }, [rows, search, activePill, sortKey, sortDir])

  function handleSave(id, key, val) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  function sortIndicator(key) {
    if (sortKey !== key) return <span style={{ color: '#ccc', marginLeft: 4, fontSize: 10 }}>↕</span>
    const color = isAdTab ? '#7c3aed' : isFeaturedTab ? '#d97706' : '#1b3a5c'
    return <span style={{ color, marginLeft: 4, fontSize: 10 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const nonSortable  = new Set(['multiselect', 'email-link', 'stars', 'image-upload'])
  const cardStyle    = isAdTab ? s.adCard : s.card
  const toolbarStyle = isAdTab ? s.adToolbar : isFeaturedTab ? s.featuredToolbar : s.toolbar
  const pillBarStyle = isAdTab ? s.adPillBar : isFeaturedTab ? s.featuredPillBar : s.pillBar
  const thFn         = isAdTab ? s.adTh : isFeaturedTab ? s.featuredTh : s.th

  return (
    <div style={cardStyle}>
      <div style={toolbarStyle}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'Search ' + tabName.toLowerCase() + '…'} style={s.searchInput} />
        <span style={s.countBadge}>{displayed.length} of {rows.length} records</span>
      </div>
      {pills.length > 0 && (
        <div style={pillBarStyle}>
          {pills.map(p => (
            <button key={p.label} style={s.pill(activePill === p.label, isFeaturedTab, isAdTab)} onClick={() => setActivePill(p.label)}>{p.label}</button>
          ))}
        </div>
      )}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading…</div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>No records match.</div>
        ) : (
          <table style={s.table}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                {cfg.fields.map(f => {
                  const sortable = !nonSortable.has(f.type)
                  return (
                    <th key={f.key} style={thFn(sortable)} onClick={sortable ? () => handleSort(f.key) : undefined} title={sortable ? 'Click to sort' : undefined}>
                      {f.label}{sortable && sortIndicator(f.key)}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {displayed.map(record => (
                <tr key={record.id}
                  style={{ background: isFeaturedTab && record.featured_status ? '#fffdf5' : '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background = isAdTab ? '#faf9ff' : isFeaturedTab ? '#fffbeb' : '#f8f9fb'}
                  onMouseLeave={e => e.currentTarget.style.background = isFeaturedTab && record.featured_status ? '#fffdf5' : '#fff'}
                >
                  {cfg.fields.map(field => (
                    <Cell key={field.key} record={record} field={field} onSave={handleSave} isFeaturedTab={isFeaturedTab} isAdTab={isAdTab} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Ad Manager wrapper with sub-tabs ─────────────────────────────────
function AdManagerTab() {
  const [adSubTab, setAdSubTab] = useState('Slots')
  return (
    <div>
      <div style={s.adSubTabBar}>
        {AD_SUBTABS.map(t => (
          <button key={t} style={s.adSubTab(adSubTab === t)} onClick={() => setAdSubTab(t)}>{t}</button>
        ))}
      </div>
      {adSubTab === 'Assignments'
        ? <AssignmentsTab key="assignments" />
        : <AdminTable key={adSubTab} tabName={adSubTab} isAdTab={true} />
      }
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(sessionStorage.getItem('admin_unlocked') === '1')
  const [activeTab, setActiveTab] = useState('Coaches')

  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />

  return (
    <div style={s.page}>
      <div style={s.header}>
        <span style={{ fontSize: 22 }}>⚾</span>
        <h1 style={s.headerTitle}>Sandlot Source</h1>
        <span style={s.headerBadge}>Admin</span>
        <button
          onClick={() => { sessionStorage.removeItem('admin_unlocked'); setUnlocked(false) }}
          style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
        >
          Log out
        </button>
      </div>
      <div style={s.body}>
        <div style={s.tabs}>
          {TABS.map(t => (
            <button
              key={t}
              style={
                FEATURED_TABS.includes(t) ? s.featuredTab(activeTab === t)
                : t === 'Ad Manager'      ? s.adTab(activeTab === t)
                : s.tab(activeTab === t)
              }
              onClick={() => setActiveTab(t)}
            >
              {FEATURED_TABS.includes(t) ? ('★ ' + t) : t === 'Ad Manager' ? ('◈ Ad Manager') : t}
            </button>
          ))}
        </div>
        {activeTab === 'Ad Manager'
          ? <AdManagerTab />
          : <AdminTable key={activeTab} tabName={activeTab} isAdTab={false} />
        }
      </div>
    </div>
  )
}
