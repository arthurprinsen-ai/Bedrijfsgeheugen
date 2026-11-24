# Rituals-richting stap 1: rust in kop en gele teller beperkt

Besluit 17 nov 2026 (Arthur): website en portaal ademen rust en exclusieve begeerte, zoals Rituals; energie en humor blijven voor social.

- De gele LEK-teller (besluit 3 sep: op elke pagina) staat nu alleen nog op /frisse-blik. /prijzen is handgemaakt en had hem al niet. Generator: `tools/bouw-v18-views.mjs` en `tools/bouw-v18-chrome.mjs`.
- `assets/kop.css`: tragere, zachtere overgangen in de kop (450 ms) en geen beweging bij `prefers-reduced-motion`. Geen kleur- of inhoudswijziging.
- Homepage (pinned V18-payload) bevatte de LEK niet; niet aangeraakt.
- Niet bewezen: effect op gedrag. Meting: scrolldiepte home, klik op Frisse blik, portaalaanmelding (voor/na, geen A/B bij ~150 sessies).
- Volgende stappen: homepage-hero, portal-v2 welkomstscherm, /prijzen, Stijlgids 18.
