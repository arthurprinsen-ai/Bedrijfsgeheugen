# 2026-10-23 — Evidence-ranked PR Recovery

Obligation-ID: github|recovery-supervisor|evidence-ranked-pr-sync|20261023-v1
Base-SHA: 146f90e33a1c13cae87e6056ab20cd5af44dbe52
Delivery-Lane: automation
Candidate-Type: implementation
Writer-Authority: existing Powerhouse Delivery Recovery Supervisor only
Source: .github/workflows/powerhouse-delivery-recovery-supervisor.yml; tools/delivery/recovery-pr-prioritizer.mjs
Regression: tests/delivery-recovery-pr-prioritizer.test.mjs
Proof: exact-head Required, CodeQL, supervisor provider logs, 24-hour independent baseline comparison required
State: CANDIDATE_PENDING_PROTECTED_CI_AND_PRODUCTION_READBACK
Policy: Fail closed to original provider PR order; no mandatory test waiver; no parallel scheduler, writer, incident register or learning store.
