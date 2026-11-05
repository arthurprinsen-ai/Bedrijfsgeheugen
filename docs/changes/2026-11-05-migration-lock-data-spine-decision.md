# Migratie-lock aangevuld met 20261105134200 — 2026-11-05

## Probleem
Migratie `20261105134200` uit #5450 staat op de database (808) maar niet in de lock (807); `preflight` faalt op elke open PR.

## Wijziging
Eén regel in `supabase/migration-history.lock.json`.

## Bewijs
De zes lock-tests slagen met 808 regels.

## Onafhankelijke gates
Protected Required, CodeQL, original BRAIN.
