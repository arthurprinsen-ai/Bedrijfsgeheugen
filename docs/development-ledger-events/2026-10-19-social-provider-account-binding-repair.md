# Production incident ledger — verified Composio account resolution
Obligation-ID: `social-provider-metrics-continuity-20261019`
Supersedes: merged PR #4513, whose source rollout passed but failed provider ingestion acceptance.
Root incident: HTTP 503 on production request #8095 and zero snapshots due to matching optional Composio account metadata rather than the verified Powerhouse account mapping.
Proof: existing Instagram and LinkedIn setup status returned unique healthy account ID and user ID in Brain record snapshots at 21:02 UTC on 19 October.

Recovery: adapt existing Edge function; no new execution engine. Guard against wrong-account fallback and stale/unverified authority; require scoped learning and test regressions.

Status: **RECOVERY CANDIDATE / NOT PRODUCTION PROVEN**. Evidence needed: protected CI, exact-head preview, merge, deployment source readback, successful authenticated post metrics, persisted observed snapshots and Heartbeat source freshness. Never close based solely on merge or cron active.
