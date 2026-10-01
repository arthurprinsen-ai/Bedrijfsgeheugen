# Footer legal links inside canonical footer — 1 oktober 2026

Obligation: `footer-legal-links-inside-footer-20261001`

Productiereadback liet zien dat de vier juridische/statuslinks niet in de zichtbare footer stonden. De oorzaak was dat ze als sibling na `</footer>` waren toegevoegd. Herstel: de links zijn in de canonical `bgvoet-onder` opgenomen op de homepage en canonical shell source, en in het legacy footerfragment.

Tweede root cause gevonden via live readback: de Netlify-build overschrijft `index.html` eerst met de pinned V18-productiepayload. Daardoor verdwenen bronwijzigingen vóór publicatie. Herstel zit nu in de echte build authority (`tools/bouw-v18-production-core.mjs`) én in `components/footer/`.
