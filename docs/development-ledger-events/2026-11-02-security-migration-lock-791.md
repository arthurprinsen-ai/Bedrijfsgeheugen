# 2026-11-02 — Supabase security migration lock provider reconciliation

Original BRAIN backend #41460310537 failed five assertions: #1114, #1116, #3690, #4582 and #5150, all requiring source-lock parity with production Supabase migration history. The triggering protected security PR #5307 and migration PR #5304 were not given false-green terminal status.

Independently read original Supabase provider ledger: 791 ordered migration identities. Git canonical `supabase/migration-history.lock.json` had 790, exact matching prefix; missing identity was exactly version `20261102141045`, name `writer_control_fixed_search_path_v1`. Existing executable SQL already has the exact version; production SQL Advisor showed zero mutable-search-path warnings on the three invoker functions.

Correction in this protected candidate: append only the source-verifiable 791st provider identity, refresh observed capture time, preserve the 790 historical identities, add a new Brain regression and one canonical learning record. Do not replay, re-number or replace migrations. No database DDL, grants, RLS, tokens, schedulers, Netlify deployments or customer data modified.

Original material change closure: learning + append-only event + human docs + current security skill. Exact Required/BRAIN/CodeQL and provider/readback gates must succeed before terminal proven closure. Failed original run is retained as learning evidence, never rewritten.
