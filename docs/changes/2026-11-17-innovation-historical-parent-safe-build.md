# 17 november 2026 — originele engineering-agent kan echte vervolginnovatie selecteren

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Productie: bron-naar-code loopt vast zonder foutstatus
Originele Daily Self Evolution original_code_recovery run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44166050762 eindigde technisch SUCCESS maar selecteerde geen kandidaat: NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE. ONE BRAIN had 14 oorspronkelijke operaties, waaronder 2 PROTECTED_BUILD_DUE. Een groene scheduler zonder code-PR is dus geen innovatie.

De veilige kandidaat 55bb0754-355b-4940-aaea-aed7123e7e57 voor de admin-only sales-cycle execution read-model heeft voorganger PR #5109. De oorspronkelijke PR is beschermd gemerged op 29 oktober 2026 om 12:39 UTC, vóór de nieuwe read-model-kandidaat van 12:43 UTC. PR #5109 betrof de SQL write guard en tests, niet het admin read model. De selector hield echter alle opdrachten met parent_pr categorisch vast.

## Minimale originele-eigenaarcorrectie
De oorspronkelijke selector blijft standaard fail-closed. Alleen een daadwerkelijk bij GitHub bevestigd historisch parent PR met exact nummer, MERGED op main, 40-hex merge-SHA, oudere mergedAt en geen overlap met de exact toegestane nieuwe bronpaden kan het ouder-veto passeren. De parent mag niet dezelfde Original-Candidate vertegenwoordigen. Ook dan blijven bronrevisie, owner, rollback, source-action digest, bestaande PR-dedupe, maximum acht gewijzigde bestanden en beschermde Required/CodeQL strikt verplicht.

Een tekstueel PR-nummer in de voorgestelde actie en een onbekende, nog open, te nieuwe of overlappende parent blijven geblokkeerd. De andere innovatie powerhouse-sales-cycle-truth krijgt geen extra SQL/migratiepad; die blijft onder onafhankelijke beoordeling. Er is geen SQL, migratie, OAuth, cron, auth, provider-send, productie-mutatie of tweede agent toegevoegd.

## Regressie en oplevering
Nieuw: tests/brain-innovation-merged-parent-safebuild-20261117.test.mjs, met negatieve historische replay en canary. Na een beschermde merge kan alleen de al bestaande original_code_recovery in de originele workflow één brongebonden kandidaat produceren. Echte oplevering vergt afzonderlijk merge/deploy/bestemmingsbewijs, named ONE BRAIN PROCESSED, Heartbeat effect en toegepaste volgende leerregel. Een PR, scheduler of document telt niet als resultaat.
