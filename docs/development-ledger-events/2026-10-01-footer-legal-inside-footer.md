# Footer legal links inside production footer — 1 oktober 2026

Obligation: `footer-legal-production-core-20261001`

Productiereadback liet zien dat de vier juridische/statuslinks nog steeds niet zichtbaar waren. De echte oorzaak is dat `tools/bouw-v18-production-core.mjs` tijdens iedere Netlify-build `index.html` opnieuw opbouwt uit de pinned V18-payload en daarmee bronfooterwijzigingen overschrijft.

Herstel: de vier links worden nu direct in die productieprojectie toegevoegd én in de canonical footercomponent gespiegeld. `tests/brain-footer-legal-production-core-v1.test.mjs` borgt beide kanten van het contract.
