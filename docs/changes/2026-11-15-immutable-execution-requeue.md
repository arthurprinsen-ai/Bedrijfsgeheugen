# Historische Powerhouse-uitvoering gescheiden van huidige actiestatus

**15 november 2026 · oorspronkelijke engineering kandidaat** `55bb0754-355b-4940-aaea-aed7123e7e57` · P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Bronbewijs en fout
Oorspronkelijke Canonical Supabase-controle van `powerhouse_cycle_events` op interne `sales_action/execution`: **164 originele immutable events** in zeven dagen, **164** met een echte writer `public.powerhouse_advance_sales_action_v1`, `status=done`, `truth_class=observed_action_state`, originele `evidence_ref` en historisch consistente `executed_at`. In de **huidige** `powerhouse_sales_actions` zijn 163 acties `done` en 1 actie `waiting`.

Die ene actie is `research_enrichment` (`channel=internal`) en kreeg **na** de oorspronkelijke uitvoering een nieuwe planning. Het bestaande readmodel van PR #5857 trok het **huidige** veld `status` ten onrechte als noodzakelijke oude eventstatus in de bronkoppeling. Daardoor zou `SOURCE_EXECUTION_GAP` ontstaan ondanks betrouwbare oorspronkelijke SQL-writer-data. Het oude event mag niet worden herschreven en een latere `waiting` mag noch tot een vals bewijs van provideraflevering, noch tot een valse historische fout leiden.

## Functionele correctie
Behoud het bestaande geauthenticeerde admin-API, de Netlify-bundel, originele PostgREST-serviceverbinding, vaste 7d-observatieperiode, exacte `Content-Range`, maximaal vijf pagina's met honderd events en volledige action-id joins. Lees bij iedere oorspronkelijk gepagineerde `powerhouse_cycle_events` ook **alleen server-side** `evidence_ref,payload`. Vereis exacte writeridentiteit, writercontract `v1`, `payload.status=done`, `truth_class=observed_action_state`, originele UUID-specifieke `evidence_ref`, consistente event-`executed_at` en gelijkheid met de nog aanwezige `powerhouse_sales_actions.executed_at`. Keur een verdachte/missende bron af.

Tel `actionBackedSample` als **interne historische uitvoeringsbron** en `currentActionNotDoneSample` als eigen dimensie: een oude `done` mag onafhankelijk samenhangen met een huidige `waiting`. Toon beide in de **bestaande** admin Powerhouse cockpit en preserveer `externalProviderProof=false`, `paidOutcomeProof=false`, `readOnly=true`. Geen PII, UUID's, ontvangers, tokens of complete payloads naar browser, nieuwe queue, scheduler, agent, tenant of privileged endpoint.

## Acceptatie
- Beschermde Required/CodeQL, Netlify preview/parity en exact main SHA.
- **Echte Netlify production READY** op de nieuwe exacte protected SHA; de import-/buildfilterreparatie van PR #5861 is vereiste basis.
- Na onafhankelijke geauthenticeerde admin-readback: `FULL_LAST_7D` plus interne historisch bewezen teller, actuele requeue teller en geen valse externe provider-claims.
- Broncount kan verschuiven; vergelijk bij releasedatum de **werkelijke** 7d-telling, niet klakkeloos de historische 164.
- Origineel `brain_operations` ID `edebcb32-335b-49f0-b527-eb4289f95c5c` behoudt exact bronrevisie/owner, blijft `PLANNED` zonder zelfverklaarde agent-ACK. Alle 14 originele innovatieverplichtingen blijven OPEN totdat werkelijke uitvoering, onafhankelijke providercontrole, Heartbeat-effect en leren sluitend zijn.

Rollback: bestaande beschermde git/Netlify route; oorspronkelijke histories blijven onveranderd. Regressie: `tests/brain-innovation-sales-execution-readback-20261115.test.mjs`.
