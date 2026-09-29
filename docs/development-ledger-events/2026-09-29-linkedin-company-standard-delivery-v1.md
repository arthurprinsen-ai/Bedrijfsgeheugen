# 2026-09-29 — LinkedIn company standard delivery

Fingerprint: `linkedin-company-standard-delivery-v1`

## Incident
A Bedrijfsgeheugen company post used a printer/personal-life story family and was manually deleted by the user. Multiple LinkedIn connection surfaces also exposed divergent OAuth state.

## Root cause
Company identity/content gating, historical semantic retirement and production OAuth recovery were not expressed as one shared executable contract.

## Change
Created one company delivery standard that:
- rejects personal topics for the company page;
- retires printer globally;
- uses production runtime auth as authority;
- self-heals safe connection drift;
- allows one new-story replacement after explicit user deletion;
- keeps duplicate/provider-URN terminality intact.

## Verification
Regression: `tests/brain-linkedin-company-standard-delivery-v1.test.mjs`.
