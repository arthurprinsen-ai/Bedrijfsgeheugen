# SaaS runtime readback recovery

Obligation-ID: saas-customer-loop-20261021-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Original implementation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4571
Production implementation SHA: 382193003400bae246e115d4a3005f537483b90e

The original exact-head Required, CodeQL, browser and Netlify preview passed. Protected merge succeeded. The canonical scan production proof and native Supabase Edge attestation passed. Terminalizer run 39553536765 then correctly refused unknown paths: afsluiten.html, zelfscan.html, tools/bouw-v18-production-core.mjs and tools/controleer-technische-seo.mjs. The canonical contract had omitted those known files.

The smallest repair adds only the two root HTML files and actual V18 output generator to Netlify runtime paths, and the exact technical SEO validator to verifier-only paths. No wildcard, runtime suppression, scheduler, second deployment route or weakened unknown-path check is introduced. Regression tests failed before the contract change and pass after it. They are executed through the existing SaaS admission regression wrapper.

After protected merge of this recovery, replay PR #4571 using the existing terminalizer on current main. Retain the original source/provider lineage and do not manufacture provider evidence. This is a continuation of the same obligation. Stripe live payment acceptance still requires the absent site/shared STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET and authorised customer sessions. Secure Stripe connection was initiated; it is not yet active. No charge or fake paid subscription was created.

The previous change document counted 27 build phases; the final exact-head build profile actually reports 26 timed phases, all successful. The complete portal suite passed 595/595 and backend lane suite 198/198.

Verification scope: 34 focused SaaS/scope/replay tests pass. A wider 59-test run found two pre-existing stale source assertions in tests/brain-terminalizer-quality-surface-governance-v1.test.mjs: “migration runtime requires explicit provider-applied evidence” and “migration-history lock is verifier-only evidence while executable migrations stay provider-readback”. Both also fail on the unchanged pre-recovery tree; no workflow or migration behavior was changed or suppressed. They remain recorded rather than being counted green.
