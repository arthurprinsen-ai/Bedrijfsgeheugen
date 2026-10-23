# SaaS account gateway — delivery learning checkpoint (23 October 2026)

Obligation-ID: portal|saas-account|verified-checkout-to-customer-entry|20261023-v1
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Pull request: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4812
Immutable base: c51342ce05e6ae58b96e6860a358eee845b3bf92
Canonical owner: existing SaaS onboarding / Powerhouse CI / Portal authority

Observed: initial root `mijn-account.html` was unclassified and Required denied it (run 39977844111). Relocating the file to existing `pages/` restored classifier admission; later Required denied absent `activity_ledger,brain_learning,human_documentation` (run 39980483223). CodeQL was successful on older heads; Netlify preview was still failing. None of these are actual customer conversion or production release evidence.

Repair: use one canonical branch and GitHub PR; move the new static account page to `pages/mijn-account.html`, point only the verified Stripe checkout handoff to this page, read entitlements through an authenticated, read-only server route; deny anonymous, unconfirmed, mismatched, unknown-plan and inactive accounts. Add this immutable ledger, the Brain-learning fingerprint and customer-facing change note; replay the existing Node regression. Do not weaken Required, CodeQL, RLS or merge controls.

Current state: CANDIDATE_UNVERIFIED. Re-run exact-head CI, build and provider readback, prove actual independent customer sign-in/payment/scan flow; do not record sale until Stripe verifies it. On failure continue same obligation, no new scheduler or payment attempt.
