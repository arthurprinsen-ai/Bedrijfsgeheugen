# Tweede commerciële scheduler-owner verwijderd

Datum: 5 oktober 2026
Obligation: `retire-secondary-commercial-scheduler-owner-20261005-v1`

De post-merge readback van PR #3737 vond naast de canonieke 5-minuten heartbeat nog een oudere dagelijkse directe loop-owner: `powerhouse-one-commercial-loop-daily-v1`.

De tweede owner is in productie verwijderd met forward migration `20261005141727_retire_secondary_commercial_scheduler_owner_v1`.

De invariant is nu: één scheduler orkestreert de commerciële closed loop. Learning-only jobs mogen blijven bestaan zolang zij geen kandidaatmaterialisatie, provider-dispatch of tweede orchestration-loop bezitten.

Production readback na de migration: exact één canonieke scheduler-owner en de secundaire dagelijkse owner is niet meer actief.
