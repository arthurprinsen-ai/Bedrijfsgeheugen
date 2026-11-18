# Homepage zonder gele LEK-teller (rust)

Besluit Arthur 17 nov 2026 (Merkrichting Rituals, stap 1 in #5938): de gele teller "Sinds je deze pagina opende ... € 0,00" staat alleen waar het over geld gaat, dus op /frisse-blik en /prijzen. Bij de controle van 18 nov bleek de homepage hem nog steeds te krijgen, omdat `tools/bouw-v18-chrome-alles.mjs` het blok bij de homepage-opbouw los invoegde, naast de conditie die in `bouw-v18-chrome.mjs` en `bouw-v18-views.mjs` al klopte.

- Wijziging: één regel in `tools/bouw-v18-chrome-alles.mjs`; het LEK-blok wordt niet meer aan de homepage toegevoegd. Alle andere modules (vertrek-blok, interactie, speelse laag) blijven.
- Scripts die het blok gebruiken controleren al op aanwezigheid (`if (lek ...)`, `if(!leak) return`); op /frisse-blik en /prijzen blijft alles gelijk.
- Bewijs lokaal: vier gerelateerde tests groen (shell-idempotentie, homepage-leesbaarheid, mobiele eerste scherm, mobiele kop).
- Niet bewezen: live-readback tot na merge; effect op gedrag of conversie (geen voor/na-meting).
