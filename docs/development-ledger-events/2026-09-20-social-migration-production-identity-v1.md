# Social migration production identity reconciliation

- Obligation: `social-migration-production-identity-v1`
- Source delivery: PR #2427.
- Observed terminal blocker: `MIGRATION_LEDGER_IDENTITY_MISMATCH`.
- Production migration ledger: `20260920073022_instagram_mira_visual_reel_only_v2` and `20260920073025_social_publication_authority_v1`.
- Repair: repository filenames are aligned to those exact production identities without changing SQL content.
- Guardrail: terminal closure remains fail-closed on any future version/name mismatch.
