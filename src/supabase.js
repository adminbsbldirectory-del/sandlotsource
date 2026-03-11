import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uphwnxgfutbmbjwjfkgu.supabase.co'
const supabaseAnonKey = 'sb_publishable_jfx5xgse3xv8KvYvsRDgQQ_BVMphtzW'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
