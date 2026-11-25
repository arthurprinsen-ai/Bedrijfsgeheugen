# Growth-drain pointer race ledger — 25 October 2026

- Obligation-ID: `netlify|growth-drain|concurrent-pointer-retirement-proof|20261025-v1`.
- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4446
- Commercial P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Evidence: independent Netlify growth-drain 15:51–15:55 UTC, 2–3 overlapping executions per minute, 3–7 invalid-index flags on the partial runs with 3–4 events persisted and no source missing or providerFailed
- Root hypothesis: concurrent retirement of temporary `pending/` pointer after index list snapshot but before `get`.
- Technical correction: successful null `get` is benign concurrency, thrown `get` is an error, corrupted non-null pointer stays an error; keep source records and cron.
- Regression: `node --test tests/brain-growth-drain-time-budget-v1.test.mjs` and full Required+CodeQL+Netlify.
- Terminal proof: protected release matching production SHA, independent minute `indexPointerGone` counter, persisted events and no false 503; qualified conversions and paid invoices separately.

- CI-failed replay repaired: exclude indexed `pending/` keys from legacy fallback to prevent duplicate read-failure counts; historical event sources still processed.
