# Autonomous production promotion and terminal writer lease — 2026-09-18

Authorized Powerhouse chats, agents and workflows own delivery through protected promotion, production/provider readback, outcome verification, learning/prevention writeback and terminal proof. Routine merge/deploy work is not handed back to the user.

During TERMINAL_DELIVERY exactly one writer lease owns the canonical PR/obligation. Non-owner workers defer instead of mutating the branch. Queued or missing exact-head gates are recoverable and are re-dispatched by the existing protected delivery path; security and release gates are never bypassed.

Fingerprints: `powerhouse-self-production-promotion-v3`, `delivery|same-lineage|parallel-writer-head-thrash-v1`.

## Terminal closure

Status: **LIVE_PROVEN / FULFILLED**.

- Candidate PR: #2063
- Candidate head: `ec4a23eec09c231fdc5e0db7691b51ac0d04053a`
- Protected main SHA: `ee526cea16dac904173466a529211ad0f7513215`
- Production Release Readback: run `35327618750` — success
- Netlify production deploy: `6aacfe9a172eed0008e2e2d9` — ready
- Netlify commit_ref: `ee526cea16dac904173466a529211ad0f7513215`
- Production route/browser readback: success
- Immutable website production truth: success
- Terminal writer lease: **RELEASED**
- Canonical learning remains directly linked from the universal Powerhouse agent policy and is consumed through `scripts/brain/chat-learning-preflight.mjs`.

A green PR, merge, or provider-ready state alone remains insufficient. This closure is valid because protected promotion, exact provider identity, production readback, outcome sweep and canonical learning/prevention lineage all resolve to the same delivered obligation.



## Wat vandaag structureel is geleerd

De grootste vertraging zat niet in één programmeerfout, maar in de ontwikkelstraat zelf. Parallelle agents konden onafhankelijk geldige wijzigingen maken die bij integratie botsten, terminale branch-writers konden elkaar superseden en retry-/queue-evidence kon door historische attempts vervuild raken.

De blijvende operating model is daarom:

1. **Parallel specialists, één rolling integrator.** Frontend, backend, automation, portal, QA en specialist-agents werken parallel zolang paden, contracts en mutable resources onafhankelijk zijn. Alleen de integratiegrens wordt geserialiseerd.
2. **Obligation + branch + exact head is authority.** Een PR-nummer is transport. Lifecycle-automatisering mag het PR-object beïnvloeden zonder dat agents de canonical obligation opnieuw ontwerpen.
3. **Immutable terminal writer lease.** Zodra release gates starten, wordt de exacte candidate SHA aan één writer gebonden. Andere agents defereren. Een repair commit vereist eerst RECOVERY, daarna een nieuwe exacte lease.
4. **Progress-aware recovery.** Een oude PR/head maakt een gezonde in-progress job niet stale. Alleen ontbrekende starts en aantoonbaar stale queued critical work worden hersteld.
5. **Latest critical attempt wins.** Op dezelfde SHA telt uitsluitend de nieuwste Required- en BRAIN-attempt voor actuele recovery. Oudere cancellations/failures blijven auditbewijs.
6. **Classifier co-change.** Een nieuwe uitvoerbare regressiontest wordt in dezelfde candidate aan een delivery lane gekoppeld. Geen test zonder execution route.
7. **Full-main union.** Main-reconciliation bewaart de volledige delta vanaf de merge-base; alleen de laatste main-commit overleggen is verboden.
8. **Integration-owned mutable identity.** Supabase migration timestamps/versions worden definitief toegekend bij rolling integration en vooraf op uniciteit getest.
9. **Non-overlapping main drift is geen rebuild-trigger.** Een mergeable, geteste candidate blijft geldig wanneer main alleen orthogonale wijzigingen bevat.
10. **Terminal gates vóór promotion.** Een protected merge vóór terminal Required+BRAIN is een governance-incident. Post-merge readback kan veiligheid achteraf bewijzen, maar mag de preventieregel niet vervangen.

### Incidenten die deze regels veroorzaakten

- twee parallelle migraties gebruikten dezelfde versie;
- head-age recovery kon gezonde jobs onnodig afbreken;
- verschillende workers muteerden dezelfde terminal branch;
- PR open/closed metadata liep los van de werkelijke obligation/head;
- historische geannuleerde attempts konden een nieuwere gezonde retry overschaduwen;
- een nieuwe writer-lease regressiontest was niet geclassificeerd;
- snelle main-beweging maakte duidelijk dat latest-commit overlay eerdere main-delta kan verliezen;
- PR #2063 werd gemerged voordat de kandidaat-Required-run volledig terminal was, waarna main/readback gelukkig aantoonbaar groen bleek.

### Permanente fingerprints

- `delivery|same-lineage|parallel-writer-head-thrash-v1`
- `delivery-recovery|progress-aware|v1`
- `delivery-attempt-authority|latest-critical-attempt|v1`
- `delivery-classifier|cochange-required|v1`
- `moving-main|full-main-union|v1`
- `migration-version-allocation|rolling-integrator|v1`

Deze regels zijn ook machine-readable vastgelegd in `brain/learning/2026-09-18-self-production-promotion-v1.json` en operationeel opgenomen in de Powerhouse continuity- en recovery-skills.
