# Development Ledger — 2026-10-30 ONE BRAIN one-loop assurance

- **Incident:** `powerhouse|one-brain|partial-loop-visibility-versus-canonical-15-loop-source|20261030-v1`; owner original ONE BRAIN/Heartbeat/Portal.
- **Observed:** source view 15 loops (9 green, 1 amber, 5 red), 32/32 architecture wired, 18/18 required jobs active, two current runtime errors, content duplicate and missing external provider/consent proof.
- **Cause:** source/release green was being displayed independently from mandatory per-loop guard truth, so "one organism" did not have a visible terminal status.
- **Fix source:** original view read via `brain/observability/one-loop-assurance-readback.mjs` and same Portal V2 admin identity via read-only `netlify/functions/powerhouse-one-loop-assurance.mjs`; aggregated on original Live view. No new state, provider token, scheduler, writer or publisher.
- **Protection:** 15 distinct rows/fresh <=20min; RED if any original RED; UNVERIFIED for incomplete/old/contradictory. No status DML, no LinkedIn repost or bypass of Instagram face/OAuth/blog approval.
- **Tests:** `tests/brain-one-loop-assurance-readback-20261030.test.mjs`; previous code/portal checks remain applicable but do not substitute for new Required/CodeQL exact-head.
- **Release:** PROTECTED_PR_CANDIDATE. Provider/Netlify/browsers must verify exact merge commit after required check. Original runtime guard RED may remain.
- **Human handoff:** [incident #4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918); authenticated portal status and original environment sources are authoritative; independent provider outcome remains unresolved when missing.
