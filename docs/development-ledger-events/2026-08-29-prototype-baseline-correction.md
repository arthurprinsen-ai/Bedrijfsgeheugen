# Prototype baseline correction — 2026-08-29

## Incident
PR #218 promoted standalone routes from the PR #110 test prototype as if they were previously accepted production pages. Repository history disproved that assumption.

## Verified evidence
At production commit `5f724aa441e47a32268f31f91fdf8bd0542e5921`, immediately before the prototype-page promotion, the standalone files `problemen.html`, `oplossingen.html`, `cases.html`, `kennis.html`, `prijzen.html`, `inloggen.html` and `aanmelden.html` did not exist. They were introduced by PR #218 and therefore are not valid historical production pages to restore.

`/over-ons` did exist. Its accepted semantic baseline is the historical brand-story version sourced from commit `4e6444e1228903853d085a4dac45f2885e37ca99`, including `Eerst kijken hoe het werk écht loopt. Dan pas techniek.`, `Onze missie`, `Onze ambitie`, `Ons geloof`, `Gewone taal`, `Geen big bang` and `Van jou, niet van mij`.

## Correction
Revert only the erroneous PR #218 website layer while preserving later portal, Brain, security and authentication work. Restore the pre-PR218 accepted route catalog, navigation baseline, sitemap, Over-ons semantic baseline and regression contracts.

## Permanent invariant
A prototype view is not a production route baseline unless repository history or explicit acceptance proves that equivalence. Before restoring a supposedly missing page, verify that the route/file existed in the last-known-good production lineage. If that evidence is absent, fail closed instead of manufacturing a route from a prototype.
