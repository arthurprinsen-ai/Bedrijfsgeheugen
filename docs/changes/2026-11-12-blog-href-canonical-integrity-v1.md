# Blog href-integriteit vóór publicatie — 12 november 2026
Fingerprint: `seo|blog-href-canonical-integrity|20261112-v1`
Owner: oorspronkelijke Powerhouse SEO Order Engine / BG169 en bestaande blog-contentwriter.
Status: SOURCE_CANDIDATE — wacht op Required/BRAIN/CodeQL, protected merge, exact productie-SHA en externe HTTP-readback.

## Vastgestelde tekortkoming
De bestaande `scripts/ci/blog_technical_seo_gate.py` telde minimaal twee interne links, een bloglink en een Frisse Blik-conversielink, maar verifieerde niet of de inhoudelijke `href` daadwerkelijk naar een bestaande canonieke route in de uiteindelijke sitemap verwees. Daardoor kon een gebroken interne bestemmings-URL de nieuwe-artikelpoort passeren.

## Veilig herstel, in dezelfde uitvoerder
- Voeg deterministische fail-closed validatie van alle `<a href>` in de body toe: lege/onveilige/schemaloze links, http, niet-canonieke host en ongeldige same-origin bestemmingen worden geweigerd.
- Gebruik de finale `sitemap.xml` als lokale first-party canonical target-set; laat legacy root-relative geldige interne links toe. Nieuwe artikelen mogen volledig canonieke HTTPS-links gebruiken.
- Rapporteer gecontroleerde interne links en HTTPS-externe links. Een lokale check claimt **geen** daadwerkelijke externe HTTP200, AI-zoekvermelding, klik of conversie.
- Bestaande dagelijkse sitebrede audit behoudt onafhankelijke live HTTP/redirect-, NL/EN hreflang-, Search Console/keyword-, schema-, mobile- en CRO-controle. ChatGPT/Claude-citaties blijven afzonderlijke provider-observaties of NOT_MEASURED.
- Geen parallelle agent, publicatiestroom of scheduler; iedere fout gaat via de oorspronkelijke owner terug naar bestaande ONE BRAIN → Heartbeat → Portal learning en dezelfde kandidaat/retry.

## Verificatie
Regressie `tests/brain-blog-href-integrity-20261112.test.mjs` dekt geldige interne/externe links en afwijzing van missende, onveilige en niet-canonieke routes. De voorbeelden `blog/wat-kost-een-afas-koppeling/index.html` en `blog/afas-api/index.html` werden in bron vergeleken met de huidige repository-sitemap: geen ontbrekende interne inhoudsbestemmingen in de onderzochte artikel-bodies. Dit is geen volledige live sitecrawl.

De huidige source candidate mag alleen automatisch worden vrijgegeven via de bestaande beschermde GitHub- en Netlify-keten met onafhankelijke productie-readback. Niet LIVE_PROVEN verklaren vanuit een PR, test of merge alleen.
