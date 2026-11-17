# Rituals-richting stap 5: /prijzen met de hand in rust gezet

Besluit Arthur 17 nov 2026: site en portaal ademen rust en exclusieve begeerte. `/prijzen` wordt niet door de v18-generator gemaakt; de laag staat daarom als `<style id="rituals-prijzen">` in `prijzen.html` zelf.

- Rustiger kop (kleinere, lichtere H1; tweede regel in gedempte kleur zonder gele nadruk), kleine hoofdletter-labels, trage overgangen, haarlijnen in plaats van schaduwen op de pakketkaarten, secundaire actie als tekstlink.
- Geen tekst-, prijs-, link- of routewijziging; alle `data-money-primary`- en conversie-attributen ongewijzigd.
- Bewijs lokaal: desktop- en mobielscreenshots voor en na; tests die `prijzen` raken groen.
- Niet bewezen: live-readback en gedragseffect (geen voor/na-meting).
- Delivery-Lane in de PR-body gecorrigeerd naar `website` (eerste invulling `frontend` bestaat niet).
