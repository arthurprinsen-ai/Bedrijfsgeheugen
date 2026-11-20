# Portal V2 — spraakbediening & signalering met advies

Datum: 2026-11-20
Fingerprint: portal-v2-voice-signal-advisor-v1
Eigenaars: Portal V2 experience / oorspronkelijke tenantgebonden BusinessInput → ONE BRAIN → Powerhouse → Heartbeat

## Functies

- Eén zichtbaar toegangspunt voor spraak én signaleringen op bestaande V2, mobiel en desktop. Geen los dashboard of parallelle API.
- Spraakherkenning start uitsluitend na expliciete microfoonactie. Nederlands (nl-NL) en schriftelijke fallback. Navigatie via de bestaande router en autorisatie/plan-gates. Vraagafhandeling via bestaande /api/portaalvraag met tenantgebonden context. Geen vrije code-executie, geen ongevraagde submit en geen audio-opslag door het portaal.
- Geselecteerde, niet-gevoelige velden kunnen gedicteerd worden; gebruiker controleert en slaat zelf op. Browsergebaseerde spraakherkenning heeft beperkte dekking en kan browserdiensten gebruiken.
- Signaleringen voor omzet, EBITDA, brutomarge, debiteurenbetaaltermijn, liquide middelen, verzuim, verloop en doorlooptijd. Regels: onder, boven of ontbrekende bronwaarde; instelbare grens en prioriteit; pauzeren of activeren.
- Servergebonden opslag via bestaande domainState.patch('portal.signalering') → flush → authenticated readback. Niet in localStorage; geen rechtstreekse browsertoegang tot Supabase. Geen mutation zonder sessie; demo/preview zijn fail-closed.
- Afwijking, binnen grens, geen-data en uitgeschakeld zijn verschillende states. Signalering toont bronpad, meetwaarde/grens, expliciete actualiteitsonzekerheid, advies en een knop naar het bestaande analyses-/actieonderdeel. Er wordt geen actie als uitgevoerd gemarkeerd door navigatie.

## Grenzen / nog geen live-producer

Deze implementatie evalueert zichtbare, geauthenticeerde portal-state bij open/refresh en bevat géén autonome cron, e-mail, push of 24/7 signaalverzending. Voor die vervolgstap moet de *bestaande* Heartbeat-executor een server-side tenant-/RLS-gecontroleerde rekenstap ontvangen, met idempotent incident-fingerprint, deduplicatie, cooldown, ontvangerkeuze, toestemming per kanaal, provider-ID en onafhankelijke readback. Maak geen tweede scheduler of ander bedrijfsgeheugen. Totdat zulke server-evidence bestaat blijft de meldstatus uitsluitend een portaalstatus.

## Acceptatiebewijs

Tests: portal-v2/tests/voice-signals.test.mjs.
Release-admissie: exact PR-head Required CI groen, beschermde merge, productie-deploy SHA gelijk aan merge SHA, en browserreadback op /portal-v2/ met echte Identity-account + tenanttest, ontbrekende data, Safari/iOS-support of typed fallback. Nog niet claims als GREEN/LIVE zonder dat bewijs.
