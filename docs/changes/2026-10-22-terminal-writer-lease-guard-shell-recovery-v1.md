# Terminal Writer Lease Closure Guard — fail-closed shellreparatie (22 oktober 2026)

## Canonieke incidentbron
- [#4687](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4687)
- Fingerprint: `github|terminal-writer-lease-closure-guard|malformed-shell-duplicate-block|20261022-v1`.
- Canonieke workflow: `.github/workflows/powerhouse-terminal-writer-lease-closure-guard.yml`, GitHub ID `361221143`.

## Waargenomen hoofdoorzaak en begrenzing
Op `main` stond een afgebroken `grep -Eq` op de actieve `TERMINAL_DELIVERY|MAIN_SYNC` lease-status en daarna een gedupliceerde herstelbody met losse `<<<"$PR_BODY"; then`. De bestaande workflow staat op `disabled_manually`; waarom de providerstatus eerder door iemand is gewijzigd, is niet bewezen.

## Minimaal herstel
De bestaande guard behoudt één actieve lease-regex, één verplichte metadata-validatie, één geverifieerde opvolgercontrole en één PR-heropenactie. Inactieve of niet-relevante PR's verlaten het script met code nul. Onvolledige metadata voor actieve leases blijft fail-closed. Er is geen nieuwe agent, scheduler, opslag, bypass of branch-protection-uitzondering.

Regressie: `node --test tests/brain-terminal-writer-lease-guard-shell-v1.test.mjs` valideert Bash `-n`, een veilige no-op en incomplete metadata voor beide actieve statussen. Machineleesbare incidentkennis: `brain/learning/2026-10-22-terminal-writer-lease-guard-shell-recovery-v1.json`. Append-only registratie: `docs/development-ledger-events/2026-10-22-terminal-writer-lease-guard-shell-recovery-v1.md`.

## Acceptatie vóór LIVE
1. Exact-head Required CI en CodeQL zijn beide `completed/success`, zonder skips van veiligheidscontroles.
2. De protected merge is aantoonbaar op de actuele `main` gekomen.
3. De workflow blijft uit tot een afzonderlijk getoetste en expliciet geautoriseerde reactivatie; `pull_request.closed` met schrijfrechten kan echte PR-staten wijzigen.
4. Controleer met echte workflow-run/readback dat inactieve PR's onaangeroerd blijven, bevoegde terminal-closure-events veilig worden geclassificeerd en geen onbedoelde heropening plaatsvindt.

Geen claim van herstel van de twee andere uitgeschakelde workflows of van provider-ghost records.
