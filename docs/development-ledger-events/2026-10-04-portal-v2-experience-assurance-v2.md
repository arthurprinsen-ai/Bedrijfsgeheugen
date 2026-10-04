# Portal V2 experience assurance v2 — development ledger event

Date: 2026-10-04  
Fingerprint: `portal-v2|experience-assurance|responsive|visual|interaction|powerhouse|v2`  
Obligation: `portal-v2-experience-assurance-v2`

This successor deliberately reuses the canonical `portal-v2/experience.css` and `portal-v2/experience.js` authority instead of creating a second UX layer. It binds dynamic visual measurement, 44px interaction protection, narrow-mobile coverage and browser screenshot evidence to the existing Powerhouse visual assurance loop.

The customer-facing goal is a calm, modern portal in which charts, cards, dialogs and interactions remain correctly scaled and predictable from desktop through 320px mobile. The operational goal is fail-closed evidence: regressions are detected by CI rather than by a customer.

Backend Portal State authority is unchanged and remains explicitly covered by the experience contract regression test.
