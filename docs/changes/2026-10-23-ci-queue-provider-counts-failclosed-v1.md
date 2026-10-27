# CI: fail closed bij ongeldige GitHub-wachtrijgetallen (2026-10-23)

De bestaande `tools/delivery/predictive-controller.mjs` ondersteunt veilige verplichte runs en begrensde optionele agenten. Een onjuist GitHub-providergetal werd eerder via `Number(value)||0` tot nul gereduceerd. Daardoor kon de planner ten onrechte ruimte voor extra CI-werk zien.

De controller weigert voortaan optionele uitvoering wanneer *een van zes* capaciteitstellers niet een niet-negatief veilig geheel getal is. De oorspronkelijke inconsistentie-fail-closed toestand en de bestaande `planConcurrentAgentWork`-hold worden hergebruikt. `invalidCountKeys` biedt verklaarbaar bewijs in hetzelfde resultaat.

De negatieve regressietests controleren ongeldige en geldige providergetallen, inclusief onafhankelijk read-only vervolgwerk. Geen nieuwe scheduler, recordregister, model, providerpermissie of extra API-call. Geen throughputverbetering claimen zonder eerst echte GitHub-job-timestamps te meten.

Vastlegging: [CI-capaciteit #4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661).
