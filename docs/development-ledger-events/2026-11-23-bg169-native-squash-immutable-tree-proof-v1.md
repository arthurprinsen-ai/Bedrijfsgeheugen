# Ontwikkellog: BG169 native squash-transport, 23 november 2026

- Originele eigenaar en eenmalige productieroute: Unified Brain Delivery → BG169 → GitHub-native → Netlify/public readback
- Eerste falende full delivery: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/45144449592
- Providerfeit: repository staat alleen squash toe; BG169 gebruikte hard-coded merge commit; GitHub 405 na echte geslaagde terminal-guard
- Bijkomend defect: `git merge-base --is-ancestor "$HEAD_SHA" origin/main` kan niet slagen voor een echte squash van een niet-triviale branch
- Correctie: GitHub-native squash; immutable provider SHA, source tree, exact geverifieerde premerge main parent, verificatie dat merge in protected main is opgenomen, readback van GitHub PR; originele BG169 evidence uitgebreid met merge method/commit/tree
- Bewaarde harde grenzen: Required + CodeQL + hygiene, maximaal één eigenaar, geen branch protection uit, geen directe main push, geen Make-transport, geen dubbele post
- Nieuwe/gewijzigde tests: `tests/brain-bg169-protected-squash-transport-20261123.test.mjs`, `tests/delivery-universal-bg169-handoff.test.mjs`, `tests/repo-writer-shadow.test.mjs`
- Echte uitkomst in dit ledger: `SOURCE_CANDIDATE_NOT_LIVE`. Vereiste komende bewijsvoering: protected merge, nieuwe succesrijke native BG169-run, provider deployment SHA, openbare bestemmings-URL, exact provider-ID, ONE BRAIN consumer ACK en Heartbeat outcomes
