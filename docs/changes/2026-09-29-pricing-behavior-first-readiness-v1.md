# Pricing production readback — behavior-first readiness

Datum: 2026-09-29

De pricing/NL-EN productiecontrole gebruikte `data-bg-pricing-interactions=ready-v3` als harde preconditie. Daardoor kon de terminale browsercontrole rood worden voordat ook maar één echte interactie werd uitgevoerd.

De terminale authority is voortaan het waarneembare gebruikersgedrag:

1. pricing-controls bestaan in de actuele DOM;
2. Verlies & herstel verandert het zichtbare lifecycle-paneel;
3. Run verandert de zichtbare pakketgroep;
4. Jaarlijks verandert geselecteerde state én prijs;
5. NL → EN → NL navigeert naar de juiste statische locale-routes en levert de juiste `html[lang]`.

De `ready-v3` marker blijft diagnostische telemetry. Hij mag geen sterkere gedrags-evidence overrulen.

Truth boundary: deze contractwijziging is pas LIVE_BEWEZEN wanneer de aangepaste browsercontrole op productie zelf groen is.
