# GitHub schoon en agents ingeperkt (2026-10-29)

Aanleiding: een extern persoon kreeg een intern concept-blog en een taak in zijn AI-assistent. In de GitHub-laag is geen route naar buiten gevonden; deze wijziging maakt dat afdwingbaar.

- Egress-guard (`tools/ci/egress-guard.mjs`): geen vreemde repo, geen niet-allowlisted secret, geen `write-all`, altijd een `permissions:`-blok. Draait in de delivery-lane en voor de dagelijkse optimizer.
- 13 workflows krijgen `contents: read`; 20 verificatieworkflows annuleren verouderde PR-runs (pushes naar main nooit).
- Janitor: ook squash-gemergde branches (exacte head-sha van gemergde PR in dezelfde repo), 70x50 branches per cyclus, nooit `archive/`, `release/`, `hotfix/`.
- Niet gedaan: branches met gesloten-niet-gemergde PR (1559) of zonder PR (519).
