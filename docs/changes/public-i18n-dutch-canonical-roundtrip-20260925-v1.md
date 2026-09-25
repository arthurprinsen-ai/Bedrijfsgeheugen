# NL/EN canonical roundtrip — 25 september 2026

## Probleem

De publieke taalarchitectuur was niet volledig symmetrisch. Nederlands hoort op de on-geprefixte route te staan en Engels onder `/en/*`. De runtime-switcher en de statische locale-builder maakten bij Nederlands echter `/nl/*`, waardoor EN → NL naar de verkeerde URL kon gaan en canonical/hreflang/interne links konden afwijken.

## Oplossing

- NL → EN bewaart hetzelfde pad en gaat naar `/en/*`;
- EN → NL bewaart hetzelfde pad en gaat terug naar de on-geprefixte Nederlandse route;
- de statische builder gebruikt dezelfde mapping voor canonical, hreflang, og:url en interne links;
- oude `/nl` en `/nl/*` URLs krijgen een permanente 301 naar de Nederlandse canonical;
- de productie-browsergate bewijst voortaan een echte NL → EN → NL roundtrip.

## Preventie

De invariant staat machineleesbaar in `tests/brain-public-i18n-static-route-authority-v1.test.mjs` en in de productiecanary `tools/site-shell/verify-pricing-i18n-production.mjs`.
