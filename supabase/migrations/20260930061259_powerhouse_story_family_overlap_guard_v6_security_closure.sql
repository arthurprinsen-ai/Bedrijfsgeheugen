REVOKE EXECUTE ON FUNCTION public.powerhouse_publication_story_family_guard_v2() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_publication_story_family_guard_v2() TO service_role;
REVOKE EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) TO service_role;
