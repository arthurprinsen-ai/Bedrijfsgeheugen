# Personal LinkedIn source dedupe — current-main recovery

Production already contained `powerhouse_prepare_daily_content_fallbacks_v1(date)` with the source-level content-id dedupe, but clean Supabase replay proved the entire function was missing from canonical migrations.

The recovery now stores the full production-proven function definition in Git. It preserves:
- prior `linkedin_personal` content-id exclusion;
- the existing no-gap fallback behavior;
- `SECURITY DEFINER` with `search_path = public, pg_catalog`;
- EXECUTE denied to `public`, `anon`, and `authenticated`;
- EXECUTE granted only to `service_role`.

This removes the hidden runtime dependency rather than patching it.
