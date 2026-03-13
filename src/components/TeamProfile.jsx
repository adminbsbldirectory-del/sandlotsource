import { useEffect } from 'react'

const STATUS_STYLE = {
  open:       { bg:'#DCFCE7', color:'#16A34A', label:'Open Tryouts' },
  closed:     { bg:'#FEE2E2', color:'#DC2626', label:'Closed' },
  by_invite:  { bg:'#FEF3C7', color:'#D97706', label:'By Invite' },
  year_round: { bg:'#DBEAFE', color:'#2563EB', label:'Year Round' },
  unknown:    { bg:'var(--lgray)', color:'var(--gray)', label:'Status Unknown' },
}

export default function TeamProfile({ team, onClose, onClaim }) {
  const statusInfo = STATUS_STYLE[team.tryout_status] || STATUS_STYLE.unknown

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position:'fixed', inset:0, zIndex:2000,
        background:'rgba(0,0,0,0.55)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        overflowY:'auto', padding:'24px 12px',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--white)', borderRadius:14,
          width:'100%', maxWidth:600,
          boxShadow:'0 8px 40px rgba(0,0,0,0.25)',
          overflow:'hidden',
        }}
      >
        {/* Header */}
        <div style={{ background:'var(--navy)', padding:'20px 24px', position:'relative' }}>
          <button
            onClick={onClose}
            style={{
              position:'absolute', top:14, right:16,
              background:'rgba(255,255,255,0.15)', border:'none',
              color:'white', borderRadius:20, width:30, height:30,
              cursor:'pointer', fontSize:16, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >✕</button>

          <div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:800, color:'white' }}>
            {team.name}
          </div>

          <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
            {/* Sport badge */}
            <span style={{
              background: team.sport === 'softball' ? '#7C3AED' : '#1D4ED8',
              color:'white', fontSize:11, fontWeight:700,
              padding:'3px 10px', borderRadius:20,
              textTransform:'uppercase', fontFamily:'var(--font-head)',
            }}>{team.sport}</span>

            {/* Age group */}
            {team.age_group && (
              <span style={{
                background:'rgba(255,255,255,0.15)', color:'white',
                fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                fontFamily:'var(--font-head)',
              }}>{team.age_group}</span>
            )}

            {/* Org affiliation */}
            {team.org_affiliation && (
              <span style={{
                background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.85)',
                fontSize:11, padding:'3px 10px', borderRadius:20,
              }}>{team.org_affiliation}</span>
            )}

            {/* Tryout status */}
            <span style={{
              background: statusInfo.bg, color: statusInfo.color,
              fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
              fontFamily:'var(--font-head)', textTransform:'uppercase', letterSpacing:'0.05em',
            }}>{statusInfo.label}</span>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Location */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:14 }}>
            {(team.city || team.county) && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span>📍</span>
                <span>{[team.city, team.county ? team.county + ' Co.' : null].filter(Boolean).join(', ')}, GA</span>
              </div>
            )}
          </div>

          {/* Tryout details */}
          {team.tryout_status === 'open' && (team.tryout_date || team.tryout_notes) && (
            <div style={{
              background:'#DCFCE7', borderRadius:10, padding:'14px 16px',
              borderLeft:'4px solid #16A34A',
            }}>
              <div style={{ fontWeight:700, color:'#15803D', fontSize:14, marginBottom:4 }}>🗓️ Tryout Information</div>
              {team.tryout_date && (
                <div style={{ color:'#15803D', fontSize:13 }}>
                  {new Date(team.tryout_date).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
                </div>
              )}
              {team.tryout_notes && (
                <div style={{ color:'#166534', fontSize:13, marginTop:4 }}>{team.tryout_notes}</div>
              )}
            </div>
          )}

          {/* Description */}
          {team.description && (
            <div style={{
              background:'var(--cream)', borderRadius:10, padding:'14px 16px',
              fontSize:14, color:'var(--navy)', lineHeight:1.6,
            }}>
              {team.description}
            </div>
          )}

          {/* Contact */}
          {(team.contact_name || team.contact_phone || team.contact_email) && (
            <div style={{
              paddingTop:16, borderTop:'2px solid var(--lgray)',
              display:'flex', flexDirection:'column', gap:6,
            }}>
              <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, color:'var(--navy)', marginBottom:4 }}>
                Contact
              </div>
              {team.contact_name && (
                <div style={{ fontSize:14, fontWeight:600, color:'var(--navy)' }}>
                  👤 {team.contact_name}
                </div>
              )}
              {team.contact_phone && (
                <a href={`tel:${team.contact_phone.replace(/\D/g,'')}`}
                  style={{ color:'var(--navy)', textDecoration:'none', fontWeight:600, fontSize:14 }}>
                  📞 {team.contact_phone}
                </a>
              )}
              {team.contact_email && (
                <a href={`mailto:${team.contact_email}`}
                  style={{ color:'#1D4ED8', textDecoration:'none', fontWeight:600, fontSize:14 }}>
                  📧 {team.contact_email}
                </a>
              )}
            </div>
          )}

          {/* Claim / Update CTA */}
          <div style={{
            marginTop:4, paddingTop:16, borderTop:'2px solid var(--lgray)',
            display:'flex', flexDirection:'column', gap:8,
          }}>
            <div style={{ fontSize:12, color:'#888', textAlign:'center' }}>
              Is this your team? Claim this listing to update contact info, tryout dates, and more.
            </div>
            <button
              onClick={() => { onClose(); onClaim && onClaim(team) }}
              style={{
                width:'100%', padding:'12px',
                background:'var(--red)', color:'white',
                border:'none', borderRadius:8,
                fontSize:15, fontWeight:700, cursor:'pointer',
                fontFamily:'var(--font-head)',
              }}
            >
              ✏️ Claim or Update This Listing
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
