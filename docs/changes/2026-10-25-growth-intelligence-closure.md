# Growth Intelligence decision engine and admission recovery

PR #4901 builds a deterministic decision core, source-verification adapter contract, experiment safety guards and an injectable idempotent learning store. It does not instantiate another scheduler. Exact new `tools/growth-intelligence` paths are mapped to the pre-existing automation lane.

## Root cause and prevention
CI admission originally rejected unclassified delivery paths. After introducing a narrow classifier mapping, the integration closure gate detected missing human documentation, learning and ledger records. These companion records correct the evidence gap, without relaxing CI.

## Evidence and limitations
Growth module tests succeeded on previous head. Required, CodeQL, and Netlify must run against the new exact commit. The actual Heartbeat and customer portal are not yet connected to these libraries; production publication, revenue, and external customer research are not proven. Do not mark these live until protected merge and independent production/provider readback.

## Continuous CRO experiment extension — 29 October

Scope: extend this **same draft PR #4901** with a deterministic preregistration, evaluation, learning-projection and website conversion opportunity contract. Experiences: WhatsApp help, progressive forms, interactive qualifiers, contextual nonmodal help, desktop-only exit-intent, ROI calculator, post-scan voluntary offer, and CTA copy. No duplicate Heartbeat, independent writer, new scheduler or unapproved provider dispatch.

Critical control: minimum 50 per arm, persistent pre-treatment assignment, exact primary metric, source-linked control/treatment exposures, sample-ratio-mismatch detection, time maturity, guardrails and verified outcome readback. Significant results only become protected implementation candidates and never realized revenue automatically. No visitor PII in experiment logs. No consent bypass; accessible dismissal, no intrusive mobile popup.

Ownership: `powerhouse-commercial-learning-v1`, Growth Swarm CRO agent, canonical `powerhouse_experiment_assignments`/`powerhouse_cycle_events`/`brain_records`, BG169 release authority, System Map candidate projection. Changes: `tools/growth-intelligence/cro-experiment-cycle.mjs`, existing decision core, heartbeat adapter, Growth Swarm skill, system map, automation lane and regression tests.

Self-review: the first local code probe found that a 4-character minimum string check excluded canonical owner `cro`; fixed to 3-character minimum before CI, with explicit preregistration test. Local browser/provider/SQL readback and production effect are **not proved**. PR remains a candidate until Required/CodeQL and protected release/readback.

## Further source verification — 29 October 2026

A source-based isolated JavaScript execution of the exact branch experiment, decision-core, adapter and closure test functions passed **19/19**. This is not Node CI/Required/CodeQL. New pure `diagnoseCroMeasurementGap` returns explicit `MEASUREMENT_REQUIRED`, `INCOMPARABLE` or `RECONCILIATION_REQUIRED` rather than inventing lost conversions. The existing Heartbeat packet now exposes `croDataGaps`; actual canonical persisted-write/readback remains unimplemented and unverified.

Supabase readback (last seven days): `growth_page_daily` 3,634 views, 0 CTA clicks, 0 qualified leads; `bg_interacties` 1,201 non-bot interactions and 48 click-like events. These are **different taxonomies**, not evidence of 48 missing CTA clicks. The existing review-required optimization candidate is `c1727e17-6200-44ff-9a31-eec0ea7c1ead`, root cause UNKNOWN.

PR #4901 remains DRAFT with GitHub mergeability `dirty`; behind an independently moving main. The most recent head does not have exact-head Required/CodeQL evidence. Do not merge or deploy from stale test results and do not reset or force-push a shared branch. Next responsible writer: perform conflict-aware, main-preserving branch reconciliation; run all protected gates and independent production/portal readback.
