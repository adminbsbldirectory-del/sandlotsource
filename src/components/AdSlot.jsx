import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'

function isWithinDateRange(startAt, endAt) {
  const now = new Date()

  if (startAt) {
    const start = new Date(startAt)
    if (now < start) return false
  }

  if (endAt) {
    const end = new Date(endAt)
    if (now > end) return false
  }

  return true
}

export default function AdSlot({ slotKey, style = {}, className = '' }) {
  const [ad, setAd] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function fetchAd() {
      setLoading(true)

      const { data, error } = await supabase
        .from('ad_assignments')
        .select(`
          id,
          is_active,
          start_at,
          end_at,
          ads!inner (
            id,
            ad_name,
            status,
            approval_status,
            is_active,
            target_url,
            alt_text,
            image_path,
            image_url,
            start_at,
            end_at
          ),
          ad_slots!inner (
            id,
            slot_key,
            is_active
          )
        `)
        .eq('is_active', true)
        .eq('ad_slots.slot_key', slotKey)
        .eq('ad_slots.is_active', true)
        .eq('ads.is_active', true)
        .eq('ads.approval_status', 'approved')
        .eq('ads.status', 'live')
        .limit(1)


      if (ignore) return

      if (error) {
        console.error('AdSlot fetch error:', error)
        setAd(null)
        setLoading(false)
        return
      }

      const match = (data || []).find((row) => {
        const assignmentOk = isWithinDateRange(row.start_at, row.end_at)
        const adOk = isWithinDateRange(row.ads?.start_at, row.ads?.end_at)
        return assignmentOk && adOk
      })


      if (!match?.ads) {
        setAd(null)
        setLoading(false)
        return
      }

      let finalImageUrl = null

      if (match.ads.image_path) {
        const { data: publicUrlData } = supabase
          .storage
          .from('ads')
          .getPublicUrl(match.ads.image_path)

        finalImageUrl = publicUrlData?.publicUrl || null
      } else if (match.ads.image_url) {
        finalImageUrl = match.ads.image_url
      }


      if (!finalImageUrl) {
        setAd(null)
        setLoading(false)
        return
      }

      setAd({
        id: match.ads.id,
        name: match.ads.ad_name || 'Sponsored',
        imageUrl: finalImageUrl,
        targetUrl: match.ads.target_url || null,
        altText: match.ads.alt_text || match.ads.ad_name || 'Sponsored advertisement',
      })

      setLoading(false)
    }

    if (slotKey) {
      fetchAd()
    } else {
      setAd(null)
      setLoading(false)
    }

    return () => {
      ignore = true
    }
  }, [slotKey])

    if (loading) return null
    if (!ad) return null

    return (
    <div
      className={className}
      style={{
        width: '100%',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        ...style,
      }}
    >
      {ad.targetUrl ? (
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ad.altText}
          style={{
            display: 'block',
            textDecoration: 'none',
          }}
        >
          <img
            src={ad.imageUrl}
            alt={ad.altText}
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              objectFit: 'contain',
              background: '#fff',
            }}
          />
        </a>
      ) : (
        <img
          src={ad.imageUrl}
          alt={ad.altText}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            background: '#fff',
          }}
        />
      )}
    </div>
  )
}