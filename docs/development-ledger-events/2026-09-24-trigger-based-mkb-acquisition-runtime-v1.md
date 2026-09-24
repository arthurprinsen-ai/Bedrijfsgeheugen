# 2026-09-24 — Trigger-based MKB acquisition runtime projection v1

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-runtime-v1`

## Change
De bestaande opportunity-scout is uitgebreid met een fail-closed commerciële contextprojectie. Het opportunity-contract en de acquisitie-skill zijn overeenkomstig bijgewerkt en er zijn regressietests toegevoegd.

## Why
De eerste acquisitie-delivery borgde beleid, skill, System Map en learning, maar de opportunity-runtime droeg de nieuwe commerciële velden nog niet expliciet. Daardoor was er een mapping gap tussen acquisitiecontract en execution stack.

## Prevention
Geen commerciële execution zonder expliciete trigger, probleemhypothese, beslissersrol, next action, evidence en minimale confidence. Ontbrekende context blijft null/observe.

## Scope
Geen nieuwe store, CRM of executor. Alleen projectie in bestaande canonical opportunity authority.
