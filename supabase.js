/* This file intentionally contains only browser-safe Supabase settings. */
window.gatherClient = window.supabase.createClient(
  'https://uuawulepyvycdcfgstig.supabase.co',
  'sb_publishable_UfmDIAp_3EQD-VMcHp8OHw_qmzBuNEW',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
