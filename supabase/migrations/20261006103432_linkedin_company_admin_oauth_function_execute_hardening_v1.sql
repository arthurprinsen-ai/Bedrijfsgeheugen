alter function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text)
  set search_path = public, pg_catalog;

revoke execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text)
  from public, anon, authenticated;

grant execute on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text)
  to service_role;
