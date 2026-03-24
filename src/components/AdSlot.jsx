import { useEffect } from 'react'

/**
 * AdSlot — three modes:
 *
 *  1. Placeholder  (no ad props)             -> labeled dashed box
 *  2. Direct sponsor (imageUrl + linkUrl)     -> clickable <a><img> banner
 *  3. Google AdSense (adsenseSlotId)          -> programmatic unit
 *
 * Usage:
 *   <AdSlot position="leaderboard-top" />
 *   <AdSlot position="leaderboard-top" imageUrl="https://..." linkUrl="https://dsg.com" altText="DSG" />
 *   <AdSlot position="leaderboard-top" adsenseClient="ca-pub-XXXXXXXX" adsenseSlotId="1234567890" />
 */

const SLOT_CONFIG = {
  // ── Full-width leaderboards ──────────────────────────────────────────────
  'leaderboard-top': {
    minH: 72, maxH: 250, w: '100%',
    label: 'Top banner - 728x90 - 970x250',
    example: "Dick's Sporting Goods - Rawlings - Perfect Game - USSSA",
  },
  'leaderboard-mid': {
    minH: 72, maxH: 100, w: '100%',
    label: 'Mid-page banner - 728x90',
    example: 'Academy Sports - Easton - local coaching academy',
  },
  'leaderboard-prefooter': {
    minH: 72, maxH: 250, w: '100%',
    label: 'Pre-footer banner - 728x90',
    example: 'County sponsor - State org - Equipment brand',
  },

  // ── Rail squares (300x300) — left and right columns ───────────────────
  'rail-left-sq1': {
    minH: 300, maxH: 300, w: 300,
    label: 'Left rail - 300x300',
    example: "Dick's Sporting Goods - Rawlings - Perfect Game",
  },
  'rail-left-sq2': {
    minH: 300, maxH: 300, w: 300,
    label: 'Left rail - 300x300',
    example: 'Travel orgs - Academies - County sponsors',
  },
  'rail-right-sq1': {
    minH: 300, maxH: 300, w: 300,
    label: 'Right rail - 300x300',
    example: "Dick's Sporting Goods - Rawlings - Perfect Game",
  },
  'rail-right-sq2': {
    minH: 300, maxH: 300, w: 300,
    label: 'Right rail - 300x300',
    example: 'Travel orgs - Academies - County sponsors',
  },

  // ── Mobile inline units ───────────────────────────────────────────────
  'mobile-inline-top': {
    minH: 50, maxH: 100, w: '100%',
    label: 'Mobile top - 320x50',
    example: 'Top mobile sponsor',
  },
  'mobile-inline-mid': {
    minH: 50, maxH: 250, w: '100%',
    label: 'Mobile mid - 300x250',
    example: 'Mid-page mobile sponsor',
  },
  'mobile-inline-lower': {
    minH: 50, maxH: 100, w: '100%',
    label: 'Mobile lower - 320x50',
    example: 'Lower mobile sponsor',
  },

  // ── Legacy / direct-sale sidebar slots (kept for backwards compat) ────
  'sidebar-half-page': {
    minH: 260, maxH: 300, w: 180,
    label: 'Sidebar - 160x300',
    example: 'Travel orgs - Academies - County sponsors',
  },
  'sidebar-square': {
    minH: 200, maxH: 250, w: 180,
    label: 'Sidebar - 160x200',
    example: 'Local businesses - Batting cages - Equipment shops',
  },
  'inline-rectangle': {
    minH: 72, maxH: 100, w: '100%',
    label: 'Inline - 468x60',
    example: 'Academy Sports - Easton - local academy',
  },
}

export default function AdSlot({
  position = 'leaderboard-top',
  imageUrl,
  linkUrl,
  altText,
  adsenseClient,
  adsenseSlotId,
  style = {},
}) {
  const cfg = SLOT_CONFIG[position] || SLOT_CONFIG['leaderboard-top']

  const base = {
    width: cfg.w,
    minHeight: cfg.minH,
    maxHeight: cfg.maxH,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    ...style,
  }

  useEffect(() => {
    if (adsenseSlotId) {
      try {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      } catch (e) {
        console.warn('AdSense push failed:', e)
      }
    }
  }, [adsenseSlotId])

  if (adsenseSlotId) {
    return (
      <div style={base}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight: cfg.minH }}
          data-ad-client={adsenseClient}
          data-ad-slot={adsenseSlotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    )
  }

  if (imageUrl && linkUrl) {
    return (
      <div style={base}>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          aria-label={altText || 'Sponsor advertisement'}
        >
          <img
            src={imageUrl}
            alt={altText || 'Sponsor'}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </a>
      </div>
    )
  }

  // Placeholder
  return (
    <div
      style={{
        ...base,
        border: '1.5px dashed #d0d0c8',
        background: '#fafaf8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '10px 12px',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#bbb',
          textAlign: 'center',
        }}
      >
        {cfg.label}
      </span>
      {cfg.example && (
        <span
          style={{
            fontSize: 10,
            color: '#ccc',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {cfg.example}
        </span>
      )}
    </div>
  )
}
