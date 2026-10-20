# P0 #4198 / P0 #4215 — begrensde commerciële contactbeoordeling

Datum: 2026-10-20
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Afhankelijkheid: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: commercial|contact-review-quarterhour-deduplication|20261020
Delivery-Lane: backend
Candidate-Type: recovery

## Geobserveerde bron van databasebelasting
De bestaande Supabase Edge Function `powerhouse-commercial-heartbeat-runner` voert `powerhouse_contact_authority_review_batch_v1(...,500)` uit **bij ieder Heartbeat-verzoek**. Productielogs op 20 oktober tonen dezelfde 500-opdracht met `57014` en `COMMERCIAL_CONTACT_AUTHORITY_REVIEW_FAILED`. Dit is aanvullend op de actieve oorspronkelijke `powerhouse-identity-graph-v1` cron (#138; 200 per slot). Daardoor bestaan meerdere initiators voor dure join/sort-verwerking tijdens commerciële en portaal-readback.

## Concrete wijziging zonder een proces uit te schakelen
- Behoud alle bestaande Heartbeat-aanroepen, commercieel verzenden, DM/like/comment/e-mail-gates, auth, providertransports en oorspronkelijke identity cron #138.
- Beperk alleen de aanvullende contactbeoordeling in bestaande Heartbeat Edge tot **maximaal 200** per attempt.
- Claim op de bestaande `powerhouse_runtime_events` met een deterministische UTC-slot-idempotency-key van 15 minuten via `ON CONFLICT DO NOTHING`. Eén volgehouden claim betekent geen nieuwe dure poging in hetzelfde slot na 16s timeout of retry. Nieuwe kwartierslots en de canonieke identity-cron blijven verwerking verzorgen.
- Striktere transactiegrenzen (3s slotclaim, 12s contactreview, 2s lockbudget). Afgewezen of mislukte review blijft expliciet RETRYABLE; geen afgeronde beoordeling, providerreceipt of contactautoriteit verzonnen.
- Het huidige `powerhouse_contact_authority_review_batch_v1` SQL heeft nog de kostbare volledige join totdat de reeds gemergede PR #4536 correct en veilig in productie kan worden gemigreerd. De wijziging hier reduceert aanvullende belasting; lost de SQL-plan/index-rootcause nog niet zelfstandig op.

## Fail-closed toelating en afronding
1. Exact-head Required CI, CodeQL, preview Supabase source-contract, protected merge.
2. Verifieer exacte Edge deployversie, code en log van ten hoogste 1 slotclaim per kwartier zonder dubbele contactreview, en onafhankelijk bewijs dat outbound lanes niet zijn uitgezet.
3. Onder stabiele lock/pooldruk de bestaande protected migratie `contact_authority_bounded_queue_v2` opnieuw beoordelen met schema- en planbewijs, **geen blinde retry**.
4. `57014`/lock/pool/cron startup aantallen en p95 over vergelijkbare vensters meten; authenticated portaal HTTP 200 en gescheiden twee-tenant Brain readback blijven vereist.

Geen LIVE_PROVEN of FULL_GREEN voordat alle resterende providerbewijzen bestaan.
