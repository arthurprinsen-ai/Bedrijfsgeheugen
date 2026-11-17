# 17 november 2026 — bestaande Mira-radar per kanaal fail-closed in plaats van cascade

- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
- Oorspronkelijke uitvoerder: #120 powerhouse-mira-problem-radar-v1
- Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Onafhankelijk bewezen fout
De originele productieaanroep van 17 november 2026 20:02 UTC voor **runDate 2026-11-18** had provider HTTP503 (native pg_net response ID 34368, Supabase Edge v1126). Het antwoord toonde `sourceRecovery=null`, `materialized.ok=true`, één echte zakelijke kandidaat met `score=0.913`, zonder provider/writeback errors, maar `personalSourceRecovery.reason=PERSONAL_USER_EXPERIENCE_NOT_VERIFIED`. Oorzaak: `allSourceReady=supply.ok&&personalPublishingSourceReady` was voor de gezamenlijke HTTP-verdict gebruikt.

Een bruikbare oorspronkelijke Instagram/Mira-businessbron mocht niet door de **andere** persoonlijke LinkedIn-bron tot HTTP503 worden gedegradeerd. Persoonlijke LinkedIn mag omgekeerd nooit op basis van een zakelijk artikel of HTTP200 zonder user-fact bewezen worden.

## Exacte bounded fix in de bestaande owner
- `miraBusinessSourceReady=supply.ok&&errors.length===0`: alleen een daadwerkelijk bruikbare, foutloze oorspronkelijke businessbron krijgt HTTP200.
- `allSourceReady=miraBusinessSourceReady&&personalPublishingSourceReady` blijft expliciet als overall status.
- Als alleen personal ontbreekt, `state=MIRA_SOURCE_READY_PERSONAL_RECOVERY_DUE`, `miraBusinessSourceState=SOURCE_READY`, `personalSourceState=SOURCE_RECOVERY_DUE`, `personalSourceRecovery.sendsAuthorized=false` en oorspronkelijke `brain_observe_failure` blijven overeind.
- Bij zakelijke bron niet klaar HTTP503; provider/writeback errors HTTP502; auth 401/503 blijft ongewijzigd fail-closed.
- Geen extra cron, generatie, Meta/LinkedIn-sender, mediavervanger, tokenrotatie of verstrekkende toestemming.

## Verplicht bewijs en begrenzing
Tests beschermen beide bestaande failure gates, bronselectie, echte persoonlijke user-fact en het aparte kanaal-ACK. Deploy uitsluitend na eigen Required/CodeQL, Supabase native Edge source byte/sha readback en natuurlijke #120 cron (de native cron `1 row` is slechts enqueue). De fix **maakt geen** Mira-asset, Instagram- of persoonlijke LinkedIn-post en bewijst geen bereik, orders of leereffect; die oorspronkelijke verplichtingen blijven OPEN tot onafhankelijke provider-GET, BRAIN PROCESSED, Heartbeat en NEXT-run learning.

Repo-tests: `tests/brain-mira-independent-personal-source-20261117.test.mjs`, `tests/brain-original-personal-radar-source-parity-20261115.test.mjs`, `tests/brain-mira-radar-http-contract-20261113.test.mjs`.
