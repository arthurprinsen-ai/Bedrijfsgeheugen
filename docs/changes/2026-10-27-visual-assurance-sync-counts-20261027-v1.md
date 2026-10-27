# Visual assurance sync reports the real screenshot count

The sync function wrote assurance receipts that claimed 9 screenshots (3 routes x 3 viewports). The active contract and the harness verify 24 (6 routes x 4 viewports). The function now carries the contract counts as constants and labels itself sync-v2; a test compares them with the contract file.

## Validation

`node --test tests/brain-portal-visual-assurance-sync-counts-v2.test.mjs tests/brain-portal-visual-assurance-supabase-sync-v1.test.mjs tests/brain-portal-visual-assurance-cross-system-v1.test.mjs`

## Boundaries

The quality-event fingerprint is unchanged because the v2 row does not exist in the database. Deploying the function is a separate step; runtime effect is unproven until the next sync writes 24.
