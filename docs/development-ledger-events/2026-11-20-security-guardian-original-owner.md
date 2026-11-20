# Security Guardian activity ledger — 20 November 2026

Owner: original `agent-security` / original ONE BRAIN / Powerhouse / Heartbeat.
Obligation: `security-guardian-continuous-20261120`.
Fingerprint: `security|original-agent|multi-site-periodic-guardian-trust-evidence|20261120-v1`.

## Source context

Sixteen Netlify management-plane site projects inventoried, including the PW site with two field/zaal URLs. Seven other URLs may be active test or archive sites. Original `security-operations-proof.yml` checked production HTTP controls weekly, while the customer Trust Center already used authenticated tenant isolation and provider observation timestamps. No parallel agent or scheduler is authorized.

## Implementation / evidence

- Reuse original existing Security Operations workflow, adding periodic 15-minute bounded read-only probes. Keep existing weekly DR/IAM proof.
- Permit only 17 pinned owned HTTPS routes plus four historically sensitive source-file HTTP 404 negative checks; use GET fallback only if HEAD not supported, two retries, no destructive scans.
- Publish sanitized readback with 45-minute expiry through new Netlify function with RS256 signed GitHub Actions OIDC verified against JWKS, pinned repo/workflow/main branch/audience. Private tenant API and EU security observation still use existing server credentials. Never place bearer values in public code.
- Customer Trust Center projects only coarse signed platform status, latest verified timestamp and reduced-motion pulsing green; red/amber/grey are required when degraded/missing.
- Deduplicated generic GitHub issues act as non-sensitive Engineering handoff requests, not proof of execution. Every material code or provider action remains on existing protected approval route.
- Add regression tests for tampered OIDC signature, missing four source checks, unauthorized URLs, stale green and duplicate security incidents.
- CI test first rejected coach mode and omitted pass-404 counts. These were fixed; branch contract subsequently passed (GitHub Actions run 44825948677).
- The existing protected Required gate then rejected unclassified new test path; classify it under existing backend lane. The subsequent Required gate requested this canonical activity ledger and learning record. Neither gate was bypassed.

## Live acceptance — unresolved

Current branch is a PR candidate. Do NOT claim active periodic guard until exact main protected merge, required CodeQL and test passes, Netlify CURRENT/READY, original scheduled OIDC ingestion 2xx + readback, and customer-portal heartbeat are independently confirmed. Leave original security obligations OPEN. A 15-minute GitHub schedule is periodic and best-effort, not continuous packet monitoring or a proof of absence of intrusion.

Security advisor: 188 `rls_enabled_no_policy` INFO and one intentional token-protected anon-executable SECURITY DEFINER cron WARN remain separately open for controlled analysis; no grant was blindly revoked. All public GitHub data may be replicated and retains historical objects.
