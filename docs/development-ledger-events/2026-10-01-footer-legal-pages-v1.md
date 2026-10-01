# Footer legal pages — 1 oktober 2026

Obligation: `footer-legal-pages-20261001`

Gebouwd: een vaste juridische/statusbalk onder de publieke footer met links naar Algemene gebruiksvoorwaarden, Privacybeleid, Cookiebeleid en Systeemstatus. De ontbrekende pagina's zijn toegevoegd onder `pages/` en via Netlify op schone publieke routes beschikbaar gemaakt.

Technische correctie tijdens delivery: root-HTML werd door de delivery-classifier niet als website-lane herkend. De pagina's zijn daarom naar de reeds geclassificeerde `pages/`-structuur verplaatst. Dit voorkomt een unclassified-delivery-path fout zonder de publieke URL's te wijzigen.
