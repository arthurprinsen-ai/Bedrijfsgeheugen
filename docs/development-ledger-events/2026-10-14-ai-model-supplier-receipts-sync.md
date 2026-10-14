# Development ledger — Supplier evidence receipt-copy reconciliation

- Date: 2026-10-14
- Obligation: ai-model-supplier-receipts-sync-20261014
- Source: receipt synchronization migration originally included in catalog PR #4368
- Correction: migration copied byte-for-byte to draft PR #4372 and removed from #4368 after comparing exact Git blob SHA
- Root cause: two JSON receipt stores may diverge with concurrent independent writers; protected admission rejects SQL migrations outside an explicitly declared delivery scope
- Technical change: SECURITY INVOKER trigger in private schema preserves and deduplicates old/new receipts and writes both views without modifying supplier, customer or release approval
- Regression: tests/brain-ai-model-supplier-receipts-migration.test.mjs
- Customer and supplier assurance: no records promoted, no contract or tenant governance claimed
- Readback: current Supabase supplier evidence row copies had zero mismatches at inspection; this does not imply new trigger was deployed
- Current status: draft, protected checks and authorized database release required
