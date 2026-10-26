# Ontwikkellog — AI-modelkeuze en datasoevereiniteit (2026-10-15)

**Obligation-ID:** `portal-ai-model-choice-sovereignty-20261015`
**Pull request:** [#4380](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4380)

## Aanleiding
De bestaande catalogus bevat 110 externe AI-modelrecords. De gecontroleerde leveranciersadministratie bevat 83 VERIFIED (leveranciersboekhouding), 26 PARTIAL en 1 CONFLICT. Dit zegt niets over klantspecifieke API-toegang, dataverwerking of EU AI Act-certificering.

## Vastgelegde handelingen
- Een nieuwe, beveiligde portaalroute `ai-modelkeuze` toegevoegd onder Data & intelligence, met Pro-entitlement.
- Alle 110 records als **gewenst model** selecteerbaar gemaakt; geen wijzigingen aan inference-router, API-secrets of klantrechten.
- Een versiegebonden leveranciersstatusmomentopname toegevoegd, met controle op ontbrekende of dubbele model-ID's.
- Datasoevereiniteit opgesplitst naar opslag, inferentie, training, bewaartermijn, klantbeheerde sleutels, eigen hosting en providerjurisdictie. Algemene documentatie is niet verward met klantbewijs.
- Klantspecifieke voorkeuren gaan uitsluitend via de al aanwezige aangemelde Portal Domain State, met flush en teruglezing.
- AI Act-toepassingsrisico wordt als **voorlopige** klantkeuze vastgelegd; geen automatische juridische classificatie.
- Regressietests en Brain-historical-replaycontract toegevoegd.

## Eigenlijke bewijsstatus
Bij aanvang van deze log is de nieuwe release **niet op productie geaccepteerd**. De eerste Required CI-run faalde op een niet-geclassificeerd nieuw data-pad, daarna op ontbrekende verplichte integratiebewijsregistraties. Het statusbestand is verplaatst naar de bestaande portaalroute en deze log plus leerevaluatie en wijzigingsdocumentatie completeren de vereiste registratie. Geslaagde checks, merge en productie-readback moeten afzonderlijk worden aangetoond.

## Openstaande technische grens
De wenslijst is geen live uitvoeringscontract. Een aparte geautoriseerde providerconnector, regioverificatie, DPA, privacy- en AI Act-toepassingscontrole en onafhankelijke runtime-toelating zijn vereist vóór gebruik van echte klantdata. Amazon Nova Premier blijft CONFLICT.
