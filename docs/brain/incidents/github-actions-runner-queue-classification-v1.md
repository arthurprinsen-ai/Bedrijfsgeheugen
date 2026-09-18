# GitHub Actions runner queue classification — Powerhouse learning v1

Fingerprint: `delivery-failure|capacity|shared|github-actions-queued-not-platform-outage`

Prevention rule: `CLASSIFY_GITHUB_QUEUE_BEFORE_EXTERNAL_CAPACITY_BLOCK`

## Aanleiding

Bij PR #1797 op candidate head `d8351464c535ef2c8243261ba1a434ddce860213` stonden beschermde GitHub Actions-gates in de wachtrij. De eerste statusclassificatie luidde dat de delivery hard geblokkeerd was op externe GitHub Actions runner-capaciteit.

Nader onderzoek liet een genuanceerder beeld zien. Op exact dezelfde candidate SHA waren veel workflows al succesvol afgerond. Binnen `Required test` waren preflight, automation, backend en portal groen en kreeg de website-lane later alsnog een runner. Binnen `Unified Brain Delivery` was `candidate-identity` groen terwijl `plan` nog queued bleef. De `plan`-job gebruikt `runs-on: ubuntu-latest` en was dus afhankelijk van een GitHub-hosted runner, niet van een eigen self-hosted runner.

Daarmee was runner scheduling/wachttijd bewezen, maar een GitHub-brede capaciteitsstoring niet.

## Canonieke les

Een queued GitHub Actions-job is geen zelfstandig bewijs van een platformbrede storing of harde externe capaciteitsblocker. Powerhouse moet eerst aantonen welk type wachtrij optreedt en of de queue nog aantoonbaar beweegt.

De standaardclassificatie bij aantoonbare voortgang is daarom:

`DEELS LIVE — EXTERNE EXECUTIE WACHT`

`GEBLOKKEERD` wegens externe runner-capaciteit is alleen toegestaan wanneer een bounded observation window geen voortgang laat zien, het vereiste gate daadwerkelijk geen uitvoeringscapaciteit kan verkrijgen, de externe boundary onafhankelijk aantoonbaar is en veilige herstelpaden zijn uitgeput zonder branch protection te omzeilen.

## Verplichte diagnosevolgorde

1. Lees alle workflow- en jobstates op de exacte candidate head SHA.
2. Splits status uit naar `queued`, `in_progress`, `success`, `failure` en `cancelled`.
3. Bepaal runner authority: GitHub-hosted (`ubuntu-latest`, etc.) versus self-hosted labels.
4. Controleer of sibling jobs op dezelfde SHA ondertussen wel runners verkrijgen en verder lopen.
5. Inspecteer concurrency groups, matrixfan-out, duplicatieve workflows en retriggerdruk.
6. Gebruik GitHub platformstatus uitsluitend als aanvullend bewijs; een groene statuspagina bewijst niet dat er geen lokale scheduling delay bestaat, maar een queued job bewijst evenmin een platformbrede storing.
7. Hertrigger niet zolang de bestaande exact-head run aantoonbaar progressie boekt.
8. Omzeil nooit branch protection of required checks om een wachtrij te passeren.
9. Na gates: vervolg exact-SHA merge/promotion, productie-readback en learning writeback.

## Waarom niet opnieuw triggeren

Een nieuwe commit of extra rerun terwijl de queue afloopt kan meer workflows en runnerallocaties veroorzaken, de eigen concurrencydruk vergroten en exact-head evidence versnipperen. Een retrigger is pas gerechtvaardigd bij failure/cancellation of bij bewijs dat de bestaande run niet meer uitvoerbaar is.

## Structurele Powerhouse-verbeteringen

Powerhouse moet CI-capaciteit als een meetbare delivery-resource behandelen. Leg per kandidaat vast: queue wait, execution duration, runnerallocaties, duplicatieve runs, lane fan-out en superseded work. Gebruik changed-lane selectie en doelgerichte concurrency groups om onnodige runnerallocaties te reduceren. Houd platform scheduling apart van product/test failure zodat incidenten correct worden gerouteerd.

## Bewijs van referentie-incident

- PR: `#1797`
- Candidate head: `d8351464c535ef2c8243261ba1a434ddce860213`
- Unified Brain Delivery: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/35109194027
- Required test: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/35109194549
- Workflow: `.github/workflows/unified-brain-delivery.yml`
- Runner class van `plan`: `ubuntu-latest`

## Hergebruikcontract

Alle bestaande en nieuwe Powerhouse-agents die delivery-, CI-, merge- of production-promotionstatus classificeren moeten deze learning toepassen voordat zij `GEBLOKKEERD op externe GitHub Actions runner-capaciteit` rapporteren. Status moet bewijsbaar zijn, op exact-head state rusten en onderscheid maken tussen wachtrij, voortgang, productfout, configuratiefout en echte externe boundary.
