import { createClient } from '@supabase/supabase-js'

// The publishable key is designed to be public: Row Level Security in
// supabase/schema.sql is what protects the data. Never put the secret /
// service_role key in this app.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://ceelownmdkgttsglwgkx.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? 'sb_publishable_Ey4cjTd-nMOlKkUsHM05-Q_xKnux821'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const MEDIA_BUCKET = 'media'
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
