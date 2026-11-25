# Causaal CI-herstel: vertakte PR ≠ wijzigingen op main (2026-10-22)

## Incident
Revenue-owner PR #4630, Required run 39861215523 / job 120112317455, werd onterecht geweigerd met `SCOPE_CONTAMINATED`: preflight zag 126 gewijzigde bronbestanden. De live GitHub PR-vergelijking toont exact 6 bron- en verificatiebestanden. De bestaande branch liep achter op een verder ontwikkelde beschermde `main`.

## Geïsoleerde oorzaak
`git diff --name-only <PR event base> <PR head>` is een **two-dot** vergelijking, niet de daadwerkelijke PR-diff wanneer beide branches zijn gedivergeerd. Daardoor werden latere, door andere eigenaren gemergde main-wijzigingen als ongeautoriseerde bestanden van deze PR geteld. GitHub Compare voor event-base `903bf0ce...` en branch-head `fae5812f...` meldt `status=diverged` met `merge_base_commit=f627153e...`; de merge-base→head diff toont slechts de zes verklaarde PR-bestanden.

## Bronreparatie
De bestaande `required-test.yml` behoudt haar beveiligde hygiene-guard en vraagt uitsluitend voor PR-events of hetzelfde PR-gebonden recovery-dispatch de **exacte** GitHub Compare-basis op. De helper verifieert de provider-base tegen de event-base, de SHA-vorm, status `ahead|diverged` en een geldige merge-base. Daarna gebruikt de kwaliteitscontrole alleen `merge_base→PR-head` voor wijzigingsclassificatie, security/lane selectie, eventuele config-diff, leer- en integratiecontrole. Merge-groups en niet-PR-processen houden het oorspronkelijke event-base contract.

## Regressie en vrijgave
`tests/delivery-branch-hygiene-guard.test.mjs` bewijst dat de oorspronkelijke diverged-PR nu uitsluitend zijn eigen scope beoordeelt en echte onverwachte broncode blijft weigeren. Provider-spoofing, een missing comparison, een invalid SHA, een head-only/behind verhouding en een ontbrekende geverifieerde voorouder moeten fail-closed blokkeren. `tests/delivery-required-branch-hygiene-wiring.test.mjs` borgt dat de Required workflow de helper en basiskoppeling werkelijk gebruikt.

Deze reparatie mag alleen beschermd mergen bij exacte-head Required + CodeQL + governanceregels. Zij repareert **geen** commerciële SQL-timeout en vervangt geen financiële pariteit, twee onafhankelijk geauthenticeerde tenant-HTTP-tests of geslaagde nieuwe cron #46. Het laatst gecontroleerde cron #46 run 121523 is nog FAILED na 120s; de 818 omzetrijen blijven stale sinds 05:55 UTC. Bewaar het oorspronkelijke incident onder #4215 en deze distincte CI-fingerprint zonder concurrerende financiële branch of scheduler.
