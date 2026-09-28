# 2026-09-28 — FALSE_FAILURE — Social provider-write terminal invariant

- **Fingerprint:** `social-provider-write-terminal-v1`
- **Observed:** provider-created LinkedIn and Instagram posts could later be classified BLOCKED because token/readback/media-proof checks changed.
- **Impact:** false failure reporting, unnecessary reconnect loops and risk of duplicate recovery publication.
- **Root cause:** post-create verification capabilities were allowed to override provider-write truth.
- **Fix:** durable provider ID + successful create/publish acknowledgement is terminal side-effect evidence across LinkedIn personal, LinkedIn company and Instagram company.
- **Safety:** `republish_forbidden=true`; recovery is exact-ID reconciliation only.
- **Prospective controls:** token, ACL, Mira/media-proof and quality failures discovered after publication apply to future claims only.
- **Regression:** `tests/brain-linkedin-composio-authority.test.mjs`.
