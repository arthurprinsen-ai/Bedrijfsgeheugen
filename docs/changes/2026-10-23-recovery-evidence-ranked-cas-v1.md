# Evidence-ranked Recovery Supervisor — 2026-10-23

Obligation: github|recovery-supervisor|evidence-ranked-pr-sync|20261023-v1

The existing five-minute Recovery Supervisor remains the only recovery scheduler and write authority. It sorts its existing PR snapshot by bounded, provider-observed Required-run evidence and *exact* existing writer-lease metadata. A running MAIN_SYNC is reconciled first; an idle, eligible stale TERMINAL_DELIVERY lease precedes an active Required run. Invalid/forked/exhausted leases are not promoted by ranking. Ineligible PRs retain their provider order.

A single added read fetches at most the latest 100 Required workflow runs; failed read, invalid snapshot or script error preserves the original PR order. The bounded sample must not be reported as complete seven-day coverage. Exact-head completed repeats are diagnostic only; base/version identity is insufficient to claim a test was unnecessary. Existing CodeQL/Required, CAS expected_head_sha, single-writer, overlap checks, bounded attempts, merge protection, Netlify/Supabase and production provider readback remain unchanged.

Acceptance: node --test tests/delivery-recovery-pr-prioritizer.test.mjs tests/delivery-powerhouse-supervisor.test.mjs; protected exact-head Required and CodeQL; 24h independently observed supervisor reports to compare baseline fallback, elapsed completion time, CAS rejects, repeat drift and gate failures. No AI technique is authorized to change production without independent baseline, regression suite, staged canary, rollback and provider readback. Existing #4763 and #4788 own innovation quality; #4772 and #4778 own deeper CI repeat/step telemetry. No duplicate collector, scheduler, skill store or incident register.

Status at submission: code candidate only, production performance improvement unproven until measured.
