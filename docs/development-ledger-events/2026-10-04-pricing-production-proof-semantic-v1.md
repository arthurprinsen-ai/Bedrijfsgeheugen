# Development ledger — semantic pricing production proof

- Datum: 2026-10-04
- Obligation-ID: pricing-production-proof-semantic-20261004
- Oorzaak: false negative door `>Starter<` / `>Enterprise<` raw-markup checks.
- Herstel: semantische tekstnormalisatie + stabiele data-tab assertions.
- Veiligheid: gate blijft fail-closed; exacte SHA en browserbewijs blijven verplicht.
- Regressie: `tests/brain-pricing-production-proof-semantic.test.mjs`.

- Canonical verifier path: `tools/delivery/verify-pricing-production-content.mjs`.

- Delivery routing closure: de production verifier staat onder `tools/delivery/`, zodat de change-classifier hem als delivery/automation behandelt en niet als UI-surface.
