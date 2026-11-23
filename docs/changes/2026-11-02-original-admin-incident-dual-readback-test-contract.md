# BRAIN herstel: twee bestaande, beveiligde incidentuitlezingen

**Datum:** 2 november 2026. **Oorspronkelijke eigenaar:** ONE BRAIN backend, Powerhouse portaalobservatie en SkillOps. **Incident:** #4439. **Status:** bronkandidaat, niet automatisch live.

## Wat ging mis?
In de oorspronkelijke volledige BRAIN-backendrun #41409975773 (job #125160796452) faalden 32 van 5.358 tests. Test 2994 voor de portal-failure-coverage had de letterlijke verwachting dat slechts één HTTP-read werd gedaan, maar de originele serverbron `brain/observability/failure-coverage-projection.mjs` voert correct twee verschillende reads uit. De eerste leest uitsluitend incidentcompleetheid met een exact aantal; de tweede leest één allowlisted voorspellingsincident zodat de interface niet onterecht herstel claimt. De historische test was niet bijgewerkt bij het toevoegen van deze tweede veilige bronverificatie.

## Reparatie en beveiliging
De broncode van het bestaande Powerhouse-portaal, diens authenticatie, SQL, provider, scheduler en writer veranderen **niet**. Alleen de oorspronkelijke regressietest controleert nu **exact twee** toegestane server-GETs op een geslaagde eerste bron: de eerste met `count=exact`, begrenzing `limit=1000`; de tweede met een exact ge-URL-encodeerde allowlisted fingerprint en `limit=1`, zonder breed count-bewijs. Bij falen van de tweede bron blijft voorspelling `UNVERIFIED` en het eerste incidentaggregaat kan wel `READBACK_COMPLETE` blijven. Bij weigering van de eerste bron stopt de keten na **één** request en blijft de totaaltelling `UNAVAILABLE`. Geen providercredentials of ruwe incidentinformatie naar de browser.

## Preventie en eenmalige bewijsroute
Historische replay: `tests/brain-portal-failure-coverage-readback-20261029.test.mjs`. Eén originele agent/skill-instructie: `.agents/skills/powerhouse-post-merge-codeql/SKILL.md`. Machineleerrecord: `brain/learning/2026-11-02-original-admin-incident-dual-readback-test-contract-v1.json`. Menselijk wijzigingslog: `docs/development-ledger-events/2026-11-02-brain-original-admin-incident-dual-readback-contract.md`.

De regellogica is: **status readback ≠ bewezen herstel**. De gewijzigde test moet in Required slagen; daarna CodeQL, beschermde merge en een **nieuwe volledige originele BRAIN-run** bewijzen hoeveel fouten resteren. Het oorspronkelijke #4439 blijft open totdat alle bronproblemen en terminale uitkomsten onafhankelijk zijn hersteld. Deze afzonderlijke reparatie betekent niet dat overige fouten, e-mail, publicaties of omzet zijn opgelost.

## Transparante eerdere poging
De eerste PR #5259-poging faalde in Required #41412531277 op `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: human_documentation`; daarom is dit afzonderlijke `docs/changes`-bestand toegevoegd. Die mislukte run blijft als incidentbewijs intact, niet als succes.
