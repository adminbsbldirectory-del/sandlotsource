import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { data, error } = await supabase
      .from('claim_requests')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('admin-claim-requests load error:', error)
      return res.status(500).json({ error: 'Failed to load claim requests.' })
    }

    return res.status(200).json({ rows: data || [] })
  } catch (error) {
    console.error('admin-claim-requests unexpected error:', error)
    return res.status(500).json({ error: 'Unexpected error loading claim requests.' })
  }
}