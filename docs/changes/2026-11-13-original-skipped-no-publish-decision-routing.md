# 13 november 2026 — oorspronkelijke SKIPPED/no-publish-overdracht veilig en actiegericht

## Productie-incident en echte oorzaken

De originele `powerhouse_content_handoff_receipts_v1(timestamptz)` (bestaande cron #171) ontvangt echte `content_publication_obligations` uit alle kanalen. Zodra de bron `SKIPPED` is, hoort er **geen nieuwe publicatie** plaats te vinden. Voor een complete, geverifieerde `NO_PUBLISH` met `veto.active=true`, `decision_code`, `decided_at`, `no_publish_reason` en afwezigheid van provider-side effects werkt de bestaande terminale `CANCELLED`-guard terecht. Historische records missen echter geregeld **één verplicht bronveld** en mogen dus nog niet terminal worden afgesloten.

De originele else-route stuurde die incomplete `SKIPPED` records desondanks als `OVERDUE_PUBLICATION` naar de blog- of social-publisher. Dit is een verkeerd overgedragen actie — bronstatus `SKIPPED` is geen geldige toestemming tot publiceren. Werkelijke productie-audit (alleen lezen, 13-11-2026) vond 19 historische `blog/SKIPPED/NO_PUBLISH/veto.active=true` met ontbrekende `decision_code`, nog één `blog/SKIPPED/NO_PUBLISH` zonder actieve veto én code. De bron heeft wel gedateerde besluit-/redenvelden, maar daaruit een `decision_code` fabriceren zou de originele terminal-proof vervalsen. Verder zijn 8 `linkedin_personal`, 5 `instagram` en 4 `linkedin_company` open `SKIPPED/NO_PUBLISH`-records met mogelijke provider-side effects; de provideridentiteit moet eerst echt worden opgehelderd en een herpublicatie is verboden.

## Eén oorspronkelijke owner, twee veilige herstelacties

Nieuwe oorspronkelijke database-migratie `20261113132000_original_skipped_no_publish_evidence_routing_v1.sql` bevat exact de **gehele** op productie bewezen originele functie na migratie 844. De correctie voegt twee routeringskeuzes toe **tussen** het bestaande streng geverifieerde `NO_PUBLISH_POLICY_ACK` en de gewone `OVERDUE_PUBLICATION`-fallback:

1. **SKIPPED met providerreferentie of vermoeden van eerdere send:** `OVERDUE_PROVIDER_READBACK`. De bestaande originele provider-account-eigenaar (of protected blog writer bij blog) moet exacte post/account-identiteit teruglezen; nooit een tweede verzendopdracht.
2. **SKIPPED zonder providerbewijs en met nog onvolledige veto-/besluitmetadata:** `OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF`, eigenaar `powerhouse-content-loop / original no-publish governance`; volgende actie `ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND`. Blijft OPEN tot de oorspronkelijke eigenaar het werkelijke besluit en besluitcode met bewijs vastlegt; geen inferentie uit vrije tekst, geen terminale claim.

De oorspronkelijke status `CANCELLED` blijft alleen onder de ongewijzigde, actieve `brain_content_handoff_terminal_proof_guard_v1`; het oorspronkelijke publisherpad behandelt alleen echte niet-SKIPPED bronnen. Originale bron-`source_revision`, `consumer_ack`, provider-/meetscope, analytics, anti-duplicatie, tenant, timing en ieders event owner blijven onveranderd.

## Borging en bewijs

Nieuwe originele regressie `tests/brain-original-skipped-no-publish-decision-routing-20261113.test.mjs` controleert dat **uitsluitend** deze twee SQL-routeplaatsen verschillen van de vorige toegepaste migratie, en verifieert daarnaast terminatie-veto, provider-side-effect-voorrang, geen verzending en vaste originele security grants. `AGENTS.md`, de bestaande social-CRO skill, machineleerregel en humane ledger/document zijn bijgewerkt.

Acceptatie: beschermde Required/CodeQL, native Supabase preview, protect merge, onafhankelijke productie-versie+naam+functie+trigger/ACL readback en daarna natuurlijke originele #171-routeschakel. Geen claim van minder open verplichtingen zolang een echte originele bronbeslissing of providerreadback ontbreekt. Ketenstatus 7 RED blijft onafhankelijk waar tot de provider → metric → learned reuse bewezen is.

Origineel incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
