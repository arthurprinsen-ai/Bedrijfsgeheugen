# Portal V2 — volledige legacy capability-pariteit

Fingerprint: `portal-v2-full-capability-parity-v3`

## Canonieke regel
Portal V2 is uitsluitend de moderne SaaS-presentatielaag van hetzelfde Bedrijfsgeheugen Powerhouse. Het is geen tweede portaal, geen tweede database en geen tweede intelligence-laag.

```text
Powerhouse canonical data
  -> intelligence + business logic
  -> shared portal/domain services
  -> Portal V2 SaaS presentation
  -> tenant-scoped writeback
  -> advice / NBA / forecast / outcome / learning
```

`klantportaal.html` blijft tijdens de migratie de golden baseline voor beschermde legacy-capabilities. Een route, label, lege kaart, schema of inventory-record is nooit voldoende parity-evidence.

## Completion gate
Een capability mag uitsluitend `verified` worden wanneer aantoonbaar gelijkwaardig zijn: inhoud en toelichting; berekeningen/scores/interpretaties; grafieken/canvassen/downloads/acties; invoer en interactie; canonieke Powerhouse-binding; tenant/provenance/freshness/confidence waar relevant; serverbevestigde writeback; downstream effect waar functioneel bedoeld; en productie/browser-readback.

Statussen zijn `contracted -> implemented -> verified` of expliciet `retired`. `implemented` betekent nadrukkelijk niet live bewezen.

## Herstel 15 september 2026
De audit van current main toonde twee concrete false-parity gaps:

1. Canvassen renderde zes namen maar inhoudelijk grotendeels slechts `kernvraag + eigenaar`. V3 herstelt zes inhoudelijke canvasviews (Business Model, Waardepropositie, Lean, Merk, Content, Sales), afgeleid uit dezelfde `portal.*` klantstate, met eigen klantantwoord/eigenaar en writeback via de bestaande `domainState.flush()`.
2. De legacy BCG-matrix ontbrak uit de V2 modelengine. V3 voegt een inhoudelijke strategiemodellenprojectie toe met minimaal SWOT, Balanced Scorecard, 7S, Blue Ocean/ERRC, Ansoff, Drie Horizonten, BCG, Vijf Krachten, Waardeketen, DESTEP, Waardepropositie, PDCA/DMAIC, RICE/MoSCoW, Value Disciplines en Kano. BCG gebruikt marktgroei plus eigen versus branchepositie en toont kwadrant, waarden, uitleg en conclusie.

De specialistische modelview wordt gebruikt voor `strategie-naar-maandagochtend` én de V2-routes `strategiemodellen`/`modellen`. De bestaande canonical domain-state en server-writeback blijven authority; er is geen parallelle V2-opslag toegevoegd.

## Assurance
Machine-readable authority: `portal-v2/assurance/portal-v2-parity.json`.

Release-invariant: geen `verified` wanneer `production_evidence_status` niet `verified` is. Route presence en inventory presence tellen niet als parity. Productiepromotie blijft fail-closed bij rode Required/BRAIN/Portal V2 checks.

## Release lineage
Implementation PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/1656

Open totdat feitelijk bewezen: Required + Portal V2 + BRAIN groen; protected merge; productie-deploy van exacte merge-SHA; browser/DOM/readback van de relevante V2-routes; daarna pas assurance-evidence naar `verified` en finale Powerhouse/Notion writeback.
