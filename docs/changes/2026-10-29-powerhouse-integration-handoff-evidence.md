# 29 oktober 2026 — controleerbare Powerhouse/Brain/Heartbeat overdracht

Fingerprint: `powerhouse|existing-brain-heartbeat-handoff-evidence|20261029-v1`

## Probleem
De runtime-inventaris rapporteert 32/32 WIRED, 54 capabilities en 18/18 core crons actief, maar dat bewijst niet dat een volledig bedrijfseffect is gerealiseerd. Op 29 oktober zijn 19 `done` acties zonder economics, 1.753 verlopen forecast-calibratieverplichtingen, 1.597 cyclus-events zonder expliciete actor/skill/effectvelden, en een geblokkeerde contentlus waargenomen. Dezelfde bron is [het bestaande issue #4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918#issuecomment-6503569386).

## Bouw
De bestaande pure validator `tools/brain/agent-skill-execution-evidence.mjs` is hergebruikt in `tools/brain/powerhouse-integration-handoff-evidence.mjs`. Het contract neemt canonieke capability-inventaris, bestaande run-/skillbewijzen en onafhankelijke receipt-verificatie als input. Het controleert exact:
`OBSERVE → DECIDE → EXECUTE → READBACK → OUTCOME → LEARN → PREVENT`.

Per stap zijn vereist: één receipt-ID, tenant, correlatie-ID, bronrevisie, vers bewijs, correcte predecessor en onafhankelijke verificatie. Agent-uitvoering vereist echte skill-load en -apply-evidence; SQL_EXECUTION mag zich niet als agent voordoen. Outcomewaarde vereist expliciete voor- en nameting. Bij omzet is daarnaast een originele betaalproviderreferentie nodig; deze pure validator controleert alleen de evidence-shape, hij claimt zelf geen betaalbewijs.

## Veiligheid en statusgrens
Geen nieuwe scheduler, geen nieuwe database, geen tweede publisher, geen migratie en geen extern side-effect. De status `EVIDENCE_VERIFIED` betekent uitsluitend dat de ingediende receipts door een onafhankelijk aangeleverde verifier zijn bevestigd; niet dat alle bedrijfsmodules al met deze functie zijn geinstrumenteerd of dat een betaalde order bestaat. De callback moet later door de bestaande Heartbeat/Powerhouse owner verbonden worden met echte bron- en providerreadback. Fail closed op ontbrekende tenant, verificatie, skill, baseline, lineage, stage of betaling.

## Integratie en acceptatie
De bestaande ONE BRAIN/Heartbeat Agent Fabric eigenaar kan deze helper in dezelfde canonical writer en verplichtingenlus consumeren. Alle werkelijke capabilities moeten in het bestaande runtime-inventaris- en portaalcontract vanuit actuele source worden aangeleverd; niet handmatig hardcoded tot GREEN maken. Verifieer op dezelfde PR-head de BRAIN regressie, Required, CodeQL, beschermd mergebeleid, exacte runtime-import én onafhankelijk live-readback. Vóór die laatste stappen: `SOURCE_CANDIDATE`, niet `LIVE_PROVEN`.
