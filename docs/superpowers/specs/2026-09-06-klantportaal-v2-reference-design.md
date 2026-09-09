# Klantenportaal V2 — Reference Design Spec

## Doel
Bouw het klantenportaal opnieuw in exact de goedgekeurde dashboardstijl, met behoud van alle huidige content, pagina's en functionaliteit. Het screenshot met linker navigatie, KPI-rij, centrale Brain-cockpit, rechterrail en onderste managementkaarten is de visuele waarheid.

## Canonieke ontwerpregel — nooit opnieuw afwijken
Deze specificatie is de enige visuele contractbron voor Klantenportaal V2. `portal-v2/` is de enige uitvoerbare visual reference implementation. Losse root-previews, selftests of alternatieve HTML-interpretaties mogen niet opnieuw als ontwerpwaarheid worden geïntroduceerd.

Een wijziging is niet klaar omdat HTML/CSS technisch rendert. De gesloten kwaliteitsloop is verplicht:
**referentie → implementatie → contracttests → browser/device readback → visuele vergelijking → functionele readback → regressie/preventie → releasebewijs**.

Bij visuele afwijking wordt de implementatie aangepast aan de referentie; niet andersom. Een test-URL mag pas als bruikbare preview worden gedeeld als dezelfde build visueel is gecontroleerd. Productie mag pas worden vervangen na expliciete release-goedkeuring en groene release-gates.

## Harde visuele regels
- Desktopcompositie: vaste linker navigatie, header/search/AI/periode, vijf KPI-kaarten, centrale Brain-cockpit, rechterrail, Roadmap/Kansen/Impact en Recente activiteiten.
- De vijf KPI's zijn zichtbaar als één herkenbare managementrij: Bedrijfsgezondheid, Kennisborging, Processen, Data & systemen en AI-volwassenheid.
- Centrale cockpit volgt de actuele canonieke V2-flow: **Bronnen → Datahub → AI Brain → Powerhouse → Acties & outcomes**.
- De cockpit maakt de gesloten learning-loop zichtbaar zonder runtime-activiteit of productie-evidence te verzinnen.
- Rechterrail bevat minimaal: AI Management Summary, Aanbevelingen en Snelle links.
- Onder de cockpit staan minimaal: Roadmap & voortgang, Kansen & bedreigingen, Impact overzicht en Recente activiteiten.
- Actief element heeft blauwe focus, statusbadge en zichtbare dotted flow. Niet-actief blijft zichtbaar maar wordt gedimd/geblurd.
- Geen actieve bron = geen bronflow. Geen actieve module = geen outputflow. Blocked/failed = flow stopt op die stap.
- Geen productieclaim zonder runtime-evidence. Preview/demo-status moet expliciet als preview herkenbaar zijn.
- Mobiel gebruikt dezelfde design-taal en componenten, maar geen verkleinde desktop. KPI's, bronnen en modules zijn touch/swipe-first.
- Mobiele tap-targets zijn minimaal 44px en de pagina heeft geen horizontale desktop-overflow op 390px viewport.

## Bestaande portalinhoud die behouden moet blijven
Hoofddomeinen: Overzicht, Inzicht, Vergelijken, Denken, Overname, Doen, Brein & Powerhouse, Beheer.

Bestaande pagina's: Overzicht; Profiel per onderdeel; Data en AI; AI-scan/kansenkaart; Kansenkaart; Je gegevens invullen; Wat je hebt ingevuld; Businesscase; Cijfers en maatstaven; Waarde en financiering; Mensen; Branche en markt; Onderzoek; Compliance/security/governance; AI-capabilities; Strategiemodellen; Alle modellen; Canvassen; Eindconclusie; Due diligence; Exit; Van strategie naar maandagochtend; Actueel houden; Wijzigingen; Advies; Offerte; Roadmap; Uitvoeringsladder; Taken & werkstromen; Koppelingen; Gebruikers; Documenten; Instellingen; Audit.

Nieuwe expliciete Brain/Powerhouse-statuspagina's: Bronnenstatus; Datahubstatus; Brain-verwerking; Agentstatus; Actieve acties; Open recovery obligations; Outcomes & evidence; Learning/writeback; Self-heal/recovery; Audittrail.

## Functionaliteitsbehoud
- Nieuwe shell vervangt presentatie, niet de bestaande functionele contracten.
- Legacy live tabs blijven gemapt via de bestaande `portal-content-map.js` en bridge.
- Klantcontext `?klant=<slug>` blijft behouden.
- Strategie → maandagochtend, Uitvoeringsladder, Actueel houden en Wijzigingen blijven volledig bereikbaar.
- Brain/Powerhouse-status wordt evidence-gated; `verified` alleen met execution evidence.
- `paused` of `disabled` met een open recovery obligation is nooit succes; dit blijft blocked/recovering totdat evidence de herstelcyclus sluit.
- Geen actieve runtimebron of module mag door UI-defaults als echte actieve flow worden voorgesteld.

## Verboden regressies
- Geen nieuwe `klantenportaal-test.html` of `klantenportaal-selftest.html` als alternatieve UI.
- Geen RawGitHack/html-preview-achtige proxy als kwaliteitsbewijs.
- Geen mini-desktop op mobiel.
- Geen fictieve `Live`, `verified`, outcome of learning-status zonder evidence.
- Geen verwijdering of stil verbergen van bestaande portalpagina's om de nieuwe UI eenvoudiger te maken.
- Geen merge/deploy alleen omdat unit tests groen zijn; visuele en functionele readback horen bij de Definition of Done.

## Testbare acceptatiecriteria
1. Alle huidige live portal-tabs zijn gemapt in de nieuwe IA.
2. Dashboard bevat alle blokken uit het goedgekeurde screenshot.
3. Klik op bron activeert alleen die bron; overige bronnen worden gedimd.
4. Klik op module activeert alleen die module; overige modules worden gedimd.
5. Dotted flow bestaat alleen wanneer de relevante status actief is.
6. Mobiele layout heeft geen horizontale desktop-overflow op 390px viewport.
7. Productie `klantportaal.html` wordt niet vervangen vóór expliciete release-goedkeuring.
8. `portal-v2/index.html` bevat de volledige herkenbare dashboardcompositie en blijft de enige visual reference implementation.
9. Afgekeurde root-previews bestaan niet in de branch.
10. Een releaseclaim vereist contracttests + browser/device readback + functionele readback op dezelfde releasecandidate.
