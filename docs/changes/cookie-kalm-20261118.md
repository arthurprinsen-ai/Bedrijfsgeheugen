# Cookiemelding compact en kalm

Merkrichting Rituals (17 nov): rust. De cookiemelding was op desktop ongeveer 280 px hoog en dekte hero-tekst en de primaire knop af.

- Wijziging: CSS-laag in `assets/rituals-belevenis.css`; de bestaande korte tekst (`.bgKort`) wordt ook op desktop getoond, de kop en lange tekst verdwijnen, de knoppen staan in één rij. Hoogte 141 px. Teksten, keuzes en consent-gedrag ongewijzigd; de korte tekst was al de goedgekeurde mobiele variant.
- Cacheversie van de Rituals-CSS naar `?v=20261118b`.
- Bewijs lokaal: nieuwe CSS over de live pagina gelegd en bekeken (desktop en mobiel); gerelateerde tests groen.
- Niet bewezen: live-readback tot na merge; effect op toestemmingspercentage (meting via bg_consent/meting.js voor/na).
