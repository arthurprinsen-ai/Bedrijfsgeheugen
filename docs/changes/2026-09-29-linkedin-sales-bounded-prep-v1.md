# LinkedIn Sales bounded prep v1 — 29 september 2026

De LinkedIn Sales Machine liep in productie tegen een statement timeout aan tijdens de prepare-fase.

## Root cause
De prepare-functie gebruikte de volledige `powerhouse_person_intelligence_v1` over 23.295 connecties, terwijl slechts een kleine set actuele LinkedIn-/research-events in aanmerking komt en maximaal drie comments per dag mogen worden voorbereid.

## Fix
De query selecteert voortaan eerst maximaal 250 recente kandidaat-events en verrijkt daarna alleen de betrokken personen uit `bg_connecties`. Cooldowns en action counts worden kandidaatgebonden bepaald.

Ongewijzigde harde regels:
- maximaal 3 contextuele comments per dag;
- 14 dagen cooldown per persoon;
- geen sales pitch of generieke lof;
- LinkedIn DM blijft `UNAVAILABLE` tenzij een echte provider capability wordt bewezen;
- e-mail blijft de canonieke fallback.
