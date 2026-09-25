# Development ledger — personal LinkedIn source dedupe recovery

- Source PR: #2569.
- Production readback: fallback function exists and excludes previously used personal LinkedIn `content_id`.
- Production privileges: anon=false, authenticated=false, service_role=true.
- Clean preview readback before recovery: function absent.
- Root cause: production hotfix existed outside canonical migration history.
- Recovery: full production-proven function definition + regression + learning/docs, not a delta patch.
- Terminal proof target: clean hosted Supabase replay, protected merge, production function parity readback.
