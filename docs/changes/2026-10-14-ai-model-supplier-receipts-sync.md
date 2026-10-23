# Supplier claim receipt synchronization — isolated database change

Obligation-ID: ai-model-supplier-receipts-sync-20261014

## Problem and scope

Supplier claim receipts appear in both `public.ai_model_supplier_verification_v1.claim_evidence` and `catalog_record.verification_evidence.claim_evidence`. Independent update paths can leave those arrays inconsistent, affecting audit readback. The proposed database migration was mistakenly inside catalog PR #4368, whose protected change scope excludes migrations. This draft PR #4372 isolates the migration and the required closure evidence.

## Change

The SQL migration creates `private.ai_model_supplier_receipts_keep_in_sync_20261014()` with `SECURITY INVOKER`, and a BEFORE INSERT/UPDATE trigger scoped to receipt columns. It merges the exact existing JSON receipt entries from old and new copies; it checks array types and synchronizes the duplicated arrays. It does **not** update any verification-status, recommendation, customer-contract, tenant-control or release-eligible flag. Function EXECUTE is revoked from PUBLIC, anon and authenticated roles.

Historical receipts are never treated as newly independently verified evidence. Reconciliation can preserve contradictory or stale receipts: investigators still have to resolve those claims separately.

## Tests and security

`node --test tests/brain-ai-model-supplier-receipts-migration.test.mjs` checks that the SQL has private SECURITY INVOKER scope, restricted execution, both receipt sources, malformed JSON rejection, and absence of supplier/customer/release promotion in the trigger body. These are structural tests, not an executed Postgres migration.

Before merging: test INSERT, UPDATE, malformed inputs and repeated updates on a **nonproduction** Postgres database with representative duplicate receipt cases, review the impact of preserving old receipts, run required CI and CodeQL, and inspect RLS and migration permissions. There is no authorization to bypass protected merge.

## Database acceptance and rollback

The pre-deployment readback showed zero mismatches between the two current receipt arrays. This **does not** mean the proposed trigger is installed.

After approved deployment, use:

```sql
select count(*) as divergent_rows
from public.ai_model_supplier_verification_v1
where claim_evidence is distinct from catalog_record #> '{verification_evidence,claim_evidence}';
```

Also verify the trigger is present and enabled in `pg_trigger`, then perform a controlled transactional insert/update scenario and confirm the duplicated receipts converge without changing `verification_status`. If unexpected behavior occurs, disable/drop only this specific trigger under authorized DB change control, then revert the function in a separate reviewed migration.

Production acceptance, actual supplier claim verification, customer DPA and tenant-specific controls remain **unproven**.
