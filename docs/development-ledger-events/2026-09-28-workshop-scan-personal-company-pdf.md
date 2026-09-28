# 2026-09-28 — Workshopscan persoonlijke bedrijfs-PDF

- Scope: `/scan` en gegenereerde tweepagina-PDF.
- Iedere deelnemer krijgt uit de eigen 18 antwoorden een eigen scoreprofiel, benchmark, top 3 hefbomen en 90-dagenplan.
- Bedrijfsnaam wordt op beide rapportpagina's doorgezet.
- Optioneel websiteveld toegevoegd voor betrouwbare klantbranding.
- Fallback naar zakelijk e-maildomein is toegestaan; generieke mailproviders worden uitgesloten.
- Logo wordt alleen getoond als een asset op het bedrijfsdomein daadwerkelijk laadt. Geen asset = geen logo-element.
- Externe logo-databases en goklogo's zijn expliciet uitgesloten.
- Copy aangescherpt: 'bedrijfsbeeld' en 'persoonlijke scanuitkomst' in plaats van generieke nulmeting.
- Regressietest: `tests/components/workshop-scan-personalisation.test.mjs`.
