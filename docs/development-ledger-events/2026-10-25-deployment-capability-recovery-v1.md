# Development ledger — deployment capability recovery

- Datum: 2026-10-25
- Obligation: `deployment-capability-recovery-20261025-v1`
- Root cause: GitHub/Netlify connector geeft geen directe productie-dispatchactie; ontbrekende capability werd een operationele blokkade.
- Agent-update: canonieke herstel-skill plus verplichte AGENTS.md verwijzing.
- CI-observatie: Required initial metadata invalid; na correctie unclassified test path; vervolgens ontbrekende closure-evidence. Alle fouten behouden als historische bewijsvoering.
- Veiligheidscontract: geen ongeautoriseerde build hook, geforceerde productiepush, extra scheduler, of onterechte status groen.
- Reststatus: tests, beschermd mergen, exacte deploy-ID/SHA en live browser-readback nog onbewezen.
