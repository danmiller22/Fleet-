import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export async function fetchDeliveriesSafe() {
  if (!supabase) return { data: null, error: new Error('Supabase env not configured') }
  try {
    const { data, error } = await supabase
      .from('deliveries')
      .select('id,fleetId,fleet,status,phone')
      .limit(100)
    return { data, error }
  } catch (e) {
    return { data: null, error: e }
  }
}

