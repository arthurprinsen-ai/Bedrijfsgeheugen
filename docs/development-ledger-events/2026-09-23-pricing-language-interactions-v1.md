# 2026-09-23 — Pricing and language interaction incident

User screenshots from iPhone Safari showed that visible lifecycle/billing controls were inert and the NL/EN selector failed. Root cause analysis separated this into DOM listener lifetime and offline static-route availability. The candidate moves pricing interactions to delegated document-level handlers and makes the canonical language switch independent of optional /en build output.

Production closure remains pending protected CI, mobile browser interaction checks, merge, exact-SHA Netlify deployment and public readback.
