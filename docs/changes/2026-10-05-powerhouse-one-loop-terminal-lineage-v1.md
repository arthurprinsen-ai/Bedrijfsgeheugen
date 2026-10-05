# Powerhouse one-loop terminal lineage v1

## Change

The commercial Powerhouse runtime is canonicalised into one auditable loop:

heartbeat → intelligence → decision → action → execution owner → terminal lifecycle → observed outcome → revenue/attribution → learning → next decision.

Legacy `powerhouse_commercial_closed_loop_v2` through `v6` remain callable only as compatibility aliases to the canonical v1 loop. They no longer own independent orchestration logic.

Exactly one full commercial scheduler owner remains: `powerhouse-one-commercial-loop-daily-v1`. Former split-stage commercial context/action scheduler owners are removed.

## Terminal lineage

Every terminal sales action now records explicit lifecycle lineage. This does **not** manufacture an observed commercial outcome.

- observed outcome evidence → `OBSERVED / CLOSED`
- internal, expired, skipped, failed or cancelled lifecycle → `NOT_APPLICABLE / CLOSED`
- externally executed action awaiting real response/revenue evidence → `PENDING_OBSERVATION / OPEN`

Historical repair is bounded with `FOR UPDATE SKIP LOCKED` so active production writers are not blocked.

## Delivery closure

A material Powerhouse candidate is not merge-ready unless the exact candidate scope also carries all mandatory writeback evidence: canonical Brain learning, an activity/development ledger event and human-readable change/learning documentation. The first exact head `5511a006c876593835c176d6502ee6306abf033a` correctly failed the Required test because that closure evidence was incomplete. This is treated as a fail-closed delivery invariant, not as a reason to weaken the gate.

## Regression prevention

The invariant is enforced in both Whole Brain Canonical Loop and the canonical Required test. Runtime readback also exposes scheduler ownership, legacy alias drift, unaccounted terminal actions and open observed-outcome obligations.

Production readback after migration:

- canonical scheduler owners: 1
- active split-stage owners: 0
- non-alias legacy loops: 0
- unaccounted terminal actions: 0
- open observed-outcome obligations: 10
- runtime regression gate: healthy

Open outcome obligations remain intentionally visible until real evidence arrives. Terminal green still requires the exact current head to pass every mandatory GitHub gate and subsequent production/readback evidence where applicable.

## Hosted Supabase Preview replay recovery

Exact head `fac9ed5d042732372003509252f5dd2c77620225` failed the provider Supabase Preview check with SQLSTATE `42601`: the historical persuasion optimizer used truncated `$` function delimiters. A migration-wide regression exposed a second truncated closing delimiter in the story-family uniqueness migration. Restore only these three delimiter tokens; retain all function logic, permissions and scheduler behavior. The new Required-test regression failed before repair (three invalid boundaries) and the targeted lineage/schema suite passed after repair (8/8). These source tests do not replace hosted database replay or production readback. Keep the same obligation and PR; terminal green requires the complete new exact-head checkset, protected merge and canonical terminalizer evidence.

PostgreSQL grammar parsing then exposed missing function-statement terminators in the commercial persuasion runtime migration. Add the three closing statement semicolons and the two PL/pgSQL END semicolons. All 420 migration files now parse without SQL syntax errors; both regression cases were observed red before their respective repair. Final focused integration/writeback/lineage/schema validation: 27/27 passed. Hosted replay and exact-head provider checks remain required.

Hosted replay on `a26043128f950208e2d6f31d0d0807ce3334603e` passed the syntax boundary and failed SQLSTATE `42P01` because production-only `powerhouse_email_reply_events` had no migration definition. Read back all 15 columns, constraints, indexes, RLS and grants from production; project that schema before the first lineage consumer. No production table/data was changed. Regression observed red, then final suite 28/28 and security self-test passed. Production current commercial gate independently reports one owner, zero secondary owners and 100% current terminal coverage; the existing bounded lineage RPC repaired 464 historical actions and the old daily-owner assurance now has zero unaccounted actions but remains stale for the newer heartbeat owner. Preserve this truth boundary until its canonical reconciliation.

Register the reply-evidence table in the existing mandatory quality surface registry, bound to the source/security/ordering regression. An already-applied historical migration is not pushed again by Supabase Git on synchronize; use the provider-documented disposable PR preview close/reopen lifecycle to replay repaired historical schema. Keep the obligation, branch and lineage unchanged.

Fresh replay follow-up: SQLSTATE 42P01 exposed the production-only channel capabilities table. Exact schema, status constraint, RLS and service-role-only grants are projected before the NBA view with a required quality contract and red/green regression. No capability evidence rows are seeded. Current main scheduler fixes are retained in the same candidate.

Replay view compatibility: Preview reached the orchestrator and failed 42P16 because intelligence columns replaced the existing message-plan projection positions. Preserve the existing 40-column prefix and numeric intent/warmth contract, append new intelligence columns, and retain all dependent views. Red/green regression covers the replacement boundary.

Canonical forward dependency: fresh replay reached the one-loop migration and failed 42883 because SQL aliases resolve a canonical implementation introduced later in the history. Use five direct PL/pgSQL delegation aliases, preserving exact results and runtime errors; no placeholder function, fallback outcome or disabled validation. Regression covers the forward-reference boundary.
