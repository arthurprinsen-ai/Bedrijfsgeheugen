# 2026-10-05 — Production locale verifier state repair

- Type: DELIVERY_VERIFICATION_FIX
- Fingerprint: `powerhouse|production-i18n-verifier-state|v1`
- Trigger: Production Source Snapshot run 37293840886 deployed exact main SHA successfully but failed its final pricing/i18n browser proof.
- Observed failure: `page.waitForURL` timed out while switching locale.
- Live evidence: the production English pricing route `/en/prijzen` serves translated English content and Netlify production is exact SHA `1cc8807b7afa1f69d72287d26bcedeba92d786e3`.
- Root cause: verifier coupled a user-visible state transition to a classical navigation event.
- Structural fix: after activating the visible language control, poll for the expected pathname and `html[lang]`; retain all content and round-trip assertions.
- Scope: verifier only; no production pricing or locale feature behavior is relaxed.
