# Original Portal V2 source-order incident

- Fingerprint: `portal|source|stale-larger-signal-overrides-recent-observation|20261112-v1`; owner original Portal V2 UX/ONE BRAIN projection; issue #4215
- Root cause: stale large delta can override latest observed provider signal via `newer || stronger`
- Severity: source-time truth risk; no claim of actual exposed customer wrong decision
- Correction: latest `observed_at` dominates; magnitude on exact timestamp tie only; undated old does not supersede dated
- Verification: original `tests/portal-v2-monitoring-learning.test.mjs`, protected Required/CodeQL, Netlify exact SHA and independent Portal V2 browser readback. No new cron, cache, auth, provider or sender
- Status at creation: FIX_CANDIDATE, learning/experiment results remain evidence-due
