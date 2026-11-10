# 10 november 2026 — exacte provider-linked meting doorgifte social-learning

**Bronincident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
**Vingerafdruk:** `powerhouse|social-learning|provider-linked-company-window-unconsumed|20261110-v1`
**Eigenaar:** originele `netlify/functions/social-learning-evaluate.mjs` met eigen Supabase `social-learning-store`; geen tweede uitvoerder.

## Vastgestelde feiten
Op productie waren 179 oorspronkelijke social-learning-verplichtingen OPEN en OVERDUE. De echte LinkedIn-bedrijfssnapshots uit Windsor dragen `PROVIDER_OBSERVED_LINKED` met exacte post-URN en geverifieerde bedrijfsaccount/author proof. De drie oorspronkelijke consumers (due-window index, evaluator filter, originele source/ACK) accepteerden deze klasse niet; een externe providerwaarneming mocht daardoor niet door naar de bestaande exact-window evaluator. Andere historische vensters hebben terecht géén voldoende bron en blijven OPEN.

## Eén wijziging, drie oorspronkelijke consumers
Een gedeelde bronkwalificatie in de bestaande shared module checkt `source=windsor-linkedin-company`, `source_event_id`, `provider_post_urn`, `provider_organization_urn`, `independent_proof`, `source_quality_before_link`, `scope` en eindige niet-negatieve `impressions`. Alleen die combinatie maakt `PROVIDER_OBSERVED_LINKED` geschikt voor dezelfde onafhankelijke oorspronkelijke window-evaluatie. De bestaande implementatie blijft nauwkeurig op tenant, post, evaluatie-ID, ±6 uur en exacte metriekwaarden controleren en schrijft de originele ACK idempotent; geen bulk-false-green.

## Regressietests
`tests/brain-social-obligation-evidence-ack-20261110.test.mjs`: exact gekoppeld provider-event positief, foute URN/organisatie/accountbewijs/tijd/bron/data negatief.
`tests/brain-social-learning-observed-window-priority-v1.test.mjs`: provider-linked bron krijgt alleen in het echte venster voorrang; partiële scopes blijven uitgesloten.

## Verificatiegrens
PR is een beveiligde kandidaat, geen live claim. Vereist: exacte Required/CodeQL, beschermde merge, Netlify- en Supabase-gebundelde runtimebroncontrole, daadwerkelijk originele volgende hourly, originele window ACK en BRAIN source-to-consumer ACK. Causaal A/B-bewijs en commerciële providerreplies/afspraken/omzet zijn andere verplichtingen; deze wijziging bewijst geen commerciële inkomsten en maakt verouderde e-mails niet opnieuw verzendbaar.
