# 15 november 2026 — originele dispatch SQL-identiteit kan niet overschreven worden door JSONB

**Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Oorzaak

De bestaande adapter `tools/outcome-obligation-supabase-store.mjs::normalizeDispatchRow` las zes canonieke databasekolommen maar spreidde `record`-JSONB als laatste. Daarmee kon optionele metadata een andere `ownerAgent`, `state`, `obligationId`, `type`, `idempotencyKey` of `traceId` rapporteren dan de oorspronkelijke append-only rij. Bij replay kon hierdoor een verkeerd eigenaarsoordeel in `assertCanonicalDispatchIdentity` terechtkomen. Dit is een bewezen **codepad**, niet een bewezen externe eigenaarswissel.

Native read-only Supabase op 15 november 2026 14:20:56 UTC: 6.017 bestaande rijen; nul metadata-owner, -obligation, -state of -idempotency; nul waargenomen identity-conflicten. Geen providerverzending, geldbedrag, autorisatie of bestaande status aangepast.

## Minimale bronreparatie

De bestaande adapter maakt eerst één canonieke projectie van `record_type,idempotency_key,obligation_id,owner_agent,trace_id,state`; leest `record` uitsluitend als aanvullende metadata; verwerpt conflicten op elk van de zes canonieke identiteits-/statusvelden; en zet de oorspronkelijke SQL-waarden als laatste in de resultaatprojectie. Bij conflicten faalt ook de complete historische listing of duplicate replay voordat de verkeerde eigenaar als ontvangen wordt gemeld.

- Bestaande Supabase-tabellen, RLS, append-only historie en POST `ignore-duplicates` blijven intact.
- Geen tweede outbox, cron, scheduler, queue, agent-executor, nieuwe provider-write of verzonnen `PROCESSED`.
- Originele Reliability- en Data Quality-agenten en bestaande herstel-skill krijgen de identificatieregel.
- Test: `tests/brain-outcome-obligation-supabase-store.test.mjs`: spoof owner/obligation/state/key/type/trace, list en duplicate replay, plus compatibele matching metadata.

## Release- en afsluitcontract

Alleen protected Required/BRAIN/CodeQL op exact-head en beschermde merge; daarop exact `main`-readback, originele natuurlijke Completion Supervisor-run en native read-only broncontrole. Het slagen van deze beveiliging maakt de 4.958 historische PENDING AgentWork of 1.059 RECOVERING RecoveryWork niet terminal; een provider- of consumentbewijs blijft vereist voor de oorspronkelijke zakelijke afsluiting. Parent #4198 blijft OPEN totdat dat onafhankelijk bewezen is.
