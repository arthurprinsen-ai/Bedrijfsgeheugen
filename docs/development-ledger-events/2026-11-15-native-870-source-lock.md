# Append-only ledger — original Supabase 870 native provider lock

- Date: 2026-11-15; verified provider readback UTC 2026-11-15T15:52:42.26634Z
- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|supabase|source-lock-869-provider-870|20261115-v1`
- Protected release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5878
- Original Supabase provider project: adhjwmvyoixzjtmiroln; applied 870; native last version/name: `20261115162500 original_personal_source_supplier_completeness_v4`.
- Git original lock before repair: 869 entries; after proposed repair: exactly 870 with 869 preserved in order.
- Root cause: original GitOps provider applies a migration before its independent provider readback is mirrored to the immutable Git source-lock.
- Prevention: atomically append only provider-attested version/name under original PR protected checks; no fabricated applied migration, no executable SQL change, no new scheduler.
- Tests: `tests/supabase-migration-history-integrity.test.mjs`, protected native provider lock suite.
- State: protected candidate until required/CodeQL, merge and final native source parity readback. Personal social provider result remains separately evidence-due.
