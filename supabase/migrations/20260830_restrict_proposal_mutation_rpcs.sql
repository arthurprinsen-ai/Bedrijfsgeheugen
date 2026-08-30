-- Restrict high-risk SECURITY DEFINER mutation RPCs to trusted server-side callers.

revoke all on function public.voorstel_afwijzen(uuid) from public, anon, authenticated;
revoke all on function public.voorstel_overnemen(uuid, text) from public, anon, authenticated;

grant execute on function public.voorstel_afwijzen(uuid) to service_role;
grant execute on function public.voorstel_overnemen(uuid, text) to service_role;
