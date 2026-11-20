# Security Guardian — existing ONE BRAIN / Powerhouse / Heartbeat security owner
Date: 20 November 2026 · owner: **agent-security** (existing 14-agent fabric)

## Goal and strict limits
One canonical Security Operations workflow checks the **16 currently inventoried Netlify projects**. PW Zaalcoach and Veldcoach are separate routes of one Netlify project, so the bounded public inventory has 17 URLs. Four additional defensive 404 checks protect historical source exposure, making 21 distinct HTTP observations per tick. New projects MUST be added after an authorized Netlify management-plane reconciliation; the inventory is not automatically exhaustive of future projects.

Use the existing GitHub Security Operations Proof workflow, not a new agent, new scheduler, Make, Buffer, shadow incident executor or public data writer. Add 15-minute scheduled checks (GitHub Actions schedules are best-effort, not continuous real-time sensor telemetry) and retain the original weekly broader security/DR contract. The monitor is read-only, bounded to owned HTTPS hostnames; transient requests are retried twice before raising an issue.

The resulting status is scoped to **these measured HTTP and source-exposure controls**, not overall immunity to hacks. CodeQL, Supabase RLS, privileged RPC, IAM/MFA, access logging, WAF/bot controls, backup restore, browser CSP, OAuth, security scanning and dependency risk remain distinct original security obligations. A single successful site check MUST NOT close them.

## Signal and customer-visible truth
- **GREEN pulse:** only signed current VERIFIED observation, evidence_available=true, correct site count, and not older than 45 minutes; latest local time displayed.
- **ORANGE:** a bounded warning / manual review, e.g. archived test site unexpectedly still publicly reachable.
- **RED:** observed critical production unavailability, critical header failure, unexpected open protected access, or previously private source route no longer 404.
- **GREY:** no valid signed evidence, partial coverage, delayed schedule, expired timestamp or lost observation pipeline. An old green check automatically expires without any UI interaction; portal re-evaluates on a 60-second cadence.
- A failure is not automatically a confirmed attack, breach or reportable personal data incident.
- Customer Trust Center remains in the existing authenticated V2 route; the server resolves the tenant and projects only Bedrijfsgeheugen **platform** aggregate status, time and expiry from canonical scope. No tenant IDs, details, affected routes, vulnerabilities, provider keys, credentials or private incident evidence may cross to a customer response.

## Secure transport
The original main-branch GitHub Actions workflow obtains a fresh OIDC JWT with the exact fixed audience of the live Bedrijfsgeheugen Netlify function. On ingestion the function checks signature against GitHub Actions JWKS, fixed repository, workflow ref, main branch, scheduler/dispatch event and short expiry, then validates the complete bounded 21-check report before calling the existing EU Service Gateway via server-only credentials. On write, the same original server authority performs **independent readback** before returning acknowledgement. The branch PR must merge via Required / CodeQL and the existing Netlify deployment before any green or live claim.

No long-lived browser token, frontend service_role key, arbitrary URL scanning, unauthenticated status writer or client-chosen tenant.

## Incidents, repair and escalation
- Each abnormal result has a deterministic correlation fingerprint. The existing Security Operations workflow opens no more than six new unique review placeholders per run (prioritize HIGH; later runs progress through backlog). It never auto-closes issues on one green HTTP check.
- Public GitHub is an external egress. Its issues contain only a generic fingerprint/severity + run ID; no exploit recipe, affected host, path, customer data, code snippets or tokens. Sensitive investigation must stay in the pre-existing private ONE BRAIN and provider audit logs.
- Original Engineering agent is routed through explicit agent-engineering-review label; this is **a request for investigation**, not proof that Engineering executed a fix. Approved fixes use the original Engineering protected PR, Required+CodeQL, original release pipeline, production provider readback and Heartbeat effect measurement.
- Safe autonomous action today: bounded repeat/read-only verification and deduplicated incident creation. Unattended code mutation, credentials rotation, WAF blocks and private-source deletion are intentionally **not** enabled without a reviewed rollback/approval contract.
- Persist incomplete handoffs as OPEN; do not claim GREEN or COMPLETED on workflow success, PR creation, or a stale source snapshot.

## Current external control evidence / known gaps
- Existing Supabase security adviser reports 188 INFO notices for RLS-enabled tables with no public policy (often intentional deny-all; not evidence of data exposure), and one WARN for a deliberately token-gated anonymous SQL SECURITY DEFINER cron gateway. The latter needs caller mapping and safe replacement before revocation; blindly revoking breaks the original external reconcile cron. No migration or provider token was changed.
- The current management-plane inventory includes password-gated bg-portaal-bronsync and several archive sites. Public archives require owner classification and protected access before they can count as green. The guardian does not automatically delete/publish an archived site.
- GitHub Actions schedule can be delayed, so fail-closed TTL is mandatory. Actual site uptime, abuse detection and intrusion detection need independent runtime telemetry from the respective providers before extended claims.
- Without a **successful** signed ingest, customer status remains UNKNOWN, never a simulated green badge.

## References and tests
- OWASP ASVS 5.0 security logging, authorization and anti-automation.
- GitHub Actions OIDC docs: https://docs.github.com/en/actions/concepts/security/openid-connect
- Netlify security and rate limiting: https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/
- Supabase production checklist: https://supabase.com/docs/guides/security/production-checklist
- Security implementation: tools/security/site-guardian.mjs, tools/security/security-guardian-incidents.mjs, netlify/functions/security-guardian-ingest.mjs, netlify/functions/_security-guardian-oidc.mjs, existing security-trust.mjs and portal-v2/modules/security-trust-workspace.js.
- Tests: tests/security-guardian-continuous.test.mjs, existing source-exposure/CSP/security trust contract tests.

Closure only when protected merge, real GitHub schedule run, Netlify CURRENT/READY, signed EU observation/readback, verified customer-visible fresh status, incident dedupe and named Engineering consumer evidence all have independent proof. Until then this remains **CANDIDATE / NOT FULLY LIVE**.
