# Development ledger — Resource Intelligence tenant isolation recovery

Obligation: `supabase-migration-history-parity-final-20261005-v2`

## Observed failure

Exact-head backend validation faalde omdat regressietests naar verwijderde migration aliases wezen. Directe productie-readback liet daarnaast zien dat de twee Resource Intelligence authorities geen `tenant_id` kolom hadden, terwijl de portal tenant-scoped queries uitvoert.

## Structural correction

- Forward migration: `20261005154500_resource_intelligence_tenant_isolation_recovery_v1.sql`.
- Canonical migration references voor Resource Intelligence en content cockpit.
- Tenant columns, backfill en indexes.
- Candidate generation bindt business-value evidence alleen bij `cardinality(tenant_ids)=1`; observed resource intelligence gebruikt zijn eigen tenant.
- Learning en regression evidence blijven in dezelfde delivery lineage.

## Terminal invariant

Geen terminal-green claim vóór exact HEAD gates, protected merge, production schema readback en remote↔repository migration parity.
