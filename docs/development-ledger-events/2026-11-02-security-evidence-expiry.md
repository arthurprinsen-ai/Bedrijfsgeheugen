# 2026-11-02 — Security evidence expiry closed-loop candidate

Obligation: powerhouse-security-provider-expiry-20261102-v1.

- Existing source: authenticated Portal Security Trust Center and existing ONE BRAIN Security Agent. No parallel worker, provider poller, user data store or scheduler.
- Independently observed defect: a source status `PASS` with `evidence_available=true` but no `expires_at` could be colored green by the existing portal UI, despite no bounded source freshness.
- Source fix: `securityEvidenceCurrent` requires both timestamps, 24-hour proof bounds, at-most-five-minute future skew, and unexpired evidence before a control can contribute to a green provider or overall posture.
- Coverage now distinguishes available source observations from **current and proven** checks, while an explicit FAIL still raises ACTION_REQUIRED.
- Historical/shadow/canary regression is `tests/brain-security-evidence-expiry-20261102.test.mjs`, including missing, stale, excessive, invalid and future-dated proof.
- No database privilege, RPC, environment variable, secret, release policy or Netlify access setting is modified by this candidate.
- Strict terminal evidence: original Required/CodeQL/BRAIN, protected merge, exact main→Netlify and independent authenticated portal control readback. Until then `CANDIDATE_UNVERIFIED`.
- Open provider risks remain in the existing private incident registry; the site-specific issue is deliberately not disclosed in public-source documents.
