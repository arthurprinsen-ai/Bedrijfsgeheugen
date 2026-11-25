# CRO-experimenten autonoom afronden (2026-10-28)

## Probleem
- Een ACTIVE experiment kon alleen worden afgerond via `bg_experiment_actie`, achter een menselijk token. Daardoor bleef elk beoordeeld experiment liggen en kon de lus niet leren.

## Wijziging
- Nieuwe service_role-poort `public.bg_experiment_autonoom_besluit(text)`: sluit ACTIVE experimenten met advies af, max 3 per aanroep.
- Regels: verlengen maximaal twee keer, daarna verwerpen; verwerpen bij guardrail-regressie; behouden alleen met een consistente controlegroep in `resultaat`. Zonder controlegroep wacht het experiment op een mens (`WACHT_OP_CONTROLEGROEP`).
- Leerpunt in `revenue_learnings` met `besloten_door: agent:bg-experimentcyclus`.
- `bg_experiment_actie` (mens-token, starten en weigeren) is niet gewijzigd.

## Open
- Nog niets aangeroepen: geen cron, geen caller. De migratie is niet toegepast. Pas na toepassing en een eerste readback is dit "gedaan".
- `intern.bg_experimenten_beoordelen` berekent nog geen controlegroep; tot die er is, blijft elke "behouden" bij een mens.
