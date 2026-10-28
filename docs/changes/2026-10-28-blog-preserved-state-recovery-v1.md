# Continue owned blog repair when database preserves content-ready state

Native384 request15193 created the expected repair claim, but returned no pending artifact. The live prevent_content_ready_state_regression_v1 BEFORE trigger retains content_ready whenever an approved artifact already exists. This is an intentional guard. Existing pending selection and final repair validation incorrectly assumed the requested decided transition took effect.

Plan: preserve the trigger and all publication state; let only a successful short locked claim contribute its own local work to the existing orchestrator invocation. Unexpired and invalid-expiry claims remain exclusive even with preserved content_ready state. Final persistence accepts only decided/content_ready for the matching owner and original unsent artifact, source, timestamp and token. Its final decision update compares the actual locked state and timestamp. No SQL migration, ad-hoc reset, alternate generator, scheduler or duplicate publisher.

Validation: three new regressions fail before the change and fourteen combined tests pass after it. They model the independently observed trigger behavior, including concurrent lock ownership, expiry, provider changes, other owners and full persistence; this is not a claim of actual SQL trigger execution. Full backend/Brain/gates and independent review are required before protected delivery. Acceptance then requires exact native helper/entrypoint, real canonical generation and new-body persistence, existing draft5042 refresh, protected checks and actual public URL/ledger readback. A claim or HTTP200 is insufficient.

Same content-publication-quality-recovery-20261028, parent4198, predecessor5048. Historical5046 failures and5047/5048 scoped fixes remain preserved. Mira rejection and personal LinkedIn permission boundary remain independent; no resend, relaxed threshold or revenue claim.

Preserved-state generation errors must also persist cooldown/attempt evidence under the same locked source/token and actual state/timestamp; decided-only catch writes silently lose billing/editorial retry limits. Return actual changed-row delivery evidence to preserve trigger diagnostics. Four new regressions include failed generation and wrong-owner failure denial;15 combined recovery tests are required.

Executed full backend glob: exit0. All60 recursive Brain test script files pass. Fifteen focused recovery tests pass after the independently identified failure-persistence correction. Protected delivery and actual native/public acceptance remain required.
