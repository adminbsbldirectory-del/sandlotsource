const APP_USER_AGENT =
  'SandlotSource/1.0 (+https://sandlotsource.com; contact: admin@sandlotsource.com)'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const q = String(req.query?.q || '').trim()
  if (!q) {
    return res.status(400).json({ error: 'Missing q parameter.' })
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('addressdetails', '1')
    url.searchParams.set('countrycodes', 'us')
    url.searchParams.set('limit', '10')
    url.searchParams.set('q', q)

    const upstream = await fetch(url.toString(), {
      headers: {
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'User-Agent': APP_USER_AGENT,
        Referer: 'https://sandlotsource.com',
      },
    })

    const text = await upstream.text()

    if (!upstream.ok) {
      console.error('geocode-address upstream error:', upstream.status, text)
      return res.status(upstream.status).json({
        error: 'Upstream geocoder failed',
        status: upstream.status,
      })
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (err) {
      console.error('geocode-address parse error:', err, text)
      return res.status(500).json({ error: 'Failed to parse geocoder response' })
    }

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    return res.status(200).json(Array.isArray(data) ? data : [])
  } catch (err) {
    console.error('geocode-address proxy error:', err)
    return res.status(500).json({
      error: 'Geocode proxy failed',
      detail: err.message || 'Unknown error',
    })
  }
}