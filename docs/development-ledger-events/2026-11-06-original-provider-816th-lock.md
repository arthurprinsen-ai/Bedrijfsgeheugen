# 2026-11-06 append-only lock synchronization

- Obligation: powerhouse|migration|original-provider-816th-mira-claim-history-lock|20261106-v1.
- Production observation: after protected PR #5498, original Supabase has 816 applied version/name identities, with exact final version 20261106160000_mira_original_pristine_waiting_asset_claim_v1.
- Immutable source lock has 815 exact matching preceding provider identities, no other drift.
- Fix: protected lock-only PR appends one provider-proven 816th row and verified capture timestamp, with canonical Brain learning, human documentation, ledger. New migrations are NOT included.
- Regression: tests/brain-original-provider-815-lock-parity-20261106.test.mjs is intentionally future-safe and verifies this new Mira version name if present; no green without independent provider readback.
- Acceptance: exact-head Required/CodeQL, protected merge and original main lock/provider parity. Publication delivery is independent and still open.
