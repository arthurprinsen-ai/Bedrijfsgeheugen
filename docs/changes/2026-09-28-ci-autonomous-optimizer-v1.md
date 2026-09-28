# CI Autonomous Optimizer — fan-out/skip-aware tuning v1

## Wat verandert

De bestaande dagelijkse Powerhouse Autonomous Engineering Optimizer gebruikte queue-wachttijd, executieduur, cancellations en failures. Hij gebruikt nu ook:
- workflow fan-out p95 per SHA;
- skipped-job ratio.

Hoge fan-out of veel overgeslagen jobs wordt behandeld als orchestration waste: parallelisme gaat begrensd omlaag en de candidate batch-window omhoog. Parallelisme mag alleen automatisch omhoog als queue, failure-rate, fan-out én skip-rate laag zijn.

## Safety

De nieuwe signalen worden uitsluitend als observatie in het optimizer-resultaat opgeslagen. Ze worden niet in `config/powerhouse-engineering-tuning.json` geschreven. De bestaande protected safety-invarianten blijven verplicht: Required gate, security gate, production readback, protected merge en exact-SHA identity.
