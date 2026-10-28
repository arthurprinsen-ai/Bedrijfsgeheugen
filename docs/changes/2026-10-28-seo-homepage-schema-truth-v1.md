# Homepage: structured data gelijk aan zichtbare werkelijkheid (28 oktober 2026)

## Feitelijke aanleiding
De canonieke homepage bevatte een `BreadcrumbList` die Home → Zelfscan → Connect → Frisse Blik als hiërarchische keten presenteerde. Deze bestemmingen zijn geen bovenliggende pagina's van de homepage. Het `SoftwareApplication`-object claimde tevens een `AggregateOffer` van €1.495 tot €4.995, terwijl de zichtbare prijspagina abonnementen vanaf €99 met €299 en €749 vermeldt.

## Kleine, omkeerbare correctie
Verwijder uitsluitend de onjuiste breadcrumb-keten en de verouderde `AggregateOffer` van de homepage. Laat `ProfessionalService`, `WebSite`, `SoftwareApplication`, `FAQPage`, `Person`, canonical, UI, consent en CTA's intact. Geen nieuwe pagina, nieuwe prijsclaim of tracking.

## Acceptatie
`node --test tests/brain-seo-homepage-schema-truth-20261028.test.mjs` en volledige relevante Required/CodeQL/website/i18n checks moeten slagen op exact HEAD. Pas na beschermde merge, Netlify deploy en onafhankelijke publieke JSON-LD/commit-readback is deze wijziging live. Zoekposities, leads, orders en omzet zijn niet door deze wijziging bewezen.
