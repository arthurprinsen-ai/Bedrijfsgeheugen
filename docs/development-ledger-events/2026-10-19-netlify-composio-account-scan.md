# Delivery event — Netlify Composio account discovery

Obligation: netlify-composio-account-scan-20261019
Linked P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447
Baseline: source `05aeb66f8cf79c800d76c6eac9744b27e6fcf85a`

Observed: an OIDC-authenticated bridge call failed to obtain a Netlify account. A static inspection identified the incomplete first-page-only scan, which could misclassify an authorized connection beyond the first 100 accounts. This is **a confirmed code defect, not proof it caused the original HTTP 420**.

Applied: bounded cursor pagination, sanitized diagnostics, strict account authorization, and a regression verifying the OIDC trust boundaries remain. No secret rotated, connection shared, or provider build triggered by this patch.

Remaining: run protected checks, merge, deploy exact Edge Function source, perform OIDC-authorized bridge probe, verify provider side effect if an authorized account is found. Until then the fallback remains externally blocked.

## Terugkerende controleregel
De bestaande, uitsluitend op `main` vertrouwde GitHub-workflow krijgt een dagelijkse OIDC-health-probe en een handmatige `authority_probe`. De probe vraagt alleen `action=health` aan de bridge, publiceert nooit broncode en rapporteert alleen HTTP-status en foutcode. Een mislukte bevoegdheidscontrole geeft een rode run en verwijst naar P0 #4447. Een groene healthcheck is nog geen bewijs van een geslaagde provider-deploy.
