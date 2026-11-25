# 2026-10-27 — Atomic cutover V6.1 voor de growth learning-store

Obligation: atomic-cutover-v6-1-20261027.

`tools/growth-intelligence/learning-store.mjs` eist nu een geïnjecteerde adapter met `insertIfAbsentWithCutoverFence` (één PostgreSQL-transactie). Betaalbewijs wordt server-side geverifieerd en v2-sleutels worden ge-escaped. De module heeft nog geen aanroeper; de adapter en de oude schrijfpaden ontbreken nog.
