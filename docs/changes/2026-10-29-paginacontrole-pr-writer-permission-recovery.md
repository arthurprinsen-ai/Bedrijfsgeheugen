# Herstel publicatie kandidaat SEO-status — 29 oktober 2026

Fingerprint: `powerhouse|website|paginacontrole|20261029`.

## Geconstateerd
GitHub Actions [Pagina- en SEO-controle #40889498268](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40889498268) genereerde op de bestaande writer-branch een SEO-statusactualisatie, maar faalde bij `gh pr create` omdat de GitHub Actions-token geen pull requests mag creëren. Dit is een repository-beveiligingsinstelling en mag niet stilzwijgend worden omzeild.

Het enige bronverschil in de kandidaat was `seo-status.json.bijgewerkt` van 2026-10-26 naar 2026-10-29. Dat herstelt de paginafout op `/afsluiten` niet.

## Afhandeling
De bestaande branch is met de afzonderlijk geautoriseerde GitHub-verbinding aan een PR gekoppeld als [#5123](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5123). Deze update houdt de canonieke Brain-learning, mensenleesbare wijzigingsregistratie en ontwikkellog bij. De workflow en security-instellingen blijven intact; er wordt geen tweede writer of scheduler aangemaakt.

## Onafhankelijke acceptatie
Beschermde Required en CodeQL moeten op de laatste PR-head slagen. De `/afsluiten` JavaScript-fout wordt afzonderlijk gecorrigeerd via PR #5124; pas een nieuwe echte browsercontrole mag dat issue sluiten. Een structurele goedgekeurde PR-aanmaakroute voor de GitHub Actions-writer blijft open.

**Status: CANDIDATE, NIET ALS GROEN AANGEMERKT.**
