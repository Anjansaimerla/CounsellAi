import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  supabaseUrl !== 'https://your-supabase-project.supabase.co' &&
  serviceRoleKey !== 'your-supabase-service-role-key'
);

export const supabaseAdmin = isSupabaseServerConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
