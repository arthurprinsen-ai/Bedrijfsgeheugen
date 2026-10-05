-- Close the remaining SECURITY DEFINER exposure reported by Supabase advisors.
revoke execute on function public.bg_klik_vastleggen(text, text) from public, anon, authenticated;
grant execute on function public.bg_klik_vastleggen(text, text) to service_role;
