# 2026-11-11 — Canonical ONE BRAIN: historical provider migrations must be immutable checkpoints, not frozen current totals

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Original portal/handshake lineage: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: brain|migration|immutable-818-819-823-checkpoints-vs-current-824|20261111-v1
Delivery-Lane: backend
Candidate-Type: recovery
Base-SHA: badf16895850de8769adc024faf0cad208b3d0ec
Writer-Lease-Owner: existing ONE BRAIN / Supabase migration source-truth and CI
Writer-Lease-NonOwner-Action: HOLD on concurrent DB lock/writer modification

## Independently checked live provider source truth
On 2026-11-11, the existing Supabase production project `adhjwmvyoixzjtmiroln` returned `824` rows, `824` distinct provider versions, latest `20261110160055_linkedin_org_readback_sticky_provider_health_v1`. A full ordered 824-version/name comparison to **current protected main** `supabase/migration-history.lock.json` returned 0 missing, 0 extra and 0 differing identities. This is the actual provider record, not merely a candidate lock manifest. DO NOT modify the migration ledger, inject missing SQL, call apply_migration, grant privilege, or bypass protected hosted preview.

The original 818, 819 and 823 identities **also** match the corresponding unchanged historical provider prefixes exactly: 818 through `20261109152945`, 819 through `20261110073500`, 823 through `20261110134500`. Later approved 824 is valid and must not make older historical tests falsely fail.

## Actual failed BRAIN delivery evidence
Previous production-delivery review run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42981444211 failed backend 5 tests: 3 tests asserted historical `818`, `819`, `823` as the **current** total, 1 migration reference-integrity parser treated the explicit negative assertion `assert.equal(existsSync(new URL('../supabase/migrations/20261110140500_original_commercial_verified_research_resume_v1.sql',import.meta.url)),false)` as a positive required SQL file, and 1 unrelated `gpt-6-astra` supplier-evidence claim exceeded its real 14-day freshness boundary. The AI supplier gate is a **real external evidence shortage** and must remain red until independent vendor facts are checked; do not modify dates from source code to fake it.

## Corrected immutable tests only
- `tests/brain-verified-provider-818-history-reconciliation-20261109.test.mjs`: rebuild the original exact 818-window snapshot from today's canonically locked history, preserving all original negative guard tests, protected base SHA, applied SQL digest and immutable identities, while separately requiring current full source/lock filename equality.
- `tests/brain-provider-819-migration-lock-parity-20261110.test.mjs`: assert original 819 historical prefix and exact original last identity, plus full current SQL/lock parity and unique versions; no fabricated provider version.
- `tests/brain-commercial-applied-provider-lock-20261110.test.mjs`: assert original 823 observed prefix and subsequent real 824 provider identity, plus the entire current SQL/lock inventory, uniqueness and original provider/consent checks.
- `tests/supabase-migration-reference-integrity.test.mjs`: recognize the *exact* nested `existsSync(new URL(...))===false` negative assertion and retain ordinary actual file reads as required, with explicit positive/negative regression.

Only test-oracle and original Brain learning/ledger documents change. NO executable SQL, migrations, provider source lock, scheduler, other tenant data, output, artificial Brain ACK, commercial publisher or second original loop is altered.

## Acceptance / remaining blocker
Exact-head Required/BRAIN/CodeQL, migration source parity and final protected main merge, independent post-merge BRAIN run and source readback required. This targeted correction should resolve four deterministic old-history test failures, **not** the 14-day AI supplier freshness block, nor all original content/portal consumer handoffs. The old PR #5557 expected 819 exact current and is outdated against provider-authoritative 824; never merge an obsolete 819 lock over the attested 824 provider history. Original #4198 and #4215 stay OPEN unless all actual provider and outcome stages satisfy independent evidence.
