# Rituals-belevenis: van dunne laag naar echte ervaring (website)

Besluit Arthur 17 nov 2026 (Merkrichting Rituals): rust en exclusieve begeerte. Feedback 17 nov 19:46: het resultaat voelde goedkoop; het moet een belevenis zijn.

- Nieuw `assets/rituals-belevenis.css`, gelinkt vanuit `tools/bouw-v18-chrome-alles.mjs` op elke pagina.
- Zelf gehoste lettertypen (SIL OFL, zie `assets/fonts/*-OFL.txt`): Fraunces voor koppen, Instrument Sans voor tekst; geen Google Fonts-verzoek voor deze laag.
- Papieren kop met haarlijn, ticker verborgen, vertrouwensregel stil, primaire actie blauw als pil, Inloggen als tekstlink.
- Homepage-hero op papier; de video als boogvormig raam; één gouden accent (onderstreping) per scherm.
- Binnenpagina's: dezelfde boogvorm, kleiner; verborgen op mobiel.
- Cookiekaart klein en rustig linksonder; WhatsApp-knop kleiner.
- Geen tekst-, route- of gedragswijziging. Portaal volgt apart (`portal-v2/rituals-belevenis.css`).
- Bewijs lokaal: volledige build op kopie, screenshots voor/na (home, over-ons, prijzen; desktop en mobiel); vier gerelateerde tests groen.
- Niet bewezen: live-readback, Lighthouse-vergelijking en gedragseffect. Bekend: op mobiel overlapt de WhatsApp-knop de onderbalk licht.
- Bekende beperking: WhatsApp-knop en onderbalk op mobiel; apart oppakken.
