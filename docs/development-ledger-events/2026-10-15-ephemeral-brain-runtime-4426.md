# 2026-10-15 — Foresight ephemeral Brain read model

- Obligation: powerhouse:portal-v2:ephemeral-brain-runtime:20261015:v1; issue #4426.
- Existing-state-first: reuse `createPortalDomainState`, `loadRuntimeEvidence` and `/api/brain-operating-loop`. No new infrastructure or persistent store.
- Root cause: view-only runtime was projected into mutable persistent customer input state.
- Candidate correction: isolated in-memory overlay, authenticated bearer gate, no persistence of historical/temporary runtime, reinitialization clears derived data, dedicated regression and Brain learning.
- Independent release evidence: pending Required CI, CodeQL, branch-protected merge and authenticated Netlify production readback.
