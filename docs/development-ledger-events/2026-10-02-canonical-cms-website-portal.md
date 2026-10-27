# Canonical CMS website + portal — 2 oktober 2026

Obligation: `cms-website-portal-20261002-v1`

Doel: één centrale beheerlaag voor alle redactioneel beheerbare website- en portaalelementen, zonder parallelle data-authority naast Supabase/Powerhouse.

Uitvoering:
- `cms_content_items` en `cms_content_revisions` toegevoegd met RLS, service-only tabelrechten, drafts/publicatie/archivering en versiehistorie.
- Publieke CMS-read en admin-mutaties lopen via gecontroleerde gateway-routes.
- `/cms.html` en `assets/cms-admin.js` leveren de beheerwerkplek en live element-picker.
- `assets/cms-runtime.js` projecteert uitsluitend gepubliceerde waarden op bestaande website- en portaalelementen.
- Build coverage registreert en injecteert de runtime over publieke HTML-surfaces.
- Quality Surface Registry en delivery-classificatie bevatten de nieuwe CMS-surfaces en regressietest.
- CodeQL-herstel beperkt previewnavigatie tot same-origin.
- De CMS-adminpagina is expliciet uitgesloten van publieke shell-normalisatie en public-page policy.

Readback:
- Supabase CMS-tabellen bestaan met RLS actief; anon/authenticated hebben geen directe tabelrechten.
- Bootstrap-items staan als draft; er is niets automatisch gepubliceerd.
- Supabase edge `portal-state-eu` bevat de CMS public/admin-acties.
- CodeQL en Quality Surface Gate zijn na recovery groen bewezen.
- Terminale status vereist nog exact-main merge, Netlify production deploy en browser/API-readback.
