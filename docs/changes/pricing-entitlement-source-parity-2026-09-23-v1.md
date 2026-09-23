# Pricing ↔ SaaS entitlement source parity — 2026-09-23

## Waarom
De prijzenpagina en Portal V2 zijn inhoudelijk in lijn, maar die overeenkomst werd nog niet volledig rechtstreeks tegen de server-side entitlementbron gevalideerd.

## Canonieke entitlementbron
`supabase/migrations/20260920101730_saas_checkout_entitlements_20260920.sql` definieert de actieve SaaS-planlimieten voor Control, Scale en Enterprise.

## Nieuwe gate
`tests/pricing-entitlement-source-parity.test.mjs` leest de entitlementseed rechtstreeks en controleert de klantbelofte in `prijzen.html`.

De gate bewaakt onder meer:
- planprijzen en jaarprijzen;
- maximaal aantal databronnen;
- refreshcadans;
- agentmodus;
- aantal organisaties;
- SSO;
- audittrail;
- senior-advisorytijd;
- dezelfde intelligence-core, forecasting en scenarioanalyse in elk betaald plan.

## Contract
Control, Scale en Enterprise verschillen niet in kwaliteit van de kernintelligentie. Ze verschillen in schaal, actualiteit, automatisering, governance en begeleiding.
