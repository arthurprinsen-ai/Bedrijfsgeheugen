# Daily blog Supabase Edge production-authority config closure — 23 October 2026
Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439
Existing source fixes #4723 (export) and #4725 (queue) were securely merged and independently deployed with active source readback; both continue with verify_jwt=false, matching their existing deployed configuration. The queue is not anonymous-writable: it checks the original x-powerhouse-token against bg_geheim before any mutation.

The independent protected-main authority [run 39904069313](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39904069313) failed closed because the deployed queue function was absent from supabase/config.toml. The exporter was also unregistered.

Register both existing function names and existing entrypoints in the canonical TOML; assert exact scope resolver and JWT/secret invariants in regression tests. No new function, runtime edit, token exposure, schedule, publisher or alternate publication flow. Re-run protected exact-head Required/CodeQL and verify subsequent Supabase Edge Production Authority byte-for-byte provider parity before marking the control green.
