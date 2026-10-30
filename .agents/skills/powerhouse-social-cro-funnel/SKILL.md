---
name: powerhouse-social-cro-funnel
description: Operate the existing Bedrijfsgeheugen social post → engagement → website CTA → qualified lead → independent order → ONE BRAIN learning loop without inventing provider metrics or a second executor.
---

# Powerhouse social CRO — één bewijsgestuurde lus (30 oktober 2026)

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

## Canonieke eigenaren, geen tweede systeem
De bestaande **powerhouse-content-orchestrator / publisher** is de enige schrijver van posts; **bg-social-metrics-sync** leest periodiek geautoriseerde providerdata; **social-learning-evaluate** heeft de bestaande hourly 24/48/72h-evaluatie; de **Content Growth Learning** workflow bewaart advies. Het enige geheugen is ONE BRAIN / `social_learnings` / `social_learning_decisions` / `social_learning_applications` en de commerciële outcome-lineage. Er komt **geen nieuwe cron, scheduler, providerwriter of tweede CRM**. Hou de bestaande executor actief bij herstelbare verstoringen.

## Voor élke publicatie- of groeibeslissing verplicht
1. Raadpleeg per `post_id` de bestaande kanaalidentiteit: `canonical + linkedin_personal`, `bedrijfsgeheugen + linkedin_company`, of `bedrijfsgeheugen + instagram`. LinkedIn zonder `channel_kind` blijft *niet geclassificeerd*; gok nooit op het bedrijfskanaal. Verifieer daadwerkelijk bestaande `external_post_id` en `content_publication_obligations`; nooit opnieuw posten bij onzekere readback.
2. Controleer beschikbaarheid en provider-echtheid van impressies, bereik, views, likes, comments, shares/reposts, saves en clicks, en vermeld ontbrekende metriek als **onbekend**. LinkedIn persoonlijk heeft momenteel reaction-only; identiteiten van individuele *viewers* zijn niet beschikbaar. Behandel openlijk kenbare commenters/reaction actors uitsluitend met providerpermissie, doelbinding, dataminimalisatie en bewaartermijn. Geen geautomatiseerde persoonsprofilering.
3. Evalueer **vergelijkbare leeftijd** van posts: 48 uur na publicatie ±6 uur, afgelopen 7 dagen versus voorgaande 21 dagen. Per metriek en periode minstens vijf onafhankelijke providerwaarnemingen; `OBSERVED_PARTIAL_SCOPE`, `PROVIDER_OBSERVED_LINKED` en losse provider-rapportdatums mogen niet als exacte 48h-causale meting tellen. Geen verruiming thresholds omdat het resultaat rood is.
4. Verander per gecontroleerd experiment één variabele (situatie/hook, feitelijk verhaal, format, CTA, publicatiedag/tijd). Controleer concrete situatie → oorzaak/gevolg → begrijpelijke pointe → passende zakelijke CTA. Respecteer de bestaande unieke-verhalenpoort; geen fictieve case of kunstmatige interacties.
5. Prioriteer **onafhankelijk betaalde orders en omzet > gekoppelde gekwalificeerde leads > bewezen websiteconversie > geattribueerde CTA/kliks > engagement > bereik**. Behandel niet-toegeschreven pageviews, lege GA4-batches en klikintenties niet als omzetbewijs.
6. Schrijf een besluit met hypothese, kanaal, basislijn, cohort, provider-ID, confidence, bronkwaliteit en effectmaat via de **bestaande** decision/experimentregisters. Koppel de toegepaste regel met `learning_id` en `application_id` aan de **volgende natuurlijke** post. Vergelijk pas ná een onafhankelijke meetperiode, anders `PENDING_EVIDENCE`.
7. Publiceer in het bestaande portaal **Data & intelligence → Andere data** uitsluitend de geauthenticeerde bronprojectie van drie kanalen. Een ontbrekend bewijs blijft `UNAVAILABLE` of `INSUFFICIENT_48H_EVIDENCE`; nooit kunstmatig `GREEN`. Bestaande admin JWT en tenantisolatie blijven hard.
8. Bij ontbrekende, verouderde of falende bron: classificeer onder de **bestaande** ONE BRAIN fingerprint `content-growth|three-channel-social-funnel-personal-omitted-age-bias|20261030-v1`, log occurrence, oorzaak, onafhankelijke readback, owner, bounded herstel en regressietest. Herstel de *originele* provider/collector of toestemming langs officiële route. Dubbele incidenten of alternatieve LinkedIn-/Instagram-connectors zijn verboden.

## Release-/bewijscontract
Tests: `tests/brain-three-channel-social-funnel-trend-v1.test.mjs`, `tests/brain-social-cro-portal-evidence-v1.test.mjs`, `tests/brain-daily-content-performance-diagnostics-v1.test.mjs`, `tests/portal-cro-other-data.test.mjs`.
De eerste geldige claim is: protected Required + CodeQL → **exacte** main-SHA → productie Netlify READY op dezelfde SHA → geauthenticeerde portal readback en werkelijke natuurlijke Content Growth-run → voor kanaalgroei echte leeftijdsgelijke providerdata → voor commercieel resultaat exact gekoppelde CTA, lead en betaalde order → bewijs van toegepaste leerregel. Een succesvolle CI-check is **niet** automatisch effectiviteit, publicatie of omzet. Het doel is een stijgende trend over voldoende steekproeven; dagelijkse monotone stijging is niet te garanderen.

Technische eigenaars: bestaande Content Growth Learning, social-learning-evaluate, bg-social-metrics-sync, Powerhouse CRO Control Center. Herstelregistratie: `brain/learning/2026-10-30-three-channel-social-cro-funnel-evidence-v1.json`, `docs/changes/2026-10-30-three-channel-social-cro-funnel-v1.md`, PR #5187 (opvolger van #5185 en #5182).
