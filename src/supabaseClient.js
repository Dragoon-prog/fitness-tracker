import { createClient } from '@supabase/supabase-js'

// You find these in Supabase > Settings > API
const supabaseUrl = 'https://jsdgjvpdzhagtjrdrtod.supabase.co/rest/v1/'
const supabaseAnonKey = 'sb_publishable_AWYhp_xRrtkdr0-Hiijjkw_QC58ztmK'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)