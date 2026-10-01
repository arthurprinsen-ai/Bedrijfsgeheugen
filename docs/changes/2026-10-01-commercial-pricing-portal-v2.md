# SaaS + consulting pricing and Portal V2 parity — 1 October 2026

Bedrijfsgeheugen now separates two commercial motions without splitting product truth:

- **Powerhouse SaaS:** Starter €99/month, Pro €299/month, Groei €749/month, Enterprise custom.
- **Consulting & workshops:** Frisse Blik €0, Directie & AI Workshop €1,950, Bedrijfsgeheugen Scan €2,950, Build Sprint from €14,500, Transformation / Fractional Lead from €2,950/month.

The canonical commercial catalog lives in `config/powerhouse-commercial-catalog-v2.json`. Public pricing, checkout and Portal V2 are required to stay semantically aligned with it.

Portal V2 reads effective subscription entitlements from the authenticated server endpoint `/api/portal-entitlements` and exposes users, integrations, documents, refresh, AI questions and automation capacity in the interface. Server-side connector and agent enforcement remains authoritative.

Commercial combination rule: workshops and scans can be credited toward a subsequent Build Sprint when scope and timing align. Consulting can include temporary Pro/Groei access; this is explicitly temporary and does not silently mutate subscription state.
