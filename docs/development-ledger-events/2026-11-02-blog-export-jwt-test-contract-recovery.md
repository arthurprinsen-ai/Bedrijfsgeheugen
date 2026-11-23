# 2026-11-02 – append-only backend/BRAIN blog-export JWT contract

- **Incident:** `powerhouse|brain|blog-export-jwt-test-drift|20261102-v1`. Bovenliggend P0 #4439 blijft OPEN.
- **Waarneming:** originele full BRAIN job `125158396237` / run `41409216287`; 32 van 5352 tests falen, waaronder de gecombineerde blog-export/queue-configuratietest.
- **Root cause:** test stelde export-JWT ten onrechte gelijk aan intern queue-JWT. Onafhankelijke Supabase live lijst bevestigt export ACTIVE v297/`verify_jwt=true`, queue ACTIVE v301/`verify_jwt=false` op 2026-11-02.
- **Veilig bronherstel:** strikte functiespecifieke testverwachting, bestaande authenticator en expliciete approvalcontrole als aanvullende regressie. Alle broncode van Edge Functions, config, SQL, kanalen en betalings-/orderregistratie ongewijzigd.
- **Agents/skills:** bestaande `AGENTS.md` en `.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md` houden de beveiligingsregel bij; geen tweede writer/executor.
- **Bewijsverplichtingen:** originele targeted tests → Required/CodeQL → exacte full BRAIN → beschermd merge → independent provider/config parity en originele terminal; status tot dan **CANDIDATE_NOT_PROVEN**, geen fictieve verlaging van de 32 open fouten en geen blog-LIVE_PROVEN.
- **Preventie:** bij test/source- of config-/providerconflict autoritatieve productiebeveiliging niet verzwakken om CI te laten slagen; classificeer verouderde fixtures pas na exact onafhankelijke bronreadback.
