# Bronwaarheid vóór bloggeneratie — Circular Plastics NL 2026

**Datum:** 30 oktober 2026. **Eigenaar:** oorspronkelijke Powerhouse Content Orchestrator, Blog Queue en ONE BRAIN. **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439.

## Geconstateerde fout
Een oorspronkelijke AI-blog legde ten onrechte vast dat CPNL op 6 oktober 2026 open zou gaan. RVO bevestigt dat de aanvraagperiode juist 21 april 2026, 09.00 tot 6 oktober 2026, 17.00 liep. Officiële bron: https://www.rvo.nl/subsidies-financiering/cpnl. De bestaande `powerhouse-blog-queue` blokkeerde dit met HTTP 422. Pas na een brongetrouwe correctie leverde dezelfde originele queue HTTP 200; dat betekent uitsluitend geaccepteerde, nog ongepubliceerde content.

Het oorspronkelijke draft is op 30 oktober bronjuist herschreven, voorzien van expliciete RVO-bron en omgezet van dubbel-geserialiseerde metadata naar JSONB-object. Het oorspronkelijke publicatierecord bleef `GENERATED`, met `external_id=null`, `published_at=null` en `live_proven_at=null`. Geen extra publicatie of vals succes.

## Structurele implementatie in originele agent
De bestaande `supabase/functions/powerhouse-content-orchestrator/index.ts` gebruikt nu dezelfde gedeelde `assessOfficialBlogDateTruth` als de oorspronkelijke blogqueue, maar vóór de write naar de bestaande artefacttabel. Na de bestaande lezerstestoets is precies één brongetrouwe herformulering toegestaan met hetzelfde goedgekeurde OpenAI-model; bij een onvoldoende resultaat sluit de kwaliteitscontrole af zonder artefactmutatie. De queue behoudt de onafhankelijke tweede datumcontrole en de bestaande exact-day CAS- en duplicaatbeveiliging.

Er wordt geen tweede agent, scheduler, database of publicatiekanaal gecreëerd. Buiten CPNL worden geen regelingclaims afgeleid. De oorspronkelijke ONE BRAIN-registratie `powerhouse-15-loop-portal-assurance:2026-10-30` bevat de runtime-oorzaak en blijft OBSERVED zolang natuurlijke toepassing en echte providerpublicatie niet bevestigd zijn.

## Acceptatie
Historische fout reproduceerbaar, correct gesloten RVO-tekst slaagt, broncontrole en lezerstest liggen vóór artefact-write, fallback valt gesloten, definitieve publicatie pas na GitHub Required/CodeQL, protected merge, Netlify/Supabase productiereadback en onafhankelijke publieke blogidentiteit. Test: `tests/brain-original-blog-official-date-prewrite-20261030.test.mjs`. Deze broncontrole bewijst geen betaalde omzet, aangevraagde subsidie of gebruikersconversie.
