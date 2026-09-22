# 2026-09-22 — Social publication daily channel fence

- Fingerprint: `social-publication-daily-channel-fence-v1`
- Trigger: duplicate social publication incident and historical evidence of multiple valid capabilities for one date/channel.
- Root cause: publication capability uniqueness existed per token, not per canonical daily channel obligation.
- Production evidence: five consumed non-revoked `instagram_company` capabilities existed for 2026-09-20 before containment; after the production hotfix, active duplicate groups were zero.
- Fix: advisory transaction lock + one-active-capability partial unique index + expired-unconsumed-only reclaim.
- Regression: `tests/brain-social-publication-daily-channel-fence-v1.test.mjs`.
- Safety invariant: uncertain provider readback never authorizes a replacement publication.
- Terminal proof: protected merge and main readback of migration, regression test, learning, ledger event and change documentation.