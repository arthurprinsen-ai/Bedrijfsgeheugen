---
name: merge-capability-guard
description: Mandatory when an agent changes GitHub rulesets, branch protection, merging, release orchestration or investigates 422 Invalid rule merge_queue errors.
---
# Merge capability guard
Read `docs/agent-skills/repository-merge-capability-guard.md`.
Before any merge queue/ruleset write, obtain live repository owner metadata. Call `determineMergeCapability` and `filterUnsupportedMergeQueueRules` from `tools/delivery/merge-capability-guard.mjs` in the ruleset writer. A personal User-owned repository always uses protected PR; an Organization owner alone does not prove queue entitlement. 422 Invalid rule merge_queue must not be retried unchanged. Do not transfer ownership autonomously. Integrate this helper at the existing writer entrypoint; this skill file on its own does not enforce external API mutations.
Never claim production green until exact-head Required/BRAIN/CodeQL, latest base, protected merge, provider deploy and independent production readback are proven.
Regression: `node --test tests/merge-capability-guard.test.mjs`.

## Required failure recovery: generated Portal System Map
If `Required` emits `SYSTEM_MAP_WRITEBACK_INCOMPLETE`, treat it as a reproducible source-inventory mismatch, not as a transient provider failure. Only the authorized canonical integration writer may update `platform/system-map/canonical-system-map.mjs` in the same release lineage. On a full checkout of the final integrated tree, run:
```sh
node scripts/brain/portal-explanation-inventory.mjs --write
node scripts/brain/portal-explanation-inventory.mjs --check
node --test tests/brain-portal-explanation-autosync-v1.test.mjs tests/brain-powerhouse-live-system-map-v1.test.mjs tests/brain-powerhouse-system-map-governance-v1.test.mjs
```
Inspect the complete generated diff (inventories, counts, provenance hash); never patch only the content hash or claim success from the previously calculated SHA. Commit the deterministic output with the intended source modifications, rerun Required and CodeQL on the exact resulting head, and repeat if new changes to main alter the integrated tree. Keep one writer; do not create a separate competing map PR or loop endlessly creating a replacement release branch. When a full repository checkout/generator execution is not available, record `GENERATOR_EXECUTION_UNAVAILABLE`, leave the release red, and route to the existing authorized integration owner.


## 2 november 2026 — terminal Supabase providerreceipt is verouderd maar bron moet opnieuw bewezen worden

**Echte oorzaak:** oorspronkelijke Obligation Terminal Closure #41446530809, poging 1 FAILED, `SUPABASE_PROVIDER_LIVE_MISMATCH:portal-state-eu`. Een toegestane concurrerende Edge-uitrol had acht actieve functierevisies verhoogd nadat de voorafgaande release-authority de PR-receipts schreef. Dat is **geen** grond om een mismatch automatisch als groen te beoordelen. Agent moet eerst de huidige ACTIVE provider-versie en SHA teruglezen, de volledige werkelijk actieve bron per gewijzigde functie **byte-for-byte** met exact beschermde `main` vergelijken en vastleggen; bron- of bevoegdheidsafwijking blijft RED. Alleen bij onafhankelijke volledige source-parity mogen *uitsluitend* de betreffende `Terminal-Supabase-Provider-Readback`-regels in de **oorspronkelijke merged PR** naar de feitelijke nieuwe provider-versie worden bijgewerkt, gevolgd door een herstart van dezelfde oorspronkelijke terminalcheck. Historische FAIL blijft behouden. Controleer geen kanaal als gepubliceerd door een groene code- of terminalrun.

**Bewezen herstel:** alle 20 bronbestanden van 8 opgehoogde functies gelijk aan beschermde main `805eb418edc36bb8c9cace3595a96109cb03060e`; 8 receipts in #5295 geactualiseerd; dezelfde workflow #41446530809, poging 2 **SUCCESS**. ONE BRAIN `powerhouse|delivery|terminal-stale-provider-receipts-after-authorized-redeploy|20261102-v1` is `VALIDATED`, niet universeel `PROVEN` zonder later geen-herhaling-bewijs. Volgende agent mag geen rechten/CI-bescherming afzwakken, geen fictieve SHA schrijven en geen extra deploy/parallel executor starten. Controleer oorspronkelijke regressie `tests/brain-terminal-supabase-provider-readback.test.mjs` en nieuw contract `tests/brain-terminal-provider-receipt-recovery-20261102.test.mjs`; menselijke beschrijving `docs/changes/2026-11-02-terminal-provider-receipt-drift.md`.
