# Ledger event: GitHub schoon en agents ingeperkt

- Datum: 2026-10-29
- Event: `github_schoon_egress_guard_declared_v1`
- Scope: .github/workflows, tools/ci/egress-guard.mjs, tests/brain-egress-guard.test.mjs
- Schrijver: alleen CI-configuratie en een controlescript; geen runtime-, Supabase- of Netlify-wijziging
- Waarheid: branch-test; de Janitor-opruiming van 883 branches is pas bewezen na de eerste scheduled runs op main
- Invariant: workflows raken alleen deze repository en hebben minimale rechten
- Bewijs: tests/brain-egress-guard.test.mjs 4/4; delivery-tests 267 pass, 0 fail
