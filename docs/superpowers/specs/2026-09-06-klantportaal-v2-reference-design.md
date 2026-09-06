# Klantenportaal V2 — Reference Design Spec

## Doel
Bouw het klantenportaal opnieuw in exact de goedgekeurde dashboardstijl, met behoud van alle huidige content, pagina's en functionaliteit. Het screenshot met linker navigatie, KPI-rij, centrale Brain-cockpit, rechterrail en onderste managementkaarten is de visuele waarheid.

## Harde visuele regels
- Desktopcompositie: vaste linker navigatie, header/search/AI/periode, vijf KPI-kaarten, centrale Brain-cockpit, rechterrail, Roadmap/Kansen/Impact en Recente activiteiten.
- Centrale cockpit is altijd: **Bronnen → Het bedrijfsgeheugen → Klantenportaal**.
- Het bedrijfsgeheugen toont visueel **AI Brain → Datahub → Powerhouse** met learning-loop.
- Actief element heeft blauwe focus, statusbadge en zichtbare dotted flow. Niet-actief blijft zichtbaar maar wordt gedimd/geblurd.
- Geen actieve bron = geen bronflow. Geen actieve module = geen outputflow. Blocked/failed = flow stopt op die stap.
- Geen productieclaim zonder runtime-evidence. Preview/demo-status moet expliciet als preview herkenbaar zijn.
- Mobiel gebruikt dezelfde design-taal en componenten, maar geen verkleinde desktop. KPI's, bronnen en modules zijn touch/swipe-first.

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

## Testbare acceptatiecriteria
1. Alle huidige live portal-tabs zijn gemapt in de nieuwe IA.
2. Dashboard bevat alle blokken uit het goedgekeurde screenshot.
3. Klik op bron activeert alleen die bron; overige bronnen worden gedimd.
4. Klik op module activeert alleen die module; overige modules worden gedimd.
5. Dotted flow bestaat alleen wanneer de relevante status actief is.
6. Mobiele layout heeft geen horizontale desktop-overflow op 390px viewport.
7. Productie `klantportaal.html` wordt niet vervangen vóór expliciete release-goedkeuring.
