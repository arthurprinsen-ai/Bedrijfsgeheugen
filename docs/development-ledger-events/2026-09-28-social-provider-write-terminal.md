# 2026-09-28 — FALSE_FAILURE — Social provider-write terminal invariant

- **Fingerprint:** `social-provider-write-terminal-v1`
- **Observed:** provider-created LinkedIn and Instagram posts could later be classified BLOCKED because token/readback/media-proof checks changed.
- **Impact:** false failure reporting, unnecessary reconnect loops and risk of duplicate recovery publication.
- **Root cause:** post-create verification capabilities were allowed to override provider-write truth.
- **Fix:** durable provider ID + successful create/publish acknowledgement is terminal side-effect evidence across LinkedIn personal, LinkedIn company and Instagram company.
- **Safety:** `republish_forbidden=true`; recovery is exact-ID reconciliation only.
- **Prospective controls:** token, ACL, Mira/media-proof and quality failures discovered after publication apply to future claims only.
- **Regression:** `tests/brain-linkedin-composio-authority.test.mjs`.

- **Database root cause found:** `powerhouse_reconcile_content_outcomes_v1`, `enforce_instagram_exact_final_media_gate_v1`, and `enforce_instagram_obligation_vision_v1` could still retroactively mark a provider-created Instagram obligation BLOCKED.
- **Database fix:** migration `20260928122000_social_provider_write_terminal_reconcile_v1.sql` makes provider side effects terminal before post-write proof enforcement; pre-write Mira/media proof remains fail-closed.
- **Production replay:** 2026-09-28 reconciled with `blocked_count=0`; personal LinkedIn, company LinkedIn and Instagram all remain terminal provider-created publications.
