# Engineering event — native approved-central-blog herstel 23-11-2026

- **Eén bestaande schrijver:** `.github/workflows/approved-central-blog.yml`; geen parallelle uitvoerder, scheduler, direct-to-main en geen generieke betaalde video/Instagram-actie.
- **Oorzaak:** bronvalidatie zag permanente 301 naar canonical over het hoofd; PR's misten verplichte machinevelden en bewijsbundle. GitHub Required faalde bewust en terecht. Meervoudig duplicaat van 2026-09-17-bron, elf PR's gecontroleerd en gesloten.
- **Fix kandidaat:** exacte data/brongebonden PR-body, runtime Brain/ledger/human closure, redirect-gate en regressie `tests/brain-approved-central-blog-candidate-contract-20261123.test.mjs`.
- **Original release owner:** BG169, Required+CodeQL+hygiene en Netlify. Duplicaatfilter wordt nooit omzeild en Notion staat voor deze bron expliciet Blocked.
- **Status:** CODE_CANDIDATE_NOT_LIVE; pas na protected merge en real public readback een groene claim.
