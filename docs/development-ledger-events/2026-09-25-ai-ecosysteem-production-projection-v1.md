# AI-ecosysteem production projection recovery — 25 september 2026

Fingerprint: `website|generated-canonical-surface|post-build-projection|v1`
Obligation: `website-ai-ecosysteem-production-v2`
Canonical PR: #2981

## Root cause
De V18-productiebuild herschrijft `index.html` vanuit een pinned homepage-payload. Een directe bronwijziging kan daardoor uit de uiteindelijke productie-artifact verdwijnen. Een eerdere recovery gebruikte bovendien een stale `Base-SHA`, waardoor branch hygiene actuele main-wijzigingen ten onrechte als candidate-scope zag.

## Fix
- idempotente helper `tools/bouw-v18-ai-ecosysteem.mjs`;
- expliciete projectie in `tools/bouw-v18-production.mjs` direct na de pinned restore;
- regressie `tests/v18-ai-ecosysteem-production-projection.test.mjs`;
- learning, ledger en human documentation in dezelfde lineage;
- recoverycandidate opnieuw opgebouwd vanaf de actuele `main` zodat alleen de bedoelde zes bestanden candidate-scope zijn.

## Delivery truth
Netlify/providerproblemen worden niet als productcodefout geïnterpreteerd zonder concrete evidence. De repository heeft inmiddels een aparte exact-source fallback voor linked Netlify build errors. Deze AI-ecosysteemlineage blijft fail-closed tot protected merge, exact production identity en functionele productie-readback groen zijn.

## Powerhouse / Brein
Dashboard Hub en Canonical System Map zijn met dezelfde fingerprint bijgewerkt en teruggelezen. Runtime/provider evidence blijft authority.
