import { useState } from 'react'
import { supabase } from '../supabase.js'

const SPECIALTIES = ['pitching','hitting','catching','fielding','speed','strength']
const COUNTIES = ['Cherokee','Cobb','DeKalb','Forsyth','Fulton','Gwinnett','Hall','Barrow','Oconee','Walton','Other']

const OPTIONS = [
  { id:'coach', icon:'🎯', title:'Coach Profile', description:'List your coaching services — pitching, hitting, catching, fielding, and more.', who:'For coaches & instructors', color:'#D42B2B' },
  { id:'team',  icon:'🏆', title:'Travel Team',   description:'Get your travel team in front of players and parents looking for a program.', who:'For coaches & team directors', color:'#1D4ED8' },
  { id:'player',icon:'🧢', title:'Player Need',   description:'Post a player looking for a team, or a team looking to fill a roster spot.', who:'For players & parents', color:'#F0A500' },
]

const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'2px solid var(--lgray)', fontSize:14, fontFamily:'var(--font-body)', outline:'none', boxSizing:'border-box' }
const labelStyle = { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', display:'block', marginBottom:5, color:'var(--navy)' }

function CoachForm({ onSuccess }) {
  const [form, setForm] = useState({ name:'', sport:'baseball', specialty:[], city:'', county:'', facility_name:'', phone:'', email:'', website:'', credentials:'', age_groups:'', price_per_session:'' })
  const [submitting, setSubmitting] = useState(false)
  function toggleSpec(s) { setForm(f => ({...f, specialty: f.specialty.includes(s) ? f.specialty.filter(x=>x!==s) : [...f.specialty, s]})) }
  async function submit() {
    if (!form.name || !form.city) { alert('Please fill in name and city.'); return }
    setSubmitting(true)
    setTimeout(() => { setSubmitting(false); onSuccess() }, 800)
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Full Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Coach's full name" style={inputStyle}/></div>
      <div><label style={labelStyle}>Sport *</label><select value={form.sport} onChange={e=>setForm(f=>({...f,sport:e.target.value}))} style={inputStyle}><option value="baseball">Baseball</option><option value="softball">Softball</option><option value="both">Both</option></select></div>
      <div><label style={labelStyle}>City *</label><input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="e.g. Alpharetta" style={inputStyle}/></div>
      <div><label style={labelStyle}>County</label><select value={form.county} onChange={e=>setForm(f=>({...f,county:e.target.value}))} style={inputStyle}><option value="">Select</option>{COUNTIES.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label style={labelStyle}>Facility / Academy</label><input value={form.facility_name} onChange={e=>setForm(f=>({...f,facility_name:e.target.value}))} placeholder="e.g. Grit Academy" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}>
        <label style={labelStyle}>Specialties</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
          {SPECIALTIES.map(s=><button key={s} onClick={()=>toggleSpec(s)} style={{ padding:'5px 12px', borderRadius:20, border:'2px solid', borderColor:form.specialty.includes(s)?'var(--red)':'var(--lgray)', background:form.specialty.includes(s)?'var(--red)':'white', color:form.specialty.includes(s)?'white':'var(--navy)', fontSize:12, textTransform:'capitalize', fontFamily:'var(--font-body)', cursor:'pointer' }}>{s}</button>)}
        </div>
      </div>
      <div><label style={labelStyle}>Phone</label><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="678-555-0101" style={inputStyle}/></div>
      <div><label style={labelStyle}>Email</label><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="coach@example.com" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Website or Social</label><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://yoursite.com" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Credentials & Background</label><textarea value={form.credentials} onChange={e=>setForm(f=>({...f,credentials:e.target.value}))} rows={3} placeholder="Playing/coaching background, certifications..." style={{...inputStyle, resize:'vertical'}}/></div>
      <div><label style={labelStyle}>Price per Session ($)</label><input value={form.price_per_session} onChange={e=>setForm(f=>({...f,price_per_session:e.target.value}))} placeholder="e.g. 70" style={inputStyle}/></div>
      <div><label style={labelStyle}>Age Groups</label><input value={form.age_groups} onChange={e=>setForm(f=>({...f,age_groups:e.target.value}))} placeholder="e.g. 10U-18U" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}>
        <button onClick={submit} disabled={submitting} style={{ background:'var(--red)', color:'white', border:'none', borderRadius:8, padding:'13px', width:'100%', cursor:'pointer', fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', opacity:submitting?0.7:1 }}>
          {submitting?'Submitting...':'Submit Coach Profile'}
        </button>
        <div style={{ fontSize:11, color:'var(--gray)', marginTop:8, textAlign:'center' }}>Reviewed before going live. Usually within 24–48 hours.</div>
      </div>
    </div>
  )
}

function TeamForm({ onSuccess }) {
  const [form, setForm] = useState({ name:'', sport:'baseball', org_affiliation:'', age_group:'', city:'', county:'', contact_name:'', contact_email:'', contact_phone:'', website:'', tryout_status:'closed', tryout_notes:'' })
  const [submitted, setSubmitted] = useState(false)
  if (submitted) return <div style={{ textAlign:'center', padding:'60px 20px' }}><div style={{ fontSize:48, marginBottom:16 }}>🏆</div><div style={{ fontFamily:'var(--font-head)', fontSize:22, fontWeight:700, color:'var(--navy)', marginBottom:8 }}>Team Submitted!</div><div style={{ color:'var(--gray)', fontSize:14 }}>We'll review and add your team shortly.</div></div>
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Team Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Cherokee Nationals 12U" style={inputStyle}/></div>
      <div><label style={labelStyle}>Sport *</label><select value={form.sport} onChange={e=>setForm(f=>({...f,sport:e.target.value}))} style={inputStyle}><option value="baseball">Baseball</option><option value="softball">Softball</option></select></div>
      <div><label style={labelStyle}>Age Group</label><select value={form.age_group} onChange={e=>setForm(f=>({...f,age_group:e.target.value}))} style={inputStyle}><option value="">Select</option>{['8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U'].map(a=><option key={a}>{a}</option>)}</select></div>
      <div><label style={labelStyle}>Organization</label><input value={form.org_affiliation} onChange={e=>setForm(f=>({...f,org_affiliation:e.target.value}))} placeholder="e.g. USSSA, PGF" style={inputStyle}/></div>
      <div><label style={labelStyle}>Tryout Status</label><select value={form.tryout_status} onChange={e=>setForm(f=>({...f,tryout_status:e.target.value}))} style={inputStyle}><option value="open">Open Tryouts</option><option value="closed">Closed</option><option value="by_invite">By Invite</option><option value="year_round">Year Round</option></select></div>
      <div><label style={labelStyle}>City *</label><input value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="e.g. Alpharetta" style={inputStyle}/></div>
      <div><label style={labelStyle}>County</label><select value={form.county} onChange={e=>setForm(f=>({...f,county:e.target.value}))} style={inputStyle}><option value="">Select</option>{COUNTIES.map(c=><option key={c}>{c}</option>)}</select></div>
      <div><label style={labelStyle}>Contact Name</label><input value={form.contact_name} onChange={e=>setForm(f=>({...f,contact_name:e.target.value}))} placeholder="Head coach or director" style={inputStyle}/></div>
      <div><label style={labelStyle}>Contact Phone</label><input value={form.contact_phone} onChange={e=>setForm(f=>({...f,contact_phone:e.target.value}))} placeholder="678-555-0101" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Contact Email</label><input value={form.contact_email} onChange={e=>setForm(f=>({...f,contact_email:e.target.value}))} placeholder="coach@example.com" style={inputStyle}/></div>
      <div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Website or Social</label><input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://yourteam.com" style={inputStyle}/></div>
      {form.tryout_status==='open'&&<div style={{ gridColumn:'1/-1' }}><label style={labelStyle}>Tryout Details</label><input value={form.tryout_notes} onChange={e=>setForm(f=>({...f,tryout_notes:e.target.value}))} placeholder="Date, location, what to bring..." style={inputStyle}/></div>}
      <div style={{ gridColumn:'1/-1' }}>
        <button onClick={()=>{ if(form.name&&form.city) setSubmitted(true); else alert('Please fill in team name and city.') }} style={{ background:'var(--navy)', color:'white', border:'none', borderRadius:8, padding:'13px', width:'100%', cursor:'pointer', fontFamily:'var(--font-head)', fontSize:15, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>Submit Team</button>
        <div style={{ fontSize:11, color:'var(--gray)', marginTop:8, textAlign:'center' }}>Reviewed before going live. Usually within 24–48 hours.</div>
      </div>
    </div>
  )
}

export default function CoachSubmitForm() {
  const [selected, setSelected] = useState(null)
  const [success, setSuccess] = useState(false)

  return (
    <div style={{ background:'var(--cream)', minHeight:'100vh' }}>
      <div style={{ maxWidth:820, margin:'0 auto', padding:'40px 20px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--gold)', marginBottom:8 }}>Add a Listing</div>
          <h1 style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:900, color:'var(--navy)', margin:0 }}>What are you adding?</h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--gray)', marginTop:10 }}>Free listings for coaches, teams, and player needs. No account required.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:14, marginBottom:36 }}>
          {OPTIONS.map(opt=>(
            <div key={opt.id} onClick={()=>{setSelected(opt.id);setSuccess(false)}} style={{ background:'var(--white)', border:`2px solid ${selected===opt.id?opt.color:'var(--lgray)'}`, borderRadius:12, padding:'20px', cursor:'pointer', transition:'all 0.15s', boxShadow:selected===opt.id?`0 0 0 4px ${opt.color}22`:'0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:28, marginBottom:10 }}>{opt.icon}</div>
              <div style={{ fontFamily:'var(--font-head)', fontSize:17, fontWeight:700, color:'var(--navy)', marginBottom:4 }}>{opt.title}</div>
              <div style={{ fontSize:12, color:'var(--gray)', lineHeight:1.5, marginBottom:8 }}>{opt.description}</div>
              <div style={{ fontSize:11, fontWeight:600, color:opt.color, textTransform:'uppercase', letterSpacing:'0.06em' }}>{opt.who}</div>
            </div>
          ))}
        </div>

        {selected && !success && (
          <div style={{ background:'var(--white)', borderRadius:12, border:'2px solid var(--lgray)', padding:'28px' }}>
            <div style={{ fontFamily:'var(--font-head)', fontSize:20, fontWeight:700, color:'var(--navy)', marginBottom:20 }}>
              {OPTIONS.find(o=>o.id===selected)?.icon} {OPTIONS.find(o=>o.id===selected)?.title}
            </div>
            {selected==='coach' && <CoachForm onSuccess={()=>setSuccess(true)} />}
            {selected==='team'  && <TeamForm  onSuccess={()=>setSuccess(true)} />}
            {selected==='player' && (
              <div>
                <p style={{ fontSize:13, color:'var(--gray)', marginBottom:16 }}>Player posts go live immediately and expire after 30 days.</p>
                <div style={{ background:'#FEF3C7', borderRadius:8, padding:'16px', fontSize:13, color:'#92400e' }}>
                  <strong>Quick tip:</strong> Use the <strong>Player Needs</strong> tab in the nav to post directly — it's instant with no review wait.
                </div>
              </div>
            )}
          </div>
        )}

        {success && (
          <div style={{ textAlign:'center', padding:'60px 20px', background:'var(--white)', borderRadius:12, border:'2px solid var(--lgray)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:700, color:'var(--navy)', marginBottom:8 }}>Submitted!</div>
            <div style={{ color:'var(--gray)', fontSize:14 }}>We'll review and add it to the directory shortly.</div>
          </div>
        )}
      </div>
    </div>
  )
}
