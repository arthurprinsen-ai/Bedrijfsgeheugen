# Delivery Pattern Memory v1

## Doel

Adaptive Delivery selecteerde tests op basis van statische capability-mappings. Powerhouse hergebruikt nu ook historische regressies uit de bestaande canonieke Brain-learning.

## Werking

De Integration Bundle leest `brain/learning/*.json`, matcht de huidige gewijzigde paden tegen eerdere `enforcement`-oppervlakken en voegt de bijbehorende bewezen test-evidence bounded toe aan de adaptive testset.

Daarmee ontstaat een compound loop:
wijziging → bewijs/failure → Brain learning → enforcement + regression → vergelijkbare toekomstige wijziging → regression automatisch opnieuw geselecteerd.

## Grenzen

- maximaal 12 historische tests per kandidaat;
- alleen bestanden onder `tests/` worden als uitvoerbaar bewijs geselecteerd;
- historische memory kan uitsluitend tests toevoegen;
- risk, security, protected merge, production en browser/provider readback blijven onafhankelijk fail-closed;
- er is geen tweede memory store.
