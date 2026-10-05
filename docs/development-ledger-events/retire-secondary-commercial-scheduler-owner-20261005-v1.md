# Retire secondary commercial scheduler owner — 5 oktober 2026

Obligation: `retire-secondary-commercial-scheduler-owner-20261005-v1`.

## Aanleiding

Na merge van PR #3737 was GitHub delivery groen, maar de productie-readback vond nog één runtime-invariantbreuk: naast `powerhouse-one-commercial-heartbeat-v1` stond `powerhouse-one-commercial-loop-daily-v1` nog actief.

## Uitvoering

Productie is gecorrigeerd met migration `20261005141727_retire_secondary_commercial_scheduler_owner_v1`. De migration is idempotent: alleen wanneer de oude dagelijkse owner actief bestaat, wordt die via `cron.unschedule` verwijderd.

## Readback

Na uitvoering:
- canonieke commerciële scheduler-owner: 1;
- `powerhouse-one-commercial-loop-daily-v1`: niet actief;
- `powerhouse-commercial-learning-v1` blijft actief als learning-only job en is geen tweede execution owner.

Deze repository-entry borgt de productiecorrectie zodat een toekomstige replay/deploy de dubbele owner niet opnieuw introduceert.
