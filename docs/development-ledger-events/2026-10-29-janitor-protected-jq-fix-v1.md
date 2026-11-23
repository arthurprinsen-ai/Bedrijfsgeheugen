# Ledger event: Janitor leest protected zonder jq-valkuil

- Datum: 2026-10-29
- Event: `janitor_protected_jq_fix_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml
- Schrijver: alleen CI-configuratie; verwijdert branches via de bestaande Janitor-rechten
- Waarheid: oorzaak bewezen met sweep-tellers (protected=219 van 219); opruiming pas bewezen na de eerste run met deleted>0
- Invariant: alleen een expliciete protected=false is verwijderbaar
- Bewijs: tests/brain-janitor-bounded-cleanup.test.mjs
