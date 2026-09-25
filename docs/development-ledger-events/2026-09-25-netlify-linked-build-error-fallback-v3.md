# Development ledger — Netlify linked-build error fallback v3

- Date: 2026-09-25
- Current-main base: 66f5051ea8bc299acdd4bef89183bc48f665aeb0
- Predecessor #2975 became stale after main advanced and was repeatedly cancelled by terminal delivery governance.
- Safety decision: do not force or rebase over concurrent main changes; replay only the four proven recovery artifacts onto current main.
- Root cause: linked Netlify repository build state=error exited delivery before the existing authorized exact-source upload fallback could run.
- Fix: log linked build/deploy evidence, set linked_fallback=true, continue to canonical exact-source transport.
- Terminal safety remains unchanged: provider ready, exact production SHA, pricing content and production browser readback are still mandatory.
- Regression: tests/brain-netlify-linked-build-error-fallback-v2.test.mjs
- Terminal state: pending protected gates, merge, exact Netlify production identity and readback.
