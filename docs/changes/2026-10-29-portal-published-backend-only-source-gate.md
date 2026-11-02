# 29 oktober 2026 — echte Browser E2E op de laatst gepubliceerde Portal-revisie ondanks backend-only mainwijzigingen

**Fingerprint:** `delivery|portal|published-main-older-than-backend-only-head|20261029-v1`.

## Aantoonbare blokkade

De echte Portal-revisie `481c2903ceba2f4e9163f62a4ec8925468b21a3b` is publiek gepubliceerd op Netlify `6ae3435d4b10026685b95242`. De huidige codebron op GitHub loopt voor door zelfstandige backend- en CI-releases. De bestaande `workflow_dispatch` van de productie-DOM-check weigert veilig een oudere gepubliceerde SHA zodra zelfs backend-only `supabase/functions` of `supabase/migrations` veranderde; die stonden niet in de beperkte bronnenlijst.

**Onafhankelijke repositoryclassificatie** op de bronwijzigingen tussen exact gepubliceerde Portal SHA en de beschermde hoofdbranch `a7d28c30e75b8ebfca404d05fd138269d32a197c`: **24** bestanden, waarvan **3** Supabase backend-code/migratie en **21** bewijsmateriaal, CI of documentatie. De bestaande `deriveNetlifyDeploymentApplicability` gaf `deliveryLanes=['backend']`, `websiteRequired=false`, `portalRequired=false`, `browserRequired=false`, `netlifyRuntimeRequired=false`, `deploymentRequired=false`. Daardoor is de geteste statische Portal-stand dezelfde, mits het onafhankelijke Netlify en publieke `release.json` exact overeenkomen.

## Veilige, generieke reparatie — geen bypass

De **bestaande** workflow behoudt de autorisatie-eisen: uitsluitend `workflow_dispatch` vanaf **main**, gepubliceerde SHA moet geldig zijn en aantoonbaar een ancestor van main zijn. De oorspronkelijke bewijs/CI/Notion/workflow-paden blijven toegestaan. Nieuwe, actuele Supabase backend-only paden zijn uitsluitend toegestaan nadat de bestaande canonieke Netlify-impactclassifier onafhankelijk vaststelt dat **geen** website-, Portal-, browser-, Netlify-runtime- of deploymentimpact bestaat. Elke overige wijziging, onbekend pad, source-policy-drift, traversal, dubbele padidentiteit, gewijzigde Netlify / Portal code of onzekere classifier leidt tot **rood**.

Het browserdoel zelf wordt nog steeds dubbel geverifieerd: immutable en publieke `release.json` moeten exact de beschermde SHA, Netlify-deploy-ID, productiecontext en contract tonen **vóór en ná** alle Playwright DOM-/mobiele-/visuele regressies. De vorige browserfouten 403 en `no response` worden niet genegeerd.

## Bewijsgrens

11/11 gerichte CI-beveiligingstests inclusief afwijzing van Portal- en Netlify-runtimeverschillen. Concrete echte `481c... → a7d...` bronclassificatie door de nieuwe helper geeft `PROVEN_NON_NETLIFY_SOURCE_DIFF` op 24 bestanden, 3 backend-only. Dit **bewijst niet** dat de echte browser-E2E al heeft gedraaid. Die wordt eerst na protected Required/CodeQL/merge van deze PR met de bestaande `portal-v2-production-dom-readback.yml` uitgevoerd.

Geen kunstmatige Netlify-deployment, geen tweede scheduler, geen externe publicatie, geen auth- of security-uitzondering voor onbekende bestanden.
