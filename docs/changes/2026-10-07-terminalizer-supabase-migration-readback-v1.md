# Terminalizer Supabase migration provider readback

Merged PR #4049 was production-correct but its post-merge terminalizer failed with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` because the classifier understood Supabase Edge source and Netlify runtime, but not an ordinary `supabase/migrations/*.sql` runtime change.

Production had already applied migration `20261007101156_close_current_set_provider_errors_v1`. The live system subsequently produced repeated VERIFIED commercial heartbeat receipts and a fresh 10:27–10:38 UTC application window with zero HTTP 401, 500, 503 or 522 responses.

This change adds a dedicated migration readback class. A changed migration is terminal only when the target merged PR contains a machine-readable `Terminal-Supabase-Migration-Readback` line with the exact migration version and name, `state=APPLIED`, the canonical Supabase project ref and a UTC observation timestamp. The readback is copied into immutable terminal evidence.

Supabase Edge functions still require provider version/runtime-hash evidence. Netlify runtime still requires production release/content readback. Any backend path outside these explicit authorities remains fail-closed.
