# SaaS account gateway — delivery learning checkpoint (23 October 2026)

Obligation-ID: portal|saas-account|verified-checkout-to-customer-entry|20261023-v1
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Pull request: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4812
Immutable base: c51342ce05e6ae58b96e6860a358eee845b3bf92
Canonical owner: existing SaaS onboarding / Powerhouse CI / Portal authority

Observed: initial root `mijn-account.html` was unclassified and Required denied it (run 39977844111). Relocating the file to existing `pages/` restored classifier admission; later Required denied absent `activity_ledger,brain_learning,human_documentation` (run 39980483223). CodeQL was successful on older heads; Netlify preview was still failing. None of these are actual customer conversion or production release evidence.

Repair: use one canonical branch and GitHub PR; move the new static account page to `pages/mijn-account.html`, point only the verified Stripe checkout handoff to this page, read entitlements through an authenticated, read-only server route; deny anonymous, unconfirmed, mismatched, unknown-plan and inactive accounts. Add this immutable ledger, the Brain-learning fingerprint and customer-facing change note; replay the existing Node regression. Do not weaken Required, CodeQL, RLS or merge controls.

Current state: CANDIDATE_UNVERIFIED. Re-run exact-head CI, build and provider readback, prove actual independent customer sign-in/payment/scan flow; do not record sale until Stripe verifies it. On failure continue same obligation, no new scheduler or payment attempt.

Additional failure observed on Required run 39980962268: the extra `netlify/functions/saas-my-account.mjs` filename changed the repository-backed portal explanation inventory; build/Required stopped with SYSTEM_MAP_WRITEBACK_INCOMPLETE. Correct root cause by reusing the existing portal-entitlements function with two explicit Netlify path patterns and deleting the duplicate file, preserving the baseline function inventory and avoiding a shared System Map writer conflict. Keep both routes bound to the same verified auth/tenant/plan handler; the original portal route retains its existing organisation_id response.

Required preflight (run 39981600704) exposed a genuine public SEO contract breach: a literal checkout anchor pointed at the intentionally noindex /pages/mijn-account.html. Keep private auth pages noindex; make the post-ready checkout continuation a keyboard-accessible button whose click handler opens the absolute account URL, without adding a crawlable public anchor or weakening the SEO gate. Regression extends the existing SaaS account test; no payment is made by this action.

Required run 39982018200 independently passed technical SEO but stopped at fail-closed static NL/EN cache: one uncached checkout label `Verder naar mijn account →`. Reuse the previously shipped, translated `Verder naar mijn portaal →` within the keyboard-accessible private-account handoff. Do not lower i18n quality or network-fallback protection; only claim completion after exact-head build.

Before the pending browser job completed, confirmed existing `tools/site-shell/checkout-browser-check.mjs` verifies `#checkoutContinue a` becomes visible after server readiness. A button-only replacement would have broken that invariant. Retain the anchor with no static href and assign its complete HTTPS destination exclusively inside the `ready===true` branch; public SEO sees no nonindexable anchor and paid access is not offered prior to verification. Re-run exact-head browser tests; previous passing checks belong to the predecessor SHA.
