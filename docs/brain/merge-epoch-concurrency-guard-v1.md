# Powerhouse merge-epoch concurrency guard v1

Fingerprint: `delivery|merge-epoch|optimistic-cas|v1`

## Doel

Powerhouse moet meerdere chats, agents en workflows tegelijk kunnen laten ontwikkelen zonder dat een groene kandidaat door een bewegende `main` alsnog onveilig of onmergeable wordt. Daarom is ontwikkeling optimistisch parallel, maar de terminale landing expliciet gebonden aan één actuele integratie-epoch.

## Canonieke beslisregel

Een kandidaat is pas terminal landable wanneer tegelijk waar is:

1. candidate head is exact dezelfde SHA als de geteste head;
2. de gate-proof hoort bij de actuele integratiebasis;
3. `behind_by = 0`;
4. GitHub rapporteert geen merge-conflict;
5. het terminale landing-eigenaarschap hoort bij dezelfde obligation, candidate head en main SHA;
6. protected merge gebruikt expected-head/CAS-semantiek.

Als `main` na de relevante proof beweegt, vervalt uitsluitend de landing-authoriteit. De bestaande obligation en candidate-lineage blijven bestaan. De agent reconcileert dezelfde lineage op actuele main, behoudt de volledige main-union, bewijst de nieuwe exact-head opnieuw en probeert daarna opnieuw te landen.

## Parallelisme

Niet alles wordt gelockt. Specialistisch werk blijft parallel zolang changed paths, contracts, dependencies en mutable external resources niet botsen. Alleen de korte terminale integratiegrens wordt geserialiseerd.

## Predictieve signalen

Powerhouse behandelt de volgende signalen als vroegtijdige indicatie van landing-risico:

- stijgende `behind_by`;
- main-commitfrequentie tijdens de gate-doorlooptijd;
- path- of contract-overlap met andere terminale kandidaten;
- meer dan één `TERMINAL_DELIVERY` candidate;
- dubbele Obligation-ID;
- merge-base ouder dan de gate main-SHA;
- meerdere reconcile/retest-rondes.

Deze signalen mogen scheduling en landing-prioriteit sturen, maar vervangen nooit de harde mergevoorwaarden.

## Referentie-incident en bewijs

Referentie-incident: PR #2074.  
Structurele fix en production proof: PR #2092.  
Production merge SHA: `fa0de9e319bc0fb440d0dd342d9688d49ed5414c`.

De machineleesbare learning staat in `brain/learning/2026-09-18-merge-epoch-concurrency-guard-v1.json`; de agent- en Brain-skills projecteren dezelfde fingerprint.
