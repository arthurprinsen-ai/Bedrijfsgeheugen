# Terminale BRAIN-overdracht: dezelfde volledige bronlezing tot en met afsluiting

Datum: 14 november 2026  
Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198  
Bestaande eigenaar: Obligation Terminal Closure / Unified Brain Delivery / ONE BRAIN  
Betrokken historische release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5816

## Werkelijke productie- en runwaarneming

PR #5816 is na Required+CodeQL beschermd gemerged (`9d392cec435718a222b6db059a23f6bcc19fa9f0`) en Netlify publiceerde een READY-productiedeploy (`6af8d0f34804e03e57347f67`). De originele GitHub-terminalworkflow `43642425605` bleef echter in `Verify exact-candidate BRAIN before terminal claim` staan en werd om 21:34:12 UTC geannuleerd. De directe externe annuleringsoorzaak is niet onafhankelijk vastgesteld; een terminale succes-ACK ontbreekt dus.

In de oorspronkelijke terminalworkflow bevat de **eerste** BRAIN-controle al de juiste, volledig gepagineerde, op oorspronkelijke PR-creatie begrensde verificatie. De **laatste** `require_workflow`-controle viel terug op alleen `per_page=100` via één niet-gepagineerde request. Wanneer in drukke perioden de werkelijke exact-head run buiten de eerste pagina valt, verliest de latere controle zijn eerder gevonden bewijs. Dat is een reproduceerbare codefout; het bewijst op zichzelf niet wat de geannuleerde run had geconcludeerd.

## Kleinste correcte reparatie in dezelfde lus

De bestaande laatste terminale controle gebruikt nu dezelfde `originalBrainFlightSince`-bronbegrenzing en `brain-verification-flight-index.mjs` als de oorspronkelijke dispatchguard. Alle native GitHub-pagina's worden ingelezen; onvolledige, verschoven, duplicate of gemaximeerde resultaten falen gesloten. Alleen de exact bij PR+HEAD horende, werkelijk voltooide en geslaagde BRAIN-workflow met beschermde main-afstamming telt. Afwezige BRAIN-run wacht zichtbaar of leidt tot een expliciete fout; er wordt nooit een run bijgemaakt door deze acceptatiestap, noch een bestaand bewijs of veiligheidscontrole overgeslagen.

Bestanden in dit incident: bestaande `.github/workflows/obligation-terminal-closure.yml`, originele verificatie-replay in `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs`, bestaande `.agents/skills/powerhouse-post-merge-codeql/SKILL.md`, originele ONE BRAIN learning en append-only ledger.

## Niet automatisch groen

Deze reparatie is geen engine voor uitvoering van de 14 oorspronkelijke `INNOVATION_INTAKE`-taken. Live Supabase blijft 14 `PLANNED`, 0 onafhankelijk geverifieerde agent-ACK's en 14 open innovation obligations tonen. De bestaande eigenaar `agent-integration-engineer` (13) en `agent-growth-market` (1) moeten aantoonbaar reviewen en daarna via de originele beveiligde levering met echte effectmeting afronden. Geen nieuwe cron, worker, queue, publisher, token, toegangsrechten of parallel Brain.

Vereiste vrijgave: exact-head Required, CodeQL, oorspronkelijke BRAIN, protected merge en onafhankelijke echte post-merge terminal- en productie-readback; ontbrekend bewijs blijft OPEN.
