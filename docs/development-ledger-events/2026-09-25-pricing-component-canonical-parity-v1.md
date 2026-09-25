# 2026-09-25 — Pricing component canonical parity

Tijdens de pricing↔Portal-audit bleek de hoofdpagina correct, maar een herbruikbare pricing-component bevatte nog €2.900 en een oude remote-price variant.

Root cause: de parity-gates omvatten de publieke prijzenpagina, Portal V2 en server-side entitlements, maar niet alle herbruikbare prijscomponenten.

Implemented: component naar €2.950, oude remote variant verwijderd, regressietest toegevoegd en learning/skill bijgewerkt.

Terminal acceptance: protected merge, exact production deploy en production readback.
