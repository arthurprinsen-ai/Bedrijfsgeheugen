# Provider 846 source-lock handoff — onveranderlijk bewijs

- Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198; originele provider-SQL-fix PR #5739 beschermd gemerged.
- Supplier/source-of-truth: actual Supabase `adhjwmvyoixzjtmiroln` SQL schema history; exact applied count **846**, max version `20261113140500`, exact name `original_no_publish_immutable_provider_receipt_v1`, verified by independent provider SQL `2026-11-13T14:39:23.852565Z`.
- Original Git lock prior to this source update: **845** verified identities, max `20261113132000/original_skipped_no_publish_evidence_routing_v1`; no older identity may change. This update adds one immutable applied identity and provider-observed time, with no provider SQL/migration/function write.
- Original RPC production: nonmaskable original/incoming JSON provider-success check, protected veto true, incomplete no-publish source proof visibly OPEN, service-role-only.
- Prevent: never mark protected PR as terminal before actual provider exact name/version+installed function readback and original BRAIN/skill terminalization. No invented migration history, no duplicate sender or scheduler, no bypass of terminal guard.
- Test: `tests/brain-original-no-publish-provider-846-migration-lock-20261113.test.mjs`; machine: `brain/learning/2026-11-13-original-no-publish-provider-846-migration-lock-v1.json`; change: `docs/changes/2026-11-13-original-no-publish-provider-846-migration-lock.md`.
