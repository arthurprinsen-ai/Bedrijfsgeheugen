# Development ledger — production readback release identity v1

- Datum: 2026-10-05
- Obligation-ID: production-readback-release-identity-20261005-v1
- Trigger: post-merge Production Release Readback van #3741 bleef hangen in `Wait for exact live release marker and deploy identity`.
- Productie-evidence: Netlify deploy `6ac3d4bbc857e90008998389` was `ready` op exact merge-SHA `6a9452fa905073290c9274c2364d2aaaa52ad492`; live `release.json` en de drie HTML-routes droegen dezelfde SHA.
- Root cause: release-identiteit was onterecht gekoppeld aan verouderde pricing-semantiek in `live-contract.mjs`.
- Herstel: release polling gebruikt de canonieke shell + exacte release marker zonder pricing-semantiek; de standaard live-contractmodus blijft pricing streng controleren.
- Regressie: `tools/site-shell/test-live-contract.mjs` bewijst zowel fail-closed pricing als onafhankelijke release-identiteit.
- Veiligheid: geen handmatig groen, geen SHA-bypass, geen deploy-id-bypass en geen verwijdering van dedicated pricing/browser gates.
